"""Webhooks resource - webhook endpoints, secret rotation and test delivery.

Event names are listed in ``northrelay.WebhookEventType`` and payloads are
described by ``northrelay.WebhookPayload``. Writes are not retried
automatically.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

from northrelay.types import CreateWebhookRequest, PaginatedResponse, UpdateWebhookRequest, Webhook
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import RetryConfig, with_retry


def _path(id: str, suffix: str = "") -> str:
    return "/api/v1/webhooks/" + quote(id, safe="") + suffix


class WebhooksResource:
    """Webhook management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self, *, active: bool | None = None) -> PaginatedResponse:
        """
        List webhooks (``secret`` is never returned here, only ``secret_prefix``)

        Example:
            >>> webhooks = await client.webhooks.list()
            >>> for webhook in webhooks.data:
            ...     print(f"{webhook.url}: {webhook.events}")
        """
        params = {"active": "true" if active else "false"} if active is not None else {}
        response = await with_retry(lambda: self._http.get("/api/v1/webhooks", params=params))
        items = [Webhook(**w) for w in response.get("webhooks", [])]
        return PaginatedResponse.model_validate(
            {"data": items, "total": len(items), "page": 1, "limit": len(items) or 20}
        )

    async def get(self, id: str) -> Webhook:
        """Get a webhook by ID (24-hour delivery stats are in ``webhook.stats``)"""
        response = await with_retry(lambda: self._http.get(_path(id)))
        return Webhook(**{**response["webhook"], "stats": response.get("stats")})

    async def create(self, request: CreateWebhookRequest) -> Webhook:
        """
        Create a webhook. The returned ``secret`` is shown only once: store it.

        Example:
            >>> from northrelay import WebhookEventType
            >>> webhook = await client.webhooks.create(
            ...     CreateWebhookRequest(
            ...         url="https://example.com/webhooks/northrelay",
            ...         events=[WebhookEventType.EMAIL_DELIVERED,
            ...                 WebhookEventType.LIST_MEMBER_ADDED],
            ...     )
            ... )
            >>> print(f"Secret: {webhook.secret}")
        """
        payload = request.model_dump(by_alias=True, exclude_none=True, exclude={"active"})
        result = await self._http.post("/api/v1/webhooks", json=payload)
        return Webhook(**{**result["webhook"], "secret": result.get("secret")})

    async def update(self, id: str, request: UpdateWebhookRequest) -> Webhook:
        """Update a webhook's URL, events, description or active flag"""
        payload = request.model_dump(by_alias=True, exclude_none=True)
        result = await self._http.patch(_path(id), json=payload)
        return Webhook(**result["webhook"])

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a webhook"""
        return await self._http.delete(_path(id))

    async def rotate_secret(self, id: str) -> str:
        """
        Rotate the signing secret and return the new one (shown once).
        The previous secret stays valid for a grace period.
        """
        response = await self._http.post(_path(id, "/rotate"))
        return str(response["secret"])

    async def test_delivery(self, id: str) -> dict[str, Any]:
        """
        Send a test event: ``{success, statusCode, responseTime, deliveryId, message}``
        """
        return await self._http.post(_path(id, "/test"))
