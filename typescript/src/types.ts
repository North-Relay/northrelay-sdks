/**
 * Type definitions for NorthRelay API
 */

export type PoolType = 'Shared' | 'Isolated';
export type PlanTier = 'Sandbox' | 'Micro' | 'Startup' | 'Scale' | 'Enterprise';
export type EmailStatus = 'Queued' | 'Processing' | 'Sent' | 'Delivered' | 'Bounced' | 'Failed' | 'Deferred';
export type EventType = 'Queued' | 'Processing' | 'Sent' | 'Delivered' | 'Bounced' | 'Opened' | 'Clicked' | 'Complained' | 'Unsubscribed' | 'Dropped';
export type EmailSource = 'API' | 'INBOX' | 'SMTP' | 'INBOUND' | 'SCHEDULED' | 'TEST';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
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
  variables: unknown;
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

export interface Webhook {
  id: string;
  url: string;
  events: EventType[];
  active: boolean;
  secret: string;
  lastDeliveryAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: EventType[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: EventType[];
  active?: boolean;
  description?: string;
}

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

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
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
export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactListRequest {
  name: string;
  description?: string;
}

export interface UpdateContactListRequest {
  name?: string;
  description?: string;
}

export interface BulkContactResult {
  created: number;
  updated: number;
  failed: number;
}

export interface ContactImportJob {
  jobId: string;
  status: string;
}

// Brand Theme Types
export interface BrandTheme {
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
  font_family?: string;
  font_url?: string;
  defaultFromName?: string;
  defaultFromEmail?: string;
  trackingDomain?: string;
  trackingDomainVerified?: boolean;
  unsubscribePageTitle?: string;
  unsubscribePageMessage?: string;
}

export type CreateBrandThemeRequest = BrandTheme;
export type UpdateBrandThemeRequest = Partial<BrandTheme>;

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

export interface SuppressionGroup {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
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
