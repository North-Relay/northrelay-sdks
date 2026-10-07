/**
 * NorthRelay SDK - Official TypeScript/JavaScript client
 * 
 * @packageDocumentation
 */

export { NorthRelayClient } from './client';

export {
  NorthRelayError,
  AuthenticationError,
  ScopeError,
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
  EmailSource,
  EventType,
  CampaignStatus,
  ButtonStyle,
  
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
  WebhookEventType,
  WebhookPayload,
  WebhookPayloadBase,
  ContactSubscribedWebhook,
  ContactConfirmedWebhook,
  ContactUnsubscribedWebhook,
  ListMemberAddedWebhook,
  ListMemberRemovedWebhook,
  EmailOpenedWebhook,
  EmailClickedWebhook,
  EmailLifecycleWebhook,
  ContactSubscribedDetails,
  ContactConfirmedDetails,
  ContactUnsubscribedDetails,
  ListMemberDetails,
  EmailOpenedDetails,
  EmailClickedDetails,
  SubscriptionSource,
  UnsubscribeScope,
  UnsubscribeMethod,
  WebhookDelivery,
  WebhookFailure,
  WebhookHealth,
  WebhookFailureSettings,
  
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
  ContactStatus,
  ContactSource,
  ContactTag,
  ContactCustomField,
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsOptions,
  ContactList,
  ListType,
  CreateContactListRequest,
  UpdateContactListRequest,
  ListContactListsOptions,
  ContactListPage,
  BulkContactResult,
  BulkDeleteContactsResult,
  ContactImportJob,
  CsvImportField,
  CsvColumnMapping,
  ImportCsvOptions,
  ContactImportResult,
  ContactListMember,
  ListMemberSuppressionFlag,
  ListMembersOptions,
  ListMembersResponse,
  AddListMembersInput,
  AddListMembersResult,
  AddListMembersResponse,
  RemoveListMembersInput,
  SubscriptionErrorCode,
  
  // Brand Theme types
  SocialLink,
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
  SuppressionGroupMember,
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
  UserProfile,
  SubscriptionUpdate,
  
  // IP Pool types
  IpPool,
  CreateIpPoolRequest,
  UpdateIpPoolRequest,
  DedicatedIp,
  CreateDedicatedIpRequest,
  WarmupStatus,
  
  // Inbound types (legacy — inbox resource uses local types)
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

// Re-export runtime helpers
export { extractItems } from './types';

// Re-export webhook utilities
export { verifyWebhookSignature, parseWebhookEvent, parseWebhookPayload, constructWebhookPayload } from './webhooks';

export * from './resources/designs';

export * from './resources/credentials';

export * from './resources/subscriptions';

export * from './resources/forms';
