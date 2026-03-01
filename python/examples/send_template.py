"""
Example: Send email using a template with NorthRelay Python SDK
"""

import asyncio
import os
from northrelay import NorthRelay


async def main():
    api_key = os.getenv("NORTHRELAY_API_KEY", "nr_live_test123")
    client = NorthRelay(api_key=api_key)

    try:
        # Send email using template
        response = await client.emails.send_template(
            template_id="tpl_welcome_email",
            to=[
                {"email": "user1@example.com", "name": "John Doe"},
                {"email": "user2@example.com", "name": "Jane Smith"},
            ],
            variables={
                "name": "John",
                "company": "Example Corp",
                "verification_code": "ABC123",
                "expires_at": "2024-12-31 23:59:59",
            },
            from_={"email": "noreply@example.com", "name": "Example App"},
            theme_id="theme_corporate",  # Optional brand theme
        )

        print(f"✅ Template email sent!")
        print(f"   Message ID: {response.message_id}")

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
