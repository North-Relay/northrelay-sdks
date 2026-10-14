# 03-release — follow a version to the registries

One run is one synced version of one or both SDKs: from the tag the platform's sync pushed here to the same version visible on npm and PyPI, repaired if a publish failed. Cutting the version is not part of it: that is a version bump in the platform ([release.md](../_shared/release.md) "Cutting a version", route `cut`). The publish history is the evidence: TypeScript 1.6.0 and 1.8.0 failed on npm authentication, 1.8.0 was recovered by dispatch after #14, and the publish workflows were repaired repeatedly in March 2026.

Stages, in order; inputs, outputs and checks for each are in [CONTEXT.md](CONTEXT.md):

1. [Trace](stages/01_trace/CONTEXT.md) — where each SDK's version stands, and why.
2. [Recover](stages/02_recover/CONTEXT.md) — the approved repair, and the version seen in each registry.
