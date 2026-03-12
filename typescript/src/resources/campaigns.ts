/**
 * Campaigns resource - Campaign management and sending
 */

import type { HttpClient } from '../utils/http';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignSendStatus,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class CampaignsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Create a new campaign
   */
  public async create(request: CreateCampaignRequest): Promise<{ success: true; data: Campaign }> {
    return withRetry(
      () => this.http.post('/api/v1/campaigns', request),
      this.retryConfig
    );
  }

  /**
   * List campaigns with pagination and filtering
   */
  public async list(options?: {
    page?: number;
    limit?: number;
    status?: string;
    approvalStatus?: string;
    search?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.status) params.set('status', options.status);
    if (options?.approvalStatus) params.set('approvalStatus', options.approvalStatus);
    if (options?.search) params.set('search', options.search);

    return withRetry(
      () => this.http.get(`/api/v1/campaigns?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a campaign by ID
   */
  public async get(id: string): Promise<{ success: true; data: Campaign }> {
    return withRetry(
      () => this.http.get(`/api/v1/campaigns/${id}`),
      this.retryConfig
    );
  }

  /**
   * Update an existing campaign
   */
  public async update(id: string, request: UpdateCampaignRequest): Promise<{ success: true; data: Campaign }> {
    return withRetry(
      () => this.http.patch(`/api/v1/campaigns/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a campaign (only DRAFT or CANCELLED campaigns)
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/campaigns/${id}`),
      this.retryConfig
    );
  }

  /**
   * Get campaign preview HTML
   */
  public async preview(id: string): Promise<{ success: true; data: string }> {
    return withRetry(
      () => this.http.get(`/api/v1/campaigns/${id}/preview`),
      this.retryConfig
    );
  }

  /**
   * Submit campaign for approval
   */
  public async submit(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/campaigns/${id}/submit`),
      this.retryConfig
    );
  }

  /**
   * Approve a campaign (admin only)
   */
  public async approve(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/campaigns/${id}/approve`),
      this.retryConfig
    );
  }

  /**
   * Reject a campaign (admin only)
   */
  public async reject(id: string, reason?: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/campaigns/${id}/reject`, { reason }),
      this.retryConfig
    );
  }

  /**
   * Send a campaign immediately
   */
  public async send(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/campaigns/${id}/send`),
      this.retryConfig
    );
  }

  /**
   * Get campaign send status
   */
  public async getSendStatus(id: string): Promise<{ success: true; data: CampaignSendStatus }> {
    return withRetry(
      () => this.http.get(`/api/v1/campaigns/${id}/send`),
      this.retryConfig
    );
  }
}
