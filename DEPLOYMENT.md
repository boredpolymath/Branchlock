# Deploying Branchlock v1

## Release contract

Branchlock v1 is a public-repository GitHub Actions scanner. It has no accounts, login, cookies, OAuth, GitHub App installation, user token fields, or server-side report storage. Private repositories are rejected by design.

## Container deployment

Build and run the vendor-neutral image:

```bash
docker build -t branchlock .
docker run --rm -p 8080:8080 branchlock
```

For a local container check, use `docker compose up --build`.

Place the container behind a managed TLS reverse proxy or load balancer. Terminate HTTPS there, forward only to the service, and expose only the public application domain. The application is same-origin only: do not add permissive CORS headers.

## Operational requirements before public launch

- Configure a public domain and HTTPS certificate at the proxy/load balancer.
- Add an external rate limit and DDoS/WAF control in front of the container; the in-process limit is a secondary safeguard only.
- Configure uptime monitoring against `/api/v1/health`; its response intentionally discloses no account, repository, or credential data.
- Collect only infrastructure health/error metrics. Do not log request bodies, repository identifiers, workflow content, findings, or IP addresses.
- Run the test suite and container image vulnerability scan in CI before deployment.
- Document GitHub public API rate-limit behavior and an outage/retry message for users.

## Explicitly deferred

Private repositories require an access credential. They are not part of this release contract. Any future private-repository feature must use short-lived GitHub App installation tokens in memory only, with no token input, database persistence, analytics capture, or application logs.
