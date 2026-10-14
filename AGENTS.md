# NorthRelay SDKs

The public client libraries for the NorthRelay API: `@northrelay/sdk` on npm (`typescript/`) and `northrelay` on PyPI (`python/`); `go/` is a plan with no code. This repository is a mirror and a release channel. The SDKs are written in North-Relay/northrelay-platform under `sdk/<language>/`; when a platform deploy carries a new SDK version, its release job replaces the SDK folder here whole, commits `sync: <language> vX.Y.Z from monorepo` to `master` and tags `<language>/vX.Y.Z`, and the tag runs this repository's publish workflow. A change made here to `typescript/` or `python/` is lost at the next sync. This repository owns its workflows, its root documents and `go/`.

## Where things live

| Path | What it holds |
|---|---|
| `typescript/`, `python/` | the two SDKs as last synced: source, tests, examples, README, CHANGELOG — mapped in [architecture.md](.github/icm/_shared/architecture.md); edited in the platform ([mirror.md](.github/icm/_shared/mirror.md)) |
| `go/` | the planned Go SDK: a README only |
| `.github/workflows/` | the contract and security checks on pull requests; the npm and PyPI publish jobs a tag starts |
| `README.md`, `CONTRIBUTING.md`, `SECURITY-DEPENDENCIES.md` | the landing page, the contribution guide, a dependency note; which have drifted: [documents.md](.github/icm/_shared/documents.md) |
| [`.github/icm/_shared/`](.github/icm/_shared/CONTEXT.md) | what every job below draws on, one file per question |
| [`.github/icm/01-fix/`](.github/icm/01-fix/CLAUDE.md) | fix a defect in a published SDK or in this repository's workflows |
| [`.github/icm/02-feature/`](.github/icm/02-feature/CLAUDE.md) | add an endpoint, resource or method to both SDKs |
| [`.github/icm/03-release/`](.github/icm/03-release/CLAUDE.md) | follow a synced version to npm and PyPI, and repair a publication |
| [`.github/icm/04-deps/`](.github/icm/04-deps/CLAUDE.md) | review a dependency alert or bump |

## Route by what just happened

| Route | If | Go to | Then stop at |
|---|---|---|---|
| triage | an issue or report arrives and its kind is unclear | read it whole (`gh issue view <n> --comments`), then take the row below that fits | the row chosen, said to the person |
| fix | a defect is reported (issue, failing test, a caller who gets the wrong answer) | [01_reproduce](.github/icm/01-fix/stages/01_reproduce/CONTEXT.md) | a person has seen the reproduction fail |
| ci-red | `SDK contracts` or `SDK security validation` is red on `master` or a pull request | [01_reproduce](.github/icm/01-fix/stages/01_reproduce/CONTEXT.md), with the run log as the report | a person has seen the reproduction fail |
| security | a report may be a vulnerability | [conventions.md](.github/icm/_shared/conventions.md) "Security": a private report, never a public issue or pull request | the maintainer has the private report |
| mirror | a change to `typescript/` or `python/` is asked for, or a pull request here touches them | [mirror.md](.github/icm/_shared/mirror.md) "Where a change is made": made in the platform's `sdk/<language>/`, never here | the person has the platform pull request, or has ported the one opened here |
| feature | a new endpoint, resource or method is asked for in an SDK | [01_spec](.github/icm/02-feature/stages/01_spec/CONTEXT.md) | a person approves the spec |
| fix-to-feature | a fix turns out to need a new method or a breaking change | [01_spec](.github/icm/02-feature/stages/01_spec/CONTEXT.md), with the fix run's `reproduction.md` as the request | a person approves the spec |
| cut | a new SDK version is wanted | [release.md](.github/icm/_shared/release.md) "Cutting a version": a version bump in the platform | the person has the platform pull request that bumps it |
| release | a `sync:` commit or a `<language>/v*` tag arrived, a publish run failed, or a version is missing from npm or PyPI | [01_trace](.github/icm/03-release/stages/01_trace/CONTEXT.md) | a person has read the state of each registry |
| deps | a Dependabot alert, an `npm audit` failure or a dependency bump | [01_review](.github/icm/04-deps/stages/01_review/CONTEXT.md) | a person decides where the bump lands |
| docs | a document is wrong or missing and no code has to change | [documents.md](.github/icm/_shared/documents.md): the owner of each document and the known drift | a person confirms the owning file |
| next | a stage's output was approved | the next numbered stage of the same job | a person reads that stage's output |
| status | asked for status | scan `.github/icm/*/stages/*/output/` | report what exists |

## Agents connecting remotely

This repository has no MemoryRelay workspace of its own: the North-Relay hub, the ICM workspace `northrelay-hub` (North-Relay/agent-knowledge), includes it, and the hub's mirror compiles and serves these files from `master`. An agent on a clone needs nothing: this file is the entry and the table above is the route. An agent that is not on a clone reaches the same files over MCP at `https://api.memoryrelay.net/mcp` through the hub, with a key in `MEMORYRELAY_API_KEY` (Claude Code, Codex) or as a connector that signs in (claude.ai, Claude Desktop). None of it holds a secret.

- Start with `icm_context_build` for the route that fits, not with the whole repository.
- Report what you read with `icm_report_reads` when a stage ends, and what the task came to with `icm_report_outcome`.
- Never write through MCP: a change is a branch and a pull request here (or in the platform), read and merged by a person.

## Rules

- Nothing moves to the next stage until a person has read the output of the last one.
- A stage writes to its own `output/`, which is not committed: one run per worktree or branch, and clear that job's `stages/*/output/` when its pull request merges or is abandoned.
- A job reads only its own run's output; moving to another job is a route above, started by the person.
- `.github/icm/` points at the files that own each fact. When they disagree, the owning file is right: correct `.github/icm/` in the same pull request and bump its `verified_commit`.
- Never push, move or delete a tag here, and never reuse a version: tags come from the platform's sync and are immutable.
- This repository is public: never copy platform operations, keys or customer data into it, and never print or commit a registry token ([conventions.md](.github/icm/_shared/conventions.md)).
