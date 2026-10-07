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

  /** Lists webhooks. The server answers `{ webhooks: [...] }`. */
  public async list(): Promise<{ webhooks: Array<Webhook & { totalDeliveries?: number }> }> {
    return withRetry(
      () => this.http.get('/api/v1/webhooks'),
      this.retryConfig
    );
  }

  /** One webhook plus 24-hour delivery stats: `{ webhook, stats }`. */
  public async get(id: string): Promise<{ webhook: Webhook; stats: Record<string, number> }> {
    return withRetry(
      () => this.http.get(`/api/v1/webhooks/${encodeURIComponent(id)}`),
      this.retryConfig
    );
  }

  /**
   * Creates a webhook. The signing `secret` is returned only here; store it.
   * Not retried: a retry after a timeout could create a duplicate.
   */
  public async create(request: CreateWebhookRequest): Promise<{ webhook: Webhook; secret: string; message: string }> {
    return this.http.post('/api/v1/webhooks', request);
  }

  public async update(id: string, request: UpdateWebhookRequest): Promise<{ webhook: Webhook; message: string }> {
    return withRetry(
      () => this.http.patch(`/api/v1/webhooks/${encodeURIComponent(id)}`, request),
      this.retryConfig
    );
  }

  public async delete(id: string): Promise<{ message: string }> {
    return withRetry(
      () => this.http.delete(`/api/v1/webhooks/${encodeURIComponent(id)}`),
      this.retryConfig
    );
  }

  /** New secret, shown once; the previous one keeps verifying until previousSecretValidUntil. */
  public async rotateSecret(id: string): Promise<{ id: string; secret: string; previousSecretValidUntil: string }> {
    return this.http.post(`/api/v1/webhooks/${encodeURIComponent(id)}/rotate`);
  }

  public async testDelivery(id: string): Promise<{ success: boolean; statusCode?: number; responseTime?: number; deliveryId?: string; message?: string; errorMessage?: string }> {
    return this.http.post(`/api/v1/webhooks/${encodeURIComponent(id)}/test`);
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
