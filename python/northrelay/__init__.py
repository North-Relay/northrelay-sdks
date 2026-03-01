"""
NorthRelay SDK - Official Python client for NorthRelay Platform API

Example usage:
    >>> from northrelay import NorthRelay
    >>> client = NorthRelay(api_key="nr_live_...")
    >>> await client.emails.send(
    ...     from_={"email": "noreply@example.com", "name": "Example"},
    ...     to=[{"email": "user@example.com"}],
    ...     content={"subject": "Welcome", "html": "<h1>Welcome!</h1>"}
    ... )
"""

from northrelay.client import NorthRelay
from northrelay.exceptions import (
    NorthRelayError,
    AuthenticationError,
    ScopeError,
    ValidationError,
    QuotaExceededError,
    RateLimitError,
    NotFoundError,
    ServerError,
    NetworkError,
)
from northrelay.types import (
    # Email types
    EmailAddress,
    EmailContent,
    SendEmailRequest,
    SendEmailResponse,
    # Template types
    Template,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    # Domain types
    Domain,
    CreateDomainRequest,
    # Webhook types
    Webhook,
    CreateWebhookRequest,
    UpdateWebhookRequest,
    # Campaign types
    Campaign,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    # Contact types
    Contact,
    CreateContactRequest,
    ContactList,
    # Theme types
    BrandTheme,
    CreateBrandThemeRequest,
    # Common types
    PaginatedResponse,
    RateLimitInfo,
)

__version__ = "1.1.0"
__all__ = [
    "NorthRelay",
    # Exceptions
    "NorthRelayError",
    "AuthenticationError",
    "ScopeError",
    "ValidationError",
    "QuotaExceededError",
    "RateLimitError",
    "NotFoundError",
    "ServerError",
    "NetworkError",
    # Types
    "EmailAddress",
    "EmailContent",
    "SendEmailRequest",
    "SendEmailResponse",
    "Template",
    "CreateTemplateRequest",
    "UpdateTemplateRequest",
    "Domain",
    "CreateDomainRequest",
    "Webhook",
    "CreateWebhookRequest",
    "UpdateWebhookRequest",
    "Campaign",
    "CreateCampaignRequest",
    "UpdateCampaignRequest",
    "Contact",
    "CreateContactRequest",
    "ContactList",
    "BrandTheme",
    "CreateBrandThemeRequest",
    "PaginatedResponse",
    "RateLimitInfo",
]
