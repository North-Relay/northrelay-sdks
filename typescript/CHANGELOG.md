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
