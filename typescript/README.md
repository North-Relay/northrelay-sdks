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
