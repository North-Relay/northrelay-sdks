# 04-deps — the pipeline

Say what moves and who moves it; a bump lands where the manifest is owned.

| Stage | Job | Input | Output | Human check |
|---|---|---|---|---|
| [`01_review`](stages/01_review/CONTEXT.md) | what moves, and where | the finding | `output/review.md` | A person reads `review.md` and decides: port the bump to the platform, wait for the next version, merge a workflow bump here, or dismiss the alert. A manifest change is never merged here alone. |
