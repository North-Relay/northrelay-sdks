# @northrelay/sdk

Official TypeScript/JavaScript SDK for the [NorthRelay](https://northrelay.ca) email infrastructure platform.

## Installation

```bash
npm install @northrelay/sdk
```

## Quick Start

```typescript
import { NorthRelayClient } from '@northrelay/sdk';

const client = new NorthRelayClient({
  apiKey: 'nr_live_your_api_key',
});

// Send an email
const result = await client.emails.send({
  from: { email: 'hello@yourdomain.com', name: 'Your App' },
  to: [{ email: 'user@example.com' }],
  content: {
    subject: 'Welcome!',
    html: '<h1>Hello {{name}}</h1>',
  },
  variables: { name: 'World' },
});

console.log(result.data.messageId);
```

## Resources

| Resource | Description |
|----------|-------------|
| `client.emails` | Send emails, track events, manage batches |
| `client.templates` | Create/update email templates with Handlebars |
| `client.campaigns` | Campaign lifecycle (draft, submit, send) |
| `client.contacts` | Contacts, tags, lists, list members, CSV import |
| `client.subscriptions` | Consent-aware subscribe/unsubscribe, status and preferences |
| `client.forms` | Hosted signup forms |
| `client.domains` | Domain verification and DNS records |
| `client.webhooks` | Webhook endpoints, deliveries, failures, health |
| `client.apiKeys` | API key management |
| `client.analytics` | Query analytics, heatmaps, geographic data |
| `client.metrics` | Delivery metrics and summaries |
| `client.suppressions` | Global suppression list |
| `client.suppressionGroups` | Topics (suppression groups) and their opt-outs |
| `client.subusers` | Subuser management and permissions |
| `client.identity` | Sender identities, profile, subscription |
| `client.ipPools` | IP pool management |
| `client.ips` | Dedicated IP management and warmup |
| `client.brandTheme` | Brand theme customization |
| `client.inbox` | Inbox sender address management |
| `client.events` | Email event querying |

## Webhook Verification

Verify incoming webhook signatures using the standalone export:

```typescript
import { verifyWebhookSignature } from '@northrelay/sdk/webhooks';

const isValid = verifyWebhookSignature(
  rawBody,                                      // Request body as string
  request.headers['x-northrelay-signature'],     // Signature header
  'whsec_your_webhook_secret'                    // Your webhook secret
);
```

## Mailing lists and subscriptions

A **list** is a contact list; a **topic** is a suppression group whose members have opted *out* of it.
Use `client.subscriptions` whenever a person gives or withdraws consent, so NorthRelay records the
evidence and fires `contact.subscribed` / `contact.unsubscribed` webhooks.

```typescript
import { isSubscriptionError } from '@northrelay/sdk';

// Subscribe with double opt-in; the contact stays PENDING until they click the link.
try {
  await client.subscriptions.subscribe({
    email: 'ada@example.com',
    listIds: ['list_newsletter'],
    topicIds: ['topic_product_news'],
    doubleOptIn: true,
    redirectUrl: 'https://example.com/thanks',
    consent: { ip: req.ip, text: 'Send me the monthly newsletter' },
  });
} catch (error) {
  // Unsubscribed people need fresh consent and `resubscribe: true`;
  // bounced or complained addresses (RECIPIENT_SUPPRESSED) cannot be re-added.
  if (isSubscriptionError(error, 'RECIPIENT_UNSUBSCRIBED')) { /* ask again */ }
}

// Render your own preference page
const { data: status } = await client.subscriptions.get('ada@example.com');
await client.subscriptions.updatePreferences('ada@example.com', {
  topics: { topic_product_news: false },
  lists: { list_weekly: true },
});
await client.subscriptions.unsubscribe({ email: 'ada@example.com', scope: 'all' });

// Owner-side list management (not a consent record)
await client.contacts.addListMembers('list_newsletter', { emails: ['bob@example.com'], createMissing: true });
const members = await client.contacts.getListMembers('list_newsletter', { filter: 'active', limit: 100 });

// CSV import into a list
await client.contacts.importCsv(csvText, {
  mappings: [{ csvColumn: 'Email', field: 'email' }, { csvColumn: 'First name', field: 'firstName' }],
  listId: 'list_newsletter',
  tags: ['imported'],
});
```

Handle the subscription webhooks with the typed parser:

```typescript
import { parseWebhookPayload } from '@northrelay/sdk/webhooks';

const event = parseWebhookPayload(rawBody, req.headers['x-northrelay-signature'], secret);
if (event.eventType === 'contact.unsubscribed') {
  // event.details: { contactEmail, scope: 'all' | 'list' | 'topic', listId, topicId, method, campaignId, ... }
}
```

Other events: `contact.confirmed`, `list.member_added`, `list.member_removed`, `email.opened` and
`email.clicked` (human engagement only; `email.clicked` carries the `url`).

## Configuration

```typescript
const client = new NorthRelayClient({
  apiKey: 'nr_live_xxx',     // Required
  baseUrl: 'https://app.northrelay.ca',  // Optional (default)
  timeout: 30000,            // Request timeout in ms (default: 30000)
  maxRetries: 3,             // Retry count for failed requests (default: 3)
  retryDelay: 1000,          // Base delay between retries in ms (default: 1000)
});
```

## Error Handling

```typescript
import { NorthRelayClient, RateLimitError, ValidationError } from '@northrelay/sdk';

try {
  await client.emails.send(/* ... */);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  }
}
```

## License

MIT


### Hosted catalog and shared brands (1.7.0)

NorthRelay owns saved templates and brands. Use an application-scoped credential with `templates:read` and `templates:write` scopes for this workflow. With a credential restricted to one application, the API derives its namespace and the adopted template's stable key. Use a verified sender permitted by the credential when setting brand defaults.

```typescript
const { data: catalog } = await client.designs.catalog();
const starter = catalog.gallery[0];
const { data: brand } = await client.designs.createBrand({
  theme: { name: 'My application', companyName: 'My company', primaryColor: '#6254e8' },
});
const { data: reviewed } = await client.designs.inspectTemplate({
  kind: starter.kind, id: starter.id, brandId: brand.id,
});
// Show reviewed.preview to the operator before adoption.
const { data: design } = await client.designs.adoptTemplate({
  ...reviewed.source, brandId: brand.id,
});
const plan = await client.designs.syncSource(design.id, {
  expectedRevision: design.revision, sourceDigest: reviewed.source.digest, apply: false,
});
```

Use `catalog(nextCursor)` to load subsequent account-template pages. `brands()`, `updateBrand(id, { expectedUpdatedAt, theme })` and `bindBrand(designId, brandId, expectedRevision)` manage the same records as the NorthRelay dashboard. For source updates, review the returned plan, then apply with its `sourceDigest` and the current draft revision. On a 409 conflict, reload and review rather than overwriting newer changes. Adoption, brand edits and synchronization only change drafts; publication is explicit. Account-wide credentials must supply an application key where required.
