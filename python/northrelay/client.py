"""Main NorthRelay SDK client"""

from typing import Optional

from northrelay.utils.http import HttpClient
from northrelay.utils.retry import RetryConfig, DEFAULT_RETRY_CONFIG
from northrelay.resources.emails import EmailsResource
from northrelay.resources.templates import TemplatesResource
from northrelay.resources.domains import DomainsResource
from northrelay.resources.webhooks import WebhooksResource
from northrelay.resources.campaigns import CampaignsResource
from northrelay.resources.contacts import ContactsResource
from northrelay.resources.brand_theme import BrandThemeResource
from northrelay.resources.api_keys import ApiKeysResource
from northrelay.resources.events import EventsResource
from northrelay.resources.infrastructure import (
    AnalyticsResource,
    MetricsResource,
    SuppressionsResource,
    SuppressionGroupsResource,
    SubusersResource,
    IpPoolsResource,
    IpsResource,
    IdentityResource,
    InboundResource,
    AdminResource,
    KeysResource,
)
from northrelay.types import RateLimitInfo


class NorthRelay:
    """
    Official Python client for NorthRelay Platform API

    Args:
        api_key: NorthRelay API key (starts with nr_live_ or nr_test_)
        base_url: API base URL (default: https://app.northrelay.ca)
        timeout: Request timeout in seconds (default: 30.0)
        max_retries: Maximum retry attempts (default: 3)
        retry_delay: Initial retry delay in seconds (default: 1.0)
        max_retry_delay: Maximum retry delay in seconds (default: 10.0)

    Example:
        >>> from northrelay import NorthRelay
        >>> client = NorthRelay(api_key="nr_live_...")
        >>> 
        >>> # Send an email
        >>> response = await client.emails.send(
        ...     from_={"email": "noreply@example.com"},
        ...     to=[{"email": "user@example.com"}],
        ...     content={"subject": "Hello", "html": "<p>Hello!</p>"}
        ... )
        >>> print(response.message_id)
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = "https://app.northrelay.ca",
        timeout: float = 30.0,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        max_retry_delay: float = 10.0,
    ):
        # Validate API key format
        if not api_key:
            raise ValueError(
                "API key is required. Get your API key at "
                "https://app.northrelay.ca/settings/api-keys"
            )

        if not api_key.startswith(("nr_live_", "nr_test_")):
            raise ValueError(
                'Invalid API key format. API keys must start with "nr_live_" or "nr_test_"'
            )

        # Initialize HTTP client
        self._http = HttpClient(
            base_url=base_url,
            api_key=api_key,
            timeout=timeout,
        )

        # Retry configuration
        self._retry_config = RetryConfig(
            max_attempts=max_retries,
            initial_delay=retry_delay,
            max_delay=max_retry_delay,
            exponential_base=2.0,
        )

        # Initialize resources
        self.emails = EmailsResource(self._http, self._retry_config)
        self.templates = TemplatesResource(self._http, self._retry_config)
        self.domains = DomainsResource(self._http, self._retry_config)
        self.webhooks = WebhooksResource(self._http, self._retry_config)
        self.campaigns = CampaignsResource(self._http, self._retry_config)
        self.contacts = ContactsResource(self._http, self._retry_config)
        self.brand_theme = BrandThemeResource(self._http, self._retry_config)
        self.api_keys = ApiKeysResource(self._http, self._retry_config)
        self.events = EventsResource(self._http, self._retry_config)
        
        # Analytics & Metrics
        self.analytics = AnalyticsResource(self._http, self._retry_config)
        self.metrics = MetricsResource(self._http, self._retry_config)
        
        # Suppression management
        self.suppressions = SuppressionsResource(self._http, self._retry_config)
        self.suppression_groups = SuppressionGroupsResource(self._http, self._retry_config)
        
        # User management
        self.subusers = SubusersResource(self._http, self._retry_config)
        self.identity = IdentityResource(self._http, self._retry_config)
        
        # Infrastructure
        self.ip_pools = IpPoolsResource(self._http, self._retry_config)
        self.ips = IpsResource(self._http, self._retry_config)
        self.inbound = InboundResource(self._http, self._retry_config)
        
        # Admin & utilities
        self.admin = AdminResource(self._http, self._retry_config)
        self.keys = KeysResource(self._http, self._retry_config)

    def get_rate_limit_info(self) -> Optional[RateLimitInfo]:
        """
        Get current rate limit information from the last API response

        Returns:
            RateLimitInfo with limit, remaining, reset timestamp, or None

        Example:
            >>> await client.emails.send(...)
            >>> rate_limit = client.get_rate_limit_info()
            >>> if rate_limit:
            ...     print(f"Remaining: {rate_limit.remaining}/{rate_limit.limit}")
        """
        return self._http.get_rate_limit_info()

    async def close(self) -> None:
        """Close HTTP client connection"""
        await self._http.close()

    async def __aenter__(self) -> "NorthRelay":
        """Async context manager entry"""
        return self

    async def __aexit__(self, *args) -> None:
        """Async context manager exit"""
        await self.close()
