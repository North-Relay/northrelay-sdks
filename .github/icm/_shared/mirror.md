---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# The mirror — where a change to an SDK is made

This repository publishes the SDKs; it does not develop them. Read this before changing anything under `typescript/` or `python/`.

## Where a change is made

| What changes | Made in | Why |
|---|---|---|
| SDK code, tests, examples, `package.json`, `package-lock.json`, `pyproject.toml`, the SDK READMEs, CHANGELOGs, `typescript/PUBLISHING.md`, `python/IMPLEMENTATION.md`, `python/TEMPLATES.md` | North-Relay/northrelay-platform, `sdk/typescript/` or `sdk/python/` (private to the organisation) | the sync replaces the whole SDK folder here on every release |
| `.github/workflows/` (the publish, contract and security jobs), `README.md`, `CONTRIBUTING.md`, `SECURITY-DEPENDENCIES.md`, `go/README.md`, `.gitignore`, `.github/icm/` | here, a pull request against `master` | nothing syncs over them |

The sync is the platform's [`sync-sdks-to-public.yml`](https://github.com/North-Relay/northrelay-platform/blob/main/.github/workflows/sync-sdks-to-public.yml), step "Sync SDK files": it deletes every entry of `<language>/` except `.git*` and copies the platform's `sdk/<language>/*` in, commits `sync: <language> vX.Y.Z from monorepo` to `master` as NorthRelay Bot, then tags `<language>/vX.Y.Z`. Dotfiles inside the platform folder (`sdk/python/.gitignore`) are not copied.

## The evidence that a change here is lost

- Pull request #12 (2026-09-06) raised the axios floor to `^1.20.0`, pinned vitest `4.1.11` and renamed `typescript/vitest.config.ts` to `.mts` here only. The next syncs restored the platform's files: `typescript/package.json:55` is `"axios": "^1.6.5"` again, vitest is `^4.1.3`, and the config is `typescript/vitest.config.ts`. Only the lockfile still resolves axios 1.20.0 (`typescript/package-lock.json`, `node_modules/axios`), because the platform's lockfile does too. `SECURITY-DEPENDENCIES.md` still describes #12's state.
- Pull request #10 (2026-03-12, `python/northrelay/types.py`) survived only because the same change was made in the platform.

## Telling whether the platform already differs

Compare this folder with the platform's at its `main` before reproducing or fixing anything: `git -C <platform clone> ls-tree -r origin/main sdk/<language>` against `git ls-tree -r origin/master <language>`. On 2026-10-14 the TypeScript folders differed only in `package.json` and `package-lock.json` (a vitest 5 bump, platform #963, not yet released) and the Python folders not at all. A difference means the platform has changes that publish with its next version; a defect may already be fixed there.

## A pull request opened here against `typescript/` or `python/`

An outside contributor can only reach this repository (the platform is private). Such a pull request is a report with a proposed patch: a maintainer ports it to the platform's `sdk/<language>/` and closes it here with the link, or it merges here and is overwritten by the next sync.

## The platform side

The platform owns the release decision and its procedure: its `.github/icm/_shared/deploy.md` "Client packages", [`release-clients.yml`](https://github.com/North-Relay/northrelay-platform/blob/main/.github/workflows/release-clients.yml) and [`docs/SDK_RELEASE_PROCESS.md`](https://github.com/North-Relay/northrelay-platform/blob/main/docs/SDK_RELEASE_PROCESS.md); its `CLAUDE.md` routes `fix`, `feature`, `deps` and `clients` are where the change itself is made. This repository's half is [release.md](release.md).
