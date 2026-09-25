"""Unified credentials. Requires account full_access. Never retries secret mutations."""
from typing import Any
from urllib.parse import quote
from northrelay.utils.http import HttpClient


class CredentialsResource:
    def __init__(self, http: HttpClient):
        self._http = http

    async def list(self) -> dict[str, Any]:
        return await self._http.get("/api/v1/credentials")

    async def create(self, credential: dict[str, Any]) -> dict[str, Any]:
        """Returns the secret once; store it securely."""
        return await self._http.post("/api/v1/credentials", json=credential)

    async def update(self, credential_id: str, credential: dict[str, Any]) -> dict[str, Any]:
        return await self._http.patch("/api/v1/credentials?id=" + quote(credential_id, safe=""), json=credential)

    async def rotate(self, credential_id: str, credential_type: str) -> dict[str, Any]:
        """Immediately invalidates the old secret; returns the new secret once."""
        return await self._http.put("/api/v1/credentials", json={"id": credential_id, "type": credential_type, "action": "rotate"})

    async def revoke(self, credential_id: str, credential_type: str) -> dict[str, Any]:
        return await self._http.put("/api/v1/credentials", json={"id": credential_id, "type": credential_type, "action": "revoke"})
