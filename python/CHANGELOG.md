## [1.9.0] - 2026-10-06

### Added
- `client.subscriptions`: `subscribe`, `unsubscribe` (scope all/list/topic), `get(email)`, `update_preferences(email, ...)` and `resend_confirmation(email)`, with typed results (`SubscribeResult`, `UnsubscribeResult`, `SubscriptionStatus`, `ResendConfirmationResult`). Supports double opt-in, `redirect_url`, consent evidence and `resubscribe`. Emails are URL-encoded in paths.
- List members by email: `contacts.add_to_list(id, contact_ids, emails=..., create_missing=...)` returns `AddListMembersResult` (`added`, `already_members`, `not_found`, `blocked`); `contacts.remove_from_list(id, contact_ids, emails=...)`; `contacts.list_members(id, page, limit, filter)` returns `ListMembersPage` with counts and suppression flags.
- Contacts: `get`, `update`, `add_tags`; `create_list`/`update_list` accept `topic_id` and `tracking_enabled`.
- CSV import sends the required `mappings` (`csvColumn` → field; auto-detected from the header when omitted), plus `list_id` and `tags`; returns `ImportContactsResult` with `added_to_list`.
- Topics: `client.topics` (alias of `client.suppression_groups`) gains `list_members`, `add_member`, `remove_member` and the public label/description/publish fields.
- `client.forms`: list, get, create, update, set_fields, delete, submit.
- `WebhookEventType`, `WEBHOOK_EVENT_TYPES` (including `list.member_added`, `list.member_removed`, `email.opened`, `email.clicked`) and a `WebhookPayload` model.
- Error `details` now carry `code`, `fix_action` and `docs_url` for every status; other 4xx codes (such as 413) raise `NorthRelayError` instead of `httpx.HTTPStatusError`.

### Fixed

- `suppressions.add(email, reason="Manual")`: `reason` defaulted to `None`, which the API rejects. `suppressions.remove` and `suppressions.check` URL-encode the email.
- Contacts: `list` sends the API's `tag`, `status`, `source`, `sortBy`, `sortOrder` (`list_id` and `tags` are deprecated and warn); `Contact` matches the API (`first_name`, `last_name`, `status`, `tags`, `custom_fields`; `name` and `subscribed` stay as properties); `CreateContactRequest` no longer sends the unknown `subscribed` field (`name` is split into first/last name); `bulk_upsert` sends `skipDuplicates`; `remove_tags` removes tags one by one (there is no bulk tag-delete route); multipart uploads now carry their boundary.
- List and topic creation no longer send `null` descriptions (rejected by the API); list pages read the `pagination` object.
- Webhooks: `update` uses PATCH, `rotate_secret` calls `/rotate`, and `list`/`get`/`create` read the API's `webhooks`/`webhook`/`secret` fields; event names are the API's (`email.delivered`, ...).
- `with_retry` is typed for async callables.

### Changed
- Write methods of contacts, lists, subscriptions, topics, forms and webhooks are no longer retried automatically; reads still are.
- `add_to_list` / `remove_from_list` / `bulk_*` / `import_csv` return typed models instead of raw dicts.

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

