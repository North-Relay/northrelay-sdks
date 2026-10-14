# 03-release — the pipeline

Read the chain from sync to registry, repair what failed without moving a tag, see the version published.

| Stage | Job | Input | Output | Human check |
|---|---|---|---|---|
| [`01_trace`](stages/01_trace/CONTEXT.md) | where each version stands | the version | `output/trace.md` | A person reads the state of each SDK and approves the proposed repair, or decides on none. A repair that publishes is never started without that approval. |
| [`02_recover`](stages/02_recover/CONTEXT.md) | repair it, see it published | 01_trace's `trace.md` | `output/publication.md` | A person sees `X.Y.Z` on npm and PyPI (or reads why one is left unpublished) and reads any workflow change made on the way. |
