"""Resource module"""
from __future__ import annotations

"""API Keys resource - API key management"""

from typing import Any
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import PaginatedResponse


class ApiKeysResource:
    """API key management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List all API keys"""
        response = await with_retry(
            lambda: self._http.get("/api/v1/api-keys")
        )
        return PaginatedResponse(**response)

    async def create(
        self, name: str, scopes: list[str], expires_at: str | None = None
    ) -> dict[str, Any]:
        """
        Create a new API key
        
        Args:
            name: Key name
            scopes: Permission scopes
            expires_at: Optional expiration date (ISO 8601)
        
        Returns:
            Created API key with secret (only shown once!)
        """
        payload = {"name": name, "scopes": scopes}
        if expires_at:
            payload["expiresAt"] = expires_at

        async def _create() -> dict[str, Any]:
            return await self._http.post("/api/v1/api-keys", json=payload)

        return await with_retry(_create)

    async def revoke(self, id: str) -> dict[str, Any]:
        """Revoke an API key"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/api-keys/{id}")
        )
