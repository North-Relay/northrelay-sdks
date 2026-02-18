/**
 * API Keys resource - API key management
 */

import type { HttpClient } from '../utils/http';
import type { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse, PaginatedResponse } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class ApiKeysResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  public async list(): Promise<PaginatedResponse<ApiKey>> {
    return withRetry(
      () => this.http.get('/api/v1/api-keys'),
      this.retryConfig
    );
  }

  public async create(request: CreateApiKeyRequest): Promise<{ success: true; data: CreateApiKeyResponse }> {
    return withRetry(
      () => this.http.post('/api/v1/api-keys', request),
      this.retryConfig
    );
  }

  public async revoke(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/api-keys/${id}`),
      this.retryConfig
    );
  }
}
