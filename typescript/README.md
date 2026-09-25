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
| `client.contacts` | Contact management and lists |
| `client.domains` | Domain verification and DNS records |
| `client.webhooks` | Webhook endpoints, deliveries, failures, health |
| `client.apiKeys` | API key management |
| `client.analytics` | Query analytics, heatmaps, geographic data |
| `client.metrics` | Delivery metrics and summaries |
| `client.suppressions` | Global suppression list |
| `client.suppressionGroups` | Category-based suppression groups |
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
