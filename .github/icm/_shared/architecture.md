---
verified_at: 2026-10-14
verified_commit: b5f45e47402a9d9700f34c879ef33f18842f9f85
---

# Architecture — where each part of the two SDKs lives

Both SDKs wrap the NorthRelay public API (`https://app.northrelay.ca`, the `/api/v1` routes of the platform) with an API key, and mirror each other resource for resource. Everything under `typescript/` and `python/` is a copy of the platform's `sdk/<language>/` ([mirror.md](mirror.md)).

## TypeScript — `@northrelay/sdk`

| Path | What it holds |
|---|---|
| `typescript/src/client.ts` | `NorthRelayClient` (`:33`; there is no `NorthRelay` export): the API-key check (`:83`), the default base URL (`:90`), one property per resource (`:106-129`) |
| `typescript/src/resources/` | one class per API area (emails, templates, designs, credentials, contacts, subscriptions, campaigns, webhooks, domains, …) |
| `typescript/src/utils/http.ts`, `typescript/src/utils/retry.ts` | the axios client, error mapping, retry with backoff |
| `typescript/src/types.ts`, `typescript/src/errors.ts` | request and response types; the error classes a caller catches |
| `typescript/src/webhooks.ts` | webhook signature verification, exported separately as `@northrelay/sdk/webhooks` (`typescript/package.json:8`) |
| `typescript/src/index.ts` | the public exports; a resource or type missing here is not public |
| `typescript/src/__tests__/` | vitest suites (client, designs, subscriptions) |
| `typescript/examples/` | runnable usage examples |
| `typescript/tsup.config.ts` | the build: CJS, ESM and declarations into `dist/` |

## Python — `northrelay`

| Path | What it holds |
|---|---|
| `python/northrelay/client.py` | `NorthRelay`: the default base URL (`:65`), the API-key check (`:75`), one attribute per resource (`:99-134`); async only (`async with`, `:155`) |
| `python/northrelay/resources/` | one module per API area, same split as TypeScript (some areas share `infrastructure.py`) |
| `python/northrelay/utils/http.py`, `python/northrelay/utils/retry.py` | the `httpx.AsyncClient` wrapper and retry |
| `python/northrelay/types.py` | Pydantic v2 models with camelCase aliases (`Field(..., alias="extractedVariables")`); the API's field names are the aliases |
| `python/northrelay/exceptions.py` | the exception classes |
| `python/northrelay/__init__.py` | the public exports and `__version__` (`:99`), a second copy of the version ([release.md](release.md)) |
| `python/tests/` | pytest suites (client, resources, retry, types, designs, subscriptions), no network |
| `python/examples/` | runnable usage examples |

## Parity

A new endpoint lands in both SDKs in the same platform version (both CHANGELOGs share version numbers, `typescript/CHANGELOG.md`, `python/CHANGELOG.md`). The two constructors still differ in places (TypeScript `inbox`, Python `inbound`; the TypeScript inbound types are kept as legacy, `typescript/src/index.ts:175`): compare them before claiming parity.

## The API they call

The contract is the platform's (`docs/openapi.yaml`, `src/app/api/v1/` in North-Relay/northrelay-platform); the response envelope is `{ data }` / `{ error: { code, message, … } }` (platform `.github/icm/_shared/gotchas.md`). `README.md` "Documentation" also names North-Relay/api-spec. An SDK that disagrees with the API is wrong, not the API, unless the platform says otherwise.
