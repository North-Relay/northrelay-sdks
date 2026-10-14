# 01_spec — agree the API, the names and the version

One job: a short spec a maintainer can approve or refuse before any code exists.

## Inputs
- Working (this run): the request — read whole: an issue (`gh issue view <n> --comments`), a platform change that added a route, or, handed over from `01-fix`, that run's `reproduction.md`.
- Reference (every run): `.github/icm/_shared/architecture.md`
- Reference (every run): `.github/icm/_shared/mirror.md`
- Reference (every run): `.github/icm/_shared/conventions.md`

Do NOT load: the other pipelines (from `01-fix`, only a handed-over `reproduction.md`), other runs' output, `.github/icm/_shared/release.md`, the full CHANGELOGs.

## Process
1. State the need in the caller's terms and what they do today without it. Check that neither SDK has it already (`typescript/src/resources/`, `python/northrelay/resources/`, and the platform's `sdk/` at `main`, which may be ahead: [mirror.md](../../../_shared/mirror.md)).
2. Name the API it calls: the platform route and its entry in the platform's `docs/openapi.yaml`, with request and response shapes ([architecture.md](../../../_shared/architecture.md) "The API they call"). A route that does not exist yet is a platform feature first (its `feature` route); this run waits for it.
3. Name the public surface in both languages: the TypeScript resource, method and types, and the `typescript/src/index.ts` export; the Python method, the Pydantic models and their camelCase aliases, and the `python/northrelay/__init__.py` export. Say where the two differ and why.
4. Errors, retries and idempotency: which error class a caller catches, whether the retry layer may repeat the call.
5. Classify the version: additive is minor; a removal or a changed signature is major and is deprecated first (`### Deprecated`, [conventions.md](../../../_shared/conventions.md) "Versions").
6. Tests (which suites, HTTP stubbed) and documents (the SDK README sections, a CHANGELOG `### Added` entry, an example if callers need one).
7. Out of scope: what this deliberately does not do.

## Outputs
- spec.md → output/ — sections 1-7 above, in that order, under two pages.

## Human check
A maintainer approves the route it calls, the names in both languages, the version class and the documents, or sends the spec back. Nothing is implemented against an unapproved spec; edit `spec.md` in place.
