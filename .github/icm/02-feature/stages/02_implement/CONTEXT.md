# 02_implement — the platform pull request

One job: implement the approved spec in both SDKs, in one pull request on the platform, with its tests and documents.

## Inputs
- Working (this run): `.github/icm/02-feature/stages/01_spec/output/spec.md`
- Reference (every run): `.github/icm/_shared/architecture.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`
- Reference (every run): `.github/icm/_shared/mirror.md`
- Reference (only when the version is bumped in this pull request): `.github/icm/_shared/release.md`

Do NOT load: the other pipelines, other runs' output, `.github/icm/_shared/documents.md`.

## Process
1. Work on North-Relay/northrelay-platform under `sdk/typescript/` and `sdk/python/`, following that repository's `feature` route; nothing under `typescript/` or `python/` is committed here ([mirror.md](../../../_shared/mirror.md)).
2. Implement the surface exactly as `spec.md` names it, following the shape of the neighbouring resource in each SDK ([architecture.md](../../../_shared/architecture.md)): the resource, the types or models, the export, the client property.
3. Tests in both suites, HTTP stubbed as the existing ones do; run each SDK's checks ([build-and-test.md](../../../_shared/build-and-test.md) "Locally").
4. Documents: the SDK READMEs, a `### Added` entry in both CHANGELOGs under the new version, an example if the spec named one. If the version is bumped here, bump both SDKs and `__version__` ([release.md](../../../_shared/release.md) "Cutting a version").
5. Anything the spec did not foresee goes back to stage 01, not into the pull request.

## Outputs
- implement-pr.md → output/ — the platform pull request link; each file changed against the spec's sections; both suites' results; the version it ships in, or that it waits for a later bump.

## Human check
A person reviews the pull request against `spec.md`: both SDKs, the same names as approved, tests and documents present. The reviewer merges it on the platform; its deploy is what publishes a bumped version.
