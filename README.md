# NorthRelay SDKs

Official SDKs for the [NorthRelay Platform API](https://northrelay.ca) - Sovereign SMTP Infrastructure with Hub & Spoke Architecture.

## 📦 Available SDKs

### TypeScript/JavaScript ✅

**Package**: [`@northrelay/sdk`](https://www.npmjs.com/package/@northrelay/sdk)  
**Directory**: [`typescript/`](./typescript)  
**Status**: Production-ready v1.0.0

```bash
npm install @northrelay/sdk
```

[📖 Documentation](./typescript/README.md) | [📦 npm](https://www.npmjs.com/package/@northrelay/sdk)

---

### Python 🚧

**Package**: `northrelay` (coming soon)  
**Directory**: [`python/`](./python)  
**Status**: Planned

---

### Go 🔮

**Package**: `github.com/North-Relay/northrelay-sdks/go` (future)  
**Directory**: [`go/`](./go)  
**Status**: Future

---

### Rust 🔮

**Package**: `northrelay` (future)  
**Directory**: [`rust/`](./rust)  
**Status**: Future

---

## 🚀 Quick Start

### TypeScript/JavaScript

```typescript
import { NorthRelay } from '@northrelay/sdk';

const client = new NorthRelay({
  apiKey: process.env.NORTHRELAY_API_KEY,
});

// Send email
await client.emails.send({
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  content: {
    subject: 'Hello from NorthRelay!',
    html: '<h1>Welcome</h1>',
  },
});
```

### Python (Coming Soon)

```python
from northrelay import NorthRelay

client = NorthRelay(api_key=os.getenv('NORTHRELAY_API_KEY'))

# Send email
client.emails.send(
    from_email={'email': 'sender@example.com'},
    to=[{'email': 'recipient@example.com'}],
    content={
        'subject': 'Hello from NorthRelay!',
        'html': '<h1>Welcome</h1>',
    }
)
```

---

## 📚 Documentation

- **Official Docs**: https://docs.northrelay.ca
- **API Reference**: https://docs.northrelay.ca/api
- **OpenAPI Spec**: https://github.com/North-Relay/api-spec
- **Platform Repo**: https://github.com/North-Relay/northrelay-platform

---

## 🛠️ Development

This is a monorepo containing SDKs for multiple languages. Each SDK has its own build system and can be developed independently.

### Repository Structure

```
northrelay-sdks/
├── typescript/          # TypeScript/JavaScript SDK
│   ├── src/
│   ├── package.json
│   └── README.md
├── python/              # Python SDK (future)
│   ├── northrelay/
│   ├── setup.py
│   └── README.md
├── go/                  # Go SDK (future)
├── rust/                # Rust SDK (future)
├── shared/              # Shared resources
│   ├── openapi/         # OpenAPI spec (generated)
│   └── scripts/         # Build/codegen scripts
└── .github/
    └── workflows/       # CI/CD for each SDK
```

### Building SDKs

#### TypeScript

```bash
cd typescript
npm install
npm run build
npm test
```

#### Python (Coming Soon)

```bash
cd python
pip install -e ".[dev]"
pytest
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Adding a New SDK

1. Create directory for the language (e.g., `python/`, `go/`)
2. Add CI/CD workflow in `.github/workflows/`
3. Implement SDK following the TypeScript SDK as reference
4. Add documentation and examples
5. Update this README

---

## 📄 License

All SDKs in this repository are licensed under the [MIT License](LICENSE).

---

## 🔗 Links

- **Website**: https://northrelay.ca
- **Documentation**: https://docs.northrelay.ca
- **Support**: support@northrelay.ca
- **Discord**: https://discord.gg/northrelay
- **Twitter**: [@northrelay](https://twitter.com/northrelay)

---

## 🏢 About NorthRelay

NorthRelay is a sovereign SMTP infrastructure platform with a Hub & Spoke architecture, designed for developers who need reliable, scalable email delivery with full control.

**Key Features**:
- 🏠 Sovereign SMTP pools (shared + isolated)
- 📧 Transactional email delivery
- 📊 Real-time analytics and webhooks
- 🔐 Built-in security (SPF, DKIM, DMARC)
- 🌐 Multi-tenant architecture
- 📮 Inbound email processing

---

**Made with ❤️ by the NorthRelay Team**
