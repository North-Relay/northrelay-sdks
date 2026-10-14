---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# Build and test — the commands, what CI runs, what counts as evidence

## Locally

| SDK | Commands (from the folder) | Owner of the command |
|---|---|---|
| TypeScript | `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; `npm run lint` | `typescript/package.json:25` (scripts) |
| Python | `pip install -e . pytest pytest-asyncio`, then `python -m pytest tests/ -q -o addopts=''` | `python/pyproject.toml:67` |

- `-o addopts=''` matters: `python/pyproject.toml:71` adds `--cov` options that need `pytest-cov`, which CI does not install. The `dev` extra carries `pytest-cov` for a coverage run.
- Install the Python package into a virtual environment of its own, not the system interpreter.
- Run on 2026-10-14 at this commit: TypeScript 3 files, 25 tests, typecheck and build clean (Node 24 locally; CI uses 22, `typescript/package.json:72` requires 18 or later); Python 50 tests passed. `npm run lint` reports 14 warnings (`no-explicit-any` among them) and no errors, and is not run by CI.
- Tests stub HTTP (a local `node:http` server in `typescript/src/__tests__/designs.test.ts`, `httpx.MockTransport` in `python/tests/test_designs.py`); none calls the live API or needs a key. A test that needs one is not added here: the platform's suites exercise the SDKs against real routes (the description of #13).

## CI on this repository

| Workflow | When | What |
|---|---|---|
| `sdk-contracts.yml` ("SDK contracts") | every pull request; pushes to `master` | TypeScript `npm ci && npm run typecheck && npm test && npm run build` on Node 22; Python `pytest` on 3.12 |
| `security.yml` ("SDK security validation") | every pull request; dispatch | TypeScript `npm ci --ignore-scripts`, `npm audit --audit-level=moderate` (development dependencies included), build, typecheck, test |
| `npm-publish.yml`, `python-publish.yml` | a `typescript/v*` or `python/v*` tag | the tests again, then publish ([release.md](release.md)) |
| `icm-check.yml` ("ICM check") | pull requests and pushes touching the entry or `.github/icm/`; Mondays | `generate.py --check`; `--strict` weekly |

CodeQL and the dependency graph also run, from the repository's GitHub settings rather than a file here. No branch protection on `master` (checked 2026-10-14), so a red check does not block a merge: read the checks before merging.

## Evidence

A reproduction or a fix is evidence when it names the test file and the command and shows the output, run against this commit and, for a released defect, against the published version (`npm install @northrelay/sdk@X.Y.Z`, `pip install northrelay==X.Y.Z`). The same tests run in the platform's CI (`validate` and `python-sdk` jobs, platform `.github/icm/_shared/build-and-test.md`), which is where a fix's tests must pass ([mirror.md](mirror.md)).
