/**
 * Subusers resource - Subuser management
 */

import type { HttpClient } from '../utils/http';
import type {
  Subuser,
  CreateSubuserRequest,
  UpdateSubuserRequest,
  SubuserUsage,
  SubuserPermissions,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class SubusersResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List subusers
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Subuser>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/subusers?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a subuser
   */
  public async get(id: string): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.get(`/api/v1/subusers/${id}`),
      this.retryConfig
    );
  }

  /**
   * Get subuser by username
   */
  public async getByUsername(username: string): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.get(`/api/v1/subusers/by-username/${encodeURIComponent(username)}`),
      this.retryConfig
    );
  }

  /**
   * Check if username is available
   */
  public async checkUsername(username: string): Promise<{ success: true; data: { available: boolean } }> {
    return withRetry(
      () => this.http.get(`/api/v1/subusers/check-username?${new URLSearchParams({ username })}`),
      this.retryConfig
    );
  }

  /**
   * Create a subuser
   */
  public async create(request: CreateSubuserRequest): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.post('/api/v1/subusers', request),
      this.retryConfig
    );
  }

  /**
   * Update a subuser
   */
  public async update(id: string, request: UpdateSubuserRequest): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.patch(`/api/v1/subusers/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a subuser
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/subusers/${id}`),
      this.retryConfig
    );
  }

  /**
   * Suspend a subuser
   */
  public async suspend(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/subusers/${id}/suspend`),
      this.retryConfig
    );
  }

  /**
   * Reactivate a subuser
   */
  public async reactivate(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/subusers/${id}/reactivate`),
      this.retryConfig
    );
  }

  /**
   * Rotate subuser API key
   */
  public async rotateApiKey(id: string): Promise<{ success: true; data: { key: string } }> {
    return withRetry(
      () => this.http.post(`/api/v1/subusers/${id}/api-key`),
      this.retryConfig
    );
  }

  /**
   * Update subuser permissions
   */
  public async updatePermissions(id: string, permissions: SubuserPermissions): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.patch(`/api/v1/subusers/${id}/permissions`, permissions),
      this.retryConfig
    );
  }

  /**
   * Set subuser monthly limit
   */
  public async setLimit(id: string, monthlyLimit: number): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.patch(`/api/v1/subusers/${id}/limit`, { monthlyLimit }),
      this.retryConfig
    );
  }

  /**
   * Set subuser IP pool
   */
  public async setIpPool(id: string, ipPoolId: string): Promise<{ success: true; data: Subuser }> {
    return withRetry(
      () => this.http.patch(`/api/v1/subusers/${id}/ip-pool`, { ipPoolId }),
      this.retryConfig
    );
  }

  /**
   * Get subuser usage
   */
  public async getUsage(id: string): Promise<{ success: true; data: SubuserUsage }> {
    return withRetry(
      () => this.http.get(`/api/v1/subusers/${id}/usage`),
      this.retryConfig
    );
  }
}
