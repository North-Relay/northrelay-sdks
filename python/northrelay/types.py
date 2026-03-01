"""Type definitions for NorthRelay SDK using Pydantic"""

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, TypedDict

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ===== Enums =====


class PoolType(str, Enum):
    SHARED = "Shared"
    ISOLATED = "Isolated"
    DEDICATED = "Dedicated"


class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"
    ENTERPRISE = "enterprise"


class EmailStatus(str, Enum):
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"
    DEFERRED = "deferred"


class EventType(str, Enum):
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    COMPLAINED = "complained"
    UNSUBSCRIBED = "unsubscribed"
    FAILED = "failed"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"


# ===== Email Types =====


class EmailAddress(BaseModel):
    """Email address with optional name"""

    email: EmailStr
    name: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class EmailContent(BaseModel):
    """Email content (subject + body)"""

    subject: str
    html: Optional[str] = None
    text: Optional[str] = None
    template_id: Optional[str] = Field(None, alias="templateId")

    model_config = ConfigDict(populate_by_name=True)


class SendEmailRequest(BaseModel):
    """Request to send a transactional email"""

    from_: EmailAddress = Field(..., alias="from")
    to: list[EmailAddress]
    cc: Optional[list[EmailAddress]] = None
    bcc: Optional[list[EmailAddress]] = None
    reply_to: Optional[EmailAddress] = Field(None, alias="replyTo")
    content: EmailContent
    variables: Optional[dict[str, Any]] = None
    theme_id: Optional[str] = Field(None, alias="themeId")
    tags: Optional[dict[str, str]] = None
    headers: Optional[dict[str, str]] = None
    attachments: Optional[list[dict[str, Any]]] = None
    scheduled_for: Optional[datetime] = Field(None, alias="scheduledFor")

    model_config = ConfigDict(populate_by_name=True)


class QuotaInfo(BaseModel):
    """Email quota information"""

    limit: int
    used: int
    remaining: int
    period: str  # "daily" | "monthly"


class SendEmailResponse(BaseModel):
    """Response from sending an email"""

    success: bool
    message_id: str = Field(..., alias="messageId")
    quota: Optional[QuotaInfo] = None

    model_config = ConfigDict(populate_by_name=True)


# ===== Template Types =====


class Template(BaseModel):
    """Email template"""

    id: str
    name: str
    subject: str
    html: Optional[str] = None
    mjml: Optional[str] = None
    text: Optional[str] = None
    variables: dict[str, Any]
    extracted_variables: list[str] = Field(default_factory=list, alias="extractedVariables")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateTemplateRequest(BaseModel):
    """Request to create a template"""

    name: str
    subject: str
    html: Optional[str] = None
    mjml: Optional[str] = None
    text: Optional[str] = None
    variables: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


class UpdateTemplateRequest(BaseModel):
    """Request to update a template"""

    name: Optional[str] = None
    subject: Optional[str] = None
    html: Optional[str] = None
    mjml: Optional[str] = None
    text: Optional[str] = None
    variables: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


# ===== Domain Types =====


class DnsRecord(BaseModel):
    """DNS record for domain verification"""

    type: str  # "TXT" | "MX" | "CNAME"
    host: str
    value: str
    priority: Optional[int] = None
    verified: bool


class Domain(BaseModel):
    """Email sending domain"""

    id: str
    domain: str
    verified: bool
    dkim_verified: bool = Field(..., alias="dkimVerified")
    spf_verified: bool = Field(..., alias="spfVerified")
    dmarc_verified: bool = Field(..., alias="dmarcVerified")
    dns_records: list[DnsRecord] = Field(..., alias="dnsRecords")
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateDomainRequest(BaseModel):
    """Request to add a domain"""

    domain: str

    model_config = ConfigDict(populate_by_name=True)


# ===== Webhook Types =====


class Webhook(BaseModel):
    """Webhook configuration"""

    id: str
    url: str
    events: list[EventType]
    active: bool
    secret: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateWebhookRequest(BaseModel):
    """Request to create a webhook"""

    url: str
    events: list[EventType]
    active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class UpdateWebhookRequest(BaseModel):
    """Request to update a webhook"""

    url: Optional[str] = None
    events: Optional[list[EventType]] = None
    active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)


# ===== Campaign Types =====


class Campaign(BaseModel):
    """Email campaign"""

    id: str
    name: str
    status: CampaignStatus
    template_id: Optional[str] = Field(None, alias="templateId")
    scheduled_for: Optional[datetime] = Field(None, alias="scheduledFor")
    sent_at: Optional[datetime] = Field(None, alias="sentAt")
    recipient_count: int = Field(..., alias="recipientCount")
    delivered_count: int = Field(0, alias="deliveredCount")
    opened_count: int = Field(0, alias="openedCount")
    clicked_count: int = Field(0, alias="clickedCount")
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateCampaignRequest(BaseModel):
    """Request to create a campaign"""

    name: str
    template_id: str = Field(..., alias="templateId")
    contact_list_id: str = Field(..., alias="contactListId")
    scheduled_for: Optional[datetime] = Field(None, alias="scheduledFor")

    model_config = ConfigDict(populate_by_name=True)


class UpdateCampaignRequest(BaseModel):
    """Request to update a campaign"""

    name: Optional[str] = None
    scheduled_for: Optional[datetime] = Field(None, alias="scheduledFor")
    status: Optional[CampaignStatus] = None

    model_config = ConfigDict(populate_by_name=True)


# ===== Contact Types =====


class Contact(BaseModel):
    """Contact / recipient"""

    id: str
    email: EmailStr
    name: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    subscribed: bool = True
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateContactRequest(BaseModel):
    """Request to create a contact"""

    email: EmailStr
    name: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    subscribed: bool = True

    model_config = ConfigDict(populate_by_name=True)


class ContactList(BaseModel):
    """Contact list"""

    id: str
    name: str
    contact_count: int = Field(..., alias="contactCount")
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


# ===== Brand Theme Types =====


class BrandTheme(BaseModel):
    """Brand theme for email styling"""

    id: str
    name: str
    colors: dict[str, str]
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    font_family: Optional[str] = Field(None, alias="fontFamily")
    created_at: datetime = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateBrandThemeRequest(BaseModel):
    """Request to create a brand theme"""

    name: str
    colors: dict[str, str]
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    font_family: Optional[str] = Field(None, alias="fontFamily")

    model_config = ConfigDict(populate_by_name=True)


# ===== Common Types =====


class PaginatedResponse(BaseModel):
    """Paginated API response"""

    data: list[Any]
    total: int
    page: int
    limit: int
    has_more: bool = Field(..., alias="hasMore")

    model_config = ConfigDict(populate_by_name=True)


class RateLimitInfo(BaseModel):
    """Rate limit information from response headers"""

    limit: Optional[int] = None
    remaining: Optional[int] = None
    reset: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class ErrorResponse(BaseModel):
    """API error response"""

    error: str
    message: str
    details: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)
