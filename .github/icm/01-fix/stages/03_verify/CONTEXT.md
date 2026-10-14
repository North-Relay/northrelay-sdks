# 03_verify — the fix in the published version

One job: show that the version a caller installs carries the fix.

## Inputs
- Working (this run): `.github/icm/01-fix/stages/02_fix/output/fix-pr.md`
- Reference (every run): `.github/icm/_shared/release.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`

Do NOT load: the other pipelines, other runs' output, the SDK source beyond the files the fix changed.

## Process
1. A platform fix with a version bump: follow [release.md](../../../_shared/release.md) "From tag to registry" for `X.Y.Z` — the `sync:` commit on `master` here, the tag, the publish run, the registry. A red step is route `release`, not a re-run from here. Without a bump nothing has published: say so and stop.
2. A fix here: the pull request merged to `master` with its checks green; for a publish-workflow fix, the next run of that workflow (or a `check_only` dispatch, which publishes nothing) passes.
3. Install the published version into a clean environment and run the reproduction's test against it; run it against `master` here too. Both pass, or the fix is not done.
4. Draft the comment that closes the report: the version, the pull request, the run links.

## Outputs
- verification.md → output/ — each run with its link and result; the version seen in the registry; the reproduction's passing output against it; the drafted closing comment.

## Human check
A person sees the version in the registry and the reproduction passing against it, then closes the issue with the drafted comment.
