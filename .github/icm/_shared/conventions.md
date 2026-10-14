---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# Conventions — commits, versions, changelogs, security, what may be written here

## Branches and commits

The default branch is `master` (the platform's sync pushes to it). Branch names and Conventional Commit subjects with the SDK as scope (`fix(python): …`, `feat(typescript): …`) are `CONTRIBUTING.md` "1. Create a Feature Branch" and "4. Commit Your Changes"; the pull request checklist is "Pull Request Process". Bot commits are `sync: <language> vX.Y.Z from monorepo` and are never edited or reverted by hand ([mirror.md](mirror.md)).

## Versions

Semantic versions, `X.Y.Z` only: `npm-publish.yml:35` and the platform's sync refuse anything else, so a pre-release (`1.2.0-rc.1`) cannot ship through this channel. Both SDKs move together and have carried the same numbers since 1.4.0 (`typescript/CHANGELOG.md`, `python/CHANGELOG.md`); a version is never reused ([release.md](release.md)).

## Changelogs

Each SDK keeps its own: `typescript/CHANGELOG.md`, `python/CHANGELOG.md`, newest first, `## [X.Y.Z] - YYYY-MM-DD` with `### Added`, `### Fixed`, `### Changed`, `### Deprecated`. The heading shape is load-bearing: the platform's sync cuts the GitHub release body from the `## [X.Y.Z]` section. Edited in the platform, like the rest of the SDK folder.

## Code style

TypeScript: strict mode (`typescript/tsconfig.json`), ESLint flat config `typescript/eslint.config.mjs`. Python: Black and Ruff at 100 columns, mypy strict, target 3.9 (`python/pyproject.toml:77-90`). New public API carries doc comments with an example (`CONTRIBUTING.md` "Code Documentation").

## Security

A possible vulnerability is reported privately through this repository's GitHub "Report a vulnerability" (private vulnerability reporting is enabled, `gh api repos/North-Relay/northrelay-sdks/private-vulnerability-reporting`, 2026-10-14), never in a public issue, pull request or test. There is no `SECURITY.md` here; the organisation rule is the platform's `SECURITY.md`.

## This repository is public

The platform is private; this repository is not. Nothing from the platform's operations (servers, hosts, keys, customer data, private issue content) is copied into any file here, including `.github/icm/` and pull request descriptions. Link the platform file instead; readers outside the organisation see a 404, which is intended. Registry tokens are named (`NPM_TOKEN`, `PYPI_TOKEN`), never quoted.
