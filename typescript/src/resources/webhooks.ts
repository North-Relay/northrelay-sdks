/**
 * Webhooks resource - Webhook management and delivery tracking
 */

import type { HttpClient } from '../utils/http';
import type { Webhook, WebhookDelivery, WebhookFailure, WebhookFailureSettings, WebhookHealth, CreateWebhookRequest, UpdateWebhookRequest, PaginatedResponse } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class WebhooksResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  public async list(): Promise<PaginatedResponse<Webhook>> {
    return withRetry(
      () => this.http.get('/api/v1/webhooks'),
      this.retryConfig
    );
  }

  public async get(id: string): Promise<{ success: true; data: Webhook }> {
    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${id}`),
      this.retryConfig
    );
  }

  public async create(request: CreateWebhookRequest): Promise<{ success: true; data: Webhook }> {
    return withRetry(
      () => this.http.post('/api/v1/webhooks', request),
      this.retryConfig
    );
  }

  public async update(id: string, request: UpdateWebhookRequest): Promise<{ success: true; data: Webhook }> {
    return withRetry(
      () => this.http.put(`/api/v1/webhooks/${id}`, request),
      this.retryConfig
    );
  }

  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/webhooks/${id}`),
      this.retryConfig
    );
  }

  public async rotateSecret(id: string): Promise<{ success: true; data: { secret: string } }> {
    return withRetry(
      () => this.http.post(`/api/v1/webhooks/${id}/rotate-secret`),
      this.retryConfig
    );
  }

  public async testDelivery(id: string): Promise<{ success: true; data: { delivered: boolean; statusCode: number } }> {
    return withRetry(
      () => this.http.post(`/api/v1/webhooks/${id}/test`),
      this.retryConfig
    );
  }

  /**
   * Get webhook health status
   */
  public async getHealth(id: string): Promise<{ success: true; data: WebhookHealth }> {
    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${id}/health`),
      this.retryConfig
    );
  }

  /**
   * List webhook deliveries
   */
  public async listDeliveries(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WebhookDelivery>> {
    const params = new URLSearchParams();
    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.limit !== undefined) params.set('limit', options.limit.toString());

    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${id}/deliveries?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * List webhook failures
   */
  public async listFailures(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WebhookFailure>> {
    const params = new URLSearchParams();
    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.limit !== undefined) params.set('limit', options.limit.toString());

    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${id}/failures?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Retry a failed webhook delivery
   */
  public async retryFailure(id: string, failureId: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/webhooks/${id}/failures/${failureId}/retry`),
      this.retryConfig
    );
  }

  /**
   * Get webhook failure settings
   */
  public async getFailureSettings(id: string): Promise<{ success: true; data: WebhookFailureSettings }> {
    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${id}/failure-settings`),
      this.retryConfig
    );
  }

  /**
   * Update webhook failure settings
   */
  public async updateFailureSettings(id: string, settings: Partial<WebhookFailureSettings>): Promise<{ success: true; data: WebhookFailureSettings }> {
    return withRetry(
      () => this.http.patch(`/api/v1/webhooks/${id}/failure-settings`, settings),
      this.retryConfig
    );
  }
}
