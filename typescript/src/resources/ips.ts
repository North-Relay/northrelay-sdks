/**
 * IPs resource - Dedicated IP management
 */

import type { HttpClient } from '../utils/http';
import type {
  DedicatedIp,
  CreateDedicatedIpRequest,
  WarmupStatus,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class IpsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List dedicated IPs
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<DedicatedIp>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/ips?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a dedicated IP
   */
  public async get(id: string): Promise<{ success: true; data: DedicatedIp }> {
    return withRetry(
      () => this.http.get(`/api/v1/ips/${id}`),
      this.retryConfig
    );
  }

  /**
   * Purchase a dedicated IP
   */
  public async purchase(request: CreateDedicatedIpRequest): Promise<{ success: true; data: DedicatedIp }> {
    return withRetry(
      () => this.http.post('/api/v1/ips', request),
      this.retryConfig
    );
  }

  /**
   * Delete a dedicated IP
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/ips/${id}`),
      this.retryConfig
    );
  }

  /**
   * Get warmup status
   */
  public async getWarmupStatus(id: string): Promise<{ success: true; data: WarmupStatus }> {
    return withRetry(
      () => this.http.get(`/api/v1/ips/${id}/warmup`),
      this.retryConfig
    );
  }

  /**
   * Update warmup settings
   */
  public async updateWarmup(id: string, enabled: boolean): Promise<{ success: true; data: DedicatedIp }> {
    return withRetry(
      () => this.http.patch(`/api/v1/ips/${id}/warmup`, { enabled }),
      this.retryConfig
    );
  }
}
