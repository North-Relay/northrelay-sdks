"""Resource module"""
from __future__ import annotations

"""Analytics, Metrics, Suppressions, and other infrastructure resources"""

from typing import Any, Optional
from urllib.parse import quote
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import PaginatedResponse


class AnalyticsResource:
    """Advanced analytics and reporting"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def query(
        self,
        *,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        group_by: Optional[str] = None,
        metrics: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """Query analytics data"""
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        if group_by:
            params["groupBy"] = group_by
        if metrics:
            params["metrics"] = ",".join(metrics)

        return await with_retry(
            lambda: self._http.get("/api/v1/analytics/query", params=params)
        )

    async def get_engagement_heatmap(
        self, *, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> dict[str, Any]:
        """Get engagement heatmap (opens/clicks by hour and day)"""
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date

        return await with_retry(
            lambda: self._http.get("/api/v1/analytics/engagement-heatmap", params=params)
        )

    async def get_geographic(
        self, *, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> dict[str, Any]:
        """Get geographic analytics"""
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date

        return await with_retry(
            lambda: self._http.get("/api/v1/analytics/geographic", params=params)
        )

    async def get_providers(
        self, *, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> dict[str, Any]:
        """Get provider statistics"""
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date

        return await with_retry(
            lambda: self._http.get("/api/v1/analytics/providers", params=params)
        )

    async def request_export(
        self, start_date: str, end_date: str, format: str = "csv"
    ) -> dict[str, Any]:
        """Request analytics export"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/analytics/export",
                json={"startDate": start_date, "endDate": end_date, "format": format},
            )
        )

    async def get_export(self, export_id: str) -> dict[str, Any]:
        """Get export status and download URL"""
        return await with_retry(
            lambda: self._http.get(f"/api/v1/analytics/export/{export_id}")
        )


class MetricsResource:
    """Delivery metrics"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def get(
        self,
        *,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        pool_type: Optional[str] = None,
    ) -> dict[str, Any]:
        """Get delivery metrics"""
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        if pool_type:
            params["poolType"] = pool_type

        return await with_retry(
            lambda: self._http.get("/api/v1/metrics", params=params)
        )

    async def get_summary(self, period: str = "today") -> dict[str, Any]:
        """Get metrics summary"""
        return await with_retry(
            lambda: self._http.get("/api/v1/metrics/summary", params={"period": period})
        )


class SuppressionsResource:
    """Suppression list management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(
        self, *, page: int = 1, limit: int = 20, search: Optional[str] = None
    ) -> PaginatedResponse:
        """List suppressions"""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search

        response = await with_retry(
            lambda: self._http.get("/api/v1/suppressions", params=params)
        )
        return PaginatedResponse(**response)

    async def add(self, email: str, reason: str = "Manual") -> dict[str, Any]:
        """Add email to suppression list. reason: Bounce, Complaint, Unsubscribe or Manual."""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/suppressions", json={"email": email, "reason": reason}
            )
        )

    async def remove(self, email: str) -> dict[str, Any]:
        """Remove email from suppression list"""
        return await with_retry(
            lambda: self._http.delete("/api/v1/suppressions/" + quote(email, safe=""))
        )

    async def check(self, email: str) -> dict[str, Any]:
        """Check if email is suppressed"""
        return await with_retry(
            lambda: self._http.get("/api/v1/suppressions/" + quote(email, safe=""))
        )


class SuppressionGroupsResource:
    """Topics (suppression groups).

    A member of a topic is an address that OPTED OUT of that topic. Tag a
    contact list with a topic (``contacts.create_list(..., topic_id=...)``) so
    that opting out of the topic also leaves the list. To let a subscriber
    rejoin a topic, use ``client.subscriptions.update_preferences``.
    Also available as ``client.topics``.
    """

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    @staticmethod
    def _path(id: str, suffix: str = "") -> str:
        return "/api/v1/suppression-groups/" + quote(id, safe="") + suffix

    async def list(
        self, *, page: int = 1, limit: int = 25, published: Optional[bool] = None
    ) -> PaginatedResponse:
        """List topics (``published=True``: only those shown on the unsubscribe page)"""
        params: dict[str, Any] = {"page": page, "limit": limit}
        if published:
            params["published"] = "true"
        response = await with_retry(
            lambda: self._http.get("/api/v1/suppression-groups", params=params)
        )
        return PaginatedResponse.from_api_response(response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get a topic (``data._count.members`` is the opt-out count)"""
        return await with_retry(lambda: self._http.get(self._path(id)))

    async def create(
        self,
        name: str,
        description: Optional[str] = None,
        *,
        is_default: Optional[bool] = None,
    ) -> dict[str, Any]:
        """Create a topic"""
        payload: dict[str, Any] = {"name": name}
        if description is not None:
            payload["description"] = description
        if is_default is not None:
            payload["isDefault"] = is_default
        return await self._http.post("/api/v1/suppression-groups", json=payload)

    async def update(
        self,
        id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        *,
        is_default: Optional[bool] = None,
        public_label: Optional[str] = None,
        public_description: Optional[str] = None,
        is_published_on_unsub: Optional[bool] = None,
        sort_order: Optional[int] = None,
    ) -> dict[str, Any]:
        """Update a topic.

        ``public_label`` / ``public_description`` are what recipients see on
        the unsubscribe and preference pages; ``is_published_on_unsub`` shows
        the topic there.
        """
        payload = {
            k: v
            for k, v in {
                "name": name,
                "description": description,
                "isDefault": is_default,
                "publicLabel": public_label,
                "publicDescription": public_description,
                "isPublishedOnUnsub": is_published_on_unsub,
                "sortOrder": sort_order,
            }.items()
            if v is not None
        }
        return await self._http.patch(self._path(id), json=payload)

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete a topic"""
        return await self._http.delete(self._path(id))

    # ----- Opt-outs (members) -----

    async def list_members(self, id: str, *, page: int = 1, limit: int = 25) -> PaginatedResponse:
        """List addresses that opted out of the topic (``{email, createdAt}`` items)"""
        params = {"page": page, "limit": limit}
        response = await with_retry(
            lambda: self._http.get(self._path(id, "/members"), params=params)
        )
        return PaginatedResponse.from_api_response(response)

    async def add_member(self, id: str, email: str) -> dict[str, Any]:
        """Opt an address out of the topic (does not fire contact.unsubscribed;
        use ``subscriptions.unsubscribe(scope="topic")`` for a recipient's own opt-out)"""
        return await self._http.post(self._path(id, "/members"), json={"email": email})

    async def remove_member(self, id: str, email: str) -> dict[str, Any]:
        """Remove an address's opt-out from the topic"""
        return await self._http.delete(self._path(id, "/members/" + quote(email, safe="")))


class SubusersResource:
    """Subuser management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List subusers"""
        response = await with_retry(lambda: self._http.get("/api/v1/subusers"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get a subuser"""
        return await with_retry(lambda: self._http.get(f"/api/v1/subusers/{id}"))

    async def create(
        self, email: str, username: str, permissions: list[str]
    ) -> dict[str, Any]:
        """Create subuser"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/subusers",
                json={"email": email, "username": username, "permissions": permissions},
            )
        )

    async def update(
        self, id: str, permissions: Optional[list[str]] = None, active: Optional[bool] = None
    ) -> dict[str, Any]:
        """Update subuser"""
        payload = {}
        if permissions:
            payload["permissions"] = permissions
        if active is not None:
            payload["active"] = active

        return await with_retry(
            lambda: self._http.patch(f"/api/v1/subusers/{id}", json=payload)
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete subuser"""
        return await with_retry(lambda: self._http.delete(f"/api/v1/subusers/{id}"))

    async def get_usage(self, id: str) -> dict[str, Any]:
        """Get subuser usage"""
        return await with_retry(lambda: self._http.get(f"/api/v1/subusers/{id}/usage"))


class IpPoolsResource:
    """IP pool management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List IP pools"""
        response = await with_retry(lambda: self._http.get("/api/v1/ip-pools"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get an IP pool"""
        return await with_retry(lambda: self._http.get(f"/api/v1/ip-pools/{id}"))

    async def create(self, name: str, pool_type: str) -> dict[str, Any]:
        """Create IP pool"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/ip-pools", json={"name": name, "poolType": pool_type}
            )
        )

    async def update(self, id: str, name: Optional[str] = None) -> dict[str, Any]:
        """Update IP pool"""
        return await with_retry(
            lambda: self._http.patch(f"/api/v1/ip-pools/{id}", json={"name": name})
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete IP pool"""
        return await with_retry(lambda: self._http.delete(f"/api/v1/ip-pools/{id}"))


class IpsResource:
    """Dedicated IP management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List dedicated IPs"""
        response = await with_retry(lambda: self._http.get("/api/v1/ips"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get a dedicated IP"""
        return await with_retry(lambda: self._http.get(f"/api/v1/ips/{id}"))

    async def request(self, pool_id: str, warmup: bool = True) -> dict[str, Any]:
        """Request a new dedicated IP"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/ips", json={"poolId": pool_id, "warmup": warmup}
            )
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Release a dedicated IP"""
        return await with_retry(lambda: self._http.delete(f"/api/v1/ips/{id}"))

    async def get_warmup_status(self, id: str) -> dict[str, Any]:
        """Get IP warmup status"""
        return await with_retry(lambda: self._http.get(f"/api/v1/ips/{id}/warmup"))


class IdentityResource:
    """Identity and recipient preference management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List identities"""
        response = await with_retry(lambda: self._http.get("/api/v1/identity"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get an identity"""
        return await with_retry(lambda: self._http.get(f"/api/v1/identity/{id}"))

    async def create(self, email: str, name: Optional[str] = None) -> dict[str, Any]:
        """Create identity"""
        return await with_retry(
            lambda: self._http.post("/api/v1/identity", json={"email": email, "name": name})
        )

    async def update(self, id: str, name: Optional[str] = None) -> dict[str, Any]:
        """Update identity"""
        return await with_retry(
            lambda: self._http.patch(f"/api/v1/identity/{id}", json={"name": name})
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete identity"""
        return await with_retry(lambda: self._http.delete(f"/api/v1/identity/{id}"))


class InboundResource:
    """Inbound email domain management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List inbound domains"""
        response = await with_retry(lambda: self._http.get("/api/v1/inbound"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get an inbound domain"""
        return await with_retry(lambda: self._http.get(f"/api/v1/inbound/{id}"))

    async def create(self, domain: str, forward_to: Optional[str] = None) -> dict[str, Any]:
        """Create inbound domain"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/inbound", json={"domain": domain, "forwardTo": forward_to}
            )
        )

    async def update(self, id: str, forward_to: Optional[str] = None) -> dict[str, Any]:
        """Update inbound domain"""
        return await with_retry(
            lambda: self._http.patch(f"/api/v1/inbound/{id}", json={"forwardTo": forward_to})
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete inbound domain"""
        return await with_retry(lambda: self._http.delete(f"/api/v1/inbound/{id}"))


class AdminResource:
    """Admin utilities"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def provision_mailbox(self, email: str, password: str) -> dict[str, Any]:
        """Provision JMAP mailbox"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/admin/provision-mailbox",
                json={"email": email, "password": password},
            )
        )

    async def get_pool_fallback_metrics(self) -> dict[str, Any]:
        """Get pool fallback metrics"""
        return await with_retry(
            lambda: self._http.get("/api/v1/admin/pool-fallback-metrics")
        )


class KeysResource:
    """DKIM keys management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> dict[str, Any]:
        """List DKIM keys"""
        return await with_retry(lambda: self._http.get("/api/v1/keys"))

    async def rotate(self, domain_id: str) -> dict[str, Any]:
        """Rotate DKIM key for domain"""
        return await with_retry(
            lambda: self._http.post(f"/api/v1/keys/rotate/{domain_id}")
        )
