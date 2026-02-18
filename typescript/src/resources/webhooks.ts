/**
 * Webhooks resource - Webhook management and delivery tracking
 */

import type { HttpClient } from '../utils/http';
import type { Webhook, CreateWebhookRequest, UpdateWebhookRequest, PaginatedResponse } from '../types';
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
}
