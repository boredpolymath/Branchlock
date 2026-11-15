# Branchlock

**Spot risky public CI workflows before they become a problem.**

Branchlock is a clean, read-only security-review workspace for public CI configuration. It turns common workflow risks into plain-English findings, shows exactly where to look, and suggests the next safest step—without changing a repository or asking for credentials.

> Branchlock is a static, browser-based scanner for public GitHub Actions and GitLab CI configuration. It analyzes live public repository files without accounts, tokens, or a backend.

## Why Branchlock?

CI workflows often have more access than teams realize. A broad token, an unpinned third-party action, or untrusted pull-request input can quietly turn routine automation into a security gap. Branchlock gives developers and reviewers a focused place to identify those risks and act on them.

## Compatibility and rules

Branchlock currently scans **public GitHub repositories** for GitHub Actions workflow risks. It never asks for credentials, supports no private repositories, and reads workflow files directly from the visitor's browser through GitHub's public API.

The initial GitHub Actions rule set detects:

- Untrusted pull-request title or body data interpolated directly into a shell command.
- Broad `permissions: write-all` workflow token grants.
- Unpinned action references that are not full commit SHAs.
- `pull_request_target` usage that needs careful handling of untrusted code.

Branchlock also supports **public GitLab.com projects** by scanning `.gitlab-ci.yml` for remote configuration, job-token, shell-download, and mutable-image risks. Private projects and self-managed GitLab instances are not supported.

## What you can do

- Review prioritized Critical, High, and Medium GitHub Actions and GitLab CI findings.
- Open each finding for the affected workflow, evidence, explanation, confidence, and a practical remediation.
- Filter findings by severity or workflow, and search by title, rule, or file.
- Browse the workflow inventory and locally retained report history.
- Export the current report as Markdown or JSON.
- Switch between dark and light themes and use the app offline after it is cached.

## Privacy-first by design

Branchlock is built around a simple promise: reviewing security should not require handing over more data than necessary. It stores reports and preferences in the browser, does not request GitHub or GitLab credentials, does not write to repositories, and does not retain secrets.

## Run it locally

No build step, backend, or third-party dependencies are required. The app scans public repositories directly from the visitor's browser:

```bash
cd workflow-guardian-prototype/dist
python3 -m http.server 8080
```

Then visit [http://127.0.0.1:8080](http://127.0.0.1:8080). It scans accessible public GitHub repositories through GitHub's public API and public GitLab.com projects through GitLab's API. It requests no credentials and deliberately rejects private repositories/projects.

GitHub Pages can host this static application directly. GitHub's anonymous API limit applies per visitor IP.

## Project layout

```text
workflow-guardian-prototype/
├── dist/                 # Deployable static Branchlock application
│   ├── index.html        # App shell
│   ├── app.js            # Prototype data and interactions
│   ├── styles.css        # Responsive visual system
│   └── sw.js             # Offline application shell
└── .openai/hosting.json  # Static-hosting configuration
workflow-guardian-service/
├── server.py              # Credentialless public-repository scan API and static host
└── test_server.py          # Scanner unit tests
```

## Product direction

Branchlock will expand its public CI rule coverage while preserving its read-only, least-data-needed model. Private-repository support is intentionally out of scope unless a future version can preserve the same credential-minimizing guarantees.

## License

Branchlock is released under the [MIT License](LICENSE).
