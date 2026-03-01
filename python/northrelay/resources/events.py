"""Resource module"""
from __future__ import annotations

"""Events resource - Email event tracking and analytics"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import PaginatedResponse, EventType


class EventsResource:
    """Email event tracking"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        event_type: Optional[EventType] = None,
        message_id: Optional[str] = None,
        recipient: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> PaginatedResponse:
        """List email events with filtering"""
        params = {"page": page, "limit": limit}
        if event_type:
            params["eventType"] = event_type.value
        if message_id:
            params["messageId"] = message_id
        if recipient:
            params["recipient"] = recipient
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date

        response = await with_retry(
            lambda: self._http.get("/api/v1/events", params=params)
        )
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get an event by ID"""
        async def _get() -> dict[str, Any]:
            return await self._http.get(f"/api/v1/events/{id}")

        return await with_retry(_get)

    async def get_by_message_id(self, message_id: str) -> list[dict[str, Any]]:
        """Get all events for a message"""
        async def _get() -> dict[str, Any]:
            return await self._http.get(f"/api/v1/events?messageId={message_id}")

        response = await with_retry(_get)
        return response["data"]
