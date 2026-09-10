"""Versioned design API. Returns the server's success/data envelope unchanged.

No automatic write retries. Persist a send idempotency key before requesting a
send and reuse it with the identical payload after an uncertain response.
"""
from __future__ import annotations

from typing import Any
from urllib.parse import quote
from northrelay.utils.http import HttpClient


class DesignsResource:
    def __init__(self, http: HttpClient):
        self._http = http

    @staticmethod
    def _path(design_id: str) -> str:
        return "/api/v1/designs/" + quote(design_id, safe="")

    async def capabilities(self) -> dict[str, Any]:
        return await self._http.get("/api/v1/capabilities")

    async def list(self, application_key: str | None = None) -> dict[str, Any]:
        return await self._http.get("/api/v1/designs", params={"applicationKey": application_key} if application_key else {})

    async def get(self, design_id: str) -> dict[str, Any]:
        return await self._http.get(self._path(design_id))

    async def create(self, *, application_key: str, key: str, draft: dict[str, Any], locale: str = "en") -> dict[str, Any]:
        return await self._http.post("/api/v1/designs", json={"applicationKey": application_key, "key": key, "locale": locale, "draft": draft})

    async def update(self, design_id: str, *, draft: dict[str, Any], expected_revision: int) -> dict[str, Any]:
        return await self._http.patch(self._path(design_id), json={"draft": draft, "expectedRevision": expected_revision})

    async def preview(self, design_id: str, *, variables: dict[str, Any] | None = None, sample: bool = False, published: bool = False, version: int | None = None) -> dict[str, Any]:
        body = {"variables": variables or {}, "sample": sample, "published": published}
        if version is not None:
            body["version"] = version
        return await self._http.post(self._path(design_id) + "/preview", json=body)

    async def publish(self, design_id: str, expected_revision: int) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/publish", json={"expectedRevision": expected_revision})

    async def rollback(self, design_id: str, version: int, expected_revision: int) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/rollback", json={"rollbackVersion": version, "expectedRevision": expected_revision})

    async def releases(self, design_id: str) -> dict[str, Any]:
        return await self._http.get(self._path(design_id) + "/releases")

    async def send(self, design_id: str, *, to: list[dict[str, str]], idempotency_key: str, variables: dict[str, Any] | None = None, version: int | None = None, metadata: dict[str, str] | None = None) -> dict[str, Any]:
        if not idempotency_key:
            raise ValueError("An idempotency key is required")
        body = {"to": to, "variables": variables or {}, "metadata": metadata or {}}
        if version is not None:
            body["version"] = version
        return await self._http.post(self._path(design_id) + "/send", json=body, headers={"Idempotency-Key": idempotency_key})

    async def deliveries(self, design_id: str) -> dict[str, Any]:
        return await self._http.get(self._path(design_id) + "/deliveries")

    async def export_manifest(self, application_key: str) -> dict[str, Any]:
        return await self._http.get("/api/v1/designs/manifest", params={"applicationKey": application_key})

    async def apply_manifest(self, manifest: dict[str, Any]) -> dict[str, Any]:
        return await self._http.post("/api/v1/designs/manifest", json=manifest)

    async def upload_logo(self, application_key: str, png_base64: str) -> dict[str, Any]:
        return await self._http.post("/api/v1/designs/assets", json={"applicationKey": application_key, "pngBase64": png_base64})
