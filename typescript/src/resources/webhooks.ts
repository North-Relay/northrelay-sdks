/**
 * Webhooks resource - Webhook management and delivery tracking
 */

import type { HttpClient } from '../utils/http';
import type { Webhook, CreateWebhookRequest, UpdateWebhookRequest, WebhookDelivery, WebhookFailure, WebhookHealth, WebhookFailureSettings, PaginatedResponse } from '../types';
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
      () => this.http.post(`/api/v1/webhooks/${id}/rotate`),
      this.retryConfig
    );
  }

  public async testDelivery(id: string): Promise<{ success: true; data: { delivered: boolean; statusCode: number } }> {
    return withRetry(
      () => this.http.post(`/api/v1/webhooks/${id}/test`),
      this.retryConfig
    );
  }

  public async listDeliveries(id: string, options?: { page?: number; limit?: number }): Promise<PaginatedResponse<WebhookDelivery>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    return withRetry(() => this.http.get(`/api/v1/webhooks/${id}/deliveries?${params.toString()}`), this.retryConfig);
  }

  public async listFailures(id: string, options?: { limit?: number; offset?: number }): Promise<{ success: true; data: WebhookFailure[] }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    return withRetry(() => this.http.get(`/api/v1/webhooks/${id}/failures?${params.toString()}`), this.retryConfig);
  }

  public async getFailure(id: string, failureId: string): Promise<{ success: true; data: WebhookFailure }> {
    return withRetry(() => this.http.get(`/api/v1/webhooks/${id}/failures/${failureId}`), this.retryConfig);
  }

  public async retryFailure(id: string, failureId: string): Promise<{ success: true }> {
    return withRetry(() => this.http.post(`/api/v1/webhooks/${id}/failures/${failureId}/retry`), this.retryConfig);
  }

  public async getHealth(id: string): Promise<{ success: true; data: WebhookHealth }> {
    return withRetry(() => this.http.get(`/api/v1/webhooks/${id}/health`), this.retryConfig);
  }

  public async getFailureSettings(id: string): Promise<{ success: true; data: WebhookFailureSettings }> {
    return withRetry(() => this.http.get(`/api/v1/webhooks/${id}/failure-settings`), this.retryConfig);
  }

  public async updateFailureSettings(id: string, settings: Partial<WebhookFailureSettings>): Promise<{ success: true; data: WebhookFailureSettings }> {
    return withRetry(() => this.http.put(`/api/v1/webhooks/${id}/failure-settings`, settings), this.retryConfig);
  }
}
