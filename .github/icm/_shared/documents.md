---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# Documents — what each one is, who edits it, which have drifted

Each link below is pinned as a node of its own. "Edited in" says where a correction is made ([mirror.md](mirror.md)): a document in an SDK folder is corrected in the platform's `sdk/<language>/` and arrives with the next sync.

| Document | What it is for | Edited in |
|---|---|---|
| [README.md](../../../README.md) | the landing page: packages, quick start, links | here |
| [CONTRIBUTING.md](../../../CONTRIBUTING.md) | setup, branches, commits, style, pull requests | here |
| [SECURITY-DEPENDENCIES.md](../../../SECURITY-DEPENDENCIES.md) | the note left by #12 (September 2026 dependency patch) | here |
| [go/README.md](../../../go/README.md) | the planned Go SDK: an intended API, no code | here |
| [typescript/README.md](../../../typescript/README.md) | the npm package page: install, resources, webhooks, subscriptions, configuration | platform |
| [typescript/CHANGELOG.md](../../../typescript/CHANGELOG.md) | what each TypeScript version changed | platform |
| [typescript/PUBLISHING.md](../../../typescript/PUBLISHING.md) | the publishing guide, written from the platform's side | platform |
| [python/README.md](../../../python/README.md) | the PyPI package page: install, usage, configuration, FastAPI | platform |
| [python/CHANGELOG.md](../../../python/CHANGELOG.md) | what each Python version changed | platform |
| [python/TEMPLATES.md](../../../python/TEMPLATES.md) | brand theme variables and template structure | platform |
| [python/IMPLEMENTATION.md](../../../python/IMPLEMENTATION.md) | the first Python implementation summary (platform issue #357); a historical record | platform |

## Known drift

Checked against the code at the commit above. Each is a `docs` route item, not something to keep in step by hand.

- `README.md`: "Production-ready v1.0.0" and Python "coming soon" / "Planned" — superseded by `typescript/package.json:3` and `python/pyproject.toml:7` (both 1.11.0, both published). The structure lists `rust/`, `shared/` and `python/setup.py`, none of which exist. The TypeScript quick start imports `NorthRelay`, which is not exported (`NorthRelayClient`, `typescript/src/index.ts:7`); the Python quick start calls `send(from_email=…)` without `await`; the client is async and `send` takes one `SendEmailRequest` (below). "Adding a New SDK" describes work here; an SDK starts in the platform's `sdk/` (the sync accepts `typescript`, `python`, `go`).
- `CONTRIBUTING.md`: "Release Process" (bump, push `main`, push a `typescript/v*` tag by hand) — superseded by the platform release in [release.md](release.md); this repository's branch is `master` and its tags come from the sync. The workflow assumes SDK code is changed here — superseded by [mirror.md](mirror.md). `.eslintrc.js` and Prettier → `typescript/eslint.config.mjs`, no Prettier configured; TypeScript `tests/` → `typescript/src/__tests__/`; Python "(Coming Soon)", `setup.py`, `flake8`, Python 3.8+ → `python/pyproject.toml` (Ruff, `requires-python >=3.9`); Node 16+ → `typescript/package.json:72` (18 or later); the linked `CODE_OF_CONDUCT.md` does not exist.
- `SECURITY-DEPENDENCIES.md`: the axios floor `1.20.0`, vitest `4.1.11` and the `.mts` config were overwritten by later syncs ([mirror.md](mirror.md) "The evidence"); the lockfile still resolves axios 1.20.0 and `security.yml` still audits development dependencies.
- `typescript/PUBLISHING.md`: names `typescript-publish.yml` (the file is `npm-publish.yml`) and a hand-tagged flow (`./scripts/release-sdk.sh`, `sdk/typescript/v*`) that the platform's `release-clients.yml` now runs after each deploy. Corrected in the platform.
- `python/README.md` "Development Status": "Current Version: 1.1.0" — superseded by `python/pyproject.toml:7`. Its "Quick Start", like `python/examples/send_email.py`, calls `client.emails.send(from_=…, to=…, content=…)`, but `send` takes one `SendEmailRequest` (`python/northrelay/resources/emails.py:24`): run as written it raises `TypeError: … unexpected keyword argument 'from_'` (checked 2026-10-14). A defect in the platform's copy, for its `fix` or `docs` route.
- `python/IMPLEMENTATION.md`: describes the state at Phase 1; read it as history, not as the current resource list (`python/northrelay/client.py` is).
