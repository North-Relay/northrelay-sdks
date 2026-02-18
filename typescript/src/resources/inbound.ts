/**
 * Inbound resource - Inbound email domain management
 */

import type { HttpClient } from '../utils/http';
import type {
  InboundDomain,
  CreateInboundDomainRequest,
  UpdateInboundDomainRequest,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class InboundResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List inbound domains
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InboundDomain>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/inbound/domains?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get an inbound domain
   */
  public async get(id: string): Promise<{ success: true; data: InboundDomain }> {
    return withRetry(
      () => this.http.get(`/api/v1/inbound/domains/${id}`),
      this.retryConfig
    );
  }

  /**
   * Create an inbound domain
   */
  public async create(request: CreateInboundDomainRequest): Promise<{ success: true; data: InboundDomain }> {
    return withRetry(
      () => this.http.post('/api/v1/inbound/domains', request),
      this.retryConfig
    );
  }

  /**
   * Update an inbound domain
   */
  public async update(id: string, request: UpdateInboundDomainRequest): Promise<{ success: true; data: InboundDomain }> {
    return withRetry(
      () => this.http.patch(`/api/v1/inbound/domains/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete an inbound domain
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/inbound/domains/${id}`),
      this.retryConfig
    );
  }

  /**
   * Verify an inbound domain
   */
  public async verify(id: string): Promise<{ success: true; data: { verified: boolean } }> {
    return withRetry(
      () => this.http.post(`/api/v1/inbound/domains/${id}/verify`),
      this.retryConfig
    );
  }
}
