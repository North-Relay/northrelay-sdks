/**
 * IP Pools resource - IP pool management
 */

import type { HttpClient } from '../utils/http';
import type {
  IpPool,
  CreateIpPoolRequest,
  UpdateIpPoolRequest,
  DedicatedIp,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class IpPoolsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List IP pools
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<IpPool>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/ip-pools?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get an IP pool
   */
  public async get(id: string): Promise<{ success: true; data: IpPool }> {
    return withRetry(
      () => this.http.get(`/api/v1/ip-pools/${id}`),
      this.retryConfig
    );
  }

  /**
   * Get default IP pool
   */
  public async getDefault(): Promise<{ success: true; data: IpPool }> {
    return withRetry(
      () => this.http.get('/api/v1/ip-pools/default'),
      this.retryConfig
    );
  }

  /**
   * Create an IP pool
   */
  public async create(request: CreateIpPoolRequest): Promise<{ success: true; data: IpPool }> {
    return withRetry(
      () => this.http.post('/api/v1/ip-pools', request),
      this.retryConfig
    );
  }

  /**
   * Update an IP pool
   */
  public async update(id: string, request: UpdateIpPoolRequest): Promise<{ success: true; data: IpPool }> {
    return withRetry(
      () => this.http.patch(`/api/v1/ip-pools/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete an IP pool
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/ip-pools/${id}`),
      this.retryConfig
    );
  }

  /**
   * List IPs in a pool
   */
  public async listIps(id: string): Promise<{ success: true; data: DedicatedIp[] }> {
    return withRetry(
      () => this.http.get(`/api/v1/ip-pools/${id}/ips`),
      this.retryConfig
    );
  }

  /**
   * Add IP to pool
   */
  public async addIp(id: string, ipId: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/ip-pools/${id}/ips`, { ipId }),
      this.retryConfig
    );
  }

  /**
   * Remove IP from pool
   */
  public async removeIp(id: string, ipId: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/ip-pools/${id}/ips/${ipId}`),
      this.retryConfig
    );
  }
}
