"""Resource module"""
from __future__ import annotations

"""Domains resource - Domain verification and management"""

from typing import Any
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import Domain, CreateDomainRequest, PaginatedResponse


class DomainsResource:
    """Domain verification and management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """
        List all domains

        Returns:
            PaginatedResponse with domains

        Example:
            >>> domains = await client.domains.list()
            >>> for domain in domains.data:
            ...     print(f"{domain.domain}: verified={domain.verified}")
        """
        async def _list() -> dict[str, Any]:
            return await self._http.get("/api/v1/domains")

        response = await with_retry(_list)
        return PaginatedResponse(**response)

    async def get(self, id: str) -> Domain:
        """
        Get a domain by ID

        Args:
            id: Domain ID

        Returns:
            Domain details with DNS records

        Example:
            >>> domain = await client.domains.get("dom_abc123")
            >>> for record in domain.dns_records:
            ...     print(f"{record.type}: {record.value}")
        """
        async def _get() -> dict[str, Any]:
            result = await self._http.get(f"/api/v1/domains/{id}")
            return result["data"]

        response = await with_retry(_get)
        return Domain(**response)

    async def create(self, request: CreateDomainRequest) -> Domain:
        """
        Add a new domain

        Args:
            request: Domain creation request

        Returns:
            Created domain with DNS records to configure

        Example:
            >>> domain = await client.domains.create(
            ...     CreateDomainRequest(domain="example.com")
            ... )
            >>> print("Add these DNS records:")
            >>> for record in domain.dns_records:
            ...     print(f"{record.type} {record.host} {record.value}")
        """
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/domains", json=payload)
            return result["data"]

        response = await with_retry(_create)
        return Domain(**response)

    async def verify(self, id: str) -> dict[str, Any]:
        """
        Verify domain DNS records

        Args:
            id: Domain ID

        Returns:
            Verification result with record statuses

        Example:
            >>> result = await client.domains.verify("dom_abc123")
            >>> if result["data"]["verified"]:
            ...     print("Domain verified!")
            >>> else:
            ...     for name, status in result["data"]["records"].items():
            ...         print(f"{name}: {status['status']}")
        """
        async def _verify() -> dict[str, Any]:
            return await self._http.post(f"/api/v1/domains/{id}/verify")

        return await with_retry(_verify)

    async def delete(self, id: str) -> dict[str, Any]:
        """
        Delete a domain

        Args:
            id: Domain ID

        Returns:
            Deletion confirmation

        Example:
            >>> await client.domains.delete("dom_abc123")
        """
        async def _delete() -> dict[str, Any]:
            return await self._http.delete(f"/api/v1/domains/{id}")

        return await with_retry(_delete)
