# NorthRelay Go SDK

> 🔮 **Planned** - This SDK is planned for the future.

## Planned Features

- Idiomatic Go API
- Strong typing with structs
- Context support for cancellation
- Comprehensive error handling
- Full test coverage

## Expected API

```go
package main

import (
    "context"
    "github.com/North-Relay/northrelay-sdks/go/northrelay"
)

func main() {
    client := northrelay.NewClient("nr_live_...")
    
    result, err := client.Emails.Send(context.Background(), &northrelay.EmailRequest{
        From: northrelay.EmailAddress{Email: "sender@example.com"},
        To: []northrelay.EmailAddress{
            {Email: "recipient@example.com"},
        },
        Content: northrelay.EmailContent{
            Subject: "Hello!",
            HTML:    "<h1>Welcome</h1>",
        },
    })
}
```

## Installation (Future)

```bash
go get github.com/North-Relay/northrelay-sdks/go/northrelay
```

## Contributing

Interested in helping build the Go SDK? See [CONTRIBUTING.md](../CONTRIBUTING.md) and open an issue!

## Timeline

- **Target**: TBD
- **Status**: Design phase

---

[← Back to main README](../README.md)
