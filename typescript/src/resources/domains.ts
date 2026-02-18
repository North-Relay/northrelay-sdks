/**
 * Domains resource - Domain verification and management
 */

import type { HttpClient } from '../utils/http';
import type { Domain, CreateDomainRequest, PaginatedResponse } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class DomainsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  public async list(): Promise<PaginatedResponse<Domain>> {
    return withRetry(
      () => this.http.get('/api/v1/domains'),
      this.retryConfig
    );
  }

  public async get(id: string): Promise<{ success: true; data: Domain }> {
    return withRetry(
      () => this.http.get(`/api/v1/domains/${id}`),
      this.retryConfig
    );
  }

  public async create(request: CreateDomainRequest): Promise<{ success: true; data: Domain }> {
    return withRetry(
      () => this.http.post('/api/v1/domains', request),
      this.retryConfig
    );
  }

  public async verify(id: string): Promise<{
    success: true;
    data: { verified: boolean; records: Record<string, { status: string; value?: string }> };
  }> {
    return withRetry(
      () => this.http.post(`/api/v1/domains/${id}/verify`),
      this.retryConfig
    );
  }

  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/domains/${id}`),
      this.retryConfig
    );
  }
}
