"""Contacts resource - contacts, tags, CSV import, lists and list membership.

Reads are retried on network/5xx errors; writes are not retried automatically
(a timed-out write may have been applied, so check before repeating it).
"""

from __future__ import annotations

import builtins
import csv
import io
import json
import os
import warnings
from typing import Any, Literal, Union
from urllib.parse import quote

from northrelay.types import (
    AddListMembersResult,
    BulkCreateContactsResult,
    BulkDeleteContactsResult,
    Contact,
    ContactList,
    CreateContactRequest,
    CsvColumnMapping,
    ImportContactsResult,
    ListMembersPage,
    PaginatedResponse,
    RemoveListMembersResult,
    UpdateContactRequest,
)
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import RetryConfig, with_retry

MappingInput = Union[
    list[Union[CsvColumnMapping, dict[str, str]]],
    dict[str, str],
]

# Header names import_csv recognises when no mapping is given (compared
# case-insensitively with spaces, dashes and underscores removed).
_AUTO_FIELDS = {
    "email": "email",
    "emailaddress": "email",
    "e-mail": "email",
    "firstname": "firstName",
    "givenname": "firstName",
    "lastname": "lastName",
    "surname": "lastName",
    "familyname": "lastName",
    "phone": "phone",
    "phonenumber": "phone",
    "mobile": "phone",
}


_UNSET: Any = object()


def _seg(value: str) -> str:
    """URL-encode one path segment."""
    return quote(value, safe="")


def _compact(payload: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in payload.items() if v is not None}


def _normalise_mappings(mappings: MappingInput) -> list[dict[str, str]]:
    if isinstance(mappings, dict):
        items: list[Any] = [{"csvColumn": col, "field": field} for col, field in mappings.items()]
    else:
        items = list(mappings)
    out = []
    for item in items:
        model = item if isinstance(item, CsvColumnMapping) else CsvColumnMapping(**item)
        out.append(model.model_dump(by_alias=True))
    return out


def _auto_mappings(content: bytes) -> list[dict[str, str]]:
    text = content.decode("utf-8-sig", errors="replace")
    header = next(csv.reader(io.StringIO(text)), [])
    mappings = []
    taken: set[str] = set()
    for column in header:
        key = column.strip().lower().replace(" ", "").replace("_", "")
        field = _AUTO_FIELDS.get(key) or _AUTO_FIELDS.get(key.replace("-", ""))
        if field and field not in taken:
            taken.add(field)
            mappings.append({"csvColumn": column, "field": field})
    if "email" not in taken:
        raise ValueError(
            "Could not find an email column in the CSV header. Pass mappings, "
            'for example mappings={"Email Address": "email"}.'
        )
    return mappings


class ContactsResource:
    """Contacts, tags, CSV import, contact lists and list membership"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def _read(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        cfg = self._retry_config
        return await with_retry(
            lambda: self._http.get(path, params=params or {}),
            max_attempts=cfg.max_attempts,
            initial_delay=cfg.initial_delay,
            max_delay=cfg.max_delay,
            exponential_base=cfg.exponential_base,
        )

    # ========== Contacts ==========

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        source: str | None = None,
        sort_by: Literal["createdAt", "email", "subscribedAt"] | None = None,
        sort_order: Literal["asc", "desc"] | None = None,
        list_id: str | None = None,
        tags: str | None = None,
    ) -> PaginatedResponse:
        """List contacts (``GET /api/v1/contacts``).

        Args:
            page: Page number (1-based)
            limit: Page size (max 1000)
            search: Matches email, first name or last name
            status: PENDING, ACTIVE, UNSUBSCRIBED, BOUNCED, COMPLAINED or CLEANED
            tag: Only contacts with this tag
            source: MANUAL, CSV_IMPORT, API, FORM or SYNC
            sort_by: createdAt (default), email or subscribedAt
            sort_order: asc or desc (default)
            list_id: Deprecated; the endpoint has no list filter. Use
                ``list_members(list_id)`` instead.
            tags: Deprecated alias of ``tag``.
        """
        if list_id is not None:
            warnings.warn(
                "contacts.list(list_id=...) is ignored by the API; "
                "use contacts.list_members(list_id)",
                DeprecationWarning,
                stacklevel=2,
            )
        if tags is not None:
            warnings.warn(
                "contacts.list(tags=...) is deprecated; use tag=...",
                DeprecationWarning,
                stacklevel=2,
            )
            tag = tag or tags
        params = _compact(
            {
                "page": page,
                "limit": limit,
                "search": search,
                "status": status,
                "tag": tag,
                "source": source,
                "sortBy": sort_by,
                "sortOrder": sort_order,
            }
        )
        response = await self._read("/api/v1/contacts", params)
        return PaginatedResponse.from_api_response(response, model_class=Contact)

    async def get(self, id: str) -> Contact:
        """Get a contact with its tags and custom fields"""
        response = await self._read(f"/api/v1/contacts/{_seg(id)}")
        return Contact(**response["data"])

    async def create(self, request: CreateContactRequest | dict[str, Any]) -> Contact:
        """Create a contact (``source`` defaults to ``API``). 409 if the email exists."""
        model = (
            request
            if isinstance(request, CreateContactRequest)
            else CreateContactRequest(**request)
        )
        payload = model.model_dump(by_alias=True, exclude_none=True)
        result = await self._http.post("/api/v1/contacts", json=payload)
        return Contact(**result["data"])

    async def update(
        self,
        id: str,
        request: UpdateContactRequest | dict[str, Any] | None = None,
        **fields: Any,
    ) -> Contact:
        """Update a contact (``PATCH /api/v1/contacts/{id}``).

        Pass an ``UpdateContactRequest``/dict, or keyword arguments such as
        ``first_name="Ada"`` or ``status="UNSUBSCRIBED"``.
        """
        if request is None:
            model = UpdateContactRequest(**fields)
        elif isinstance(request, UpdateContactRequest):
            model = request
        else:
            model = UpdateContactRequest(**{**request, **fields})
        payload = model.model_dump(by_alias=True, exclude_none=True)
        result = await self._http.patch(f"/api/v1/contacts/{_seg(id)}", json=payload)
        return Contact(**result["data"])

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a contact"""
        return await self._http.delete(f"/api/v1/contacts/{_seg(id)}")

    async def bulk_upsert(
        self,
        contacts: builtins.list[CreateContactRequest | dict[str, Any]],
        *,
        skip_duplicates: bool = True,
    ) -> BulkCreateContactsResult:
        """Create up to 1000 contacts (``POST /api/v1/contacts/bulk``).

        Existing emails are counted as ``skipped`` when ``skip_duplicates`` is
        true (the default) and reported in ``errors`` otherwise.
        """
        models = [
            c if isinstance(c, CreateContactRequest) else CreateContactRequest(**c)
            for c in contacts
        ]
        payload = {
            "contacts": [c.model_dump(by_alias=True, exclude_none=True) for c in models],
            "skipDuplicates": skip_duplicates,
        }
        result = await self._http.post("/api/v1/contacts/bulk", json=payload)
        return BulkCreateContactsResult(**result["data"])

    async def bulk_delete(self, ids: builtins.list[str]) -> BulkDeleteContactsResult:
        """Delete up to 1000 contacts by id (``DELETE /api/v1/contacts/bulk``)"""
        result = await self._http.delete("/api/v1/contacts/bulk", json={"contactIds": ids})
        return BulkDeleteContactsResult(**result["data"])

    # ========== Tags ==========

    async def add_tags(self, id: str, tags: builtins.list[str]) -> Contact:
        """Add tags (lowercase letters, digits, - or _; max 50 per contact)"""
        result = await self._http.post(f"/api/v1/contacts/{_seg(id)}/tags", json={"tags": tags})
        return Contact(**result["data"])

    async def remove_tag(self, id: str, tag: str) -> dict[str, Any]:
        """Remove one tag from a contact"""
        return await self._http.delete(f"/api/v1/contacts/{_seg(id)}/tags/{_seg(tag)}")

    async def remove_tags(self, id: str, tags: builtins.list[str] | None = None) -> dict[str, Any]:
        """Remove several tags (all of them when ``tags`` is omitted).

        The API removes one tag per request, so this issues one
        ``DELETE /contacts/{id}/tags/{tag}`` per tag.
        """
        if tags is None:
            tags = (await self.get(id)).tag_names
        for tag in tags:
            await self.remove_tag(id, tag)
        return {"success": True, "data": {"removed": list(tags)}}

    # ========== CSV import ==========

    async def import_csv(
        self,
        file: str | os.PathLike[str] | bytes,
        *,
        mappings: MappingInput | None = None,
        list_id: str | None = None,
        tags: builtins.list[str] | str | None = None,
        file_name: str | None = None,
    ) -> ImportContactsResult:
        """Import contacts from a CSV file (max 2 MiB, ``POST /api/v1/contacts/import``).

        Args:
            file: Path to a ``.csv`` file, or the CSV content as bytes
            mappings: Which CSV column feeds which field, as
                ``[{"csvColumn": "Email", "field": "email"}, ...]``,
                ``CsvColumnMapping`` objects or ``{"Email": "email"}``.
                Fields: email, firstName, lastName, phone, skip. When omitted,
                columns named like email / first name / last name / phone are
                mapped automatically.
            list_id: Add every imported (and already existing) contact to this list
            tags: Tags for newly created contacts (list or comma-separated string; max 20)
            file_name: Upload name when ``file`` is bytes (must end in ``.csv``)

        Existing contacts are counted as ``skipped`` (but still added to ``list_id``).
        """
        if isinstance(file, (bytes, bytearray)):
            content = bytes(file)
            name = file_name or "contacts.csv"
        else:
            with open(file, "rb") as handle:
                content = handle.read()
            name = file_name or os.path.basename(os.fspath(file))
        if not name.lower().endswith(".csv"):
            raise ValueError("The API only accepts files whose name ends in .csv")

        mapping_list = (
            _normalise_mappings(mappings) if mappings is not None else _auto_mappings(content)
        )
        data: dict[str, str] = {"mappings": json.dumps(mapping_list, separators=(",", ":"))}
        if list_id:
            data["listId"] = list_id
        if tags:
            data["tags"] = tags if isinstance(tags, str) else ",".join(tags)

        result = await self._http.post_multipart(
            "/api/v1/contacts/import",
            data=data,
            files={"file": (name, content, "text/csv")},
        )
        return ImportContactsResult(**result)

    # ========== Contact Lists ==========

    async def list_lists(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        type: Literal["STATIC", "DYNAMIC", "ALL"] | None = None,
        search: str | None = None,
        archived: bool = False,
    ) -> PaginatedResponse:
        """List contact lists (``archived=True`` lists archived ones instead)"""
        params = _compact({"page": page, "limit": limit, "type": type, "search": search})
        if archived:
            # The API coerces any non-empty value to true, so only send it when set.
            params["isArchived"] = "true"
        response = await self._read("/api/v1/contacts/lists", params)
        return PaginatedResponse.from_api_response(response, model_class=ContactList)

    async def get_list(self, id: str) -> ContactList:
        """Get a contact list"""
        response = await self._read(f"/api/v1/contacts/lists/{_seg(id)}")
        return ContactList(**response["data"])

    async def create_list(
        self,
        name: str,
        description: str | None = None,
        *,
        type: Literal["STATIC", "DYNAMIC"] | None = None,
        topic_id: str | None = None,
        tracking_enabled: bool | None = None,
        segment_rules: dict[str, Any] | None = None,
    ) -> ContactList:
        """Create a contact list.

        Args:
            topic_id: Tag the list with a topic (suppression group); recipients
                who opt out of the topic also leave the list.
            tracking_enabled: Open/click tracking for campaigns to this list
        """
        payload = _compact(
            {
                "name": name,
                "description": description,
                "type": type,
                "suppressionGroupId": topic_id,
                "trackingEnabled": tracking_enabled,
                "segmentRules": segment_rules,
            }
        )
        result = await self._http.post("/api/v1/contacts/lists", json=payload)
        return ContactList(**result["data"])

    async def update_list(
        self,
        id: str,
        name: str | None = None,
        description: str | None = None,
        *,
        topic_id: Any = _UNSET,
        tracking_enabled: bool | None = None,
        is_archived: bool | None = None,
    ) -> ContactList:
        """Update a contact list (``topic_id=None`` removes the topic tag)"""
        payload = _compact(
            {
                "name": name,
                "description": description,
                "trackingEnabled": tracking_enabled,
                "isArchived": is_archived,
            }
        )
        if topic_id is not _UNSET:
            payload["suppressionGroupId"] = topic_id
        result = await self._http.patch(f"/api/v1/contacts/lists/{_seg(id)}", json=payload)
        return ContactList(**result["data"])

    async def delete_list(self, id: str) -> dict[str, Any]:
        """Archive a contact list"""
        return await self._http.delete(f"/api/v1/contacts/lists/{_seg(id)}")

    # ========== List Membership ==========

    async def list_members(
        self,
        id: str,
        *,
        page: int = 1,
        limit: int = 50,
        filter: Literal["all", "active", "suppressed"] = "all",
    ) -> ListMembersPage:
        """List members of a list (max 100 per page).

        ``filter="active"`` returns members who would receive mail;
        ``"suppressed"`` returns those blocked (see ``suppression_statuses``).
        """
        response = await self._read(
            f"/api/v1/contacts/lists/{_seg(id)}/members",
            {"page": page, "limit": limit, "filter": filter},
        )
        pagination = response.get("pagination") or {}
        return ListMembersPage.model_validate(
            {
                "data": response.get("data") or [],
                "counts": response.get("counts") or {},
                "page": pagination.get("page", page),
                "limit": pagination.get("limit", limit),
                "total": pagination.get("total", 0),
                "totalPages": pagination.get("totalPages", 0),
            }
        )

    async def get_list_members(
        self,
        id: str,
        *,
        page: int = 1,
        limit: int = 50,
        filter: Literal["all", "active", "suppressed"] = "all",
    ) -> ListMembersPage:
        """Alias of ``list_members`` (kept for 1.x compatibility)"""
        return await self.list_members(id, page=page, limit=limit, filter=filter)

    async def add_to_list(
        self,
        id: str,
        contact_ids: builtins.list[str] | None = None,
        *,
        emails: builtins.list[str] | None = None,
        create_missing: bool | None = None,
    ) -> AddListMembersResult:
        """Add members by contact id and/or email (up to 1000 of each).

        Unknown emails are reported in ``not_found`` unless ``create_missing``
        is true, which creates them as ACTIVE contacts. Suppressed or
        unsubscribed addresses are reported in ``blocked``, never re-added.
        Use ``client.subscriptions.subscribe`` when the person opted in
        themselves (consent evidence, double opt-in).
        """
        if not contact_ids and not emails:
            raise ValueError("Provide contact_ids or emails")
        payload = _compact(
            {"contactIds": contact_ids, "emails": emails, "createMissing": create_missing}
        )
        result = await self._http.post(f"/api/v1/contacts/lists/{_seg(id)}/members", json=payload)
        return AddListMembersResult(**result["data"])

    async def remove_from_list(
        self,
        id: str,
        contact_ids: builtins.list[str] | None = None,
        *,
        emails: builtins.list[str] | None = None,
    ) -> RemoveListMembersResult:
        """Remove members by contact id and/or email.

        This is the list owner removing someone (the membership is deleted),
        not an unsubscribe. Raises ``NotFoundError`` (NOT_A_MEMBER) when none
        of them were members.
        """
        if not contact_ids and not emails:
            raise ValueError("Provide contact_ids or emails")
        payload = _compact({"contactIds": contact_ids, "emails": emails})
        result = await self._http.delete(f"/api/v1/contacts/lists/{_seg(id)}/members", json=payload)
        return RemoveListMembersResult(**result["data"])
