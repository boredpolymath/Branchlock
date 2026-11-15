# Security Policy

## System and Scope

Branchlock is a static, browser-based prototype for reviewing GitHub Actions security findings. This policy covers the files in this repository, especially the deployable application in `workflow-guardian-prototype/dist/`.

The prototype is client-side only: it does not connect to GitHub, accept credentials, send data to a backend, or modify repositories.

## Threat Model and Trust Boundaries

Repository names and browser-local preferences are treated as untrusted input. Findings displayed by the prototype are bundled sample data. Browser storage is a local convenience feature, not a secure data store.

## Security Invariants

- Never request, store, expose, or transmit access tokens, credentials, cookies, or secrets.
- Never write to a user’s repository or execute repository content.
- Keep report history and preferences local to the browser.
- Escape user-controlled values before rendering them into the page.

## Reportable Findings

Please report vulnerabilities that could cause credential exposure, cross-site scripting, unsafe handling of user input, unauthorized network transmission, unintended repository mutation, or compromise of the offline application shell.

## Out of Scope

Sample finding data and simulated scan behavior are product-demo content, not claims of live GitHub analysis. Vulnerabilities in third-party browsers, extensions, or static-hosting infrastructure are outside this repository’s scope.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability. Report it privately to the repository owner through GitHub’s security advisory reporting flow, with reproduction steps and impact. We will acknowledge the report and coordinate a fix before public disclosure.
