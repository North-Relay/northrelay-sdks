# Changelog

All notable changes to the NorthRelay SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-27

### Fixed
- **CRITICAL: Webhook signature verification crash** — `crypto.timingSafeEqual` threw on mismatched buffer lengths instead of returning false
- **CRITICAL: Webhook verification with undefined inputs** — missing null-guard caused crash when payload/signature/secret were undefined
- **Contacts `bulkDelete`** — was sending POST to wrong endpoint instead of DELETE to `/contacts/bulk`
- **Contacts `updateList`** — was using POST instead of PATCH
- **URL encoding safety** — added `encodeURIComponent` to path parameters in `subusers.getByUsername`, `suppressions.remove`, `suppressionGroups.removeSuppression`, `contacts.removeTag`
- **Subusers `checkUsername`** — query string was not properly encoded with `URLSearchParams`
- **User-Agent version** — was hardcoded to `1.0.0` instead of tracking actual SDK version
- **`sendTemplate` fallback sender** — removed insecure `noreply@example.com` default; `from` is now required

### Added
- **Template versioning** — `listVersions`, `getVersion`, `restoreVersion` methods
- **Template utilities** — `compileMjml`, `render`, `generateBulk` methods
- **Webhook delivery tracking** — `listDeliveries`, `listFailures`, `retryFailure` methods
- **Webhook health** — `getHealth` method for monitoring webhook reliability
- **Webhook failure settings** — `getFailureSettings`, `updateFailureSettings` methods
- **Event counts** — `events.count()` method with date range filtering and type grouping
- New types: `TemplateVersion`, `WebhookDelivery`, `WebhookFailure`, `WebhookFailureSettings`, `WebhookHealth`
- `SDK_VERSION` constant exported from `version.ts` for dynamic User-Agent

### Removed
- Unused `zod` dependency (was listed but never imported)

## [1.0.0] - 2026-02-17

### Added
- Initial release of @northrelay/sdk
- Complete TypeScript SDK for NorthRelay Platform API
- 20 resource modules:
  - EmailsResource - send, schedule, validate, batch
  - TemplatesResource - CRUD, preview, compile
  - DomainsResource - CRUD, verify
  - WebhooksResource - CRUD, test, rotate
  - ApiKeysResource - list, create, revoke
  - EventsResource - list, filter, pagination
  - CampaignsResource - CRUD, workflow
  - ContactsResource - CRUD, lists, import
  - BrandThemeResource - CRUD
  - AnalyticsResource - query, export, heatmaps
  - MetricsResource - delivery metrics, summary
  - SuppressionsResource - CRUD, bulk operations
  - SuppressionGroupsResource - CRUD
  - SubusersResource - CRUD, permissions, usage
  - IdentityResource - verify, CRUD, profile
  - IpPoolsResource - CRUD, routing
  - IpsResource - dedicated IP, warmup
  - InboundResource - inbound domains
  - AdminResource - provisioning, metrics
  - KeysResource - key rotation
- Automatic retry logic with exponential backoff
- Rate limit tracking and exposure
- Webhook HMAC-SHA256 verification utilities
- "No-Support" error handling philosophy (fix_action + docs_url)
- Full TypeScript support with complete type definitions
- ESM + CJS dual package support
- Comprehensive documentation with 15+ examples
- Example files for common use cases

### Developer Experience
- Clean resource module pattern
- Type-safe request/response handling
- Proper error classes (AuthenticationError, ValidationError, RateLimitError, etc.)
- HTTP client with interceptors
- Request/response logging (debug mode)

### Known Limitations
- No unit tests yet (planned for v1.1.0)
- Unused Zod dependency (3KB overhead, can be removed)

[1.2.0]: https://github.com/North-Relay/northrelay-sdks/releases/tag/typescript/v1.2.0
[1.0.0]: https://github.com/North-Relay/northrelay-sdks/releases/tag/typescript/v1.0.0
