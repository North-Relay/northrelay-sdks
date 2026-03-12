/**
 * Suppression Groups resource - Suppression group management
 */

import type { HttpClient } from '../utils/http';
import type {
  SuppressionGroup,
  CreateSuppressionGroupRequest,
  UpdateSuppressionGroupRequest,
  Suppression,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class SuppressionGroupsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List suppression groups
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SuppressionGroup>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a suppression group
   */
  public async get(id: string): Promise<{ success: true; data: SuppressionGroup }> {
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups/${id}`),
      this.retryConfig
    );
  }

  /**
   * Create a suppression group
   */
  public async create(request: CreateSuppressionGroupRequest): Promise<{ success: true; data: SuppressionGroup }> {
    return withRetry(
      () => this.http.post('/api/v1/suppression-groups', request),
      this.retryConfig
    );
  }

  /**
   * Update a suppression group
   */
  public async update(id: string, request: UpdateSuppressionGroupRequest): Promise<{ success: true; data: SuppressionGroup }> {
    return withRetry(
      () => this.http.patch(`/api/v1/suppression-groups/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a suppression group
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/suppression-groups/${id}`),
      this.retryConfig
    );
  }

  // ========== Group Suppressions ==========

  /**
   * List suppressions in a group
   */
  public async listSuppressions(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Suppression>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups/${id}/suppressions?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Add email to suppression group
   */
  public async addSuppression(id: string, email: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${id}/suppressions`, { email }),
      this.retryConfig
    );
  }

  /**
   * Remove email from suppression group
   */
  public async removeSuppression(id: string, email: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/suppression-groups/${id}/suppressions/${email}`),
      this.retryConfig
    );
  }

  /**
   * Bulk add emails to suppression group
   */
  public async bulkAddSuppressions(id: string, emails: string[]): Promise<{ success: true; data: { added: number } }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${id}/suppressions/bulk`, { emails }),
      this.retryConfig
    );
  }
}
