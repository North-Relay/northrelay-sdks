"""Resource module"""
from __future__ import annotations

"""Contacts resource - Contact and contact list management"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import (
    Contact,
    CreateContactRequest,
    ContactList,
    PaginatedResponse,
)


class ContactsResource:
    """Contact and contact list management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    # ========== Contacts ==========

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        list_id: Optional[str] = None,
        tags: Optional[str] = None,
    ) -> PaginatedResponse:
        """List contacts"""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if list_id:
            params["listId"] = list_id
        if tags:
            params["tags"] = tags

        response = await with_retry(
            lambda: self._http.get("/api/v1/contacts", params=params)
        )
        return PaginatedResponse(**response)

    async def create(self, request: CreateContactRequest) -> Contact:
        """Create a new contact"""
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/contacts", json=payload)
            return result["data"]

        response = await with_retry(_create)
        return Contact(**response)

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a contact"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/contacts/{id}")
        )

    async def bulk_delete(self, ids: list[str]) -> dict[str, Any]:
        """Bulk delete contacts"""
        return await with_retry(
            lambda: self._http.post("/api/v1/contacts", json={"ids": ids})
        )

    async def bulk_upsert(self, contacts: list[CreateContactRequest]) -> dict[str, Any]:
        """Bulk create/update contacts"""
        payload = {
            "contacts": [c.model_dump(by_alias=True, exclude_none=True) for c in contacts]
        }
        return await with_retry(
            lambda: self._http.post("/api/v1/contacts/bulk", json=payload)
        )

    async def import_csv(
        self, file_path: str, list_id: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Import contacts from CSV
        
        Args:
            file_path: Path to CSV file
            list_id: Optional list ID to add contacts to
        """
        # Note: Python SDK uses file path, not File object like TS
        with open(file_path, "rb") as f:
            files = {"file": f}
            data = {"listId": list_id} if list_id else {}
            
            return await with_retry(
                lambda: self._http.post(
                    "/api/v1/contacts/import",
                    data=data,
                    files=files,
                )
            )

    async def remove_tags(self, id: str) -> dict[str, Any]:
        """Remove all tags from a contact"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/contacts/{id}/tags")
        )

    async def remove_tag(self, id: str, tag: str) -> dict[str, Any]:
        """Remove a specific tag from a contact"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/contacts/{id}/tags/{tag}")
        )

    # ========== Contact Lists ==========

    async def list_lists(
        self, *, page: int = 1, limit: int = 20
    ) -> PaginatedResponse:
        """List contact lists"""
        params = {"page": page, "limit": limit}
        response = await with_retry(
            lambda: self._http.get("/api/v1/contacts/lists", params=params)
        )
        return PaginatedResponse(**response)

    async def get_list(self, id: str) -> ContactList:
        """Get a contact list"""
        async def _get() -> dict[str, Any]:
            result = await self._http.get(f"/api/v1/contacts/lists/{id}")
            return result["data"]

        response = await with_retry(_get)
        return ContactList(**response)

    async def create_list(self, name: str, description: Optional[str] = None) -> ContactList:
        """Create a contact list"""
        async def _create() -> dict[str, Any]:
            result = await self._http.post(
                "/api/v1/contacts/lists",
                json={"name": name, "description": description},
            )
            return result["data"]

        response = await with_retry(_create)
        return ContactList(**response)

    async def update_list(
        self, id: str, name: Optional[str] = None, description: Optional[str] = None
    ) -> ContactList:
        """Update a contact list"""
        async def _update() -> dict[str, Any]:
            payload = {}
            if name:
                payload["name"] = name
            if description is not None:
                payload["description"] = description
            
            result = await self._http.post(
                f"/api/v1/contacts/lists/{id}",
                json=payload,
            )
            return result["data"]

        response = await with_retry(_update)
        return ContactList(**response)

    async def delete_list(self, id: str) -> dict[str, Any]:
        """Delete a contact list"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/contacts/lists/{id}")
        )

    # ========== List Membership ==========

    async def get_list_members(
        self, id: str, *, page: int = 1, limit: int = 20
    ) -> PaginatedResponse:
        """Get list members"""
        params = {"page": page, "limit": limit}
        response = await with_retry(
            lambda: self._http.get(f"/api/v1/contacts/lists/{id}/members", params=params)
        )
        return PaginatedResponse(**response)

    async def add_to_list(self, id: str, contact_ids: list[str]) -> dict[str, Any]:
        """Add contacts to a list"""
        return await with_retry(
            lambda: self._http.post(
                f"/api/v1/contacts/lists/{id}/members",
                json={"contactIds": contact_ids},
            )
        )

    async def remove_from_list(self, id: str, contact_ids: list[str]) -> dict[str, Any]:
        """Remove contacts from a list"""
        return await with_retry(
            lambda: self._http.delete(
                f"/api/v1/contacts/lists/{id}/members",
                json={"contactIds": contact_ids},
            )
        )
