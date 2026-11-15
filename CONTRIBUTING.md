# Contributing to Branchlock

Thanks for helping make GitHub Actions security easier to understand and act on.

## Before you begin

- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Search existing issues and pull requests before opening a new one.
- For a suspected security vulnerability, follow the private reporting process in [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Working on the prototype

Branchlock is a dependency-free static web app. Its deployable files live in `workflow-guardian-prototype/dist/`.

```bash
cd workflow-guardian-prototype/dist
python3 -m http.server 8080
```

Visit `http://localhost:8080` and check the affected flows in both desktop and narrow browser widths.

## Pull requests

- Keep each pull request focused on one problem.
- Explain the user-facing effect and how you tested it.
- Preserve the product’s read-only, privacy-first posture: do not add credential collection, repository mutation, or unannounced network requests.
- Use clear, inclusive language and update documentation when behavior changes.

By contributing, you agree to license your contributions under the [MIT License](LICENSE).
