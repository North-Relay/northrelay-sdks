# 03_verify — the capability in the published version

One job: show that the published packages carry the capability as specified.

## Inputs
- Working (this run): `.github/icm/02-feature/stages/02_implement/output/implement-pr.md`
- Reference (every run): `.github/icm/_shared/release.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`

Do NOT load: the other pipelines, other runs' output, the SDK source beyond the files the pull request changed.

## Process
1. Follow [release.md](../../../_shared/release.md) "From tag to registry" for the version: the `sync:` commits for both SDKs on `master` here, the tags, both publish runs, both registries. A red step is route `release`. No bump yet: say which version will carry it and stop.
2. Install both published packages into clean environments; import the new surface by the names in the spec and run the new tests against them.
3. Check the published READMEs (the npm and PyPI pages) show the new section.

## Outputs
- verification.md → output/ — each run with its link and result; the version seen in each registry; the import and test output against the published packages.

## Human check
A person sees the version in both registries and the new names importable from each, then closes the request.
