# Contributing to NorthRelay SDKs

Thank you for your interest in contributing to NorthRelay SDKs! This document provides guidelines for contributing to any SDK in this monorepo.

## 🚀 Getting Started

### Prerequisites

- Git
- Language-specific tools:
  - **TypeScript**: Node.js 16+, npm
  - **Python**: Python 3.8+, pip
  - **Go**: Go 1.19+
  - **Rust**: Rust 1.70+

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/northrelay-sdks.git
   cd northrelay-sdks
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/North-Relay/northrelay-sdks.git
   ```

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 2. Make Changes

Follow the language-specific guidelines below.

### 3. Test Your Changes

Each SDK has its own test suite. Run tests before committing:

**TypeScript**:
```bash
cd typescript
npm test
npm run typecheck
npm run lint
```

**Python** (when available):
```bash
cd python
pytest
mypy northrelay
flake8 northrelay
```

### 4. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(typescript): add webhook signature verification"
git commit -m "fix(python): handle null response in email send"
git commit -m "docs(typescript): add batch sending examples"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots/examples if applicable

## 🎯 SDK-Specific Guidelines

### TypeScript SDK

**Location**: `typescript/`

**Code Style**:
- Use TypeScript strict mode
- Follow ESLint rules (`.eslintrc.js`)
- Use Prettier for formatting
- Prefer functional programming patterns

**Structure**:
```
typescript/
├── src/
│   ├── client.ts          # Main client
│   ├── resources/         # API resource classes
│   │   ├── emails.ts
│   │   ├── templates.ts
│   │   └── ...
│   ├── types.ts           # TypeScript types
│   ├── errors.ts          # Custom error classes
│   └── webhooks.ts        # Webhook utilities
├── examples/              # Usage examples
├── tests/                 # Test files
└── README.md
```

**Adding a New Resource**:
1. Create `src/resources/your-resource.ts`
2. Implement resource class extending `BaseResource`
3. Add to `src/client.ts`
4. Update types in `src/types.ts`
5. Add examples to `examples/`
6. Update README.md

**Testing**:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run typecheck       # Type checking
```

### Python SDK (Coming Soon)

**Location**: `python/`

**Code Style**:
- Follow PEP 8
- Use type hints (Python 3.8+)
- Use Black for formatting
- Use mypy for type checking

**Structure**:
```
python/
├── northrelay/
│   ├── __init__.py
│   ├── client.py
│   ├── resources/
│   │   ├── emails.py
│   │   ├── templates.py
│   │   └── ...
│   ├── types.py
│   └── errors.py
├── tests/
├── examples/
└── setup.py
```

## 🧪 Testing

### Unit Tests

- Write tests for all new features
- Maintain >80% code coverage
- Use mocking for API calls

### Integration Tests

- Test against real API (use test API keys)
- Run in CI/CD pipeline
- Clean up test data after runs

## 📖 Documentation

### Code Documentation

- Add JSDoc/docstrings to all public methods
- Include examples in documentation
- Document all parameters and return types

### README Updates

- Update SDK README when adding features
- Keep examples up-to-date
- Document breaking changes

## 🔄 Pull Request Process

1. **Before Submitting**:
   - ✅ Tests pass
   - ✅ Code follows style guidelines
   - ✅ Documentation updated
   - ✅ CHANGELOG.md updated (if applicable)

2. **PR Description**:
   - Clear title (follows Conventional Commits)
   - Description of changes
   - Related issue links
   - Breaking changes (if any)

3. **Review Process**:
   - Maintainers will review within 2-3 business days
   - Address feedback promptly
   - Squash commits before merge (if requested)

4. **After Merge**:
   - Delete your feature branch
   - Pull latest changes from upstream

## 🐛 Bug Reports

Use GitHub Issues with the bug template:

**Required Information**:
- SDK version
- Language/runtime version
- Steps to reproduce
- Expected vs actual behavior
- Code snippet (if applicable)

## 💡 Feature Requests

Use GitHub Issues with the feature template:

**Required Information**:
- Clear description of feature
- Use case / motivation
- Proposed API design (if applicable)
- Willingness to contribute

## 📋 Release Process

Releases are automated via GitHub Actions when tags are pushed:

**TypeScript**:
```bash
npm version patch|minor|major  # Update version
git push origin main
git tag typescript/v1.0.1
git push origin typescript/v1.0.1
```

This triggers:
1. Build and test
2. Publish to npm
3. Create GitHub release

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## 📞 Questions?

- 💬 GitHub Discussions
- 📧 Email: support@northrelay.ca
- 🐦 Twitter: [@northrelay](https://twitter.com/northrelay)

## 🙏 Thank You!

Your contributions make NorthRelay better for everyone. We appreciate your time and effort!
