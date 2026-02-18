# NorthRelay Python SDK

> 🚧 **Coming Soon** - This SDK is planned but not yet implemented.

## Planned Features

- Full type hints (Python 3.8+)
- Async/await support
- Pydantic models for validation
- Comprehensive test coverage
- Black + mypy for code quality

## Expected API

```python
from northrelay import NorthRelay

client = NorthRelay(api_key='nr_live_...')

# Send email
result = await client.emails.send(
    from_email={'email': 'sender@example.com'},
    to=[{'email': 'recipient@example.com'}],
    content={
        'subject': 'Hello!',
        'html': '<h1>Welcome</h1>',
    }
)
```

## Installation (Future)

```bash
pip install northrelay
```

## Contributing

Interested in helping build the Python SDK? See [CONTRIBUTING.md](../CONTRIBUTING.md) and open an issue to coordinate!

## Timeline

- **Target**: Q2 2026
- **Status**: Accepting design proposals

---

[← Back to main README](../README.md)
