"""Resource module"""
from __future__ import annotations

"""Campaigns resource - Campaign management and sending"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import Campaign, CreateCampaignRequest, UpdateCampaignRequest, PaginatedResponse


class CampaignsResource:
    """Campaign management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def create(self, request: CreateCampaignRequest) -> Campaign:
        """Create a new campaign"""
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/campaigns", json=payload)
            return result["data"]

        response = await with_retry(_create, max_attempts=self._retry_config.max_attempts)
        return Campaign(**response)

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        approval_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse:
        """List campaigns with pagination and filtering"""
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        if approval_status:
            params["approvalStatus"] = approval_status
        if search:
            params["search"] = search

        async def _list() -> dict[str, Any]:
            return await self._http.get("/api/v1/campaigns", params=params)

        response = await with_retry(_list)
        return PaginatedResponse(**response)

    async def get(self, id: str) -> Campaign:
        """Get a campaign by ID"""
        async def _get() -> dict[str, Any]:
            result = await self._http.get(f"/api/v1/campaigns/{id}")
            return result["data"]

        response = await with_retry(_get)
        return Campaign(**response)

    async def update(self, id: str, request: UpdateCampaignRequest) -> Campaign:
        """Update an existing campaign"""
        async def _update() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.patch(f"/api/v1/campaigns/{id}", json=payload)
            return result["data"]

        response = await with_retry(_update)
        return Campaign(**response)

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a campaign (only DRAFT or CANCELLED)"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/campaigns/{id}")
        )

    async def preview(self, id: str) -> str:
        """Get campaign preview HTML"""
        async def _preview() -> dict[str, Any]:
            return await self._http.get(f"/api/v1/campaigns/{id}/preview")

        response = await with_retry(_preview)
        return response["data"]

    async def submit(self, id: str) -> dict[str, Any]:
        """Submit campaign for approval"""
        return await with_retry(
            lambda: self._http.post(f"/api/v1/campaigns/{id}/submit")
        )

    async def approve(self, id: str) -> dict[str, Any]:
        """Approve a campaign (admin only)"""
        return await with_retry(
            lambda: self._http.post(f"/api/v1/campaigns/{id}/approve")
        )

    async def reject(self, id: str, reason: Optional[str] = None) -> dict[str, Any]:
        """Reject a campaign (admin only)"""
        return await with_retry(
            lambda: self._http.post(f"/api/v1/campaigns/{id}/reject", json={"reason": reason})
        )

    async def send(self, id: str) -> dict[str, Any]:
        """Send a campaign immediately"""
        return await with_retry(
            lambda: self._http.post(f"/api/v1/campaigns/{id}/send")
        )

    async def get_send_status(self, id: str) -> dict[str, Any]:
        """Get campaign send status"""
        return await with_retry(
            lambda: self._http.get(f"/api/v1/campaigns/{id}/send")
        )
