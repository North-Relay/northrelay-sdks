# 02-feature — the pipeline

Agree the surface in both languages, build it where the SDKs are written, see it published.

| Stage | Job | Input | Output | Human check |
|---|---|---|---|---|
| [`01_spec`](stages/01_spec/CONTEXT.md) | agree the API, the names and the version | the request | `output/spec.md` | A maintainer approves the route it calls, the names in both languages, the version class and the documents, or sends the spec back. Nothing is implemented against an unapproved spec; edit `spec.md` in place. |
| [`02_implement`](stages/02_implement/CONTEXT.md) | the platform pull request | 01_spec's `spec.md` | `output/implement-pr.md` | A person reviews the pull request against `spec.md`: both SDKs, the same names as approved, tests and documents present. The reviewer merges it on the platform; its deploy is what publishes a bumped version. |
| [`03_verify`](stages/03_verify/CONTEXT.md) | the capability in the published version | 02_implement's `implement-pr.md` | `output/verification.md` | A person sees the version in both registries and the new names importable from each, then closes the request. |
