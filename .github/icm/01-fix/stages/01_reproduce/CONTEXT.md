# 01_reproduce — reproduce the reported defect

One job: turn the report into a test that fails on demand, for the reason reported, and name the repository where the fix is made.

## Inputs
- Working (this run): the report — read whole with what it links: an issue (`gh issue view <n> --repo North-Relay/northrelay-sdks --comments`), a red run (`gh run view <run-id> --log-failed`), a caller's error and the version they installed.
- Reference (every run): `.github/icm/_shared/mirror.md`
- Reference (every run): `.github/icm/_shared/architecture.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`
- Reference (only when the report could be a vulnerability): `.github/icm/_shared/conventions.md`
- Reference (only when the defect is in a publish workflow): `.github/icm/_shared/release.md`

Do NOT load: the other pipelines, other runs' output, `.github/icm/_shared/documents.md`, CHANGELOG sections beyond the versions the report names.

## Process
1. If the report could be a vulnerability, stop before writing anything: this job ends in a public pull request, and [conventions.md](../../../_shared/conventions.md) "Security" is the route.
2. Restate the report as observed versus expected, with the SDK, its version (`npm ls @northrelay/sdk`, `pip show northrelay`), the runtime (Node, Python) and the call made.
3. Compare the folder here with the platform's `sdk/<language>/` at `main` ([mirror.md](../../../_shared/mirror.md) "Telling whether the platform already differs"). If the code path differs, reproduce against both. A defect already fixed there ships with the next version: record it and stop at the human check.
4. Find the code path with [architecture.md](../../../_shared/architecture.md) and name the suspected cause as `path:line`. A suspicion is not a finding until something fails.
5. Write the failing test in the SDK's own suite (`typescript/src/__tests__/`, `python/tests/`), stubbing HTTP as the existing tests do; never a live call or a key. For a workflow defect, the failing run's log is the reproduction. Run it with the commands in [build-and-test.md](../../../_shared/build-and-test.md) and keep the failing output. The test is not committed here: it travels with the fix.
6. If it passes, the reproduction or the report is wrong: say which, and stop.
7. Name where the fix is made: the platform's `sdk/<language>/` (SDK code, tests, examples, SDK documents) or this repository (`.github/workflows/`, root documents).

## Outputs
- reproduction.md → output/ — the restated report; SDK, version and runtime; the platform comparison; the suspected cause (`path:line`); the test in full and the command; the failing output; where the fix is made.

## Human check
A person runs the command or reads the log, confirms it fails for the reported reason and not a neighbouring one, and agrees where the fix is made: the platform or this repository.
