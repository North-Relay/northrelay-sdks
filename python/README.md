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
| **Subscriptions** | ✅ | Opt-in/opt-out, preferences, double opt-in (1.9) |
| **Forms** | ✅ | Signup forms feeding a list (1.9) |
| **Brand Themes** | ✅ | CRUD, multi-theme support |
| **API Keys** | ✅ | Create, list, revoke |
| **Events** | ✅ | Track email events, analytics |
| **Analytics** | ✅ | Heatmaps, geographic, provider stats |
| **Metrics** | ✅ | Delivery metrics, summaries |
| **Suppressions** | ✅ | Block list management |
| **Suppression Groups** | ✅ | Topics (unsubscribe groups) and their opt-outs; also `client.topics` |
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


## Mailing lists and subscriptions

A **list** is a contact list (`client.contacts.*_list*`). A **topic** is a
suppression group (`client.topics`, same object as `client.suppression_groups`):
an address listed in a topic has opted out of it. Tag a list with a topic and
opting out of the topic also leaves the list. Use `client.subscriptions` when a
person opts in or out themselves: it records consent evidence, handles double
opt-in and fires the `contact.*` webhooks. API key scopes: `contacts:read` /
`contacts:write`.

```python
from northrelay import NorthRelay, NorthRelayError

client = NorthRelay(api_key="nr_live_...")

news = await client.contacts.create_list("Newsletter", topic_id="topic_product_news")

# Opt-in from your own signup form (double opt-in: contact stays PENDING until confirmed)
result = await client.subscriptions.subscribe(
    "ada@example.com",
    first_name="Ada",
    list_ids=[news.id],
    tags=["website"],
    double_opt_in=True,
    redirect_url="https://example.com/thanks",          # https only
    consent={"ip": request_ip, "user_agent": request_ua, "text": "Send me the monthly newsletter"},
)
print(result.status, result.confirmation_sent)          # PENDING True

try:
    await client.subscriptions.subscribe("left@example.com", list_ids=[news.id])
except NorthRelayError as e:
    if e.details.get("code") == "RECIPIENT_UNSUBSCRIBED":
        ...  # only retry with resubscribe=True after fresh consent
    # RECIPIENT_SUPPRESSED (bounce/complaint/manual) cannot be overridden

# Render a preference page in your product
status = await client.subscriptions.get("ada@example.com")
for topic in status.topics:
    print(topic.label or topic.name, topic.subscribed)

await client.subscriptions.update_preferences(
    "ada@example.com", topics={"topic_offers": False}, lists={news.id: True},
)
await client.subscriptions.unsubscribe("ada@example.com", scope="list", list_id=news.id)
await client.subscriptions.unsubscribe("ada@example.com")   # scope="all"
await client.subscriptions.resend_confirmation("ada@example.com")
```

### List members

```python
added = await client.contacts.add_to_list(
    news.id, emails=["a@example.com", "b@example.com"], create_missing=True,
)
print(added.added, added.already_members, added.not_found, added.blocked)  # blocked = suppressed/unsubscribed

page = await client.contacts.list_members(news.id, page=1, limit=50, filter="suppressed")
for member in page.data:
    print(member.contact.email, member.suppression_statuses)

await client.contacts.remove_from_list(news.id, emails=["b@example.com"])  # owner removal, not an unsubscribe
```

### Contacts and CSV import

```python
contact = await client.contacts.create({"email": "c@example.com", "first_name": "Cy", "tags": ["vip"]})
contact = await client.contacts.update(contact.id, last_name="Young")
await client.contacts.add_tags(contact.id, ["beta"])
await client.contacts.remove_tag(contact.id, "beta")
page = await client.contacts.list(tag="vip", status="ACTIVE", sort_by="email", sort_order="asc")

result = await client.contacts.import_csv(
    "people.csv",                                  # or bytes + file_name="people.csv"; max 2 MiB
    mappings=[{"csvColumn": "Email Address", "field": "email"},
              {"csvColumn": "Given name", "field": "firstName"}],
    list_id=news.id,                               # adds new and existing contacts to the list
    tags=["import-2026-10"],                       # tags for newly created contacts
)
print(result.imported, result.skipped, result.added_to_list, result.errors)
```

Without `mappings`, columns named like `email`, `first name`, `last name` and
`phone` are mapped automatically.

### Topics and forms

```python
topic = (await client.topics.create("Product news"))["data"]
await client.topics.update(topic["id"], public_label="Product news", is_published_on_unsub=True)
opt_outs = await client.topics.list_members(topic["id"])

form = (await client.forms.create(list_id=news.id, name="Newsletter", slug="newsletter"))["form"]
await client.forms.update(form["id"], status="PUBLISHED", require_confirmation=True)
```

### Webhook events

```python
from northrelay import WebhookEventType, WebhookPayload
from northrelay.types import CreateWebhookRequest

await client.webhooks.create(CreateWebhookRequest(
    url="https://example.com/hooks/northrelay",
    events=[WebhookEventType.CONTACT_SUBSCRIBED, WebhookEventType.CONTACT_UNSUBSCRIBED,
            WebhookEventType.LIST_MEMBER_ADDED, WebhookEventType.LIST_MEMBER_REMOVED,
            WebhookEventType.EMAIL_OPENED, WebhookEventType.EMAIL_CLICKED],
))

event = WebhookPayload(**request_json)
if event.event_type == WebhookEventType.EMAIL_CLICKED:
    print(event.details["url"])
```

`email.opened` and `email.clicked` report human engagement only (bots are
filtered) for campaign mail and for API mail sent with tracking; API mail
fires one `email.opened` per message and recipient.
