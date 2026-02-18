/**
 * Identity resource - Sender identity management
 */

import type { HttpClient } from '../utils/http';
import type {
  Identity,
  CreateIdentityRequest,
  UpdateIdentityRequest,
  RecipientPreferences,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class IdentityResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List sender identities
   */
  public async list(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Identity>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/identity?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a sender identity
   */
  public async get(identity: string): Promise<{ success: true; data: Identity }> {
    return withRetry(
      () => this.http.get(`/api/v1/identity/${identity}`),
      this.retryConfig
    );
  }

  /**
   * Create a sender identity
   */
  public async create(request: CreateIdentityRequest): Promise<{ success: true; data: Identity }> {
    return withRetry(
      () => this.http.post('/api/v1/identity', request),
      this.retryConfig
    );
  }

  /**
   * Update a sender identity
   */
  public async update(identity: string, request: UpdateIdentityRequest): Promise<{ success: true; data: Identity }> {
    return withRetry(
      () => this.http.patch(`/api/v1/identity/${identity}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a sender identity
   */
  public async delete(identity: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/identity/${identity}`),
      this.retryConfig
    );
  }

  /**
   * Verify a sender identity
   */
  public async verify(identity: string): Promise<{ success: true; data: { verified: boolean } }> {
    return withRetry(
      () => this.http.post(`/api/v1/identity/${identity}/verify`),
      this.retryConfig
    );
  }

  /**
   * Get recipient preferences
   */
  public async getRecipientPreferences(email: string): Promise<{ success: true; data: RecipientPreferences }> {
    return withRetry(
      () => this.http.get(`/api/v1/recipients/${email}/preferences`),
      this.retryConfig
    );
  }
}
