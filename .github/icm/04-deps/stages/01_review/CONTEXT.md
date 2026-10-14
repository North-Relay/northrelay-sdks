# 01_review — what moves, and where

One job: a review of one dependency finding that says what changes, whether callers are exposed, and where the bump is made.

## Inputs
- Working (this run): the finding — read whole: the alert (`gh api repos/North-Relay/northrelay-sdks/dependabot/alerts/<n>`), the failing `SDK security validation` run (`gh run view <run-id> --log-failed`), or the pull request (`gh pr view <n> --comments`, `gh pr diff <n>`) with the upstream notes it links.
- Reference (every run): `.github/icm/_shared/mirror.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`
- Reference (only when callers need a new version to get the fix): `.github/icm/_shared/release.md`

Do NOT load: the other pipelines, other runs' output, the SDK source beyond what the dependency touches.

## Process
1. Name the package, the manifest, the versions from and to, and whether it is a runtime dependency (`dependencies` in `typescript/package.json`, `[project] dependencies` in `python/pyproject.toml`) or a development one.
2. Compare with the platform's `sdk/<language>/` at `main` ([mirror.md](../../../_shared/mirror.md) "Telling whether the platform already differs"): the platform's Dependabot covers `sdk/typescript`, so the bump may already be there, waiting for the next version.
3. Say where the bump is made: the platform (its `deps` route) for anything in `typescript/` or `python/`; here only for `.github/workflows/` (action versions). Never a manifest or lockfile change here alone.
4. For a runtime dependency, say whether callers are exposed: does the published range (for example `"axios": "^1.6.5"`) let a caller's own lockfile resolve the fixed version, or does the floor need raising and a new version ([release.md](../../../_shared/release.md) "Cutting a version")?
5. Read the checks on the finding: `npm audit` in `security.yml`, the contract tests; say what exercises the dependency and what does not.

## Outputs
- review.md → output/ — the package and manifest, from and to, runtime or development; the platform comparison; where the bump is made; whether callers are exposed and whether a version is needed; the checks; merge, port to the platform, wait for the next version, or dismiss, with the reason.

## Human check
A person reads `review.md` and decides: port the bump to the platform, wait for the next version, merge a workflow bump here, or dismiss the alert. A manifest change is never merged here alone.
