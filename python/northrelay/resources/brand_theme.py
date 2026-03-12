"""Resource module"""
from __future__ import annotations

"""Brand Theme resource - UI customization"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import BrandTheme, CreateBrandThemeRequest, UpdateBrandThemeRequest


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
        self, id: str, request: UpdateBrandThemeRequest
    ) -> BrandTheme:
        """Update a brand theme by ID"""
        url = f"/api/v1/brand-theme?id={id}"
        
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

    async def set_tracking_domain(self, id: str, domain: str) -> dict[str, Any]:
        """Set a custom tracking domain for a brand theme"""
        async def _set() -> dict[str, Any]:
            return await self._http.put(
                f"/api/v1/brand-theme/{id}/tracking-domain",
                json={"domain": domain},
            )
        return await with_retry(_set)

    async def verify_tracking_domain(self, id: str) -> dict[str, Any]:
        """Verify a custom tracking domain's CNAME"""
        async def _verify() -> dict[str, Any]:
            return await self._http.get(
                f"/api/v1/brand-theme/{id}/tracking-domain/verify"
            )
        return await with_retry(_verify)

    async def remove_tracking_domain(self, id: str) -> dict[str, Any]:
        """Remove a custom tracking domain"""
        async def _remove() -> dict[str, Any]:
            return await self._http.delete(
                f"/api/v1/brand-theme/{id}/tracking-domain"
            )
        return await with_retry(_remove)
