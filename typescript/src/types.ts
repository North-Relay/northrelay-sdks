/**
 * Type definitions for NorthRelay API
 */

export type PoolType = 'Shared' | 'Isolated';
export type PlanTier = 'Sandbox' | 'Micro' | 'Startup' | 'Scale' | 'Enterprise';
export type EmailStatus = 'Queued' | 'Sent' | 'Delivered' | 'Bounced' | 'Failed' | 'Opened' | 'Clicked';
export type EventType = 'Sent' | 'Delivered' | 'Bounced' | 'Opened' | 'Clicked' | 'Complained' | 'Unsubscribed' | 'Dropped';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  themeId?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  themeId?: string;
  isActive?: boolean;
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
  eventType: EventType;
  statusCode: number;
  responseBody?: string;
  duration: number;
  createdAt: string;
}

export interface WebhookFailure {
  id: string;
  webhookId: string;
  eventType: EventType;
  statusCode?: number;
  errorMessage: string;
  retryCount: number;
  lastRetryAt?: string;
  createdAt: string;
}

export interface WebhookFailureSettings {
  maxRetries: number;
  disableAfterFailures: number;
  alertEmail?: string;
}

export interface WebhookHealth {
  healthy: boolean;
  successRate: number;
  totalDeliveries: number;
  totalFailures: number;
  lastDeliveryAt?: string;
  lastFailureAt?: string;
}

// Template versioning
export interface TemplateVersion {
  version: number;
  name?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  variables?: string[];
  createdAt: string;
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
export type CampaignStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  contactListId: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  templateId: string;
  contactListId: string;
  scheduledFor?: string;
  status?: CampaignStatus;
}

export interface UpdateCampaignRequest {
  name?: string;
  templateId?: string;
  contactListId?: string;
  scheduledFor?: string;
  status?: CampaignStatus;
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
