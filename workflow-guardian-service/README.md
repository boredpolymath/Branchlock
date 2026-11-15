# Credentialless scanner service

This server scans only public GitHub repositories and accepts no credentials. It does not implement accounts, cookies, OAuth, GitHub App installation, token input, or report persistence. A report is returned to the requesting browser and may then be retained by that browser under the app's local retention setting.

Run it from the repository root:

```bash
python3 workflow-guardian-service/server.py
```

Then open `http://127.0.0.1:8080`. The public GitHub API imposes anonymous rate limits. Private repositories are intentionally rejected.

Run the deterministic scanner tests with:

```bash
cd workflow-guardian-service
python3 -m unittest -v
```
