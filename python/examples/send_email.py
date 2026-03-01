"""
Example: Send a simple transactional email using NorthRelay Python SDK
"""

import asyncio
import os
from northrelay import NorthRelay


async def main():
    # Initialize client with API key from environment
    api_key = os.getenv("NORTHRELAY_API_KEY", "nr_live_test123")
    client = NorthRelay(api_key=api_key)

    try:
        # Send a simple email
        response = await client.emails.send(
            from_={"email": "noreply@example.com", "name": "Example App"},
            to=[{"email": "user@example.com", "name": "Test User"}],
            content={
                "subject": "Welcome to NorthRelay!",
                "html": """
                    <html>
                        <body>
                            <h1>Welcome to NorthRelay!</h1>
                            <p>This email was sent using the Python SDK.</p>
                        </body>
                    </html>
                """,
                "text": "Welcome to NorthRelay! This email was sent using the Python SDK.",
            },
            tags={"example": "true", "sdk": "python"},
        )

        print(f"✅ Email sent successfully!")
        print(f"   Message ID: {response.message_id}")
        
        if response.quota:
            print(f"   Quota: {response.quota.used}/{response.quota.limit} ({response.quota.remaining} remaining)")

        # Check rate limit info
        rate_limit = client.get_rate_limit_info()
        if rate_limit:
            print(f"   Rate Limit: {rate_limit.remaining}/{rate_limit.limit} remaining")

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
