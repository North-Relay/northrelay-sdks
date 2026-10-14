# 01_trace — where each version stands

One job: for each SDK in this version, the state of the chain from sync to registry, and the cause of any break.

## Inputs
- Working (this run): the version — the tag the person names (`typescript/vX.Y.Z`, `python/vX.Y.Z`), or the failed run's link.
- Reference (every run): `.github/icm/_shared/release.md`
- Reference (only when a failure is in the tests or the build): `.github/icm/_shared/build-and-test.md`

Do NOT load: the other pipelines, other runs' output, the SDK source.

## Process
1. For each SDK, follow [release.md](../../../_shared/release.md) "From tag to registry": the `sync:` commit on `master` (`git log origin/master --oneline -5`), the tag (`git ls-remote --tags origin '<language>/v*'`), the publish run (`gh run list --repo North-Relay/northrelay-sdks --workflow <file> --limit 5`), the registry (`npm view @northrelay/sdk@X.Y.Z version`, the PyPI JSON page). Record each with a link.
2. No sync commit and no tag: the platform's release job did not run or failed for this language (the Python sync waits for the TypeScript one). That is the platform's to repair; name the platform run if visible and stop there.
3. A red publish run: read the failed step (`gh run view <run-id> --log-failed`) and name the cause: version mismatch, a test or build failure, registry authentication (`E401`, `E404` on publish), the version already published, a network failure. Quote error lines, never a token or an identity the log masks.
4. Classify each SDK: published; failed before upload; failed at or after upload; not tagged. Name the repair from release.md "Repairing a publication", or "none: a new version from the platform" when the code at the tag is at fault.

## Outputs
- trace.md → output/ — per SDK: the commit, the tag, the run and the registry, each with a link; the cause of any break; the state; the repair proposed.

## Human check
A person reads the state of each SDK and approves the proposed repair, or decides on none. A repair that publishes is never started without that approval.
