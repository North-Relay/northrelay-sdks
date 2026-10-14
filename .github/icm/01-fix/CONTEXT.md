# 01-fix — the pipeline

Make it fail, fix it where the file is owned, see it fixed in the registry.

| Stage | Job | Input | Output | Human check |
|---|---|---|---|---|
| [`01_reproduce`](stages/01_reproduce/CONTEXT.md) | reproduce the reported defect | the report | `output/reproduction.md` | A person runs the command or reads the log, confirms it fails for the reported reason and not a neighbouring one, and agrees where the fix is made: the platform or this repository. |
| [`02_fix`](stages/02_fix/CONTEXT.md) | change the cause, where it is owned | 01_reproduce's `reproduction.md` | `output/fix-pr.md` | A person reads the diff beside the reproduction: it removes the cause, it is in the repository that owns the file, and the version bump (or its absence) is what they want. The reviewer merges it there. |
| [`03_verify`](stages/03_verify/CONTEXT.md) | the fix in the published version | 02_fix's `fix-pr.md` | `output/verification.md` | A person sees the version in the registry and the reproduction passing against it, then closes the issue with the drafted comment. |
