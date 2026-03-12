# SDK Publishing Guide

Publishing uses the public repo [North-Relay/northrelay-sdks](https://github.com/North-Relay/northrelay-sdks) as the release channel. The monorepo syncs SDK files there, and the public repo's CI publishes to npm/PyPI.

## Release Flow

```
monorepo tag (sdk/typescript/v1.3.0)
  → sync-sdks-to-public.yml (monorepo workflow)
    → syncs files to northrelay-sdks/typescript/
    → creates tag typescript/v1.3.0 in public repo
      → typescript-publish.yml (public repo workflow)
        → publishes @northrelay/sdk to npm
```

## Quick Release

```bash
# 1. Ensure version is set in package.json / pyproject.toml
# 2. Ensure CHANGELOG.md is updated
# 3. Commit changes to main

# TypeScript SDK
./scripts/release-sdk.sh typescript 1.3.0
git push origin sdk/typescript/v1.3.0

# Python SDK
./scripts/release-sdk.sh python 1.2.0
git push origin sdk/python/v1.2.0

# MCP Server (publishes directly, not via public repo)
./scripts/release-sdk.sh mcp 1.1.0
git push origin mcp-v1.1.0
```

## Tag Conventions

| SDK | Monorepo Tag | Public Repo Tag | Registry |
|-----|-------------|-----------------|----------|
| TypeScript | `sdk/typescript/v1.3.0` | `typescript/v1.3.0` | npm `@northrelay/sdk` |
| Python | `sdk/python/v1.2.0` | `python/v1.2.0` | PyPI `northrelay` |
| MCP Server | `mcp-v1.1.0` | N/A (direct publish) | npm `@northrelay/mcp-server` |

## Required Secrets

### Monorepo (`northrelay-platform`)
- `PUBLIC_SDK_SYNC_TOKEN` — GitHub PAT with repo access to northrelay-sdks
- `NPM_PTOKEN` — npm token (for MCP Server direct publish only)

### Public Repo (`northrelay-sdks`)
- `NPM_TOKEN` — npm automation token for @northrelay/sdk
- `PYPI_TOKEN` — PyPI token for northrelay package

## Pre-Release Checklist

- [ ] Version bumped in `package.json` / `pyproject.toml`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] SDK builds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Changes committed to `main`

## Manual Publish (Emergency)

If CI is broken, publish directly:

```bash
# TypeScript
cd sdk/typescript
npm ci && npm run build && npm test
npm publish --access public

# Python
cd sdk/python
pip install build twine
python -m build
twine upload dist/*
```

## Troubleshooting

### Sync workflow fails with "remote rejected"
The public repo default branch is `master`. The sync workflow pushes to `master`.

### Version mismatch error
The public repo's publish workflows verify that the tag version matches `package.json`/`pyproject.toml`. Ensure versions match before tagging.

### Tag already exists
```bash
# Delete and recreate
git tag -d sdk/typescript/v1.3.0
git push origin :refs/tags/sdk/typescript/v1.3.0
git tag -a sdk/typescript/v1.3.0 -m "TypeScript SDK v1.3.0"
git push origin sdk/typescript/v1.3.0
```
