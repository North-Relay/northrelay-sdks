# Shared reference

What every job on this repository draws on. Each file points at the repository file that owns a fact (`path:line`) and says what it means for the job; follow the pointer for the detail, and when the two disagree the owning file is right.

| File | Answers |
|---|---|
| [mirror.md](mirror.md) | where a change is made: the platform's `sdk/<language>/` for SDK code, here for workflows and root documents; the evidence; how to compare the two |
| [architecture.md](architecture.md) | where each part of the TypeScript and Python SDKs lives, parity between them, the API they call |
| [build-and-test.md](build-and-test.md) | the local commands, what each CI workflow runs, what counts as evidence |
| [release.md](release.md) | how a version is cut (in the platform), how a tag here reaches npm and PyPI, how a publication is repaired, the history |
| [conventions.md](conventions.md) | branches, commits, versions, changelogs, code style, security reporting, what may be written in a public repository |
| [documents.md](documents.md) | every document here, who edits it, which have drifted |

Each stage's contract names the files it loads.
