# NorthRelay Python SDK

Official Python SDK for the [NorthRelay Platform API](https://northrelay.ca) - Send transactional emails with ease.

[![PyPI version](https://badge.fury.io/py/northrelay.svg)](https://pypi.org/project/northrelay/)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **100% Feature Parity** - All 20 resources from TypeScript SDK
- ✅ **Async/await support** - Native asyncio for FastAPI, async frameworks
- ✅ **Type-safe** - Full Pydantic v2 models with IDE autocomplete
- ✅ **Automatic retries** - Exponential backoff with configurable retry logic
- ✅ **Rate limiting** - Built-in rate limit tracking and error handling
- ✅ **Comprehensive error handling** - Structured exceptions for all error cases
- ✅ **Production-ready** - Used in production by MemoryRelay and others

## Installation

```bash
pip install northrelay
```

**With webhook signature verification:**
```bash
pip install northrelay[webhooks]
```

## Quick Start

```python
from northrelay import NorthRelay

# Initialize client
client = NorthRelay(api_key="nr_live_...")

# Send an email
response = await client.emails.send(
    from_={"email": "noreply@example.com", "name": "Example"},
    to=[{"email": "user@example.com"}],
    content={
        "subject": "Welcome!",
        "html": "<h1>Welcome to our service!</h1>",
        "text": "Welcome to our service!",
    },
)

print(f"Email sent! Message ID: {response.message_id}")
```

## Usage

### Send Email with Template

```python
from northrelay import NorthRelay

client = NorthRelay(api_key="nr_live_...")

# Send using template
response = await client.emails.send_template(
    template_id="tpl_abc123",
    to=[{"email": "user@example.com", "name": "John"}],
    variables={
        "name": "John",
        "verification_code": "123456",
        "expires_at": "2024-12-31",
    },
    from_={"email": "noreply@example.com", "name": "Example"},
    theme_id="theme_xyz789",  # Optional brand theme
)
```

### Send Batch Emails

```python
from northrelay import NorthRelay, SendEmailRequest

client = NorthRelay(api_key="nr_live_...")

emails = [
    SendEmailRequest(
        from_={"email": "noreply@example.com"},
        to=[{"email": f"user{i}@example.com"}],
        content={"subject": "Update", "html": f"<p>Hello user {i}!</p>"},
    )
    for i in range(100)
]

result = await client.emails.send_batch(emails)
print(f"Sent {result['accepted_count']} of {len(emails)} emails")
```

### Schedule Email for Later

```python
from northrelay import NorthRelay, SendEmailRequest
from datetime import datetime, timedelta

client = NorthRelay(api_key="nr_live_...")

future_time = datetime.now() + timedelta(hours=2)

request = SendEmailRequest(
    from_={"email": "noreply@example.com"},
    to=[{"email": "user@example.com"}],
    content={"subject": "Scheduled Email", "html": "<p>This was scheduled!</p>"},
)

result = await client.emails.schedule(request, scheduled_for=future_time)
print(f"Scheduled email with ID: {result['schedule_id']}")
```

### Error Handling

```python
from northrelay import (
    NorthRelay,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    QuotaExceededError,
    ServerError,
)

client = NorthRelay(api_key="nr_live_...")

try:
    await client.emails.send(...)
    
except AuthenticationError:
    print("Invalid API key")
    
except ValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Errors: {e.errors}")
    
except RateLimitError as e:
    print(f"Rate limited! Retry after {e.retry_after} seconds")
    await asyncio.sleep(e.retry_after)
    
except QuotaExceededError as e:
    print(f"Quota exceeded: {e.quota_used}/{e.quota_limit}")
    
except ServerError as e:
    print(f"Server error ({e.status_code}): {e.message}")
```

### Rate Limit Tracking

```python
client = NorthRelay(api_key="nr_live_...")

await client.emails.send(...)

# Check rate limit info from last request
rate_limit = client.get_rate_limit_info()
if rate_limit:
    print(f"Remaining: {rate_limit.remaining}/{rate_limit.limit}")
    print(f"Resets at: {rate_limit.reset}")
```

### Context Manager (Auto-close)

```python
async with NorthRelay(api_key="nr_live_...") as client:
    await client.emails.send(...)
    # HTTP client auto-closes on exit
```

## Configuration

```python
client = NorthRelay(
    api_key="nr_live_...",
    base_url="https://app.northrelay.ca",  # Default
    timeout=30.0,                           # Request timeout (seconds)
    max_retries=3,                          # Retry attempts
    retry_delay=1.0,                        # Initial retry delay (seconds)
    max_retry_delay=10.0,                   # Max retry delay (seconds)
)
```

### Retry Behavior

The SDK automatically retries on:
- ✅ Network errors (connection timeout, DNS failure)
- ✅ Server errors (500, 502, 503, 504)
- ✅ Rate limits (429) - with exponential backoff

Does **not** retry on:
- ❌ Authentication errors (401)
- ❌ Validation errors (400)
- ❌ Not found errors (404)

## FastAPI Integration

```python
from fastapi import FastAPI
from northrelay import NorthRelay

app = FastAPI()
client = NorthRelay(api_key="nr_live_...")

@app.post("/send-welcome-email")
async def send_welcome(email: str, name: str):
    response = await client.emails.send_template(
        template_id="tpl_welcome",
        to=[{"email": email, "name": name}],
        variables={"name": name},
    )
    return {"message_id": response.message_id}

@app.on_event("shutdown")
async def shutdown():
    await client.close()
```

## Development Status

**Current Version: 1.1.0 - 100% Complete! ✅**

### All Resources Implemented ✅

| Resource | Status | Description |
|----------|--------|-------------|
| **Emails** | ✅ | Send, schedule, batch, validate |
| **Templates** | ✅ | CRUD, preview, variable extraction |
| **Domains** | ✅ | Add, verify, DNS records |
| **Webhooks** | ✅ | CRUD, secret rotation, test delivery |
| **Campaigns** | ✅ | CRUD, approval workflow, sending |
| **Contacts** | ✅ | CRUD, lists, bulk operations, CSV import |
| **Brand Themes** | ✅ | CRUD, multi-theme support |
| **API Keys** | ✅ | Create, list, revoke |
| **Events** | ✅ | Track email events, analytics |
| **Analytics** | ✅ | Heatmaps, geographic, provider stats |
| **Metrics** | ✅ | Delivery metrics, summaries |
| **Suppressions** | ✅ | Block list management |
| **Suppression Groups** | ✅ | Unsubscribe groups |
| **Subusers** | ✅ | Subaccount management |
| **IP Pools** | ✅ | IP pool management |
| **Dedicated IPs** | ✅ | IP allocation, warmup |
| **Identity** | ✅ | Sender identity management |
| **Inbound** | ✅ | Inbound email domains |
| **Admin** | ✅ | Admin utilities |
| **Keys** | ✅ | DKIM key management |

**Total**: 20/20 resources implemented 🎉

### Feature Parity with TypeScript SDK

✅ **100% Complete** - All methods from TypeScript SDK v1.1.0 implemented

## API Documentation

Full API documentation: [docs.northrelay.ca](https://docs.northrelay.ca)

## Requirements

- Python 3.9+
- httpx >= 0.27.0
- pydantic >= 2.6.0
- tenacity >= 8.2.0
- python-dateutil >= 2.8.0

## Support

- 📧 Email: support@northrelay.ca
- 💬 GitHub Issues: [github.com/North-Relay/northrelay-platform/issues](https://github.com/North-Relay/northrelay-platform/issues)
- 📚 Documentation: [docs.northrelay.ca](https://docs.northrelay.ca)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.

---

**Made with ❤️ by the NorthRelay team**


## Hosted catalog and shared brands (1.7)

NorthRelay stores the templates and brands; clients can keep local drafts while editing.
Use an application-scoped credential with `templates:read` and `templates:write` scopes. For a credential
restricted to one application, the server derives its application key on adoption
and brand creation. Account-wide credentials must supply `application_key`.

```python
catalog = (await client.designs.catalog())["data"]
starter = catalog["gallery"][0]
brand = (await client.designs.create_brand(theme={
    "name": "My application", "companyName": "My company", "primaryColor": "#6254e8",
}))["data"]
reviewed = (await client.designs.inspect_template(
    kind=starter["kind"], id=starter["id"], brand_id=brand["id"],
))["data"]
# Show reviewed["preview"] before adopting the inspected source digest.
design = (await client.designs.adopt_template(
    **reviewed["source"], brand_id=brand["id"],
))["data"]
plan = await client.designs.sync_source(
    design["id"], expected_revision=design["revision"],
    source_digest=reviewed["source"]["digest"], apply=False,
)
```

Follow `nextCursor` with `catalog(cursor=...)` for the remaining hosted templates.
Use `brands()` to select a brand, `update_brand()` with its `expected_updated_at`
timestamp to edit it, and `bind_brand()` with the design's `expected_revision` to
change its brand. On HTTP 409, reload and review the latest state before retrying.
Inspecting and planning sync do not publish or send; publication remains explicit.
