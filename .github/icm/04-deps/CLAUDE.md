# 04-deps — review a dependency alert or bump

One run is one dependency finding: a Dependabot alert on this repository (30 so far, all against `typescript/package-lock.json` or `typescript/package.json`), an `npm audit` failure in `SDK security validation`, or a bump someone proposes. It decides where the bump lands; the SDK manifests are the platform's, so a bump made only here is overwritten at the next sync (#12). #11 and #12 are the runs this job has seen.

Stages, in order; inputs, outputs and checks for each are in [CONTEXT.md](CONTEXT.md):

1. [Review](stages/01_review/CONTEXT.md) — what moves, whether the platform already moved it, where the bump is made.
