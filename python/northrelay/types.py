"""Type definitions for NorthRelay SDK using Pydantic"""

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, TypedDict, Union

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


# ===== Enums =====


class PoolType(str, Enum):
    SHARED = "Shared"
    ISOLATED = "Isolated"
    DEDICATED = "Dedicated"


class PlanTier(str, Enum):
    SANDBOX = "Sandbox"
    MICRO = "Micro"
    STARTUP = "Startup"
    SCALE = "Scale"
    ENTERPRISE = "Enterprise"


class EmailStatus(str, Enum):
    QUEUED = "Queued"
    PROCESSING = "Processing"
    SENT = "Sent"
    DELIVERED = "Delivered"
    BOUNCED = "Bounced"
    FAILED = "Failed"
    DEFERRED = "Deferred"


class EventType(str, Enum):
    QUEUED = "Queued"
    PROCESSING = "Processing"
    SENT = "Sent"
    DELIVERED = "Delivered"
    BOUNCED = "Bounced"
    OPENED = "Opened"
    CLICKED = "Clicked"
    COMPLAINED = "Complained"
    UNSUBSCRIBED = "Unsubscribed"
    DROPPED = "Dropped"


class EmailSource(str, Enum):
    API = "API"
    INBOX = "INBOX"
    SMTP = "SMTP"
    INBOUND = "INBOUND"
    SCHEDULED = "SCHEDULED"
    TEST = "TEST"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"


class ButtonStyle(str, Enum):
    FILLED = "filled"
    OUTLINE = "outline"
    GHOST = "ghost"


class WebhookEventType(str, Enum):
    """Event names a webhook can subscribe to (``WEBHOOK_EVENT_TYPES`` on the server)."""

    CONTACT_SUBSCRIBED = "contact.subscribed"
    CONTACT_CONFIRMED = "contact.confirmed"
    CONTACT_UNSUBSCRIBED = "contact.unsubscribed"
    LIST_MEMBER_ADDED = "list.member_added"
    LIST_MEMBER_REMOVED = "list.member_removed"
    EMAIL_OPENED = "email.opened"
    EMAIL_CLICKED = "email.clicked"
    EMAIL_DELIVERED = "email.delivered"
    EMAIL_BOUNCED = "email.bounced"
    EMAIL_DEFERRED = "email.deferred"
    EMAIL_DROPPED = "email.dropped"
    EMAIL_RECEIVED = "email.received"
    EMAIL_QUEUED = "email.queued"
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILED = "auth.failed"


#: Every event name accepted by ``POST /api/v1/webhooks``.
WEBHOOK_EVENT_TYPES: tuple[str, ...] = tuple(e.value for e in WebhookEventType)


# ===== Email Types =====


class EmailAddress(BaseModel):
    """Email address with optional name"""

    email: EmailStr
    name: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class EmailContent(BaseModel):
    """Email content (subject + body)"""

    subject: Optional[str] = None
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
    period: Optional[str] = None  # "daily" | "monthly"


class PoolInfo(BaseModel):
    """Pool routing information"""

    type: str  # "Shared" | "Isolated"
    gateway: Optional[str] = None


class SendEmailResponse(BaseModel):
    """Response from sending an email (unwrapped from API envelope)"""

    message_id: str = Field(..., alias="messageId")
    status: Optional[str] = None
    pool: Optional[PoolInfo] = None
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
    version: Optional[int] = None
    category: Optional[str] = None
    variables: Optional[list[str]] = Field(default_factory=list)
    extracted_variables: Optional[list[str]] = Field(default_factory=list, alias="extractedVariables")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateTemplateRequest(BaseModel):
    theme_id: Optional[str] = Field(None, alias="themeId")
    category: Optional[str] = None
    blocks: Optional[list[dict[str, Any]]] = None
    """Request to create a template"""

    name: str
    subject: str
    html: Optional[str] = None
    mjml: Optional[str] = None
    text: Optional[str] = None
    variables: Optional[list[str]] = None

    model_config = ConfigDict(populate_by_name=True)


class UpdateTemplateRequest(BaseModel):
    theme_id: Optional[str] = Field(None, alias="themeId")
    category: Optional[str] = None
    blocks: Optional[list[dict[str, Any]]] = None
    """Request to update a template"""

    name: Optional[str] = None
    subject: Optional[str] = None
    html: Optional[str] = None
    mjml: Optional[str] = None
    text: Optional[str] = None
    variables: Optional[list[str]] = None

    model_config = ConfigDict(populate_by_name=True)


class TemplateVersion(BaseModel):
    """Template version snapshot"""

    id: str
    version: int
    name: str
    subject: str
    html_content: Optional[str] = Field(None, alias="htmlContent")
    text_content: Optional[str] = Field(None, alias="textContent")
    variables: list[str] = []
    block_content: Optional[dict] = Field(None, alias="blockContent")
    created_at: str = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class AddBlockRequest(BaseModel):
    """Request to add a block to a template"""

    type: str
    data: Optional[dict] = None
    styles: Optional[dict] = None
    position: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class UpdateBlockRequest(BaseModel):
    """Request to update a block"""

    data: Optional[dict] = None
    styles: Optional[dict] = None

    model_config = ConfigDict(populate_by_name=True)


class TestSendRequest(BaseModel):
    """Request to send a test email for a template"""

    recipient_email: str = Field(alias="recipientEmail")
    variables: Optional[dict[str, str]] = None
    theme_id: Optional[str] = Field(None, alias="themeId")

    model_config = ConfigDict(populate_by_name=True)


class ImportTemplateRequest(BaseModel):
    """Request to import a template"""

    name: str
    subject: str
    html_content: Optional[str] = Field(None, alias="htmlContent")
    text_content: Optional[str] = Field(None, alias="textContent")
    category: Optional[str] = None
    block_content: Optional[dict] = Field(None, alias="blockContent")

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
    """Webhook configuration. ``secret`` is only set on the create response."""

    id: str
    url: str
    events: list[Union[WebhookEventType, str]]
    active: bool = True
    description: Optional[str] = None
    secret: Optional[str] = None
    secret_prefix: Optional[str] = Field(None, alias="secretPrefix")
    total_deliveries: Optional[int] = Field(None, alias="totalDeliveries")
    stats: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateWebhookRequest(BaseModel):
    """Request to create a webhook. ``events`` takes ``WebhookEventType`` values."""

    url: str
    events: list[Union[WebhookEventType, str]]
    description: Optional[str] = None
    active: bool = True  # not sent: new webhooks are always active

    model_config = ConfigDict(populate_by_name=True)


class UpdateWebhookRequest(BaseModel):
    """Request to update a webhook"""

    url: Optional[str] = None
    events: Optional[list[Union[WebhookEventType, str]]] = None
    description: Optional[str] = None
    active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)


class WebhookPayload(BaseModel):
    """Body NorthRelay POSTs to your webhook URL.

    ``details`` depends on ``event_type``:

    - ``contact.subscribed``: contactId, email, source (FORM, API, IMPORT,
      PREFERENCE_CENTER, PLATFORM_SIGNUP, DASHBOARD), listIds, topicIds,
      requiresConfirmation, status (plus listId, formId and fields for forms).
    - ``contact.confirmed``: contactId, email, formId, listIds, topicIds, confirmedAt.
    - ``contact.unsubscribed``: contactEmail, contactId, scope (all, list, topic),
      method (one_click, link, preference_center, api, dashboard,
      platform_settings, complaint), listId, topicId, campaignId, reason and the
      legacy ``category``.
    - ``list.member_added`` / ``list.member_removed``: listId, contactId, email, source.
    - ``email.opened`` / ``email.clicked``: email, contactId, campaignId,
      trackingId, userAgent, engagementType (human engagement only; bots are
      filtered) and, for clicks, ``url``.
    """

    event_type: Union[WebhookEventType, str] = Field(..., alias="eventType")
    message_id: Optional[str] = Field(None, alias="messageId")
    timestamp: Optional[datetime] = None
    recipient: Optional[str] = None
    sender: Optional[str] = None
    subject: Optional[str] = None
    status: Optional[str] = None
    details: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    @model_validator(mode="before")
    @classmethod
    def _null_details(cls, data: Any) -> Any:
        if isinstance(data, dict) and data.get("details") is None:
            data = {**data, "details": {}}
        return data


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


ContactStatus = Literal["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED", "CLEANED"]
ContactSource = Literal["MANUAL", "CSV_IMPORT", "API", "FORM", "SYNC"]
WritableContactStatus = Literal["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED", "CLEANED"]


class ContactTag(BaseModel):
    """Tag row attached to a contact"""

    id: Optional[str] = None
    tag: str

    model_config = ConfigDict(populate_by_name=True)


class ContactCustomField(BaseModel):
    """Custom field row attached to a contact"""

    id: Optional[str] = None
    key: str
    value: str

    model_config = ConfigDict(populate_by_name=True)


class Contact(BaseModel):
    """Contact as returned by ``/api/v1/contacts``"""

    id: str
    email: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    phone: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    source: Optional[str] = None
    status: Optional[str] = None
    subscribed_at: Optional[datetime] = Field(None, alias="subscribedAt")
    unsubscribed_at: Optional[datetime] = Field(None, alias="unsubscribedAt")
    confirmed_at: Optional[datetime] = Field(None, alias="confirmedAt")
    engagement_score: Optional[float] = Field(None, alias="engagementScore")
    last_engaged_at: Optional[datetime] = Field(None, alias="lastEngagedAt")
    consent_source: Optional[str] = Field(None, alias="consentSource")
    consent_at: Optional[datetime] = Field(None, alias="consentAt")
    tags: list[ContactTag] = Field(default_factory=list)
    custom_fields: list[ContactCustomField] = Field(default_factory=list, alias="customFields")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)

    @property
    def name(self) -> Optional[str]:
        """First and last name joined (kept for 1.x compatibility)."""
        joined = " ".join(p for p in (self.first_name, self.last_name) if p)
        return joined or None

    @property
    def subscribed(self) -> bool:
        """True when the contact is ACTIVE (kept for 1.x compatibility)."""
        return self.status == "ACTIVE"

    @property
    def tag_names(self) -> list[str]:
        """Tag strings without the row ids."""
        return [t.tag for t in self.tags]


class CreateContactRequest(BaseModel):
    """Body of ``POST /api/v1/contacts`` (and one item of ``POST /contacts/bulk``).

    ``source`` defaults to ``API`` on the server. Tags must be lowercase
    letters, digits, ``-`` or ``_``; phone numbers use E.164. ``name`` is
    accepted for 1.x compatibility and split into first and last name.
    """

    email: EmailStr
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    phone: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    source: Optional[ContactSource] = None
    status: Optional[WritableContactStatus] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, str]] = Field(None, alias="customFields")
    name: Optional[str] = Field(None, exclude=True)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def _split_name(self) -> "CreateContactRequest":
        if self.name and self.first_name is None and self.last_name is None:
            first, _, last = self.name.strip().partition(" ")
            self.first_name = first or None
            self.last_name = last.strip() or None
        return self


class UpdateContactRequest(BaseModel):
    """Body of ``PATCH /api/v1/contacts/{id}`` (every field optional)"""

    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    phone: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    source: Optional[ContactSource] = None
    status: Optional[WritableContactStatus] = None

    model_config = ConfigDict(populate_by_name=True)


class BulkCreateContactsResult(BaseModel):
    """Result of ``POST /api/v1/contacts/bulk``"""

    created: int = 0
    skipped: int = 0
    errors: list[dict[str, Any]] = Field(default_factory=list)


class BulkDeleteContactsResult(BaseModel):
    """Result of ``DELETE /api/v1/contacts/bulk``"""

    deleted: int = 0
    requested: int = 0


class CsvColumnMapping(BaseModel):
    """Maps one CSV header to a contact field for ``contacts.import_csv``"""

    csv_column: str = Field(..., alias="csvColumn")
    field: Literal["email", "firstName", "lastName", "phone", "skip"]

    model_config = ConfigDict(populate_by_name=True)


class ImportContactsResult(BaseModel):
    """Result of ``POST /api/v1/contacts/import``"""

    imported: int = 0
    skipped: int = 0
    added_to_list: int = Field(0, alias="addedToList")
    errors: list[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class ContactList(BaseModel):
    """Contact list (mailing list)"""

    id: str
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    contact_count: int = Field(0, alias="contactCount")
    is_archived: Optional[bool] = Field(None, alias="isArchived")
    suppression_group_id: Optional[str] = Field(None, alias="suppressionGroupId")
    tracking_enabled: Optional[bool] = Field(None, alias="trackingEnabled")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class ListMemberContact(BaseModel):
    """Contact summary embedded in a list member row"""

    id: str
    email: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    status: Optional[str] = None
    subscribed_at: Optional[datetime] = Field(None, alias="subscribedAt")
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class ListMember(BaseModel):
    """One row of ``GET /api/v1/contacts/lists/{id}/members``.

    ``suppression_statuses`` says why the member would not receive mail
    (BOUNCED, COMPLAINED, UNSUBSCRIBED, CLEANED, MANUALLY_SUPPRESSED,
    CATEGORY_SUPPRESSED, REMOVED_FROM_LIST); an empty list means active.
    """

    id: str
    contact_id: str = Field(..., alias="contactId")
    contact: Optional[ListMemberContact] = None
    added_at: Optional[datetime] = Field(None, alias="addedAt")
    removed_at: Optional[datetime] = Field(None, alias="removedAt")
    suppression_statuses: list[str] = Field(default_factory=list, alias="suppressionStatuses")

    model_config = ConfigDict(populate_by_name=True)


class ListMemberCounts(BaseModel):
    """Member counts for the list (independent of the filter)"""

    total: int = 0
    active: int = 0
    suppressed: int = 0


class ListMembersPage(BaseModel):
    """One page of list members"""

    data: list[ListMember] = Field(default_factory=list)
    counts: ListMemberCounts = Field(default_factory=lambda: ListMemberCounts.model_validate({}))
    page: int = 1
    limit: int = 50
    total: int = 0
    total_pages: int = Field(0, alias="totalPages")

    model_config = ConfigDict(populate_by_name=True)

    @property
    def has_more(self) -> bool:
        return self.page < self.total_pages


class BlockedAddress(BaseModel):
    """Address that was not added because it is suppressed or unsubscribed"""

    email: str
    reason: str


class AddListMembersResult(BaseModel):
    """Result of ``POST /api/v1/contacts/lists/{id}/members``"""

    added: int = 0
    already_members: int = Field(0, alias="alreadyMembers")
    not_found: list[str] = Field(default_factory=list, alias="notFound")
    blocked: list[BlockedAddress] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

    @property
    def skipped(self) -> int:
        """Back-compat name for ``already_members``."""
        return self.already_members


class RemoveListMembersResult(BaseModel):
    """Result of ``DELETE /api/v1/contacts/lists/{id}/members``"""

    removed: int = 0


# ===== Subscription Types =====


class Consent(BaseModel):
    """Consent evidence your application collected (CASL / GDPR)."""

    ip: Optional[str] = None
    user_agent: Optional[str] = Field(None, alias="userAgent")
    text: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class SubscribeRequest(BaseModel):
    """Body of ``POST /api/v1/subscriptions`` (the server rejects unknown keys)"""

    email: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    phone: Optional[str] = None
    list_ids: Optional[list[str]] = Field(None, alias="listIds", max_length=50)
    topic_ids: Optional[list[str]] = Field(None, alias="topicIds", max_length=50)
    tags: Optional[list[str]] = Field(None, max_length=50)
    custom_fields: Optional[dict[str, str]] = Field(None, alias="customFields")
    metadata: Optional[dict[str, Any]] = None
    double_opt_in: Optional[bool] = Field(None, alias="doubleOptIn")
    confirmation_template_id: Optional[str] = Field(None, alias="confirmationTemplateId")
    redirect_url: Optional[str] = Field(None, alias="redirectUrl")
    resubscribe: Optional[bool] = None
    consent: Optional[Consent] = None

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    @model_validator(mode="after")
    def _https_redirect(self) -> "SubscribeRequest":
        if self.redirect_url is not None and not self.redirect_url.startswith("https://"):
            raise ValueError("redirect_url must use https://")
        return self


class SubscribeResult(BaseModel):
    """Result of ``POST /api/v1/subscriptions``"""

    contact_id: str = Field(..., alias="contactId")
    email: str
    status: Literal["ACTIVE", "PENDING"]
    created: bool
    list_ids: list[str] = Field(default_factory=list, alias="listIds")
    added_to_list_ids: list[str] = Field(default_factory=list, alias="addedToListIds")
    topic_ids: list[str] = Field(default_factory=list, alias="topicIds")
    requires_confirmation: bool = Field(False, alias="requiresConfirmation")
    confirmation_sent: bool = Field(False, alias="confirmationSent")

    model_config = ConfigDict(populate_by_name=True)


class UnsubscribeResult(BaseModel):
    """Result of ``POST /api/v1/subscriptions/unsubscribe``"""

    email: str
    contact_id: Optional[str] = Field(None, alias="contactId")
    scope: Literal["all", "list", "topic"]
    changed: bool

    model_config = ConfigDict(populate_by_name=True)


class ConsentEvidence(BaseModel):
    """Consent evidence stored on a contact"""

    source: Optional[str] = None
    at: Optional[datetime] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = Field(None, alias="userAgent")
    text: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class SubscriptionContact(BaseModel):
    """Contact block of a subscription status"""

    id: str
    status: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    subscribed_at: Optional[datetime] = Field(None, alias="subscribedAt")
    confirmed_at: Optional[datetime] = Field(None, alias="confirmedAt")
    unsubscribed_at: Optional[datetime] = Field(None, alias="unsubscribedAt")
    consent: ConsentEvidence = Field(default_factory=lambda: ConsentEvidence.model_validate({}))

    model_config = ConfigDict(populate_by_name=True)


class SuppressionInfo(BaseModel):
    """Account-level suppression (Unsubscribe, Bounce, Complaint or Manual)"""

    reason: str
    since: Optional[datetime] = None


class PendingConfirmation(BaseModel):
    """Outstanding double opt-in"""

    expires_at: Optional[datetime] = Field(None, alias="expiresAt")

    model_config = ConfigDict(populate_by_name=True)


class ListSubscription(BaseModel):
    """List membership in a subscription status"""

    id: str
    name: str
    subscribed: bool
    added_at: Optional[datetime] = Field(None, alias="addedAt")
    removed_at: Optional[datetime] = Field(None, alias="removedAt")

    model_config = ConfigDict(populate_by_name=True)


class TopicSubscription(BaseModel):
    """Topic (suppression group) in a subscription status"""

    id: str
    name: str
    label: Optional[str] = None
    description: Optional[str] = None
    subscribed: bool


class SubscriptionStatus(BaseModel):
    """Result of ``GET`` and ``PATCH /api/v1/subscriptions/{email}``"""

    email: str
    contact: Optional[SubscriptionContact] = None
    suppression: Optional[SuppressionInfo] = None
    unsubscribed_from_all: bool = Field(False, alias="unsubscribedFromAll")
    pending_confirmation: Optional[PendingConfirmation] = Field(None, alias="pendingConfirmation")
    lists: list[ListSubscription] = Field(default_factory=list)
    topics: list[TopicSubscription] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class ResendConfirmationResult(BaseModel):
    """Result of ``POST /api/v1/subscriptions/{email}/resend-confirmation``"""

    email: str
    confirmation_sent: bool = Field(False, alias="confirmationSent")
    expires_at: Optional[datetime] = Field(None, alias="expiresAt")

    model_config = ConfigDict(populate_by_name=True)


# ===== Brand Theme Types =====


class SocialLink(BaseModel):
    """Social media link"""

    platform: str
    url: str


class BrandTheme(BaseModel):
    default_from_name: Optional[str] = Field(None, alias="defaultFromName")
    default_from_email: Optional[str] = Field(None, alias="defaultFromEmail")
    default_from_title: Optional[str] = Field(None, alias="defaultFromTitle")
    custom_variables: Optional[dict[str, str]] = Field(None, alias="customVariables")
    unsubscribe_page_title: Optional[str] = Field(None, alias="unsubscribePageTitle")
    unsubscribe_page_message: Optional[str] = Field(None, alias="unsubscribePageMessage")
    unsubscribe_submit_label: Optional[str] = Field(None, alias="unsubscribeSubmitLabel")
    unsubscribe_success_message: Optional[str] = Field(None, alias="unsubscribeSuccessMessage")
    unsubscribe_redirect_url: Optional[str] = Field(None, alias="unsubscribeRedirectUrl")
    """Brand theme for email styling"""

    id: str
    name: str
    is_default: bool = Field(False, alias="isDefault")
    primary_color: Optional[str] = Field(None, alias="primaryColor")
    secondary_color: Optional[str] = Field(None, alias="secondaryColor")
    accent_color: Optional[str] = Field(None, alias="accentColor")
    bg_color: Optional[str] = Field(None, alias="bgColor")
    card_bg_color: Optional[str] = Field(None, alias="cardBgColor")
    heading_color: Optional[str] = Field(None, alias="headingColor")
    text_color: Optional[str] = Field(None, alias="textColor")
    muted_color: Optional[str] = Field(None, alias="mutedColor")
    font_family: Optional[str] = Field(None, alias="fontFamily")
    font_name: Optional[str] = Field(None, alias="fontName")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    company_name: Optional[str] = Field(None, alias="companyName")
    footer_html: Optional[str] = Field(None, alias="footerHtml")
    social_links: list[SocialLink] = Field(default_factory=list, alias="socialLinks")
    border_radius: Optional[str] = Field(None, alias="borderRadius")
    button_radius: Optional[str] = Field(None, alias="buttonRadius")
    button_style: Optional[str] = Field(None, alias="buttonStyle")
    design_style: Optional[str] = Field(None, alias="designStyle")
    variables: Optional[dict[str, str]] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateBrandThemeRequest(BaseModel):
    default_from_name: Optional[str] = Field(None, alias="defaultFromName")
    default_from_email: Optional[str] = Field(None, alias="defaultFromEmail")
    default_from_title: Optional[str] = Field(None, alias="defaultFromTitle")
    custom_variables: Optional[dict[str, str]] = Field(None, alias="customVariables")
    unsubscribe_page_title: Optional[str] = Field(None, alias="unsubscribePageTitle")
    unsubscribe_page_message: Optional[str] = Field(None, alias="unsubscribePageMessage")
    unsubscribe_submit_label: Optional[str] = Field(None, alias="unsubscribeSubmitLabel")
    unsubscribe_success_message: Optional[str] = Field(None, alias="unsubscribeSuccessMessage")
    unsubscribe_redirect_url: Optional[str] = Field(None, alias="unsubscribeRedirectUrl")
    """Request to create a brand theme"""

    name: str
    is_default: Optional[bool] = Field(None, alias="isDefault")
    primary_color: Optional[str] = Field(None, alias="primaryColor")
    secondary_color: Optional[str] = Field(None, alias="secondaryColor")
    accent_color: Optional[str] = Field(None, alias="accentColor")
    bg_color: Optional[str] = Field(None, alias="bgColor")
    card_bg_color: Optional[str] = Field(None, alias="cardBgColor")
    heading_color: Optional[str] = Field(None, alias="headingColor")
    text_color: Optional[str] = Field(None, alias="textColor")
    muted_color: Optional[str] = Field(None, alias="mutedColor")
    font_family: Optional[str] = Field(None, alias="fontFamily")
    font_name: Optional[str] = Field(None, alias="fontName")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    company_name: Optional[str] = Field(None, alias="companyName")
    footer_html: Optional[str] = Field(None, alias="footerHtml")
    social_links: Optional[list[SocialLink]] = Field(None, alias="socialLinks")
    border_radius: Optional[str] = Field(None, alias="borderRadius")
    button_radius: Optional[str] = Field(None, alias="buttonRadius")
    button_style: Optional[ButtonStyle] = Field(None, alias="buttonStyle")
    design_style: Optional[str] = Field(None, alias="designStyle")

    model_config = ConfigDict(populate_by_name=True)


class UpdateBrandThemeRequest(BaseModel):
    default_from_name: Optional[str] = Field(None, alias="defaultFromName")
    default_from_email: Optional[str] = Field(None, alias="defaultFromEmail")
    default_from_title: Optional[str] = Field(None, alias="defaultFromTitle")
    custom_variables: Optional[dict[str, str]] = Field(None, alias="customVariables")
    unsubscribe_page_title: Optional[str] = Field(None, alias="unsubscribePageTitle")
    unsubscribe_page_message: Optional[str] = Field(None, alias="unsubscribePageMessage")
    unsubscribe_submit_label: Optional[str] = Field(None, alias="unsubscribeSubmitLabel")
    unsubscribe_success_message: Optional[str] = Field(None, alias="unsubscribeSuccessMessage")
    unsubscribe_redirect_url: Optional[str] = Field(None, alias="unsubscribeRedirectUrl")
    """Request to update a brand theme (all fields optional for PATCH semantics)"""

    name: Optional[str] = None
    is_default: Optional[bool] = Field(None, alias="isDefault")
    primary_color: Optional[str] = Field(None, alias="primaryColor")
    secondary_color: Optional[str] = Field(None, alias="secondaryColor")
    accent_color: Optional[str] = Field(None, alias="accentColor")
    bg_color: Optional[str] = Field(None, alias="bgColor")
    card_bg_color: Optional[str] = Field(None, alias="cardBgColor")
    heading_color: Optional[str] = Field(None, alias="headingColor")
    text_color: Optional[str] = Field(None, alias="textColor")
    muted_color: Optional[str] = Field(None, alias="mutedColor")
    font_family: Optional[str] = Field(None, alias="fontFamily")
    font_name: Optional[str] = Field(None, alias="fontName")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    company_name: Optional[str] = Field(None, alias="companyName")
    footer_html: Optional[str] = Field(None, alias="footerHtml")
    social_links: Optional[list[SocialLink]] = Field(None, alias="socialLinks")
    border_radius: Optional[str] = Field(None, alias="borderRadius")
    button_radius: Optional[str] = Field(None, alias="buttonRadius")
    button_style: Optional[ButtonStyle] = Field(None, alias="buttonStyle")
    design_style: Optional[str] = Field(None, alias="designStyle")

    model_config = ConfigDict(populate_by_name=True)


# ===== Event Types =====


class EmailEvent(BaseModel):
    """Email event record"""

    id: str
    message_id: str = Field(..., alias="messageId")
    event_type: EventType = Field(..., alias="eventType")
    sender: str
    recipient: str
    subject: str
    status_code: Optional[str] = Field(None, alias="statusCode")
    status_message: Optional[str] = Field(None, alias="statusMessage")
    pool_type: PoolType = Field(..., alias="poolType")
    source: Optional[EmailSource] = None
    timestamp: str
    details: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


# ===== Common Types =====


class PaginatedResponse(BaseModel):
    """Paginated API response from the NorthRelay API envelope.

    The API returns: { success, data: { <items_key>: [...] } | [...], meta: { page, limit, total_count, has_more } }
    This model normalises that into a flat structure.
    """

    data: list[Any] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    limit: int = 20
    has_more: bool = Field(False, alias="hasMore")

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_api_response(
        cls, response: dict[str, Any], model_class: Optional[type] = None
    ) -> "PaginatedResponse":
        """Parse the standard NorthRelay API envelope into a PaginatedResponse.

        Handles both ``{ data: [...] }`` and ``{ data: { templates: [...] } }`` shapes.
        """
        raw_data = response.get("data", [])
        meta = response.get("meta") or {}
        pagination = response.get("pagination")
        if not meta and isinstance(pagination, dict):
            # List routes that answer { data: [...], pagination: { page, limit, total, totalPages } }
            page = int(pagination.get("page", 1))
            meta = {
                "page": page,
                "limit": pagination.get("limit", 20),
                "total_count": pagination.get("total", 0),
                "has_more": page < int(pagination.get("totalPages", 0) or 0),
            }

        # data can be a list directly or a dict with a single list value
        if isinstance(raw_data, dict):
            # Find the first list value inside data (e.g. data.templates, data.campaigns)
            items: list[Any] = []
            for v in raw_data.values():
                if isinstance(v, list):
                    items = v
                    break
        else:
            items = raw_data if isinstance(raw_data, list) else []

        # Deserialize items into model objects if model_class is given
        if model_class is not None:
            items = [model_class(**item) if isinstance(item, dict) else item for item in items]

        return cls(
            data=items,
            total=meta.get("total_count", meta.get("total", len(items))),
            page=meta.get("page", 1),
            limit=meta.get("limit", 20),
            has_more=meta.get("has_more", meta.get("hasMore", False)),
        )


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
