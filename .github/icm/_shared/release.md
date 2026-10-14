---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# Releasing — how a version reaches npm and PyPI, and how it is repaired

| Package | Registry | Version file | Tag here | Publish workflow |
|---|---|---|---|---|
| `@northrelay/sdk` | npm | `typescript/package.json:3` | `typescript/vX.Y.Z` | `npm-publish.yml` ("Publish TypeScript SDK") |
| `northrelay` | PyPI | `python/pyproject.toml:7` (and `python/northrelay/__init__.py:99`, the User-Agent version; no check compares the two) | `python/vX.Y.Z` | `python-publish.yml` ("Publish Python SDK") |

`go/` publishes nothing (`go/README.md`; the platform's sync refuses `go`).

## Cutting a version

A version is cut in the platform, never here: bump `sdk/<language>/package.json` or `pyproject.toml` and add the `## [X.Y.Z] - date` section to the SDK's CHANGELOG in a platform pull request. After that merge deploys, the platform's `release-clients.yml` reads both versions and calls the sync for each; the sync skips a language whose tag already exists here, so a deploy without a bump publishes nothing. The Python sync waits for the TypeScript one (`needs: [versions, typescript]`): a failed TypeScript sync holds Python back. The platform's `.github/icm/_shared/deploy.md` "Client packages" is the platform half (links in [mirror.md](mirror.md)). `typescript/PUBLISHING.md` and `CONTRIBUTING.md` "Release Process" describe hand-pushed tags; that is superseded ([documents.md](documents.md)).

## From tag to registry

1. The sync pushes the `sync:` commit to `master` and the annotated tag; the tag push starts the publish workflow here (the bot's token triggers workflows). The sync also creates the GitHub release, its body cut from the CHANGELOG's `## [X.Y.Z]` section, so neither workflow here creates one (`python-publish.yml:83`).
2. `npm-publish.yml`: checks out the tag, checks the npm token can authenticate (`:51`), skips if `@northrelay/sdk@X.Y.Z` already exists (`:73`), checks `package.json` equals the tag, runs `npm ci`, typecheck, build and test (`:85`), then `npm publish --access public` (`:97`). Serialized by `concurrency` (`:20`).
3. `python-publish.yml`: checks `pyproject.toml` equals the tag (`:39`), runs the tests (`:50`), builds, `twine check`, uploads with the PyPI token (`:64`), then retries `pip install northrelay==X.Y.Z` until it resolves (`:71`). It has no dispatch and no "already published" check.
4. Confirm: `gh run list --repo North-Relay/northrelay-sdks --workflow <file> --limit 5`; `npm view @northrelay/sdk@X.Y.Z version`; `pip index versions northrelay` or `https://pypi.org/pypi/northrelay/X.Y.Z/json`. The platform's `scripts/verify-client-publication.py` waits for the same.

Secrets: `NPM_TOKEN` and `PYPI_TOKEN` are repository secrets of this repository, named in the workflows. Never print, paste or commit a value; a check that needs the npm identity uses the workflow's `check_only` run, which reports without exposing it.

## Repairing a publication

A tag is immutable: never move, delete or re-push one, and never reuse a version (both registries refuse it). Defective code gets a new version from the platform.

- npm failed for an existing tag: fix the cause (usually the token; see #14), then dispatch `npm-publish.yml` with `version: X.Y.Z` and `check_only: true` to see authentication pass, then again with `check_only: false` (inputs `:7-16`). Already-published versions are skipped, so a repeat is safe.
- PyPI failed before the upload: `gh run rerun <run-id> --repo North-Relay/northrelay-sdks` on the tag's run. After a successful upload a re-run fails at the upload; check PyPI first.
- A change to a publish workflow is a pull request here against `master`; the fixed workflow applies to a dispatch at once and to a tag push only for later tags (a tag push runs the workflow file as of the tagged commit).

## History worth knowing

- `typescript/v1.6.0` exists but npm has no 1.6.0: the tag run failed on 2026-09-10 and was not recovered. `typescript/v1.8.0` failed the same way (npm `E404` on publish, a token problem) and was recovered by dispatch on 2026-09-25 after #14.
- 1.7.0 was never tagged; both CHANGELOGs keep it as "Unreleased" (`typescript/CHANGELOG.md`, `python/CHANGELOG.md`).
- Verified 2026-10-14: npm and PyPI both at 1.11.0, every tag run green since 1.9.0.
