#!/usr/bin/env python3
"""Credentialless public-repository scanner for Branchlock.

The service accepts only owner/repository identifiers and reads public workflow
files through the GitHub REST API. It deliberately has no login, cookie, token,
or database support; reports live only in the caller's browser.
"""
import base64
import hashlib
import json
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC_ROOT = ROOT / "workflow-guardian-prototype" / "dist"
GITHUB_API = "https://api.github.com"
MAX_BODY_BYTES = 4096
MAX_WORKFLOWS = 100
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_REQUESTS = 12
REPOSITORY_RE = re.compile(r"^(?:https://github\.com/)?([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$")
SECRET_VALUE_RE = re.compile(r"(?i)((?:token|secret|password|api[_-]?key)\s*[:=]\s*)([^\s#]+)")
_rate_limit = {}
_rate_lock = threading.Lock()


class ScanError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message
        super().__init__(message)


def parse_repository(value):
    match = REPOSITORY_RE.fullmatch(value.strip()) if isinstance(value, str) else None
    if not match:
        raise ScanError(HTTPStatus.BAD_REQUEST, "Enter a public GitHub owner/repository or repository URL.")
    return match.group(1), match.group(2)


def github_get(path):
    request = urllib.request.Request(
        f"{GITHUB_API}{path}",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "Branchlock-Public-Scanner/0.1"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code in (401, 403, 404):
            raise ScanError(HTTPStatus.FORBIDDEN, "Only accessible public repositories can be scanned without credentials.")
        if error.code == 429:
            raise ScanError(HTTPStatus.TOO_MANY_REQUESTS, "GitHub's public API rate limit is reached. Try again later.")
        raise ScanError(HTTPStatus.BAD_GATEWAY, "GitHub could not provide repository data.")
    except (urllib.error.URLError, TimeoutError):
        raise ScanError(HTTPStatus.BAD_GATEWAY, "GitHub could not be reached. Try again shortly.")


def redact(value):
    return SECRET_VALUE_RE.sub(r"\1[REDACTED]", value)


def allow_scan(client_ip):
    """Small in-process limit; production may add a proxy/WAF limit in front."""
    now = time.monotonic()
    with _rate_lock:
        timestamps = [value for value in _rate_limit.get(client_ip, []) if now - value < RATE_LIMIT_WINDOW_SECONDS]
        if len(timestamps) >= RATE_LIMIT_REQUESTS:
            _rate_limit[client_ip] = timestamps
            return False
        timestamps.append(now)
        _rate_limit[client_ip] = timestamps
        return True


def finding(rule, severity, title, workflow, line_number, evidence, description, remediation, confidence="High"):
    fingerprint = hashlib.sha256(f"{rule}:{workflow}:{line_number}:{evidence}".encode()).hexdigest()[:10]
    return {"id": rule, "fingerprint": fingerprint, "severity": severity, "title": title, "workflow": workflow,
            "location": f"line {line_number}", "evidence": redact(evidence.strip())[:500], "description": description,
            "remediation": remediation, "confidence": confidence}


def scan_workflow(name, content):
    results = []
    for number, raw_line in enumerate(content.splitlines(), 1):
        line = raw_line.strip()
        if re.match(r"^permissions:\s*write-all\s*(?:#.*)?$", line):
            results.append(finding("WG-004", "High", "Workflow token has write-all permissions", name, number, raw_line,
                "This workflow grants the built-in token broad write permissions.", "Set permissions to read-all, then grant only the job permissions that are required."))
        if re.match(r"^on:\s*pull_request_target\s*(?:#.*)?$", line) or re.match(r"^pull_request_target:\s*$", line):
            results.append(finding("WG-008", "Medium", "pull_request_target can access write credentials", name, number, raw_line,
                "This trigger runs in the base repository context and requires special care with untrusted pull request content.", "Use pull_request for untrusted contributions, or do not execute pull-request code." , "Medium"))
        action = re.search(r"\buses:\s*([^\s#]+)", line)
        if action and not re.search(r"@[0-9a-fA-F]{40}$", action.group(1)):
            results.append(finding("WG-021", "Medium", "Third-party action is not pinned to a commit", name, number, raw_line,
                "A movable action reference can execute code that was not reviewed with this workflow.", "Pin the action to a full-length commit SHA and review updates deliberately."))
        if re.search(r"^run:\s*.*\$\{\{\s*github\.event\.pull_request\.(title|body)", line):
            results.append(finding("WG-012", "Critical", "Untrusted pull request input reaches shell", name, number, raw_line,
                "Pull-request title or body data is attacker-controlled. Interpolating it into a shell command can allow command injection.", "Pass the value through an environment variable and quote it, or use an action that treats it as data."))
    return results


def scan_repository(repository):
    owner, repo = parse_repository(repository)
    metadata = github_get(f"/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}")
    if metadata.get("private"):
        raise ScanError(HTTPStatus.FORBIDDEN, "Private repositories are not supported by the credentialless scanner.")
    commit = github_get(f"/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}/commits/{urllib.parse.quote(metadata['default_branch'], safe='')}")
    revision = commit["sha"]
    tree = github_get(f"/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}/git/trees/{revision}?recursive=1")
    workflows = [item for item in tree.get("tree", []) if item.get("type") == "blob" and re.fullmatch(r"\.github/workflows/[^/]+\.ya?ml", item.get("path", ""), re.I)][:MAX_WORKFLOWS]
    if not workflows:
        raise ScanError(HTTPStatus.UNPROCESSABLE_ENTITY, "No GitHub Actions workflow files were found at this revision.")
    findings, workflow_summary = [], []
    for item in workflows:
        blob = github_get(f"/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}/git/blobs/{item['sha']}")
        content = base64.b64decode(blob["content"]).decode("utf-8", errors="replace")
        workflow_findings = scan_workflow(item["path"].rsplit("/", 1)[-1], content)
        findings.extend(workflow_findings)
        workflow_summary.append({"name": item["path"].rsplit("/", 1)[-1], "findings": len(workflow_findings), "status": "Needs review" if workflow_findings else "No findings", "triggers": "Scanned workflow"})
    severity = {level: sum(f["severity"] == level for f in findings) for level in ("Critical", "High", "Medium")}
    posture = max(0, 100 - severity["Critical"] * 35 - severity["High"] * 15 - severity["Medium"] * 5)
    return {"repository": f"{owner}/{repo}", "revision": revision, "scanned_at": datetime.now(timezone.utc).isoformat(), "rule_set": "2026.11-public", "credential_mode": "none", "workflows_analyzed": len(workflows), "findings": findings, "workflows": workflow_summary, "summary": severity, "posture_score": posture}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_ROOT), **kwargs)

    def log_message(self, *_args):
        # Do not log repository identifiers, request bodies, or other user input.
        return

    def end_headers(self):
        self.send_header("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; worker-src 'self'")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "camera=(), geolocation=(), microphone=()")
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/v1/health":
            self.send_json(HTTPStatus.OK, {"status": "ok", "credential_mode": "none", "repository_access": "public-only"})
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/v1/scans":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return
        if self.headers.get("Authorization") or self.headers.get("X-GitHub-Token"):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Credentials are not accepted by this service."})
            return
        if not allow_scan(self.client_address[0]):
            self.send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "Too many scans. Try again in a minute."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY_BYTES:
                raise ScanError(HTTPStatus.BAD_REQUEST, "Invalid request body.")
            if self.headers.get("Content-Type", "").split(";", 1)[0] != "application/json":
                raise ScanError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "Request body must be JSON.")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self.send_json(HTTPStatus.OK, {"report": scan_repository(payload.get("repository"))})
        except json.JSONDecodeError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Request body must be JSON."})
        except ScanError as error:
            self.send_json(error.status, {"error": error.message})


class Server(ThreadingHTTPServer):
    daemon_threads = True


if __name__ == "__main__":
    host = os.environ.get("BRANCHLOCK_HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8080"))
    print(f"Branchlock credentialless scanner: http://{host}:{port}")
    Server((host, port), Handler).serve_forever()
