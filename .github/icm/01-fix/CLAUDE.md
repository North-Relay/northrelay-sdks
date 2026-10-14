# 01-fix — fix a defect

One run is one defect: reproduced against the code here and the version the caller installed, fixed by one pull request in the repository that owns the file (the platform's `sdk/<language>/` for SDK code, this repository for its workflows and root documents), and seen fixed in the published version. The Python defects reported here in March 2026 (#3 to #9) and the fixes that followed (#2, #10), and the publish-workflow fixes (#14 and the March commits to `npm-publish.yml`), are the runs this job repeats.

Stages, in order; inputs, outputs and checks for each are in [CONTEXT.md](CONTEXT.md):

1. [Reproduce](stages/01_reproduce/CONTEXT.md) — make it fail on purpose, and say where the fix belongs.
2. [Fix](stages/02_fix/CONTEXT.md) — change the cause, in the repository that owns it.
3. [Verify](stages/03_verify/CONTEXT.md) — the fix in the version a caller installs.
