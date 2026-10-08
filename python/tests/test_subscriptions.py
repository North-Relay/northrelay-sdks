"""Mailing lists, subscriptions, topics and contacts against a mocked HTTP API.

Request and response shapes mirror src/app/api/v1/{subscriptions,contacts,
suppression-groups}/** and src/lib/subscriptions/service.ts.
"""

import json
import warnings

import httpx
import pydantic
import pytest

from northrelay import (
    WEBHOOK_EVENT_TYPES,
    NorthRelay,
    NorthRelayError,
    NotFoundError,
    ValidationError,
    WebhookEventType,
    WebhookPayload,
)
from northrelay.types import CreateWebhookRequest, CsvColumnMapping, SubscribeRequest


class Recorder:
    """Collects requests and answers them from a route table."""

    def __init__(self, routes):
        self.routes = routes
        self.requests = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = None
        if request.content and request.headers.get("content-type", "").startswith(
            "application/json"
        ):
            body = json.loads(request.content)
        self.requests.append((request, body))
        key = (request.method, request.url.raw_path.split(b"?")[0].decode())
        handler = self.routes.get(key)
        if handler is None:
            return httpx.Response(500, json={"error": f"unexpected {key}"})
        status, payload = handler(request) if callable(handler) else handler
        return httpx.Response(status, json=payload)


@pytest.fixture
async def make_client():
    clients = []

    async def factory(routes):
        recorder = Recorder(routes)
        client = NorthRelay(
            api_key="nr_live_fixture", base_url="https://example.test", max_retries=3
        )
        headers = client._http.client.headers
        await client._http.client.aclose()
        client._http.client = httpx.AsyncClient(
            base_url="https://example.test",
            headers=headers,
            transport=httpx.MockTransport(recorder),
        )
        clients.append(client)
        return client, recorder

    yield factory
    for client in clients:
        await client.close()


STATUS = {
    "email": "ada+news@example.com",
    "contact": {
        "id": "c1",
        "status": "ACTIVE",
        "firstName": "Ada",
        "lastName": None,
        "subscribedAt": "2026-10-01T12:00:00.000Z",
        "unsubscribedAt": None,
        "confirmedAt": "2026-10-01T12:05:00.000Z",
        "consent": {
            "source": "api",
            "at": "2026-10-01T12:00:00.000Z",
            "ip": "203.0.113.9",
            "text": "Yes please",
        },
    },
    "suppression": None,
    "unsubscribedFromAll": False,
    "pendingConfirmation": None,
    "lists": [
        {
            "id": "l1",
            "name": "News",
            "subscribed": True,
            "addedAt": "2026-10-01T12:00:00.000Z",
            "removedAt": None,
        },
        {
            "id": "l2",
            "name": "Old",
            "subscribed": False,
            "addedAt": "2026-09-01T12:00:00.000Z",
            "removedAt": "2026-09-20T12:00:00.000Z",
        },
    ],
    "topics": [
        {
            "id": "t1",
            "name": "product",
            "label": "Product news",
            "description": None,
            "subscribed": True,
        },
        {"id": "t2", "name": "offers", "label": None, "description": None, "subscribed": False},
    ],
}


# ---------------------------------------------------------------- subscriptions


async def test_subscribe_sends_camel_case_body_and_parses_result(make_client):
    result_data = {
        "contactId": "c1",
        "email": "ada@example.com",
        "status": "PENDING",
        "created": True,
        "listIds": ["l1"],
        "addedToListIds": ["l1"],
        "topicIds": ["t1"],
        "requiresConfirmation": True,
        "confirmationSent": True,
    }
    client, rec = await make_client(
        {("POST", "/api/v1/subscriptions"): (201, {"success": True, "data": result_data})}
    )
    result = await client.subscriptions.subscribe(
        "ada@example.com",
        first_name="Ada",
        list_ids=["l1"],
        topic_ids=["t1"],
        tags=["newsletter"],
        custom_fields={"plan": "pro"},
        double_opt_in=True,
        redirect_url="https://example.com/thanks",
        consent={"ip": "203.0.113.9", "user_agent": "Mozilla/5.0", "text": "Send me news"},
    )
    assert result.status == "PENDING"
    assert result.created is True
    assert result.added_to_list_ids == ["l1"]
    assert result.confirmation_sent is True
    _, body = rec.requests[0]
    assert body == {
        "email": "ada@example.com",
        "firstName": "Ada",
        "listIds": ["l1"],
        "topicIds": ["t1"],
        "tags": ["newsletter"],
        "customFields": {"plan": "pro"},
        "doubleOptIn": True,
        "redirectUrl": "https://example.com/thanks",
        "consent": {"ip": "203.0.113.9", "userAgent": "Mozilla/5.0", "text": "Send me news"},
    }


async def test_subscribe_conflict_exposes_code_and_is_not_retried(make_client):
    error = {
        "success": False,
        "error": {
            "code": "RECIPIENT_UNSUBSCRIBED",
            "message": "ada@example.com has unsubscribed.",
            "fix_action": 'Pass "resubscribe": true only when they have given fresh consent',
            "docs_url": "https://docs.northrelay.ca/docs/api-reference/subscriptions",
        },
    }
    client, rec = await make_client({("POST", "/api/v1/subscriptions"): (409, error)})
    with pytest.raises(NorthRelayError) as exc:
        await client.subscriptions.subscribe("ada@example.com", list_ids=["l1"])
    assert exc.value.status_code == 409
    assert exc.value.details["code"] == "RECIPIENT_UNSUBSCRIBED"
    assert "resubscribe" in exc.value.details["fix_action"]
    assert len(rec.requests) == 1


async def test_subscribe_not_found_keeps_error_code(make_client):
    error = {
        "success": False,
        "error": {
            "code": "LIST_NOT_FOUND",
            "message": "List not found: nope",
            "fix_action": "Check the list id",
            "docs_url": "x",
        },
    }
    client, _ = await make_client({("POST", "/api/v1/subscriptions"): (404, error)})
    with pytest.raises(NotFoundError) as exc:
        await client.subscriptions.subscribe("ada@example.com", list_ids=["nope"])
    assert exc.value.details["code"] == "LIST_NOT_FOUND"


def test_subscribe_request_is_strict_and_https_only():
    with pytest.raises(pydantic.ValidationError):
        SubscribeRequest(email="a@example.com", redirect_url="http://example.com")
    with pytest.raises(pydantic.ValidationError):
        SubscribeRequest(email="a@example.com", unknown_field=True)


async def test_unsubscribe_scopes(make_client):
    data = {"email": "ada@example.com", "contactId": "c1", "scope": "list", "changed": True}
    client, rec = await make_client(
        {("POST", "/api/v1/subscriptions/unsubscribe"): (200, {"success": True, "data": data})}
    )
    with pytest.raises(ValueError):
        await client.subscriptions.unsubscribe("ada@example.com", scope="list")
    with pytest.raises(ValueError):
        await client.subscriptions.unsubscribe("ada@example.com", scope="topic")
    assert rec.requests == []
    result = await client.subscriptions.unsubscribe(
        "ada@example.com", scope="list", list_id="l1", reason="too many"
    )
    assert result.changed is True and result.contact_id == "c1"
    assert rec.requests[0][1] == {
        "email": "ada@example.com",
        "scope": "list",
        "listId": "l1",
        "reason": "too many",
    }
    await client.subscriptions.unsubscribe("ada@example.com")
    assert rec.requests[1][1] == {"email": "ada@example.com", "scope": "all"}


async def test_get_status_url_encodes_email(make_client):
    path = "/api/v1/subscriptions/ada%2Bnews%40example.com"
    client, rec = await make_client({("GET", path): (200, {"success": True, "data": STATUS})})
    status = await client.subscriptions.get("ada+news@example.com")
    assert rec.requests[0][0].url.raw_path == path.encode()
    assert status.contact.first_name == "Ada"
    assert status.contact.consent.ip == "203.0.113.9"
    assert [item.id for item in status.lists if item.subscribed] == ["l1"]
    assert status.lists[1].removed_at is not None
    assert {t.id: t.subscribed for t in status.topics} == {"t1": True, "t2": False}
    assert status.unsubscribed_from_all is False
    assert status.pending_confirmation is None


async def test_get_status_for_unknown_address(make_client):
    data = {
        "email": "x@example.com",
        "contact": None,
        "suppression": {"reason": "Bounce", "since": "2026-10-01T00:00:00Z"},
        "unsubscribedFromAll": True,
        "pendingConfirmation": None,
        "lists": [],
        "topics": [],
    }
    client, _ = await make_client(
        {("GET", "/api/v1/subscriptions/x%40example.com"): (200, {"success": True, "data": data})}
    )
    status = await client.subscriptions.get("x@example.com")
    assert status.contact is None
    assert status.suppression.reason == "Bounce"
    assert status.unsubscribed_from_all is True


async def test_update_preferences(make_client):
    path = "/api/v1/subscriptions/ada%2Bnews%40example.com"
    client, rec = await make_client({("PATCH", path): (200, {"success": True, "data": STATUS})})
    with pytest.raises(ValueError):
        await client.subscriptions.update_preferences("ada+news@example.com")
    status = await client.subscriptions.update_preferences(
        "ada+news@example.com",
        topics={"t1": True, "t2": False},
        lists={"l2": True},
        resubscribe=True,
        consent={"text": "Opted back in on the settings page"},
    )
    assert status.email == "ada+news@example.com"
    req, body = rec.requests[0]
    assert req.method == "PATCH"
    assert body == {
        "topics": {"t1": True, "t2": False},
        "lists": {"l2": True},
        "resubscribe": True,
        "consent": {"text": "Opted back in on the settings page"},
    }
    await client.subscriptions.update_preferences("ada+news@example.com", unsubscribe_all=True)
    assert rec.requests[1][1] == {"unsubscribeAll": True}


async def test_resend_confirmation(make_client):
    path = "/api/v1/subscriptions/ada%40example.com/resend-confirmation"
    data = {
        "email": "ada@example.com",
        "confirmationSent": True,
        "expiresAt": "2026-10-13T12:00:00.000Z",
    }
    client, rec = await make_client({("POST", path): (200, {"success": True, "data": data})})
    result = await client.subscriptions.resend_confirmation("ada@example.com")
    assert result.confirmation_sent is True
    assert result.expires_at.year == 2026
    assert rec.requests[0][0].url.raw_path == path.encode()


async def test_resend_confirmation_conflict(make_client):
    path = "/api/v1/subscriptions/ada%40example.com/resend-confirmation"
    error = {
        "success": False,
        "error": {
            "code": "NO_PENDING_CONFIRMATION",
            "message": "nothing pending",
            "fix_action": "Subscribe again",
            "docs_url": "x",
        },
    }
    client, rec = await make_client({("POST", path): (409, error)})
    with pytest.raises(NorthRelayError) as exc:
        await client.subscriptions.resend_confirmation("ada@example.com")
    assert exc.value.details["code"] == "NO_PENDING_CONFIRMATION"
    assert len(rec.requests) == 1


# ---------------------------------------------------------------- list members


async def test_add_list_members_by_email_with_create_missing(make_client):
    data = {
        "added": 1,
        "alreadyMembers": 1,
        "notFound": [],
        "blocked": [{"email": "b@example.com", "reason": "RECIPIENT_SUPPRESSED"}],
    }
    payload = {
        "success": True,
        "data": data,
        "added": 1,
        "skipped": 1,
        "message": "Added 1 contacts to list",
    }
    client, rec = await make_client(
        {("POST", "/api/v1/contacts/lists/l%2F1/members"): (200, payload)}
    )
    with pytest.raises(ValueError):
        await client.contacts.add_to_list("l/1")
    result = await client.contacts.add_to_list(
        "l/1", ["c1"], emails=["a@example.com", "b@example.com"], create_missing=True
    )
    assert result.added == 1 and result.already_members == 1 and result.skipped == 1
    assert result.blocked[0].reason == "RECIPIENT_SUPPRESSED"
    assert rec.requests[0][1] == {
        "contactIds": ["c1"],
        "emails": ["a@example.com", "b@example.com"],
        "createMissing": True,
    }


async def test_remove_list_members_uses_delete_body(make_client):
    client, rec = await make_client(
        {
            ("DELETE", "/api/v1/contacts/lists/l1/members"): lambda r: (
                (200, {"success": True, "data": {"removed": 2}})
                if json.loads(r.content).get("emails")
                else (
                    404,
                    {
                        "success": False,
                        "error": {
                            "code": "NOT_A_MEMBER",
                            "message": "Contact(s) not in list",
                            "fix_action": "List members",
                            "docs_url": "x",
                        },
                    },
                )
            ),
        }
    )
    result = await client.contacts.remove_from_list("l1", emails=["a@example.com", "b@example.com"])
    assert result.removed == 2
    assert rec.requests[0][0].method == "DELETE"
    assert rec.requests[0][1] == {"emails": ["a@example.com", "b@example.com"]}
    with pytest.raises(NotFoundError) as exc:
        await client.contacts.remove_from_list("l1", ["c9"])
    assert exc.value.details["code"] == "NOT_A_MEMBER"


async def test_list_members_page_filter_and_parse(make_client):
    payload = {
        "data": [
            {
                "id": "m1",
                "contactId": "c1",
                "contact": {
                    "id": "c1",
                    "email": "a@example.com",
                    "firstName": "A",
                    "lastName": None,
                    "status": "UNSUBSCRIBED",
                    "subscribedAt": "2026-10-01T00:00:00.000Z",
                    "createdAt": "2026-10-01T00:00:00.000Z",
                },
                "addedAt": "2026-10-01T00:00:00.000Z",
                "removedAt": None,
                "suppressionStatuses": ["UNSUBSCRIBED"],
            }
        ],
        "counts": {"total": 3, "active": 2, "suppressed": 1},
        "pagination": {"page": 1, "limit": 1, "total": 1, "totalPages": 1},
    }
    client, rec = await make_client({("GET", "/api/v1/contacts/lists/l1/members"): (200, payload)})
    page = await client.contacts.list_members("l1", page=1, limit=1, filter="suppressed")
    params = rec.requests[0][0].url.params
    assert (params["page"], params["limit"], params["filter"]) == ("1", "1", "suppressed")
    assert page.counts.suppressed == 1 and page.total == 1 and page.has_more is False
    assert page.data[0].suppression_statuses == ["UNSUBSCRIBED"]
    assert page.data[0].contact.email == "a@example.com"


async def test_list_lists_reads_pagination_and_archived_flag(make_client):
    payload = {
        "data": [
            {
                "id": "l1",
                "name": "News",
                "description": None,
                "type": "STATIC",
                "contactCount": 4,
                "isArchived": False,
                "createdAt": "2026-10-01T00:00:00Z",
                "updatedAt": "2026-10-01T00:00:00Z",
                "lastSyncedAt": None,
            }
        ],
        "pagination": {"page": 1, "limit": 1, "total": 3, "totalPages": 3},
    }
    client, rec = await make_client({("GET", "/api/v1/contacts/lists"): (200, payload)})
    lists = await client.contacts.list_lists(limit=1)
    assert lists.total == 3 and lists.has_more is True
    assert lists.data[0].contact_count == 4
    assert "isArchived" not in rec.requests[0][0].url.params
    await client.contacts.list_lists(archived=True)
    assert rec.requests[1][0].url.params["isArchived"] == "true"


async def test_create_and_update_list_with_topic(make_client):
    created = {
        "id": "l1",
        "name": "News",
        "type": "STATIC",
        "contactCount": 0,
        "suppressionGroupId": "t1",
        "trackingEnabled": True,
        "createdAt": "2026-10-06T00:00:00Z",
        "updatedAt": "2026-10-06T00:00:00Z",
    }
    client, rec = await make_client(
        {
            ("POST", "/api/v1/contacts/lists"): (201, {"data": created}),
            ("PATCH", "/api/v1/contacts/lists/l1"): (
                200,
                {"data": {**created, "suppressionGroupId": None}},
            ),
        }
    )
    lst = await client.contacts.create_list("News", topic_id="t1")
    assert lst.suppression_group_id == "t1"
    assert rec.requests[0][1] == {"name": "News", "suppressionGroupId": "t1"}  # no null description
    await client.contacts.update_list("l1", topic_id=None)
    assert rec.requests[1][1] == {"suppressionGroupId": None}


# ---------------------------------------------------------------- contacts


CONTACT = {
    "id": "c1",
    "userId": "u1",
    "email": "ada@example.com",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "phone": None,
    "metadata": None,
    "source": "API",
    "status": "ACTIVE",
    "subscribedAt": "2026-10-01T00:00:00.000Z",
    "unsubscribedAt": None,
    "confirmedAt": None,
    "createdAt": "2026-10-01T00:00:00.000Z",
    "updatedAt": "2026-10-01T00:00:00.000Z",
    "tags": [{"id": "tg1", "contactId": "c1", "tag": "vip"}],
    "customFields": [{"id": "cf1", "contactId": "c1", "key": "plan", "value": "pro"}],
}


async def test_contacts_list_query_params(make_client):
    payload = {
        "success": True,
        "data": [CONTACT],
        "meta": {"page": 2, "limit": 10, "total_count": 11, "has_more": False},
    }
    client, rec = await make_client({("GET", "/api/v1/contacts"): (200, payload)})
    result = await client.contacts.list(
        page=2, limit=10, status="ACTIVE", tag="vip", sort_by="email", sort_order="asc"
    )
    params = dict(rec.requests[0][0].url.params)
    assert params == {
        "page": "2",
        "limit": "10",
        "status": "ACTIVE",
        "tag": "vip",
        "sortBy": "email",
        "sortOrder": "asc",
    }
    assert result.total == 11
    contact = result.data[0]
    assert (
        contact.name == "Ada Lovelace"
        and contact.subscribed is True
        and contact.tag_names == ["vip"]
    )
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        await client.contacts.list(list_id="l1", tags="vip")
    assert any(issubclass(w.category, DeprecationWarning) for w in caught)
    params = dict(rec.requests[1][0].url.params)
    assert "listId" not in params and params["tag"] == "vip"


async def test_contact_crud_and_tags(make_client):
    ok = (200, {"success": True, "data": CONTACT})
    client, rec = await make_client(
        {
            ("POST", "/api/v1/contacts"): (201, {"success": True, "data": CONTACT}),
            ("GET", "/api/v1/contacts/c1"): ok,
            ("PATCH", "/api/v1/contacts/c1"): ok,
            ("DELETE", "/api/v1/contacts/c1"): (
                200,
                {"success": True, "data": {"message": "Contact deleted successfully"}},
            ),
            ("POST", "/api/v1/contacts/c1/tags"): ok,
            ("DELETE", "/api/v1/contacts/c1/tags/early%20bird"): (
                200,
                {"success": True, "data": {"message": "ok"}},
            ),
        }
    )
    created = await client.contacts.create(
        {"email": "ada@example.com", "name": "Ada Lovelace", "tags": ["vip"]}
    )
    assert created.id == "c1"
    assert rec.requests[0][1] == {
        "email": "ada@example.com",
        "firstName": "Ada",
        "lastName": "Lovelace",
        "tags": ["vip"],
    }
    assert (await client.contacts.get("c1")).custom_fields[0].value == "pro"
    await client.contacts.update("c1", first_name="Augusta", status="UNSUBSCRIBED")
    assert rec.requests[2][1] == {"firstName": "Augusta", "status": "UNSUBSCRIBED"}
    await client.contacts.delete("c1")
    await client.contacts.add_tags("c1", ["vip", "beta"])
    assert rec.requests[4][1] == {"tags": ["vip", "beta"]}
    await client.contacts.remove_tag("c1", "early bird")
    assert rec.requests[5][0].url.raw_path == b"/api/v1/contacts/c1/tags/early%20bird"


async def test_contacts_bulk(make_client):
    client, rec = await make_client(
        {
            ("POST", "/api/v1/contacts/bulk"): (
                201,
                {"success": True, "data": {"created": 1, "skipped": 1, "errors": []}},
            ),
            ("DELETE", "/api/v1/contacts/bulk"): (
                200,
                {"success": True, "data": {"deleted": 2, "requested": 2}},
            ),
        }
    )
    result = await client.contacts.bulk_upsert(
        [{"email": "a@example.com"}, {"email": "b@example.com"}], skip_duplicates=False
    )
    assert result.created == 1 and result.skipped == 1
    assert rec.requests[0][1] == {
        "contacts": [{"email": "a@example.com"}, {"email": "b@example.com"}],
        "skipDuplicates": False,
    }
    deleted = await client.contacts.bulk_delete(["c1", "c2"])
    assert deleted.deleted == 2
    assert rec.requests[1][1] == {"contactIds": ["c1", "c2"]}


async def test_import_csv_sends_multipart_with_mappings_list_and_tags(make_client):
    client, rec = await make_client(
        {
            ("POST", "/api/v1/contacts/import"): (
                200,
                {"imported": 2, "skipped": 1, "addedToList": 3, "errors": []},
            ),
        }
    )
    csv_bytes = b"Email Address,Given,Ignored\nada@example.com,Ada,x\n"
    result = await client.contacts.import_csv(
        csv_bytes,
        mappings=[
            CsvColumnMapping(csv_column="Email Address", field="email"),
            {"csvColumn": "Given", "field": "firstName"},
        ],
        list_id="l1",
        tags=["import", "oct"],
    )
    assert result.imported == 2 and result.added_to_list == 3
    request = rec.requests[0][0]
    content_type = request.headers["content-type"]
    assert content_type.startswith("multipart/form-data; boundary=")
    body = request.content
    expected_mappings = json.dumps(
        [
            {"csvColumn": "Email Address", "field": "email"},
            {"csvColumn": "Given", "field": "firstName"},
        ],
        separators=(",", ":"),
    ).encode()
    assert b'name="mappings"' in body and expected_mappings in body
    assert b'name="listId"\r\n\r\nl1' in body
    assert b'name="tags"\r\n\r\nimport,oct' in body
    assert b'filename="contacts.csv"' in body and csv_bytes in body


async def test_import_csv_auto_maps_headers(make_client, tmp_path):
    client, rec = await make_client(
        {
            ("POST", "/api/v1/contacts/import"): (
                200,
                {"imported": 1, "skipped": 0, "addedToList": 0, "errors": []},
            ),
        }
    )
    path = tmp_path / "people.csv"
    path.write_bytes(b"First Name,E-mail,last_name,Notes\nAda,ada@example.com,Lovelace,hi\n")
    await client.contacts.import_csv(path)
    body = rec.requests[0][0].content
    assert b'filename="people.csv"' in body
    assert (
        b'[{"csvColumn":"First Name","field":"firstName"},{"csvColumn":"E-mail","field":"email"},'
        b'{"csvColumn":"last_name","field":"lastName"}]'
    ) in body
    with pytest.raises(ValueError):
        await client.contacts.import_csv(b"name,notes\nAda,x\n")
    with pytest.raises(ValueError):
        await client.contacts.import_csv(b"email\na@example.com\n", file_name="people.txt")
    assert len(rec.requests) == 1


async def test_import_csv_dict_mapping_and_error(make_client):
    client, _ = await make_client(
        {("POST", "/api/v1/contacts/import"): (400, {"error": "Invalid mappings"})}
    )
    with pytest.raises(ValidationError, match="Invalid mappings"):
        await client.contacts.import_csv(b"Mail\na@example.com\n", mappings={"Mail": "email"})


# ---------------------------------------------------------------- topics & forms


async def test_topics_members(make_client):
    page = {
        "success": True,
        "data": [{"email": "a@example.com", "createdAt": "2026-10-01T00:00:00Z"}],
        "meta": {"page": 1, "limit": 25, "total_count": 1, "has_more": False},
    }
    client, rec = await make_client(
        {
            ("GET", "/api/v1/suppression-groups"): (
                200,
                {
                    "success": True,
                    "data": [],
                    "meta": {"page": 1, "limit": 25, "total_count": 0, "has_more": False},
                },
            ),
            ("POST", "/api/v1/suppression-groups"): (201, {"success": True, "data": {"id": "t1"}}),
            ("GET", "/api/v1/suppression-groups/t1/members"): (200, page),
            ("POST", "/api/v1/suppression-groups/t1/members"): (
                201,
                {"success": True, "data": {"email": "a@example.com"}},
            ),
            ("DELETE", "/api/v1/suppression-groups/t1/members/a%2Bb%40example.com"): (
                200,
                {"success": True, "data": {"ok": True}},
            ),
            ("PATCH", "/api/v1/suppression-groups/t1"): (
                200,
                {"success": True, "data": {"id": "t1"}},
            ),
        }
    )
    await client.topics.list(published=True)
    assert rec.requests[0][0].url.params["published"] == "true"
    await client.topics.create("Product news")
    assert rec.requests[1][1] == {"name": "Product news"}
    members = await client.topics.list_members("t1")
    assert members.total == 1 and members.data[0]["email"] == "a@example.com"
    await client.topics.add_member("t1", "a@example.com")
    assert rec.requests[3][1] == {"email": "a@example.com"}
    await client.topics.remove_member("t1", "a+b@example.com")
    await client.topics.update(
        "t1", public_label="Product news", is_published_on_unsub=True, sort_order=1
    )
    assert rec.requests[5][1] == {
        "publicLabel": "Product news",
        "isPublishedOnUnsub": True,
        "sortOrder": 1,
    }


async def test_forms(make_client):
    client, rec = await make_client(
        {
            ("POST", "/api/v1/forms"): (200, {"success": True, "data": {"form": {"id": "f1"}}}),
            ("PATCH", "/api/v1/forms/f1"): (
                200,
                {"success": True, "data": {"form": {"id": "f1", "status": "PUBLISHED"}}},
            ),
            ("PUT", "/api/v1/forms/f1/fields"): (200, {"success": True, "data": {"fields": []}}),
            ("POST", "/api/v1/forms/f1/submit"): (
                200,
                {"data": {"ok": True, "requiresConfirmation": True}},
            ),
        }
    )
    assert (await client.forms.create(list_id="l1", name="Newsletter", slug="newsletter"))["form"][
        "id"
    ] == "f1"
    assert rec.requests[0][1] == {"listId": "l1", "name": "Newsletter", "slug": "newsletter"}
    await client.forms.update(
        "f1", status="PUBLISHED", require_confirmation=True, success_redirect_url=None
    )
    assert rec.requests[1][1] == {
        "status": "PUBLISHED",
        "requireConfirmation": True,
        "successRedirectUrl": None,
    }
    with pytest.raises(TypeError):
        await client.forms.update("f1", colour="red")
    await client.forms.set_fields(
        "f1", [{"fieldKey": "email", "label": "Email", "type": "EMAIL", "bindsToContact": "EMAIL"}]
    )
    assert rec.requests[2][0].method == "PUT"
    assert (await client.forms.submit("f1", {"email": "a@example.com"}))[
        "requiresConfirmation"
    ] is True


# ---------------------------------------------------------------- webhooks


def test_webhook_event_types_include_lists_and_engagement():
    for name in (
        "list.member_added",
        "list.member_removed",
        "email.opened",
        "email.clicked",
        "contact.subscribed",
        "contact.confirmed",
        "contact.unsubscribed",
    ):
        assert name in WEBHOOK_EVENT_TYPES
    assert WebhookEventType.LIST_MEMBER_ADDED.value == "list.member_added"
    request = CreateWebhookRequest(
        url="https://example.com/hook",
        events=[
            WebhookEventType.LIST_MEMBER_ADDED,
            WebhookEventType.EMAIL_CLICKED,
            "contact.unsubscribed",
        ],
    )
    sent = json.loads(json.dumps(request.model_dump(by_alias=True, exclude_none=True)))
    assert sent["events"] == ["list.member_added", "email.clicked", "contact.unsubscribed"]


def test_webhook_payload_parses_click_event():
    payload = WebhookPayload(
        **{
            "eventType": "email.clicked",
            "messageId": "m1",
            "timestamp": "2026-10-06T12:00:00.000Z",
            "recipient": "a@example.com",
            "details": {
                "email": "a@example.com",
                "contactId": None,
                "campaignId": None,
                "trackingId": "tr1",
                "url": "https://example.com/pricing",
                "userAgent": None,
                "engagementType": "HUMAN",
            },
        }
    )
    assert payload.event_type == WebhookEventType.EMAIL_CLICKED
    assert payload.details["url"] == "https://example.com/pricing"
    assert WebhookPayload(eventType="list.member_removed", details=None).details == {}


async def test_webhooks_resource_matches_api_shapes(make_client):
    hook = {
        "id": "wh1",
        "url": "https://example.com/hook",
        "events": ["list.member_added", "email.opened"],
        "description": None,
        "active": True,
        "createdAt": "2026-10-06T00:00:00.000Z",
        "updatedAt": "2026-10-06T00:00:00.000Z",
        "secretPrefix": "whsec_ab",
    }
    client, rec = await make_client(
        {
            ("POST", "/api/v1/webhooks"): (
                201,
                {"webhook": hook, "secret": "whsec_full", "message": "ok"},
            ),
            ("GET", "/api/v1/webhooks"): (200, {"webhooks": [{**hook, "totalDeliveries": 3}]}),
            ("GET", "/api/v1/webhooks/wh1"): (
                200,
                {"webhook": hook, "stats": {"successRate": 100}},
            ),
            ("PATCH", "/api/v1/webhooks/wh1"): (200, {"webhook": {**hook, "active": False}}),
            ("POST", "/api/v1/webhooks/wh1/rotate"): (200, {"id": "wh1", "secret": "whsec_new"}),
        }
    )
    created = await client.webhooks.create(
        CreateWebhookRequest(
            url="https://example.com/hook",
            events=[WebhookEventType.LIST_MEMBER_ADDED, WebhookEventType.EMAIL_OPENED],
        )
    )
    assert created.secret == "whsec_full"
    assert rec.requests[0][1] == {
        "url": "https://example.com/hook",
        "events": ["list.member_added", "email.opened"],
    }
    listed = await client.webhooks.list()
    assert listed.data[0].total_deliveries == 3 and listed.data[0].secret is None
    assert (await client.webhooks.get("wh1")).stats == {"successRate": 100}
    from northrelay.types import UpdateWebhookRequest

    updated = await client.webhooks.update("wh1", UpdateWebhookRequest(active=False))
    assert updated.active is False and rec.requests[3][0].method == "PATCH"
    assert await client.webhooks.rotate_secret("wh1") == "whsec_new"
