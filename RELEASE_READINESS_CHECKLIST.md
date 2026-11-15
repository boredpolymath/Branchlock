# Branchlock: Prototype-to-Public Release Checklist

## Current release gate

Branchlock is presently a polished front-end prototype. It displays bundled sample findings, simulates scans in the browser, and stores report history in `localStorage`. It must not be described as a live GitHub Actions security scanner until the items in the product, analysis, security, and validation sections below are complete.

## UI review: fix before public release

- [x] **Make finding selection keyboard-accessible.** Finding rows are now semantic buttons with descriptive labels and clear keyboard focus treatment.
- [x] **Make the export modal a complete accessible dialog.** The export dialog now has dialog semantics, initial focus, focus trapping, Escape/backdrop dismissal, and focus restoration.
- [x] **Give all controls reliable focus and state feedback.** Added high-contrast focus treatment and made the offline-cache setting persistent and functional; the simulated online/offline toggle is now a real network-status indicator.

## 1. Product contract and trust model

- [ ] Define the supported customer, plan, repository types, GitHub hosting types, and supported browser matrix.
- [ ] Decide whether Branchlock is local-only, a hosted SaaS, or both; document the resulting data flows and trust boundaries.
- [ ] Define the exact promise behind “read-only,” “privacy-first,” “offline,” and “never retains raw secrets.” Make UI copy, documentation, and implementation agree.
- [ ] Define severity, confidence, posture-score, coverage, and “resolved” semantics so users do not mistake advisory results for guarantees.
- [ ] Establish a false-positive/false-negative policy, a support route, an appeal path, and responsible disclosure handling.

## 2. GitHub integration and application architecture

- [x] Establish a credentialless public-repository scan path: same-origin API, no user-token fields, no cookies, no report persistence, and explicit rejection of credentials and private repositories.
- [ ] Create the GitHub App or other approved integration with the minimum read-only repository and metadata permissions.
- [ ] Implement installation, authentication, repository selection, permission-change handling, revocation, and uninstall cleanup.
- [ ] Retrieve a repository’s workflow files at an explicit commit SHA; never scan an ambiguous branch tip without showing its resolved revision.
- [ ] Build a backend API with authenticated authorization checks, organization and repository tenancy boundaries, schema validation, rate limits, and audit events.
- [ ] Move scanning to an isolated worker/queue with cancellation, retries, idempotency, concurrency limits, timeouts, and a durable job status model.
- [ ] Add webhooks or a clearly scheduled/on-demand rescan model; deduplicate deliveries and verify webhook signatures.
- [ ] Store reports, configuration, and scan metadata in a production database with migrations, retention controls, and deletion workflows.
- [ ] Replace the sample repository input, workflow inventory, history, dashboard, and export data with the live API contract.

## 3. Workflow analysis engine

- [x] Add an initial deterministic public-workflow scanner for write-all permissions, `pull_request_target`, unpinned actions, and direct pull-request title/body shell interpolation, with redacted evidence.
- [ ] Parse GitHub Actions YAML safely and normalize reusable workflows, matrices, expressions, job-level permissions, and workflow call chains.
- [ ] Implement a versioned rules engine for the announced detection coverage, including evidence, remediation, confidence, CWE/category mapping where useful, and documentation links.
- [ ] Track rule version, scanner version, repository revision, input provenance, and timestamp in every finding and export.
- [ ] Add result de-duplication, stable finding identities, baseline comparison, resolved/new/regressed status, and an explicit suppression/acknowledgement workflow with audit trail.
- [ ] Test against a curated corpus of vulnerable, benign, malformed, and adversarial workflow fixtures; include regression fixtures for every fixed rule defect.
- [ ] Calibrate severity and confidence with security review; do not use a posture score until its calculation and limitations are explainable.
- [ ] Redact secrets and sensitive values from collected content, stored evidence, logs, exports, telemetry, and error messages.

## 4. Product experience and accessibility

- [x] Restore top-level UI routes from the URL hash and handle browser back/forward navigation.
- [ ] Implement a first-run experience that explains how to connect a repository, what will be read, why access is needed, and what happens after a scan.
- [ ] Provide complete loading, progress, empty, error, permission-denied, rate-limited, cancelled, stale-result, and successful-scan states.
- [ ] Add direct, refresh-safe URLs for repositories, reports, and findings; handle browser back/forward navigation.
- [ ] Link findings to precise workflow evidence and repository source when permission allows; make remediation actionable and copyable.
- [ ] Add report comparison, filtering, export history, and clear labels for data freshness and scan coverage.
- [ ] Complete the UI fixes listed in the review above, then test keyboard navigation, screen reader announcements, visible focus, target size, contrast, zoom/reflow, light/dark themes, and reduced motion.
- [ ] Consolidate the current layered CSS overrides into a small tokenized design system with maintainable desktop, tablet, and mobile breakpoints.
- [ ] Test the complete workflow on current supported browsers and representative phone, tablet, desktop, high-zoom, and narrow-width viewports.

## 5. Application security, privacy, and resilience

- [x] Add an initial restrictive browser Content Security Policy and escape dynamic finding content before rendering it.
- [x] Version the offline cache, delete superseded Branchlock caches, and limit service-worker interception to same-origin GET requests.
- [ ] Threat-model the hosted system, including GitHub OAuth/App credentials, webhook ingestion, user-controlled repository identifiers, workflow text, exports, multi-tenant isolation, and the worker execution environment.
- [ ] Store integration credentials in a managed secret store; encrypt data in transit and at rest; rotate secrets and signing keys; never place secrets in browser storage.
- [ ] Enforce authorization at every API and background-job boundary. Verify organization membership and repository installation access on every request.
- [ ] Protect public endpoints against CSRF where applicable, XSS, injection, SSRF, path traversal, open redirects, unsafe downloads, and replayed webhook events.
- [ ] Add a restrictive Content Security Policy and other production security headers; remove or self-host externally loaded assets when the privacy posture requires it.
- [ ] Define retention, export, deletion, account deletion, backup, and restoration policies. Make them work end-to-end and document exceptions.
- [ ] Implement privacy-safe logs and analytics with opt-in/opt-out choices as appropriate; prohibit report contents and secrets from telemetry.
- [ ] Review the service worker caching strategy so updates activate predictably, authenticated responses are never cached unintentionally, and users can recover from a broken offline cache.
- [ ] Complete independent application and infrastructure security review, dependency/license scanning, and a pre-launch penetration test appropriate to the deployment scope.

## 6. Quality, reliability, and delivery engineering

- [x] Add a vendor-neutral, non-root container package, local Compose configuration, health check, and CI verification for the credentialless service.
- [x] Add in-process scan rate limiting and hardened same-origin response headers; production deployment still needs edge rate limiting and monitoring.
- [ ] Establish a typed API/schema contract, validation strategy, error taxonomy, migration process, and backwards-compatibility policy.
- [ ] Add unit tests for rules and UI state, integration tests for GitHub and persistence paths, end-to-end tests for critical user journeys, and visual/accessibility regression tests.
- [ ] Add CI gates for formatting, linting, type checking, tests, accessibility checks, secret scanning, dependency/vulnerability scanning, and build provenance.
- [ ] Add production environment separation, infrastructure-as-code, least-privilege deploy identities, protected secrets, and reviewed release approvals.
- [ ] Define performance budgets and measure scan latency, page load, interaction responsiveness, error rate, worker queue depth, and GitHub API quota use.
- [ ] Add structured, redacted logs; metrics; traces; alerts; dashboards; uptime checks; and a runbook for each alert.
- [ ] Test backups, restoration, deploy rollback, scanner rollback, GitHub outage behavior, rate-limit exhaustion, and degraded read-only behavior.
- [ ] Publish status communication and incident-response procedures, including customer notification criteria and ownership.

## 7. Public launch operations

- [ ] Publish production documentation: getting started, supported rules, limitations, permissions, data handling, retention, exports, deletion, troubleshooting, and accessibility contact.
- [ ] Finalize privacy notice, terms, acceptable-use policy, licensing/third-party notices, branding, and support/contact details with appropriate review.
- [ ] Configure production domain, HTTPS, DNS, email sender/domain, monitoring, error intake, and a customer support workflow.
- [ ] Set up release notes, versioning, staged rollout/feature flags, beta feedback collection, and a rollback communication plan.
- [ ] Decide whether organization roles, billing, entitlement enforcement, and audit-log access are required for the intended commercial model; implement them before exposing paid or shared workspaces.

## 8. Launch acceptance checklist

- [ ] A new authorized user can connect a repository, understand requested access, start a scan, see accurate progress, and receive a report tied to the scanned commit.
- [ ] Every visible finding is backed by source evidence, a versioned rule, understandable remediation, and a valid export.
- [ ] Unauthorized users cannot read another organization’s repositories, reports, exports, jobs, or metadata.
- [ ] Empty, failed, revoked, offline, rate-limited, and malformed-input paths are helpful, recoverable, and tested.
- [ ] Critical journeys pass supported-browser, responsive, keyboard-only, screen-reader, zoom, and contrast testing.
- [ ] Security, privacy, retention, support, monitoring, backup/restore, incident response, and rollback owners have signed off.
- [ ] Product claims, in-app copy, documentation, and deployed behavior match exactly.

