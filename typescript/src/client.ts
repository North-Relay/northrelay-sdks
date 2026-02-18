/**
 * Main NorthRelay SDK client
 */

import { HttpClient } from './utils/http';
import { withRetry, DEFAULT_RETRY_CONFIG } from './utils/retry';
import { EmailsResource } from './resources/emails';
import { TemplatesResource } from './resources/templates';
import { DomainsResource } from './resources/domains';
import { WebhooksResource} from './resources/webhooks';
import { ApiKeysResource } from './resources/api-keys';
import { EventsResource } from './resources/events';
import { CampaignsResource } from './resources/campaigns';
import { ContactsResource } from './resources/contacts';
import { BrandThemeResource } from './resources/brand-theme';
import { AnalyticsResource } from './resources/analytics';
import { MetricsResource } from './resources/metrics';
import { SuppressionsResource } from './resources/suppressions';
import { SuppressionGroupsResource } from './resources/suppression-groups';
import { SubusersResource } from './resources/subusers';
import { IdentityResource } from './resources/identity';
import { IpPoolsResource } from './resources/ip-pools';
import { IpsResource } from './resources/ips';
import { InboundResource } from './resources/inbound';
import { AdminResource } from './resources/admin';
import { KeysResource } from './resources/keys';
import type { ClientConfig, RateLimitInfo } from './types';

export class NorthRelayClient {
  private http: HttpClient;
  private retryConfig: typeof DEFAULT_RETRY_CONFIG;

  // Core resources
  public readonly emails: EmailsResource;
  public readonly templates: TemplatesResource;
  public readonly domains: DomainsResource;
  public readonly webhooks: WebhooksResource;
  public readonly apiKeys: ApiKeysResource;
  public readonly events: EventsResource;
  
  // Campaign & Contact resources
  public readonly campaigns: CampaignsResource;
  public readonly contacts: ContactsResource;
  
  // Customization
  public readonly brandTheme: BrandThemeResource;
  
  // Analytics & Metrics
  public readonly analytics: AnalyticsResource;
  public readonly metrics: MetricsResource;
  
  // Suppression management
  public readonly suppressions: SuppressionsResource;
  public readonly suppressionGroups: SuppressionGroupsResource;
  
  // User management
  public readonly subusers: SubusersResource;
  public readonly identity: IdentityResource;
  
  // Infrastructure
  public readonly ipPools: IpPoolsResource;
  public readonly ips: IpsResource;
  public readonly inbound: InboundResource;
  
  // Admin & utilities
  public readonly admin: AdminResource;
  public readonly keys: KeysResource;

  constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required. Get your API key at https://app.northrelay.ca/settings/api-keys');
    }

    if (!config.apiKey.startsWith('nr_live_') && !config.apiKey.startsWith('nr_test_')) {
      throw new Error('Invalid API key format. API keys must start with "nr_live_" or "nr_test_"');
    }

    const baseUrl = config.baseUrl || 'https://app.northrelay.ca';
    const timeout = config.timeout || 30000; // 30 seconds default

    this.http = new HttpClient({
      baseURL: baseUrl,
      apiKey: config.apiKey,
      timeout,
    });

    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: config.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
      initialDelayMs: config.retryDelay ?? DEFAULT_RETRY_CONFIG.initialDelayMs,
    };

    // Initialize resource modules
    this.emails = new EmailsResource(this.http, this.retryConfig);
    this.templates = new TemplatesResource(this.http, this.retryConfig);
    this.domains = new DomainsResource(this.http, this.retryConfig);
    this.webhooks = new WebhooksResource(this.http, this.retryConfig);
    this.apiKeys = new ApiKeysResource(this.http, this.retryConfig);
    this.events = new EventsResource(this.http, this.retryConfig);
    this.campaigns = new CampaignsResource(this.http, this.retryConfig);
    this.contacts = new ContactsResource(this.http, this.retryConfig);
    this.brandTheme = new BrandThemeResource(this.http, this.retryConfig);
    this.analytics = new AnalyticsResource(this.http, this.retryConfig);
    this.metrics = new MetricsResource(this.http, this.retryConfig);
    this.suppressions = new SuppressionsResource(this.http, this.retryConfig);
    this.suppressionGroups = new SuppressionGroupsResource(this.http, this.retryConfig);
    this.subusers = new SubusersResource(this.http, this.retryConfig);
    this.identity = new IdentityResource(this.http, this.retryConfig);
    this.ipPools = new IpPoolsResource(this.http, this.retryConfig);
    this.ips = new IpsResource(this.http, this.retryConfig);
    this.inbound = new InboundResource(this.http, this.retryConfig);
    this.admin = new AdminResource(this.http, this.retryConfig);
    this.keys = new KeysResource(this.http, this.retryConfig);
  }

  /**
   * Get current rate limit information
   */
  public getRateLimitInfo(): RateLimitInfo | null {
    return this.http.getRateLimitInfo();
  }

  /**
   * Execute a function with retry logic
   */
  public async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn, this.retryConfig);
  }
}
