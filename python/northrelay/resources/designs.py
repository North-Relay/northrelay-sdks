"""Versioned design API. Returns the server's success/data envelope unchanged.

No automatic write retries. Persist a send idempotency key before requesting a
send and reuse it with the identical payload after an uncertain response.
"""
from __future__ import annotations

from typing import Any
from urllib.parse import quote
from northrelay.utils.http import HttpClient

#: Application key of the account's own templates (the NorthRelay dashboard).
ACCOUNT_APPLICATION = "account"


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

    async def list_page(self, *, application_key: str | None = None, cursor: str | None = None, search: str | None = None, brand_id: str | None = None, category: str | None = None, status: str = "all", limit: int = 50) -> dict[str, Any]:
        params = {"applicationKey": application_key, "cursor": cursor, "search": search, "brandId": brand_id, "category": category, "status": status, "limit": limit, "paginated": "true"}
        return await self._http.get("/api/v1/designs", params={k: v for k, v in params.items() if v is not None})

    async def set_lifecycle(self, design_id: str, *, retired: bool, expected_revision: int, replacement: dict[str, str] | None = None) -> dict[str, Any]:
        body = {"retired": retired, "expectedRevision": expected_revision}
        if replacement is not None:
            body["replacement"] = replacement
        return await self._http.patch(self._path(design_id) + "/lifecycle", json=body)

    async def get(self, design_id: str) -> dict[str, Any]:
        return await self._http.get(self._path(design_id))

    async def create(self, *, application_key: str, key: str, draft: dict[str, Any], locale: str = "en") -> dict[str, Any]:
        return await self._http.post("/api/v1/designs", json={"applicationKey": application_key, "key": key, "locale": locale, "draft": draft})

    async def update(self, design_id: str, *, draft: dict[str, Any], expected_revision: int) -> dict[str, Any]:
        return await self._http.patch(self._path(design_id), json={"draft": draft, "expectedRevision": expected_revision})

    async def preview(self, design_id: str, *, variables: dict[str, Any] | None = None, sample: bool = False, published: bool = False, version: int | None = None, brand_id: str | None = None) -> dict[str, Any]:
        """Render with the delivery engine. ``brand_id`` previews the template with another brand."""
        body = {"variables": variables or {}, "sample": sample, "published": published}
        if version is not None:
            body["version"] = version
        if brand_id is not None:
            body["brandId"] = brand_id
        return await self._http.post(self._path(design_id) + "/preview", json=body)

    async def publish(self, design_id: str, expected_revision: int) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/publish", json={"expectedRevision": expected_revision})

    async def rollback(self, design_id: str, version: int, expected_revision: int) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/rollback", json={"rollbackVersion": version, "expectedRevision": expected_revision})

    async def release(self, design_id: str, version: int) -> dict[str, Any]:
        return await self._http.get(self._path(design_id) + "/releases", params={"version": version})

    async def releases(self, design_id: str) -> dict[str, Any]:
        return await self._http.get(self._path(design_id) + "/releases")

    async def send(self, design_id: str, *, to: list[dict[str, str]], idempotency_key: str, variables: dict[str, Any] | None = None, version: int | None = None, metadata: dict[str, str] | None = None, from_: dict[str, str] | None = None) -> dict[str, Any]:
        """Send the live release. ``from_`` sets the sender for account templates (default: the brand sender)."""
        if not idempotency_key:
            raise ValueError("An idempotency key is required")
        body = {"to": to, "variables": variables or {}, "metadata": metadata or {}}
        if version is not None:
            body["version"] = version
        if from_ is not None:
            body["from"] = from_
        return await self._http.post(self._path(design_id) + "/send", json=body, headers={"Idempotency-Key": idempotency_key})

    async def deliveries(self, design_id: str) -> dict[str, Any]:
        """Design sends and API sends by template id (``source``), newest first."""
        return await self._http.get(self._path(design_id) + "/deliveries")

    async def usage(self, design_id: str) -> dict[str, Any]:
        """Campaigns using the template and send counts, before retiring or deleting it."""
        return await self._http.get(self._path(design_id) + "/usage")

    async def export_manifest(self, application_key: str) -> dict[str, Any]:
        return await self._http.get("/api/v1/designs/manifest", params={"applicationKey": application_key})

    async def apply_manifest(self, manifest: dict[str, Any]) -> dict[str, Any]:
        return await self._http.post("/api/v1/designs/manifest", json=manifest)

    async def upload_logo(self, application_key: str, png_base64: str) -> dict[str, Any]:
        """Deprecated: use :meth:`upload_asset`, which also accepts JPEG and WebP."""
        return await self._http.post("/api/v1/designs/assets", json={"applicationKey": application_key, "pngBase64": png_base64})

    async def upload_asset(self, image_base64: str, *, application_key: str | None = None) -> dict[str, Any]:
        """Upload a logo or image (PNG, JPEG or WebP, up to 700 KiB); NorthRelay resizes it for email."""
        body = {"imageBase64": image_base64}
        if application_key is not None:
            body["applicationKey"] = application_key
        return await self._http.post("/api/v1/designs/assets", json=body)

    async def assets(self) -> dict[str, Any]:
        """Uploaded images, newest first, with the brands using each."""
        return await self._http.get("/api/v1/designs/assets")

    async def delete_asset(self, asset_id: str) -> dict[str, Any]:
        """Refused while a brand uses the image as its logo."""
        return await self._http.delete("/api/v1/designs/assets", params={"id": asset_id})

    async def catalog(self, cursor: str | None = None, *, search: str | None = None, brand_id: str | None = None, category: str | None = None) -> dict[str, Any]:
        return await self._http.get("/api/v1/designs/catalog", params={k: v for k, v in {"cursor": cursor, "search": search, "brandId": brand_id, "category": category}.items() if v is not None})

    async def inspect_template(self, *, kind: str, id: str, brand_id: str | None = None) -> dict[str, Any]:
        return await self._http.post("/api/v1/designs/catalog", json={"kind": kind, "id": id, **({"brandId": brand_id} if brand_id else {})})

    async def adopt_template(self, *, kind: str, id: str, digest: str, application_key: str | None = None, brand_id: str | None = None, as_blocks: bool = False) -> dict[str, Any]:
        """``as_blocks=True`` adopts a gallery starter as a visual-editor (blocks) draft."""
        body = {"kind": kind, "id": id, "digest": digest}
        if as_blocks:
            body["asBlocks"] = True
        if application_key is not None:
            body["applicationKey"] = application_key
        if brand_id is not None:
            body["brandId"] = brand_id
        return await self._http.post("/api/v1/designs/catalog/adopt", json=body)

    async def sync_source(self, design_id: str, *, expected_revision: int, source_digest: str, apply: bool = False) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/sync", json={"expectedRevision": expected_revision, "sourceDigest": source_digest, "apply": apply})

    async def brands(self) -> dict[str, Any]:
        return await self._http.get("/api/v1/designs/brands")

    async def create_brand(self, *, theme: dict[str, Any], application_key: str | None = None) -> dict[str, Any]:
        body = {"theme": theme}
        if application_key is not None:
            body["applicationKey"] = application_key
        return await self._http.post("/api/v1/designs/brands", json=body)

    async def update_brand(self, brand_id: str, *, theme: dict[str, Any], expected_updated_at: str) -> dict[str, Any]:
        return await self._http.patch("/api/v1/designs/brands/" + quote(brand_id, safe=""), json={"theme": theme, "expectedUpdatedAt": expected_updated_at})

    @staticmethod
    def _brand(brand_id: str) -> str:
        return "/api/v1/designs/brands/" + quote(brand_id, safe="")

    async def brand_usage(self, brand_id: str) -> dict[str, Any]:
        """Templates and campaigns using a brand; ``needsPublish`` marks application templates on an older brand version."""
        return await self._http.get(self._brand(brand_id) + "/usage")

    async def delete_brand(self, brand_id: str) -> dict[str, Any]:
        """Refused while templates use the brand, and for the only brand."""
        return await self._http.delete(self._brand(brand_id))

    async def set_default_brand(self, brand_id: str) -> dict[str, Any]:
        """Make an account brand the default (account credentials only)."""
        return await self._http.post(self._brand(brand_id) + "/default", json={})

    async def tracking_domain(self, brand_id: str) -> dict[str, Any]:
        """The brand's custom tracking domain, CNAME record and verification state."""
        return await self._http.get(self._brand(brand_id) + "/tracking-domain")

    async def set_tracking_domain(self, brand_id: str, domain: str) -> dict[str, Any]:
        return await self._http.put(self._brand(brand_id) + "/tracking-domain", json={"domain": domain})

    async def verify_tracking_domain(self, brand_id: str) -> dict[str, Any]:
        return await self._http.post(self._brand(brand_id) + "/tracking-domain/verify", json={})

    async def remove_tracking_domain(self, brand_id: str) -> dict[str, Any]:
        return await self._http.delete(self._brand(brand_id) + "/tracking-domain")

    async def bind_brand(self, design_id: str, *, brand_id: str, expected_revision: int) -> dict[str, Any]:
        return await self._http.post(self._path(design_id) + "/brand", json={"brandId": brand_id, "expectedRevision": expected_revision})
