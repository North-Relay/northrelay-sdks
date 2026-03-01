"""Resource module"""
from __future__ import annotations

"""Webhooks resource - Webhook management and delivery tracking"""

from typing import Any
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import Webhook, CreateWebhookRequest, UpdateWebhookRequest, PaginatedResponse


class WebhooksResource:
    """Webhook management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """
        List all webhooks

        Returns:
            PaginatedResponse with webhooks

        Example:
            >>> webhooks = await client.webhooks.list()
            >>> for webhook in webhooks.data:
            ...     print(f"{webhook.url}: active={webhook.active}")
        """
        async def _list() -> dict[str, Any]:
            return await self._http.get("/api/v1/webhooks")

        response = await with_retry(_list)
        return PaginatedResponse(**response)

    async def get(self, id: str) -> Webhook:
        """
        Get a webhook by ID

        Args:
            id: Webhook ID

        Returns:
            Webhook details

        Example:
            >>> webhook = await client.webhooks.get("wh_abc123")
            >>> print(webhook.events)  # ['delivered', 'bounced']
        """
        async def _get() -> dict[str, Any]:
            result = await self._http.get(f"/api/v1/webhooks/{id}")
            return result["data"]

        response = await with_retry(_get)
        return Webhook(**response)

    async def create(self, request: CreateWebhookRequest) -> Webhook:
        """
        Create a new webhook

        Args:
            request: Webhook creation request

        Returns:
            Created webhook with secret

        Example:
            >>> from northrelay.types import EventType
            >>> webhook = await client.webhooks.create(
            ...     CreateWebhookRequest(
            ...         url="https://example.com/webhooks/northrelay",
            ...         events=[EventType.DELIVERED, EventType.BOUNCED],
            ...         active=True,
            ...     )
            ... )
            >>> print(f"Secret: {webhook.secret}")
        """
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/webhooks", json=payload)
            return result["data"]

        response = await with_retry(_create)
        return Webhook(**response)

    async def update(self, id: str, request: UpdateWebhookRequest) -> Webhook:
        """
        Update a webhook

        Args:
            id: Webhook ID
            request: Webhook update request

        Returns:
            Updated webhook

        Example:
            >>> webhook = await client.webhooks.update(
            ...     "wh_abc123",
            ...     UpdateWebhookRequest(active=False),
            ... )
        """
        async def _update() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.put(f"/api/v1/webhooks/{id}", json=payload)
            return result["data"]

        response = await with_retry(_update)
        return Webhook(**response)

    async def delete(self, id: str) -> dict[str, Any]:
        """
        Delete a webhook

        Args:
            id: Webhook ID

        Returns:
            Deletion confirmation

        Example:
            >>> await client.webhooks.delete("wh_abc123")
        """
        async def _delete() -> dict[str, Any]:
            return await self._http.delete(f"/api/v1/webhooks/{id}")

        return await with_retry(_delete)

    async def rotate_secret(self, id: str) -> str:
        """
        Rotate webhook secret

        Args:
            id: Webhook ID

        Returns:
            New secret

        Example:
            >>> new_secret = await client.webhooks.rotate_secret("wh_abc123")
            >>> print(f"Update your webhook verification to use: {new_secret}")
        """
        async def _rotate() -> dict[str, Any]:
            return await self._http.post(f"/api/v1/webhooks/{id}/rotate-secret")

        response = await with_retry(_rotate)
        return response["data"]["secret"]

    async def test_delivery(self, id: str) -> dict[str, Any]:
        """
        Test webhook delivery

        Args:
            id: Webhook ID

        Returns:
            Delivery test result with status code

        Example:
            >>> result = await client.webhooks.test_delivery("wh_abc123")
            >>> if result["data"]["delivered"]:
            ...     print(f"Success! Status: {result['data']['statusCode']}")
            >>> else:
            ...     print("Delivery failed")
        """
        async def _test() -> dict[str, Any]:
            return await self._http.post(f"/api/v1/webhooks/{id}/test")

        return await with_retry(_test)
