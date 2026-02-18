# @northrelay/sdk

Official TypeScript/JavaScript SDK for the NorthRelay Platform API.

[![npm version](https://img.shields.io/npm/v/@northrelay/sdk.svg)](https://www.npmjs.com/package/@northrelay/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Type-safe** - Full TypeScript support with generated types
- ✅ **Automatic retries** - Exponential backoff for transient failures
- ✅ **Rate limiting** - Respects API rate limits automatically
- ✅ **Webhook verification** - HMAC-SHA256 signature verification helpers
- ✅ **Connection pooling** - Efficient HTTP connection reuse
- ✅ **Error handling** - Detailed error types with fix suggestions
- ✅ **Universal** - Works in Node.js and browsers (with build tools)

## Installation

```bash
npm install @northrelay/sdk
```

## Quick Start

```typescript
import { NorthRelayClient } from '@northrelay/sdk';

const client = new NorthRelayClient({
  apiKey: 'nr_live_your_api_key_here'
});

// Send an email
const result = await client.emails.send({
  from: { email: 'noreply@example.com', name: 'Example App' },
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  content: {
    subject: 'Welcome to our service!',
    html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
    text: 'Welcome! Thanks for signing up.'
  }
});

console.log('Message ID:', result.data.messageId);
console.log('Quota remaining:', result.data.quota.remaining);
```

## Configuration

```typescript
const client = new NorthRelayClient({
  apiKey: 'nr_live_...',      // Required: Your API key
  baseUrl: 'https://app.northrelay.ca',  // Optional: API base URL
  timeout: 30000,             // Optional: Request timeout (ms)
  maxRetries: 3,              // Optional: Max retry attempts
  retryDelay: 1000,           // Optional: Initial retry delay (ms)
});
```

## Usage Examples

### Send Email

```typescript
// Basic email
await client.emails.send({
  from: { email: 'noreply@example.com' },
  to: [{ email: 'user@example.com' }],
  content: {
    subject: 'Hello!',
    text: 'Plain text message',
    html: '<p>HTML message</p>'
  }
});

// With CC, BCC, Reply-To
await client.emails.send({
  from: { email: 'noreply@example.com', name: 'Example' },
  to: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  cc: [{ email: 'manager@example.com' }],
  bcc: [{ email: 'archive@example.com' }],
  replyTo: { email: 'support@example.com', name: 'Support' },
  content: {
    subject: 'Team Update',
    html: '<p>Update content...</p>'
  }
});
```

### Use Templates

```typescript
// Create a template
const template = await client.templates.create({
  name: 'Welcome Email',
  subject: 'Welcome {{name}}!',
  htmlContent: `
    <h1>Hello {{name}}</h1>
    <p>Your verification code is: <strong>{{verificationCode}}</strong></p>
  `,
  textContent: 'Hello {{name}}, Your verification code is: {{verificationCode}}'
});

// Send email using template
await client.emails.sendTemplate(
  template.data.id,
  [{ email: 'user@example.com' }],
  {
    name: 'John Doe',
    verificationCode: '123456'
  },
  {
    from: { email: 'noreply@example.com' }
  }
);

// Preview template with variables
const preview = await client.templates.preview(template.data.id, {
  name: 'John Doe',
  verificationCode: '123456'
});
console.log(preview.data.html);
```

### Domain Verification

```typescript
// Add a domain
const domain = await client.domains.create({
  domain: 'example.com'
});

// Verify DNS records
const verification = await client.domains.verify(domain.data.id);
console.log('SPF:', verification.data.records.spf.status);
console.log('DKIM:', verification.data.records.dkim.status);
console.log('DMARC:', verification.data.records.dmarc.status);
```

### Webhooks

```typescript
// Create a webhook
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks/northrelay',
  events: ['Sent', 'Delivered', 'Bounced', 'Opened', 'Clicked']
});

console.log('Webhook secret:', webhook.data.secret); // Save this!

// Test webhook delivery
await client.webhooks.testDelivery(webhook.data.id);

// Rotate webhook secret
const newSecret = await client.webhooks.rotateSecret(webhook.data.id);
```

### Webhook Verification (Server-side)

```typescript
import { verifyWebhookSignature, parseWebhookEvent } from '@northrelay/sdk/webhooks';
import express from 'express';

const app = express();

// IMPORTANT: Use raw body parser for webhooks
app.post('/webhooks/northrelay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-northrelay-signature'] as string;
  const secret = process.env.NORTHRELAY_WEBHOOK_SECRET!;
  const payload = req.body.toString('utf8');

  try {
    // Parse and verify in one step
    const event = parseWebhookEvent(payload, signature, secret);

    switch (event.type) {
      case 'Sent':
        console.log('Email sent to:', event.data.email);
        break;
      case 'Delivered':
        console.log('Email delivered to:', event.data.email);
        break;
      case 'Bounced':
        console.log('Email bounced:', event.data.email);
        break;
      case 'Opened':
        console.log('Email opened by:', event.data.email);
        break;
      case 'Clicked':
        console.log('Link clicked by:', event.data.email);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook verification failed:', error);
    res.status(401).send('Invalid signature');
  }
});
```

### Email Events

```typescript
// Get events for a specific message
const events = await client.events.getByMessageId('msg_abc123');
console.log('Events:', events.data);

// List all events with filters
const recentEvents = await client.events.list({
  eventType: 'Delivered',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-31T23:59:59Z',
  limit: 100,
  page: 1
});
```

### Batch Sending

```typescript
// Send up to 1000 emails in one request
const results = await client.emails.sendBatch([
  {
    from: { email: 'noreply@example.com' },
    to: [{ email: 'user1@example.com' }],
    content: { subject: 'Hello 1', text: 'Message 1' }
  },
  {
    from: { email: 'noreply@example.com' },
    to: [{ email: 'user2@example.com' }],
    content: { subject: 'Hello 2', text: 'Message 2' }
  }
]);

console.log('Accepted:', results.data.accepted);
console.log('Rejected:', results.data.rejected);
```

### Email Validation

```typescript
// Validate single email
const result = await client.emails.validate('user@example.com');
console.log('Valid:', result.data[0].valid);
console.log('Deliverable:', result.data[0].deliverable);

// Validate multiple emails
const results = await client.emails.validate([
  'user1@example.com',
  'user2@example.com',
  'invalid-email'
]);
```

### Schedule Emails

```typescript
// Schedule for future delivery
const futureDate = new Date();
futureDate.setHours(futureDate.getHours() + 24);

const scheduled = await client.emails.schedule(
  {
    from: { email: 'noreply@example.com' },
    to: [{ email: 'user@example.com' }],
    content: {
      subject: 'Reminder',
      text: 'Your appointment is tomorrow!'
    }
  },
  futureDate.toISOString()
);

// Cancel scheduled email
await client.emails.cancel(scheduled.data.id);
```

### Error Handling

```typescript
import {
  NorthRelayError,
  AuthenticationError,
  ValidationError,
  QuotaExceededError,
  RateLimitError,
} from '@northrelay/sdk';

try {
  await client.emails.send({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.validationErrors);
  } else if (error instanceof QuotaExceededError) {
    console.error('Quota exceeded:', error.quota);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof NorthRelayError) {
    console.error('API error:', error.code, error.message);
    console.error('Fix:', error.fixAction);
    console.error('Docs:', error.docsUrl);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Rate Limiting

```typescript
// Check rate limit status
const rateLimit = client.getRateLimitInfo();
if (rateLimit) {
  console.log('Limit:', rateLimit.limit);
  console.log('Remaining:', rateLimit.remaining);
  console.log('Resets at:', new Date(rateLimit.reset * 1000));
}
```

### Pool Routing (Advanced)

```typescript
// Specify pool type (Shared or Isolated)
await client.emails.send({
  from: { email: 'noreply@example.com' },
  to: [{ email: 'user@example.com' }],
  content: {
    subject: 'High-priority email',
    text: 'Important message'
  },
  poolType: 'Isolated', // Use Isolated pool (requires Startup/Scale plan)
  poolTier: 'Startup'
});
```

## API Reference

### NorthRelayClient

Main client class for interacting with the NorthRelay API.

**Constructor:**
```typescript
new NorthRelayClient(config: ClientConfig)
```

**Properties:**
- `emails: EmailsResource` - Email operations
- `templates: TemplatesResource` - Template management
- `domains: DomainsResource` - Domain verification
- `webhooks: WebhooksResource` - Webhook management
- `apiKeys: ApiKeysResource` - API key management
- `events: EventsResource` - Event tracking

**Methods:**
- `getRateLimitInfo(): RateLimitInfo | null` - Get current rate limit status
- `withRetry<T>(fn: () => Promise<T>): Promise<T>` - Execute with retry logic

### Resources

#### EmailsResource
- `send(request: SendEmailRequest): Promise<SendEmailResponse>`
- `sendTemplate(templateId, to, variables, options?): Promise<SendEmailResponse>`
- `sendBatch(emails: SendEmailRequest[]): Promise<BatchResponse>`
- `schedule(request, scheduledFor): Promise<ScheduledResponse>`
- `cancel(messageId): Promise<{ success: true }>`
- `validate(emails): Promise<ValidationResponse>`
- `getEvents(messageId): Promise<{ data: EmailEvent[] }>`

#### TemplatesResource
- `list(options?): Promise<PaginatedResponse<Template>>`
- `get(id): Promise<{ data: Template }>`
- `create(request): Promise<{ data: Template }>`
- `update(id, request): Promise<{ data: Template }>`
- `delete(id): Promise<{ success: true }>`
- `preview(id, variables): Promise<PreviewResponse>`
- `extractVariables(content): Promise<{ data: { variables: string[] } }>`

#### DomainsResource
- `list(): Promise<PaginatedResponse<Domain>>`
- `get(id): Promise<{ data: Domain }>`
- `create(request): Promise<{ data: Domain }>`
- `verify(id): Promise<VerificationResponse>`
- `delete(id): Promise<{ success: true }>`

#### WebhooksResource
- `list(): Promise<PaginatedResponse<Webhook>>`
- `get(id): Promise<{ data: Webhook }>`
- `create(request): Promise<{ data: Webhook }>`
- `update(id, request): Promise<{ data: Webhook }>`
- `delete(id): Promise<{ success: true }>`
- `rotateSecret(id): Promise<{ data: { secret: string } }>`
- `testDelivery(id): Promise<TestResponse>`

#### ApiKeysResource
- `list(): Promise<PaginatedResponse<ApiKey>>`
- `create(request): Promise<{ data: CreateApiKeyResponse }>`
- `revoke(id): Promise<{ success: true }>`

#### EventsResource
- `list(options?): Promise<PaginatedResponse<EmailEvent>>`
- `get(id): Promise<{ data: EmailEvent }>`
- `getByMessageId(messageId): Promise<{ data: EmailEvent[] }>`

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. All API responses and request parameters are fully typed.

```typescript
import type { SendEmailRequest, SendEmailResponse } from '@northrelay/sdk';

const request: SendEmailRequest = {
  from: { email: 'noreply@example.com' },
  to: [{ email: 'user@example.com' }],
  content: {
    subject: 'Hello',
    text: 'World'
  }
};

const response: SendEmailResponse = await client.emails.send(request);
```

## Environment Variables

Recommended environment variables for production:

```env
NORTHRELAY_API_KEY=nr_live_your_api_key_here
NORTHRELAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Testing

The SDK includes comprehensive tests. Run tests with:

```bash
npm test
```

## Migration from Raw HTTP

If you're currently using raw HTTP requests, migration is straightforward:

**Before:**
```typescript
const response = await fetch('https://app.northrelay.ca/api/v1/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nr_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: { email: 'noreply@example.com' },
    to: [{ email: 'user@example.com' }],
    content: { subject: 'Hello', text: 'World' }
  })
});
const data = await response.json();
```

**After:**
```typescript
const client = new NorthRelayClient({ apiKey: 'nr_live_...' });
const result = await client.emails.send({
  from: { email: 'noreply@example.com' },
  to: [{ email: 'user@example.com' }],
  content: { subject: 'Hello', text: 'World' }
});
```

## Support

- **Documentation**: https://docs.northrelay.ca
- **API Reference**: https://docs.northrelay.ca/api
- **GitHub Issues**: https://github.com/North-Relay/northrelay-platform/issues
- **Email**: support@northrelay.ca

## License

MIT © NorthRelay
