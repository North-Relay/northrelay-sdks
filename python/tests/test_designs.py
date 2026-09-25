"""Exercise the design workflow through HTTP serialization and error handling."""
import json

import httpx
import pytest
from northrelay import NorthRelay, __version__
from northrelay.exceptions import NorthRelayError


@pytest.mark.asyncio
async def test_catalog_brand_adoption_and_conflict():
    requests = []
    source = {"kind": "gallery", "id": "welcome", "digest": "a" * 64}

    def respond(request):
        body = json.loads(request.content) if request.content else None
        requests.append((request, body))
        path = request.url.path
        if path.endswith("/sync"):
            return httpx.Response(409, json={"success": False, "error": {
                "code": "REVISION_CONFLICT", "message": "Reload the draft",
            }})
        if request.url.query:
            data = {"items": [], "gallery": [source], "nextCursor": None}
        elif path.endswith("/adopt"):
            data = {"id": "design/one", "revision": 3, "applicationKey": "my-app", "source": source}
        elif path.endswith("/catalog"):
            data = {"source": source, "preview": {"html": "<p>Welcome</p>"}}
        else:
            data = {"id": "brand/one", "updatedAt": "2026-09-23T00:00:00Z", "editable": True}
        return httpx.Response(200, json={"success": True, "data": data})

    client = NorthRelay(api_key="nr_app_fixture", base_url="https://example.test")
    headers = client._http.client.headers
    await client._http.client.aclose()
    async with httpx.AsyncClient(base_url="https://example.test", headers=headers,
                                 transport=httpx.MockTransport(respond)) as transport:
        client._http.client = transport
        catalog = await client.designs.catalog(cursor="next+/=")
        assert catalog["data"]["gallery"][0]["id"] == source["id"]
        brand = (await client.designs.create_brand(theme={"name": "My app"}))["data"]
        reviewed = (await client.designs.inspect_template(
            kind="gallery", id="welcome", brand_id=brand["id"]))["data"]
        design = (await client.designs.adopt_template(
            **reviewed["source"], brand_id=brand["id"]))["data"]
        await client.designs.update_brand(brand["id"], expected_updated_at=brand["updatedAt"],
                                         theme={"primaryColor": "#123456"})
        await client.designs.bind_brand(design["id"], brand_id=brand["id"], expected_revision=3)
        with pytest.raises(NorthRelayError) as error:
            await client.designs.sync_source(design["id"], expected_revision=3,
                                             source_digest=source["digest"])
        assert error.value.status_code == 409
        assert error.value.details["code"] == "REVISION_CONFLICT"
    assert len(requests) == 7  # No automatic write retry, publication or send.
    assert requests[0][0].url.params["cursor"] == "next+/="
    assert requests[1][1] == {"theme": {"name": "My app"}}
    assert requests[3][1] == {**source, "brandId": "brand/one"}
    assert requests[4][0].method == "PATCH"
    assert requests[4][0].url.raw_path.endswith(b"/brands/brand%2Fone")
    assert requests[4][1]["expectedUpdatedAt"] == brand["updatedAt"]
    assert requests[5][0].url.raw_path.endswith(b"/design%2Fone/brand")
    assert requests[5][1] == {"brandId": "brand/one", "expectedRevision": 3}
    assert requests[6][1] == {"expectedRevision": 3, "sourceDigest": source["digest"], "apply": False}
    assert all(req.headers["authorization"] == "Bearer nr_app_fixture" for req, _ in requests)
    assert all(req.headers["user-agent"] == f"northrelay-python/{__version__}" for req, _ in requests)


@pytest.mark.asyncio
async def test_pagination_lifecycle_and_no_rotation_retry():
    requests = []
    def respond(request):
        requests.append(request)
        if request.method == "PUT":
            return httpx.Response(503, json={"success": False, "error": {"code": "UNAVAILABLE", "message": "Uncertain result"}})
        return httpx.Response(200, json={"success": True, "data": {"items": [], "nextCursor": None}})
    client = NorthRelay(api_key="nr_live_fixture", base_url="https://example.test")
    await client._http.client.aclose()
    async with httpx.AsyncClient(base_url="https://example.test", transport=httpx.MockTransport(respond)) as transport:
        client._http.client = transport
        await client.designs.list_page(brand_id="brand&other", status="retired", cursor="d1", search="Welcome home")
        await client.designs.set_lifecycle("a/b", retired=True, expected_revision=4, replacement={"id": "d2", "kind": "DESIGN"})
        await client.credentials.update("key&id", {"type": "USER", "name": "CC", "scopes": ["templates:read"], "expiresAt": None})
        with pytest.raises(NorthRelayError):
            await client.credentials.rotate("key", "APPLICATION")
    assert len(requests) == 4
    assert requests[0].url.params["brandId"] == "brand&other"
    assert requests[0].url.params["paginated"] == "true"
    assert requests[1].url.raw_path == b"/api/v1/designs/a%2Fb/lifecycle"
    assert json.loads(requests[1].content)["expectedRevision"] == 4
    assert requests[2].url.params["id"] == "key&id"
    assert json.loads(requests[3].content) == {"id": "key", "type": "APPLICATION", "action": "rotate"}
