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
    UpdateContactRequest,
    ContactList,
    ContactTag,
    ContactCustomField,
    BulkCreateContactsResult,
    BulkDeleteContactsResult,
    CsvColumnMapping,
    ImportContactsResult,
    ListMember,
    ListMembersPage,
    AddListMembersResult,
    RemoveListMembersResult,
    BlockedAddress,
    # Subscription types
    Consent,
    SubscribeRequest,
    SubscribeResult,
    UnsubscribeResult,
    SubscriptionStatus,
    SubscriptionContact,
    ListSubscription,
    TopicSubscription,
    ResendConfirmationResult,
    # Webhook payloads
    WebhookEventType,
    WEBHOOK_EVENT_TYPES,
    WebhookPayload,
    # Theme types
    SocialLink,
    BrandTheme,
    CreateBrandThemeRequest,
    UpdateBrandThemeRequest,
    # Event types
    EmailEvent,
    # Enum types
    PoolType,
    PlanTier,
    EmailStatus,
    EmailSource,
    EventType,
    CampaignStatus,
    ButtonStyle,
    # Common types
    PaginatedResponse,
    RateLimitInfo,
)

from northrelay.resources.designs import ACCOUNT_APPLICATION

__version__ = "1.10.0"
__all__ = [
    "ACCOUNT_APPLICATION",
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
    "UpdateContactRequest",
    "ContactTag",
    "ContactCustomField",
    "BulkCreateContactsResult",
    "BulkDeleteContactsResult",
    "CsvColumnMapping",
    "ImportContactsResult",
    "ListMember",
    "ListMembersPage",
    "AddListMembersResult",
    "RemoveListMembersResult",
    "BlockedAddress",
    "Consent",
    "SubscribeRequest",
    "SubscribeResult",
    "UnsubscribeResult",
    "SubscriptionStatus",
    "SubscriptionContact",
    "ListSubscription",
    "TopicSubscription",
    "ResendConfirmationResult",
    "WebhookEventType",
    "WEBHOOK_EVENT_TYPES",
    "WebhookPayload",
    "SocialLink",
    "BrandTheme",
    "CreateBrandThemeRequest",
    "UpdateBrandThemeRequest",
    "EmailEvent",
    "PoolType",
    "PlanTier",
    "EmailStatus",
    "EmailSource",
    "EventType",
    "CampaignStatus",
    "ButtonStyle",
    "PaginatedResponse",
    "RateLimitInfo",
]
