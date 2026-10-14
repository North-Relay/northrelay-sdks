# 02_recover — repair it, see it published

One job: carry out the approved repair for the same tag and confirm the version in each registry.

## Inputs
- Working (this run): `.github/icm/03-release/stages/01_trace/output/trace.md`
- Reference (every run): `.github/icm/_shared/release.md`
- Reference (only when the repair changes a workflow here): `.github/icm/_shared/conventions.md`

Do NOT load: the other pipelines, other runs' output, the SDK source.

## Process
1. Do only the repair `trace.md` names and the person approved; nothing for an SDK already published.
2. npm: dispatch `npm-publish.yml` for the existing tag with `check_only` first (`gh workflow run npm-publish.yml --repo North-Relay/northrelay-sdks -f version=X.Y.Z -f check_only=true`), read that run, then with `check_only=false` ([release.md](../../../_shared/release.md) "Repairing a publication").
3. PyPI, failed before the upload: `gh run rerun <run-id> --repo North-Relay/northrelay-sdks`. Check PyPI first; after a successful upload a re-run only fails.
4. A credential: only a person with admin rights on this repository replaces `NPM_TOKEN` or `PYPI_TOKEN`. Say which secret and what the run showed; never ask for, print or store the value.
5. A workflow defect: a pull request here against `master` ([conventions.md](../../../_shared/conventions.md)); after it merges, the dispatch in step 2 uses the fixed file.
6. Never move, delete or re-push a tag, and never publish from a laptop: the tag's code, the workflow, the registry.
7. Confirm each SDK in its registry and record the run links.

## Outputs
- publication.md → output/ — what was done for each SDK, with run links; the version seen in each registry; anything left unpublished and why.

## Human check
A person sees `X.Y.Z` on npm and PyPI (or reads why one is left unpublished) and reads any workflow change made on the way.
