/**
 * NorthRelay SDK - Official TypeScript/JavaScript client
 * 
 * @packageDocumentation
 */

export { NorthRelayClient } from './client';

export {
  NorthRelayError,
  AuthenticationError,
  ValidationError,
  QuotaExceededError,
  RateLimitError,
  NotFoundError,
  ServerError,
  NetworkError,
} from './errors';

export type {
  // Base types
  PoolType,
  PlanTier,
  EmailStatus,
  EventType,
  CampaignStatus,
  
  // Email types
  EmailAddress,
  EmailContent,
  SendEmailRequest,
  SendEmailResponse,
  ErrorResponse,
  
  // Template types
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateVersion,
  MjmlCompileResult,
  ExtractedVariables,
  BulkTemplateResult,
  
  // Domain types
  Domain,
  CreateDomainRequest,
  
  // Webhook types
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookEvent,
  WebhookDelivery,
  WebhookFailure,
  WebhookFailureSettings,
  WebhookHealth,
  
  // API Key types
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  
  // Event types
  EmailEvent,
  
  // Campaign types
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignSendStatus,
  
  // Contact types
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactList,
  CreateContactListRequest,
  UpdateContactListRequest,
  BulkContactResult,
  ContactImportJob,
  
  // Brand Theme types
  BrandTheme,
  CreateBrandThemeRequest,
  UpdateBrandThemeRequest,
  
  // Analytics types
  AnalyticsQuery,
  AnalyticsData,
  EngagementHeatmap,
  GeographicData,
  ProviderStats,
  AnalyticsExport,
  
  // Metrics types
  DeliveryMetrics,
  MetricsSummary,
  
  // Suppression types
  Suppression,
  AddSuppressionRequest,
  SuppressionGroup,
  CreateSuppressionGroupRequest,
  UpdateSuppressionGroupRequest,
  
  // Subuser types
  Subuser,
  SubuserPermissions,
  CreateSubuserRequest,
  UpdateSubuserRequest,
  SubuserUsage,
  
  // Identity types
  Identity,
  CreateIdentityRequest,
  UpdateIdentityRequest,
  RecipientPreferences,
  
  // IP Pool types
  IpPool,
  CreateIpPoolRequest,
  UpdateIpPoolRequest,
  DedicatedIp,
  CreateDedicatedIpRequest,
  WarmupStatus,
  
  // Inbound types
  InboundDomain,
  CreateInboundDomainRequest,
  UpdateInboundDomainRequest,
  
  // Admin types
  AdminMailboxProvision,
  PoolFallbackMetrics,
  
  // Common types
  PaginatedResponse,
  RateLimitInfo,
  ClientConfig,
} from './types';

// Re-export webhook utilities
export { verifyWebhookSignature, parseWebhookEvent, constructWebhookPayload } from './webhooks';
