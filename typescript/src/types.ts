/**
 * Type definitions for NorthRelay API
 */

export type PoolType = 'Shared' | 'Isolated';
export type PlanTier = 'Sandbox' | 'Micro' | 'Startup' | 'Scale' | 'Enterprise';
export type EmailStatus = 'Queued' | 'Processing' | 'Sent' | 'Delivered' | 'Bounced' | 'Failed' | 'Deferred';
export type EventType = 'Queued' | 'Processing' | 'Sent' | 'Delivered' | 'Bounced' | 'Opened' | 'Clicked' | 'Complained' | 'Unsubscribed' | 'Dropped';
export type EmailSource = 'API' | 'INBOX' | 'SMTP' | 'INBOUND' | 'SCHEDULED' | 'TEST';
export type ButtonStyle = 'filled' | 'outline' | 'ghost';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
}

export interface SendEmailRequest {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  content: EmailContent;
  variables?: Record<string, string>;
  themeId?: string;
  poolType?: PoolType;
  poolTier?: PlanTier;
  poolId?: string;
}

export interface SendEmailResponse {
  success: true;
  data: {
    messageId: string;
    status: 'Queued';
    pool: {
      type: PoolType;
      gateway: string;
    };
    quota: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fix_action?: string;
    docs_url?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  };
}

export interface Template {
  html: string;
  text?: string;
  variables?: string[];
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  extractedVariables?: string[];
  themeId?: string;
  isActive: boolean;
  format?: 'LEGACY' | 'BLOCKS';
  version?: number;
  blockContent?: TemplateDocument;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  html?: string;
  text?: string;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  mjml?: string;
  themeId?: string;
  blocks?: TemplateDocument;
  category?: string;
  variables?: string[];
}

export interface UpdateTemplateRequest {
  html?: string;
  text?: string;
  blocks?: TemplateDocument;
  variables?: string[];
  category?: string;
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  mjml?: string;
  themeId?: string;
  isActive?: boolean;
}

// Block editor types
export type BlockType =
  | 'header' | 'text' | 'image' | 'button' | 'divider'
  | 'columns' | 'social' | 'video' | 'code' | 'table'
  | 'spacer' | 'navbar' | 'footer';

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
  styles?: {
    padding?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: string;
  };
}

export interface TemplateDocument {
  id: string;
  name: string;
  version: number;
  blocks: Block[];
}

export interface TemplateVersion {
  id: string;
  version: number;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  variables: string[];
  blockContent?: TemplateDocument;
  createdAt: string;
}

export interface ExportedTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: string;
  version: number;
  blockContent?: TemplateDocument;
  format: 'LEGACY' | 'BLOCKS';
}

export interface AddBlockRequest {
  type: BlockType;
  data?: Record<string, unknown>;
  styles?: Block['styles'];
  position?: number;
}

export interface UpdateBlockRequest {
  data?: Record<string, unknown>;
  styles?: Block['styles'];
}

export interface TestSendRequest {
  fromEmail?: string;
  recipientEmail: string;
  variables?: Record<string, string>;
  themeId?: string;
}

export interface ImportTemplateRequest {
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  category?: string;
  blockContent?: unknown;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  verifiedAt?: string;
  dnsRecords: {
    spf?: { status: 'pending' | 'verified' | 'failed' };
    dkim?: { status: 'pending' | 'verified' | 'failed' };
    dmarc?: { status: 'pending' | 'verified' | 'failed' };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainRequest {
  domain: string;
}

/** Event names a webhook can subscribe to (`events` on create/update). */
export type WebhookEventType =
  | 'contact.subscribed'
  | 'contact.confirmed'
  | 'contact.unsubscribed'
  | 'list.member_added'
  | 'list.member_removed'
  | 'email.opened'
  | 'email.clicked'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.deferred'
  | 'email.dropped'
  | 'email.received'
  | 'email.queued'
  | 'auth.success'
  | 'auth.failed';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  secret: string;
  lastDeliveryAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookRequest {
  /** Must be https:// and not a loopback address. */
  url: string;
  events: WebhookEventType[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: WebhookEventType[];
  active?: boolean;
  description?: string;
}

/**
 * Legacy webhook event shape.
 * @deprecated Deliveries use `{ eventType, messageId, timestamp, recipient, details }`;
 * type them with `WebhookPayload`.
 */
export interface WebhookEvent {
  id: string;
  type: EventType;
  messageId: string;
  timestamp: string;
  data: {
    email: string;
    subject?: string;
    status?: string;
    [key: string]: unknown;
  };
}

/** How a subscription change was made. */
export type SubscriptionSource =
  | 'FORM'
  | 'API'
  | 'IMPORT'
  | 'PREFERENCE_CENTER'
  | 'PLATFORM_SIGNUP'
  | 'DASHBOARD';

export type UnsubscribeScope = 'all' | 'list' | 'topic';

export type UnsubscribeMethod =
  | 'one_click'
  | 'link'
  | 'preference_center'
  | 'api'
  | 'dashboard'
  | 'platform_settings'
  | 'complaint';

export interface ContactSubscribedDetails {
  contactId: string;
  email: string;
  source: SubscriptionSource;
  /** Lists the contact was added to by this event. */
  listIds?: string[];
  /** Topics the contact opted (back) into by this event. */
  topicIds?: string[];
  /** Form subscriptions only (kept for older consumers). */
  listId?: string;
  formId?: string | null;
  /** True when a double opt-in email was sent and the contact is PENDING. */
  requiresConfirmation: boolean;
  status: ContactStatus | string;
  /** Form answers, for form subscriptions. */
  fields?: Record<string, unknown>;
}

export interface ContactConfirmedDetails {
  contactId: string;
  email?: string;
  formId: string | null;
  listIds?: string[];
  topicIds?: string[];
  confirmedAt: string;
}

export interface ContactUnsubscribedDetails {
  contactEmail: string;
  /** Null when the address was not a contact (for example API mail). */
  contactId?: string | null;
  scope?: UnsubscribeScope;
  listId?: string | null;
  topicId?: string | null;
  method?: UnsubscribeMethod;
  campaignId?: string | null;
  reason?: string | null;
  /** Legacy alias of `topicId`. */
  category?: string | null;
}

export interface ListMemberDetails {
  listId: string;
  contactId: string;
  email: string;
  /** `UNSUBSCRIBE` when the recipient left the list themselves. */
  source: SubscriptionSource | 'UNSUBSCRIBE';
}

export interface EmailOpenedDetails {
  email: string | null;
  /** Set for campaign mail. */
  contactId: string | null;
  campaignId: string | null;
  /** Set for API mail sent with tracking. */
  trackingId: string | null;
  userAgent: string | null;
  /** Always `HUMAN`: machine opens and clicks are filtered out. */
  engagementType: string;
}

export interface EmailClickedDetails extends EmailOpenedDetails {
  /** The link that was clicked. */
  url: string;
}

/** Envelope of every webhook delivery (JSON body, signed with `X-NorthRelay-Signature`). */
export interface WebhookPayloadBase<T extends string = WebhookEventType, D = Record<string, unknown>> {
  eventType: T;
  messageId: string;
  timestamp: string;
  recipient?: string;
  sender?: string;
  subject?: string;
  status?: string;
  pool?: string;
  smtpResponse?: string;
  bounceReason?: string;
  bounceType?: 'hard' | 'soft';
  details?: D;
}

export type ContactSubscribedWebhook = WebhookPayloadBase<'contact.subscribed', ContactSubscribedDetails> & { details: ContactSubscribedDetails };
export type ContactConfirmedWebhook = WebhookPayloadBase<'contact.confirmed', ContactConfirmedDetails> & { details: ContactConfirmedDetails };
export type ContactUnsubscribedWebhook = WebhookPayloadBase<'contact.unsubscribed', ContactUnsubscribedDetails> & { details: ContactUnsubscribedDetails };
export type ListMemberAddedWebhook = WebhookPayloadBase<'list.member_added', ListMemberDetails> & { details: ListMemberDetails };
export type ListMemberRemovedWebhook = WebhookPayloadBase<'list.member_removed', ListMemberDetails> & { details: ListMemberDetails };
export type EmailOpenedWebhook = WebhookPayloadBase<'email.opened', EmailOpenedDetails> & { details: EmailOpenedDetails };
export type EmailClickedWebhook = WebhookPayloadBase<'email.clicked', EmailClickedDetails> & { details: EmailClickedDetails };
export type EmailLifecycleWebhook = WebhookPayloadBase<
  'email.delivered' | 'email.bounced' | 'email.deferred' | 'email.dropped' | 'email.received' | 'email.queued' | 'auth.success' | 'auth.failed'
>;

/** Discriminated union of webhook deliveries; switch on `eventType`. */
export type WebhookPayload =
  | ContactSubscribedWebhook
  | ContactConfirmedWebhook
  | ContactUnsubscribedWebhook
  | ListMemberAddedWebhook
  | ListMemberRemovedWebhook
  | EmailOpenedWebhook
  | EmailClickedWebhook
  | EmailLifecycleWebhook;

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  deliveredAt: string;
  statusCode: number;
  success: boolean;
  retries: number;
  responseTime?: number;
  errorMessage?: string;
}

export interface WebhookFailure {
  id: string;
  webhookId: string;
  eventId: string;
  deliveredAt: string;
  statusCode: number;
  errorMessage: string;
  retries: number;
  lastRetryAt?: string;
}

export interface WebhookHealth {
  webhookId: string;
  successRate: number;
  averageResponseTime: number;
  totalDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: string;
  status: 'healthy' | 'degraded' | 'failing';
}

export interface WebhookFailureSettings {
  maxRetries: number;
  retryIntervalSeconds: number;
  disableAfterFailures: number;
  notifyOnFailure: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string; // Full key (show only once)
  prefix: string;
  active: boolean;
  createdAt: string;
}

export interface EmailEvent {
  id: string;
  messageId: string;
  eventType: EventType;
  sender: string;
  recipient: string;
  subject: string;
  statusCode?: string;
  statusMessage?: string;
  poolType: PoolType;
  source?: EmailSource;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated API response envelope.
 *
 * The API returns either `{ data: T[] }` or `{ data: { <key>: T[] } }` with
 * pagination metadata in a `meta` block.
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[] | Record<string, T[] | unknown>;
  meta: {
    page: number;
    limit: number;
    total_count: number;
    has_more: boolean;
    /** Some endpoints include extra meta fields (e.g. count, limit for themes). */
    [key: string]: unknown;
  };
}

/**
 * Extract the items array from a PaginatedResponse.
 *
 * Handles both `{ data: T[] }` and `{ data: { templates: T[] } }` shapes.
 */
export function extractItems<T>(response: PaginatedResponse<T>): T[] {
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // Find the first array value in the data object
  for (const value of Object.values(response.data)) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return [];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
// Campaign Types
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
export type CampaignApprovalStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheaderText?: string | null;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  templateId?: string | null;
  htmlContent?: string | null;
  textContent?: string | null;
  templateVariables?: Record<string, string> | null;
  themeId?: string | null;
  status: CampaignStatus;
  approvalStatus: CampaignApprovalStatus;
  trackOpens: boolean;
  trackClicks: boolean;
  scheduledFor?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  preheaderText?: string;
  replyTo?: string;
  templateId?: string;
  htmlContent?: string;
  textContent?: string;
  templateVariables?: Record<string, string>;
  themeId?: string;
  listIds?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface UpdateCampaignRequest {
  name?: string;
  subject?: string;
  preheaderText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: string;
  htmlContent?: string;
  textContent?: string;
  templateVariables?: Record<string, string>;
  themeId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface CampaignSendStatus {
  status: string;
  sent: number;
  failed: number;
  total: number;
}

// Contact Types
export type ContactStatus = 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'COMPLAINED' | 'CLEANED';
export type ContactSource = 'MANUAL' | 'CSV_IMPORT' | 'API' | 'FORM' | 'SYNC';

export interface ContactTag {
  id: string;
  contactId: string;
  tag: string;
}

export interface ContactCustomField {
  id: string;
  contactId: string;
  key: string;
  value: string;
}

export interface Contact {
  id: string;
  userId?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: ContactStatus;
  source?: ContactSource;
  /** Tag rows as returned by the API (`tags[].tag` is the tag name). */
  tags?: ContactTag[];
  customFields?: ContactCustomField[];
  metadata?: Record<string, any> | null;
  subscribedAt?: string;
  unsubscribedAt?: string | null;
  confirmedAt?: string | null;
  /** Consent evidence: "form", "api", "import", "platform_signup", "manual". */
  consentSource?: string | null;
  consentAt?: string | null;
  consentIp?: string | null;
  consentUserAgent?: string | null;
  consentText?: string | null;
  engagementScore?: number | null;
  lastEngagedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  /** E.164 format, e.g. +12025551234 */
  phone?: string;
  /** Defaults to `API`. */
  source?: ContactSource;
  /** Defaults to `ACTIVE`. */
  status?: ContactStatus;
  /** Lowercase letters, digits, `-` and `_`; at most 50. */
  tags?: string[];
  customFields?: Record<string, string>;
  /** Up to 4 KB of JSON. */
  metadata?: Record<string, any>;
}

/**
 * Fields accepted by `PATCH /api/v1/contacts/{id}`. Tags are not updated
 * here: use `contacts.addTags()` / `contacts.removeTag()`.
 */
export interface UpdateContactRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata?: Record<string, any>;
  source?: ContactSource;
  status?: ContactStatus;
}

export interface ListContactsOptions {
  page?: number;
  /** 1-1000, default 100. */
  limit?: number;
  status?: ContactStatus;
  /** Filter by one tag. */
  tag?: string;
  /** Matches email, first name or last name. */
  search?: string;
  source?: ContactSource;
  sortBy?: 'createdAt' | 'email' | 'subscribedAt';
  sortOrder?: 'asc' | 'desc';
  /**
   * @deprecated The API filters by a single tag. Use `tag`; when this is set
   * the first comma-separated value is sent as `tag`.
   */
  tags?: string;
}

export type ListType = 'STATIC' | 'DYNAMIC';

export interface ContactList {
  id: string;
  name: string;
  description?: string | null;
  type?: ListType;
  contactCount: number;
  isArchived?: boolean;
  segmentRules?: Record<string, unknown> | null;
  /** Topic (suppression group) this list belongs to; opting out of the topic also leaves the list. */
  suppressionGroupId?: string | null;
  trackingEnabled?: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactListRequest {
  name: string;
  description?: string;
  /** Defaults to `STATIC`. */
  type?: ListType;
  segmentRules?: Record<string, unknown>;
  /** Tag the list with a topic (suppression group id). */
  suppressionGroupId?: string | null;
  trackingEnabled?: boolean;
}

export interface UpdateContactListRequest {
  name?: string;
  description?: string | null;
  segmentRules?: Record<string, unknown> | null;
  isArchived?: boolean;
  suppressionGroupId?: string | null;
  trackingEnabled?: boolean;
}

export interface ListContactListsOptions {
  page?: number;
  /** 1-100, default 20. */
  limit?: number;
  type?: ListType | 'ALL';
  isArchived?: boolean;
  search?: string;
}

/** Envelope of the contact-list routes (`{ data, pagination }`). */
export interface ContactListPage<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Result of `POST /api/v1/contacts/bulk`. */
export interface BulkContactResult {
  created: number;
  /** Existing contacts left untouched (when `skipDuplicates` is true). */
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

/** Result of `DELETE /api/v1/contacts/bulk`. */
export interface BulkDeleteContactsResult {
  deleted: number;
  requested: number;
}

/** @deprecated The import API is synchronous; see `ContactImportResult`. */
export interface ContactImportJob {
  jobId: string;
  status: string;
}

/** Contact field a CSV column maps to. */
export type CsvImportField = 'email' | 'firstName' | 'lastName' | 'phone' | 'skip';

export interface CsvColumnMapping {
  /** Header of the CSV column, exactly as it appears in the first row. */
  csvColumn: string;
  field: CsvImportField;
}

export interface ImportCsvOptions {
  /** Column mappings; one must map to `email`. At most 100. */
  mappings: CsvColumnMapping[];
  /** Add every imported (and already known) contact to this list. */
  listId?: string;
  /** Tags applied to newly created contacts (at most 20). */
  tags?: string[] | string;
  /** File name sent with the upload; must end in `.csv`. Default `contacts.csv`. */
  filename?: string;
}

/** Result of `POST /api/v1/contacts/import`. */
export interface ContactImportResult {
  imported: number;
  /** Rows whose email already existed. */
  skipped: number;
  /** Contacts (new or existing) added to `listId`. */
  addedToList: number;
  errors: string[];
}

export type ListMemberSuppressionFlag =
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'UNSUBSCRIBED'
  | 'CLEANED'
  | 'MANUALLY_SUPPRESSED'
  | 'CATEGORY_SUPPRESSED'
  | 'REMOVED_FROM_LIST';

export interface ContactListMember {
  id: string;
  contactId: string;
  contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: ContactStatus;
    subscribedAt: string;
    createdAt: string;
  };
  addedAt: string;
  /** Set when the contact unsubscribed from this list (history kept). */
  removedAt: string | null;
  /** Empty when the member is mailable. */
  suppressionStatuses: ListMemberSuppressionFlag[];
}

export interface ListMembersOptions {
  page?: number;
  /** 1-100, default 50. */
  limit?: number;
  filter?: 'all' | 'active' | 'suppressed';
}

export interface ListMembersResponse {
  data: ContactListMember[];
  counts: { total: number; active: number; suppressed: number };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AddListMembersInput {
  contactIds?: string[];
  emails?: string[];
  /** Create ACTIVE contacts for unknown emails instead of reporting them in `notFound`. */
  createMissing?: boolean;
}

export interface RemoveListMembersInput {
  contactIds?: string[];
  emails?: string[];
}

export interface AddListMembersResult {
  added: number;
  alreadyMembers: number;
  /** Contact ids or emails that did not match a contact (and were not created). */
  notFound: string[];
  /** Suppressed, unsubscribed or blocked addresses, with the subscription error code. */
  blocked: Array<{ email: string; reason: SubscriptionErrorCode | string }>;
}

export interface AddListMembersResponse {
  success: true;
  data: AddListMembersResult;
  /** @deprecated Same as `data.added`. */
  added: number;
  /** @deprecated Same as `data.alreadyMembers`. */
  skipped: number;
  message: string;
}

/** Error codes returned by the subscriptions API and list-member changes. */
export type SubscriptionErrorCode =
  | 'LIST_NOT_FOUND'
  | 'TOPIC_NOT_FOUND'
  | 'CONTACT_NOT_FOUND'
  | 'CONTACT_BLOCKED'
  | 'RECIPIENT_SUPPRESSED'
  | 'RECIPIENT_UNSUBSCRIBED'
  | 'NO_PENDING_CONFIRMATION'
  | 'FREE_TIER_CONTACT_LIMIT'
  | 'VALIDATION_ERROR';

// Brand Theme Types
export interface SocialLink {
  platform: string;
  url: string;
}

export interface BrandTheme {
  defaultFromName?: string | null;
  defaultFromEmail?: string | null;
  defaultFromTitle?: string | null;
  customVariables?: Record<string, string>;
  unsubscribePageTitle?: string | null;
  unsubscribePageMessage?: string | null;
  unsubscribeSubmitLabel?: string | null;
  unsubscribeSuccessMessage?: string | null;
  unsubscribeRedirectUrl?: string | null;
  id: string;
  name: string;
  isDefault: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  cardBgColor?: string;
  headingColor?: string;
  textColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  fontName?: string;
  logoUrl?: string | null;
  companyName?: string;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  supportEmail?: string | null;
  websiteUrl?: string | null;
  footerHtml?: string | null;
  socialLinks?: SocialLink[];
  borderRadius?: string;
  buttonRadius?: string;
  buttonStyle?: ButtonStyle;
  designStyle?: string;
  variables?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandThemeRequest {
  defaultFromName?: string | null;
  defaultFromEmail?: string | null;
  defaultFromTitle?: string | null;
  customVariables?: Record<string, string>;
  unsubscribePageTitle?: string | null;
  unsubscribePageMessage?: string | null;
  unsubscribeSubmitLabel?: string | null;
  unsubscribeSuccessMessage?: string | null;
  unsubscribeRedirectUrl?: string | null;
  name: string;
  isDefault?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  cardBgColor?: string;
  headingColor?: string;
  textColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  fontName?: string;
  logoUrl?: string | null;
  companyName?: string;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  supportEmail?: string | null;
  websiteUrl?: string | null;
  footerHtml?: string | null;
  socialLinks?: SocialLink[];
  borderRadius?: string;
  buttonRadius?: string;
  buttonStyle?: ButtonStyle;
  designStyle?: string;
}

export type UpdateBrandThemeRequest = Partial<CreateBrandThemeRequest>;

// Analytics Types
export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  metrics?: string[];
}

export interface AnalyticsData {
  date: string;
  [metric: string]: string | number;
}

export interface EngagementHeatmap {
  hour: number;
  dayOfWeek: number;
  opens: number;
  clicks: number;
}

export interface GeographicData {
  country: string;
  region?: string;
  opens: number;
  clicks: number;
  bounces: number;
}

export interface ProviderStats {
  provider: string;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
}

export interface AnalyticsExport {
  exportId: string;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
}

// Metrics Types
export interface DeliveryMetrics {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  complained: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface MetricsSummary extends DeliveryMetrics {
  period: string;
  startDate: string;
  endDate: string;
}

// Suppression Types
export interface Suppression {
  email: string;
  reason?: string;
  createdAt: string;
}

export interface AddSuppressionRequest {
  email: string;
  reason?: string;
}

/**
 * A suppression group, also called a topic. A member of the group is an
 * address that opted OUT of the topic.
 */
export interface SuppressionGroup {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  /** Set for NorthRelay-managed topics; null for yours. */
  systemKey?: string | null;
  /** Name shown to recipients on the unsubscribe / preference page. */
  publicLabel?: string | null;
  publicDescription?: string | null;
  isPublishedOnUnsub?: boolean;
  sortOrder?: number;
  _count?: { members: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSuppressionGroupRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateSuppressionGroupRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
  publicLabel?: string | null;
  publicDescription?: string | null;
  isPublishedOnUnsub?: boolean;
  sortOrder?: number;
}

/** An opt-out row in a topic. */
export interface SuppressionGroupMember {
  email: string;
  createdAt: string;
}

// Subuser Types
export interface Subuser {
  id: string;
  username: string;
  email: string;
  disabled: boolean;
  permissions: SubuserPermissions;
  ipPoolId?: string;
  monthlyLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubuserPermissions {
  emails: boolean;
  templates: boolean;
  domains: boolean;
  webhooks: boolean;
  apiKeys: boolean;
  analytics: boolean;
}

export interface CreateSubuserRequest {
  username: string;
  email: string;
  password: string;
  permissions: SubuserPermissions;
  ipPoolId?: string;
  monthlyLimit?: number;
}

export interface UpdateSubuserRequest {
  email?: string;
  permissions?: SubuserPermissions;
  ipPoolId?: string;
  monthlyLimit?: number;
}

export interface SubuserUsage {
  sent: number;
  limit: number;
  remaining: number;
  period: string;
}

// Identity Types
export interface Identity {
  id: string;
  email: string;
  name?: string;
  replyTo?: string;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIdentityRequest {
  email: string;
  name?: string;
  replyTo?: string;
}

export interface UpdateIdentityRequest {
  name?: string;
  replyTo?: string;
}

export interface RecipientPreferences {
  email: string;
  unsubscribed: boolean;
  suppressionGroups: string[];
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  planTier: PlanTier;
  poolAssignment: {
    type: PoolType;
    tier: PlanTier;
    poolId: string | null;
  };
  quota: {
    limit: number;
    used: number;
    resetAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUpdate {
  userId: string;
  previousTier: PlanTier;
  newTier: PlanTier;
  poolAssignment: {
    type: PoolType;
    tier: string;
    poolId: string | null;
  };
  effectiveAt: string;
}

// IP Pool Types
export interface IpPool {
  id: string;
  name: string;
  poolType: PoolType;
  ipCount: number;
  warmup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIpPoolRequest {
  name: string;
  poolType: PoolType;
  warmup?: boolean;
}

export interface UpdateIpPoolRequest {
  name?: string;
  warmup?: boolean;
}

export interface DedicatedIp {
  id: string;
  ip: string;
  poolId?: string;
  warmupEnabled: boolean;
  warmupProgress?: number;
  region?: string;
  createdAt: string;
}

export interface CreateDedicatedIpRequest {
  region?: string;
  poolId?: string;
  warmupEnabled?: boolean;
}

export interface WarmupStatus {
  enabled: boolean;
  progress: number;
  dailyLimit: number;
  currentDaily: number;
}

// Inbound Types
export interface InboundDomain {
  id: string;
  domain: string;
  verified: boolean;
  verifiedAt?: string;
  forwardTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboundDomainRequest {
  domain: string;
  forwardTo?: string;
}

export interface UpdateInboundDomainRequest {
  forwardTo?: string;
}

// Template Utility Types
export interface MjmlCompileResult {
  html: string;
  errors: Array<{ line: number; message: string }>;
}

export interface ExtractedVariables {
  variables: string[];
}

export interface BulkTemplateResult {
  results: Array<{
    html: string;
    subject: string;
  }>;
}

// Admin Types
export interface AdminMailboxProvision {
  email: string;
}

export interface PoolFallbackMetrics {
  totalFallbacks: number;
  byPool: Record<string, number>;
  period: string;
}
