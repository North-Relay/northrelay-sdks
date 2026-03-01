"""Resource module"""
from __future__ import annotations

"""Analytics, Metrics, Suppressions, and other infrastructure resources"""

from typing import Any, Optional
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

    async def add(self, email: str, reason: Optional[str] = None) -> dict[str, Any]:
        """Add email to suppression list"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/suppressions", json={"email": email, "reason": reason}
            )
        )

    async def remove(self, email: str) -> dict[str, Any]:
        """Remove email from suppression list"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/suppressions/{email}")
        )

    async def check(self, email: str) -> dict[str, Any]:
        """Check if email is suppressed"""
        return await with_retry(
            lambda: self._http.get(f"/api/v1/suppressions/{email}")
        )


class SuppressionGroupsResource:
    """Suppression group management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self) -> PaginatedResponse:
        """List suppression groups"""
        response = await with_retry(lambda: self._http.get("/api/v1/suppression-groups"))
        return PaginatedResponse(**response)

    async def get(self, id: str) -> dict[str, Any]:
        """Get a suppression group"""
        return await with_retry(
            lambda: self._http.get(f"/api/v1/suppression-groups/{id}")
        )

    async def create(self, name: str, description: Optional[str] = None) -> dict[str, Any]:
        """Create suppression group"""
        return await with_retry(
            lambda: self._http.post(
                "/api/v1/suppression-groups",
                json={"name": name, "description": description},
            )
        )

    async def update(
        self, id: str, name: Optional[str] = None, description: Optional[str] = None
    ) -> dict[str, Any]:
        """Update suppression group"""
        payload = {}
        if name:
            payload["name"] = name
        if description is not None:
            payload["description"] = description

        return await with_retry(
            lambda: self._http.patch(f"/api/v1/suppression-groups/{id}", json=payload)
        )

    async def delete(self, id: str) -> dict[str, Any]:
        """Delete suppression group"""
        return await with_retry(
            lambda: self._http.delete(f"/api/v1/suppression-groups/{id}")
        )


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
