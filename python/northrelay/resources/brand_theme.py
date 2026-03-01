"""Resource module"""
from __future__ import annotations

"""Brand Theme resource - UI customization"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import BrandTheme, CreateBrandThemeRequest


class BrandThemeResource:
    """Brand theme management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def get(self, id: Optional[str] = None) -> BrandTheme:
        """Get default brand theme, or a specific theme by ID"""
        url = f"/api/v1/brand-theme?id={id}" if id else "/api/v1/brand-theme"
        
        async def _get() -> dict[str, Any]:
            result = await self._http.get(url)
            return result["data"]

        response = await with_retry(_get)
        return BrandTheme(**response)

    async def list(self) -> list[BrandTheme]:
        """List all brand themes"""
        async def _list() -> dict[str, Any]:
            return await self._http.get("/api/v1/brand-theme?all=true")

        response = await with_retry(_list)
        return [BrandTheme(**theme) for theme in response["data"]]

    async def create(self, request: CreateBrandThemeRequest) -> BrandTheme:
        """Create brand theme"""
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/brand-theme", json=payload)
            return result["data"]

        response = await with_retry(_create)
        return BrandTheme(**response)

    async def update(
        self, request: CreateBrandThemeRequest, id: Optional[str] = None
    ) -> BrandTheme:
        """Update a brand theme by ID, or the default theme if no ID provided"""
        url = f"/api/v1/brand-theme?id={id}" if id else "/api/v1/brand-theme"
        
        async def _update() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.put(url, json=payload)
            return result["data"]

        response = await with_retry(_update)
        return BrandTheme(**response)

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a brand theme by ID"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/brand-theme?id={id}")
        )
