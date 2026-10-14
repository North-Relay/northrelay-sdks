# 02-feature — add a capability to both SDKs

One run is one capability (an endpoint, a resource, a method or an option) added to the TypeScript and Python SDKs together: specified against the platform's API, implemented in the platform's `sdk/<language>/`, and seen in the published version. #1 (new API methods in TypeScript 1.2.0) and #13 (design resources in both SDKs, synchronized with platform #835), and the `### Added` sections of every version since, are the runs this job repeats.

Stages, in order; inputs, outputs and checks for each are in [CONTEXT.md](CONTEXT.md):

1. [Spec](stages/01_spec/CONTEXT.md) — the API it calls, the names in both languages, the version.
2. [Implement](stages/02_implement/CONTEXT.md) — the platform pull request, both SDKs, tests and documents.
3. [Verify](stages/03_verify/CONTEXT.md) — the capability in the published version.
