# Branchlock

**Spot risky GitHub Actions workflows before they become a problem.**

Branchlock is a clean, read-only security-review workspace for GitHub Actions. It turns common workflow risks into plain-English findings, shows exactly where to look, and suggests the next safest step—without changing a repository or asking for credentials.

> This repository currently contains an interactive front-end prototype with sample findings. It is designed to demonstrate the product experience; it does not yet connect to GitHub or analyze a repository's live workflow files.

## Why Branchlock?

CI workflows often have more access than teams realize. A broad token, an unpinned third-party action, or untrusted pull-request input can quietly turn routine automation into a security gap. Branchlock gives developers and reviewers a focused place to identify those risks and act on them.

## What you can do in the prototype

- Review prioritized Critical, High, and Medium workflow findings.
- Open each finding for the affected workflow, evidence, explanation, confidence, and a practical remediation.
- Filter findings by severity or workflow, and search by title, rule, or file.
- Browse the workflow inventory and locally retained report history.
- Export the current report as Markdown or JSON.
- Switch between dark and light themes and use the app offline after it is cached.

## Privacy-first by design

Branchlock is built around a simple promise: reviewing security should not require handing over more data than necessary. The prototype stores its sample reports and preferences in the browser. It does not request GitHub credentials, write to repositories, or retain secrets.

## Run it locally

No build step or dependencies are required. Serve the static app from the project folder:

```bash
cd workflow-guardian-prototype/dist
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

Opening `index.html` directly also works for most of the interface, but serving it locally is recommended so the service worker and offline experience can run normally.

## Project layout

```text
workflow-guardian-prototype/
├── dist/                 # Deployable static Branchlock application
│   ├── index.html        # App shell
│   ├── app.js            # Prototype data and interactions
│   ├── styles.css        # Responsive visual system
│   └── sw.js             # Offline application shell
└── .openai/hosting.json  # Static-hosting configuration
```

## Product direction

The next step is connecting the experience to real GitHub Actions files while preserving its read-only, least-data-needed approach. That would enable repository-backed scans, current commit context, and shareable reports without turning Branchlock into a deployment or credential-management tool.

## License

Branchlock is released under the [MIT License](LICENSE).
