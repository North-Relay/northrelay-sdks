/**
 * Suppressions resource - Suppression list management
 */

import type { HttpClient } from '../utils/http';
import type { Suppression, AddSuppressionRequest, PaginatedResponse } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class SuppressionsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List suppressions
   */
  public async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Suppression>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.search) params.set('search', options.search);
    
    return withRetry(
      () => this.http.get(`/api/v1/suppressions?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Add email to suppression list
   */
  public async add(request: AddSuppressionRequest): Promise<{ success: true; data: Suppression }> {
    return withRetry(
      () => this.http.post('/api/v1/suppressions', request),
      this.retryConfig
    );
  }

  /**
   * Remove email from suppression list
   */
  public async remove(email: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/suppressions/${encodeURIComponent(email)}`),
      this.retryConfig
    );
  }

  /**
   * Bulk add suppressions
   */
  public async bulkAdd(emails: string[]): Promise<{ success: true; data: { added: number } }> {
    return withRetry(
      () => this.http.post('/api/v1/suppressions/bulk', { emails }),
      this.retryConfig
    );
  }
}
