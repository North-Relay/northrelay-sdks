## [1.11.0] - 2026-10-08

### Added
- Manifests: `applyManifest({ ..., publish: true })` publishes each entry whose live release differs from its draft after a real apply; the result's `published` lists versions. `exportManifest` returns a `version` plus per-entry `digest` and `publishedVersion`. Types `DesignManifestEntry`, `DesignManifestResult`.

## [1.10.0] - 2026-10-08

NorthRelay Studio: templates are designs, and dashboard templates live in the reserved `account` application.

### Added
- `designs.usage(id)`: campaigns using a template and its send counts; `deliveries(id)` now includes API sends by template id (`source: "api"`, `recipient`).
- Brands: `brandUsage(id)` (templates, campaigns, `needsPublish` for application templates on an older brand), `deleteBrand(id)`, `setDefaultBrand(id)`, and the tracking-domain methods `trackingDomain`, `setTrackingDomain`, `verifyTrackingDomain`, `removeTrackingDomain`. `DesignBrand.isDefault`.
- Assets: `assets()`, `uploadAsset({ imageBase64 })` (PNG, JPEG or WebP up to 700 KiB, resized for email) and `deleteAsset(id)`.
- `preview(id, { brandId })` previews a template with another brand; `adoptTemplate({ asBlocks: true })` adopts a gallery starter as a visual-editor draft; `send(id, { from })` for account templates.
- `EmailDesignDraft.format` (`"html"` | `"blocks"`) and `blocks`; `ACCOUNT_APPLICATION`.

### Deprecated
- `client.templates` and `client.brandTheme` (legacy APIs, sunset 30 April 2027). Template ids keep working: each legacy template is a design with the same id. The API returns `Deprecation`, `Sunset` and `Link: rel="successor-version"` headers on the legacy routes.
- `designs.uploadLogo`: use `uploadAsset`.

## [1.9.0] - 2026-10-06

### Added
- `client.subscriptions`: `subscribe`, `unsubscribe` (scope `all` / `list` / `topic`), `get(email)` status,
  `updatePreferences(email, ...)` and `resendConfirmation(email)`, with typed inputs, results and
  `SubscriptionErrorCode`; `isSubscriptionError(error, code?)` helper. Emails are URL-encoded in paths.
  `subscribe` and `resendConfirmation` are never retried automatically (a retry could send a second email).
- `client.forms`: list, get, create, update, archive, `setFields` and `submit` for hosted signup forms.
- Contacts: `get`, `update`, `addTags`, `bulkCreate(contacts, { skipDuplicates })`; list members by
  `emails` and/or `contactIds` with `createMissing` (`addListMembers` / `removeListMembers`), and
  `getListMembers(id, { page, limit, filter })` with per-member suppression flags and counts.
- Topics: `suppressionGroups.listMembers` / `addMember` / `removeMember`, `bulkRemoveSuppressions`,
  `list({ published })` and the unsubscribe-page fields (`publicLabel`, `publicDescription`,
  `isPublishedOnUnsub`, `sortOrder`). Lists accept `suppressionGroupId` and `trackingEnabled`.
- Webhooks: `WebhookEventType` (including `list.member_added`, `list.member_removed`, `email.opened`,
  `email.clicked`), the `WebhookPayload` union with typed `details` for `contact.subscribed`,
  `contact.confirmed`, `contact.unsubscribed` (scope, method, listId, topicId, campaignId) and the new
  events, and `parseWebhookPayload()`.
- CSV import: `importCsv(file, { mappings: [{ csvColumn, field }], listId, tags })`, accepting a
  `Blob`/`File` or a string; returns `{ imported, skipped, addedToList, errors }`.

### Fixed

- `webhooks` methods now return what the server sends: `list` → `{ webhooks }`, `get` → `{ webhook, stats }`, `create` → `{ webhook, secret, message }`, `update` (now PATCH, was PUT) → `{ webhook, message }`, `delete` → `{ message }`, `rotateSecret` → `{ id, secret, previousSecretValidUntil }`. `create`, `rotateSecret` and `testDelivery` are no longer retried; `testDelivery` returns `{ success, statusCode, responseTime, deliveryId, message, errorMessage }`.
- `suppressions.bulkAdd(emails, reason = "Manual")` sends the required `action: "add"`; new `suppressions.bulkRemove(emails)`; `suppressions.remove` URL-encodes the email.
- `contacts.bulkDelete` sends `{ contactIds }` (the API rejected `{ ids }`).
- `contacts.removeTags` used a route that does not exist; it now removes tags one by one through
  `DELETE /contacts/{id}/tags/{tag}` (all current tags when none are given). Tag and id path segments are encoded.
- `contacts.list` sends the parameters the API reads (`status`, `tag`, `search`, `source`, `sortBy`,
  `sortOrder`). `listId` was silently ignored and now throws, pointing to `getListMembers`; the
  deprecated `tags` option sends its first value as `tag`.
- `contacts.importCsv` now sends real multipart form data with the required `mappings`; it previously
  posted JSON without mappings and always failed.
- `suppressionGroups.bulkAddSuppressions` sends the required `action: 'add'`; emails in paths are encoded.
- Error subclasses now pass `instanceof` (`NotFoundError`, `RateLimitError`, `ValidationError`, ...);
  the prototype was pinned to `NorthRelayError`.
- Error bodies of the form `{ "error": "message" }` (contact lists, CSV import) keep their message.
- `verifyWebhookSignature` returns `false` instead of throwing when the signature length differs.
- Types now match the API: `Contact.tags` is `ContactTag[]`, `BulkContactResult` is
  `{ created, skipped, errors }`, webhook `events` use `WebhookEventType` (the `EventType` values were
  never accepted), contact-list routes return `{ data }` / `{ data, pagination }`.
  `UpdateContactRequest` no longer lists `tags` (the API ignored them; use `addTags` / `removeTag`).

### Changed
- `contacts.create`, `bulkCreate`, `importCsv`, `createList`, `suppressionGroups.create` and
  `forms.create` are no longer retried automatically, so a timeout cannot create duplicates.
- Drop the unused `zod` runtime dependency; the SDK never imported it.
- Development tooling: ESLint 9 flat config with typescript-eslint 8.

## [1.8.0] - 2026-09-25

- Filter and paginate hosted designs by brand, category, lifecycle and search.
- Align client contracts with current brand fields and template lifecycle.
- Add unified user/application credential management without automatic write retries.

## [1.7.0] - Unreleased

- Discover account/shared templates and built-in starters through the hosted catalog.
- Preview and adopt sources with a selected brand; preserve source digests and revisions when planning or applying updates.
- List, create, update and bind shared application brands, keeping published releases immutable.
- Support server-derived application namespaces for single-application credentials.
- Align the HTTP client version header with the package version.

## [1.6.0] - 2026-09-10

- Add application design capabilities, typed inputs, draft editing, exact hosted preview, immutable publication, rollback, manifests and logo assets.
- Support restricted API-only application credentials and mandatory idempotency keys for design sends.
- Align template and branding fields with the API.

# Changelog

All notable changes to the NorthRelay SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-03-11

### Added
- `EmailSource` type — `'API' | 'INBOX' | 'SMTP' | 'INBOUND' | 'SCHEDULED' | 'TEST'`
- `source` optional field on `EmailEvent` interface

### Fixed
- `EmailStatus` type now matches API values — added `Processing`, `Deferred`; removed invalid `Opened`, `Clicked`
- `EventType` type now includes `Queued`, `Processing`, `Dropped` to match API schema

## [1.1.0] - 2026-02-18

### Added
- **Campaigns API** - Full campaign management support
  - `CampaignsResource` with create, update, preview, submit, approve, reject, send, and status methods
  - Campaign approval workflow for team collaboration
  - Bulk email sending with campaign tracking
- **Contacts API** - Contact and list management
  - `ContactsResource` with full CRUD operations
  - Contact list management (create, update, delete, add/remove members)
  - CSV import support for bulk contact uploads
  - Bulk operations (create/delete multiple contacts)
  - Search and filtering capabilities
- **Brand Theme API** - Brand customization support
  - `BrandThemeResource` for managing brand colors, logos, and fonts
  - Create, update, get, and delete brand theme settings
- **Test Suite** - Added vitest configuration and basic tests
  - Fixed ESM/CJS compatibility issues
  - Added client initialization tests
  - Test coverage for all resource endpoints

### Changed
- Updated OpenAPI spec to v1.1.0 (27 new endpoints)
- Improved documentation with examples for all new features
- Enhanced type definitions for new resources

### Fixed
- Vitest configuration now properly excludes React dependencies
- Test suite no longer conflicts with parent project configuration
- Removed ESM/CJS module resolution errors

## [1.0.0] - 2026-02-17

### Added
- Initial release of NorthRelay TypeScript/JavaScript SDK
- **Core Features:**
  - Type-safe API client with full TypeScript support
  - Automatic retry logic with exponential backoff
  - Rate limiting and connection pooling
  - Comprehensive error handling
  - Webhook signature verification helpers
- **API Resources:**
  - Emails - Send, batch, schedule, validate
  - Templates - CRUD, preview, variable extraction
  - Domains - Verification, DNS management
  - Webhooks - CRUD, secret rotation, test delivery
  - API Keys - List, create, revoke
  - Events - Email event tracking
- **Documentation:**
  - Complete API reference
  - Usage examples for all resources
  - Migration guide from raw HTTP
  - TypeScript type definitions
- **Build System:**
  - Dual CJS/ESM builds
  - TypeScript declarations
  - Tree-shaking support
  - Source maps

[1.1.0]: https://github.com/North-Relay/northrelay-platform/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/North-Relay/northrelay-platform/releases/tag/v1.0.0
