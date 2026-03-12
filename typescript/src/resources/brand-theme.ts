/**
 * Brand Theme resource - UI customization
 */

import type { HttpClient } from '../utils/http';
import type { BrandTheme, CreateBrandThemeRequest, UpdateBrandThemeRequest } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class BrandThemeResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Get default brand theme, or a specific theme by ID
   */
  public async get(id?: string): Promise<{ success: true; data: BrandTheme }> {
    const url = id ? `/api/v1/brand-theme?id=${id}` : '/api/v1/brand-theme';
    return withRetry(
      () => this.http.get(url),
      this.retryConfig
    );
  }

  /**
   * List all brand themes
   */
  public async list(): Promise<{ success: true; data: BrandTheme[]; meta: { count: number; limit: number | null } }> {
    return withRetry(
      () => this.http.get('/api/v1/brand-theme?all=true'),
      this.retryConfig
    );
  }

  /**
   * Create brand theme
   */
  public async create(request: CreateBrandThemeRequest): Promise<{ success: true; data: BrandTheme }> {
    return withRetry(
      () => this.http.post('/api/v1/brand-theme', request),
      this.retryConfig
    );
  }

  /**
   * Update a brand theme by ID, or the default theme if no ID provided
   */
  public async update(request: UpdateBrandThemeRequest, id?: string): Promise<{ success: true; data: BrandTheme }> {
    const url = id ? `/api/v1/brand-theme?id=${id}` : '/api/v1/brand-theme';
    return withRetry(
      () => this.http.put(url, request),
      this.retryConfig
    );
  }

  /**
   * Delete a brand theme by ID
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/brand-theme?id=${id}`),
      this.retryConfig
    );
  }

  /**
   * Set a custom tracking domain
   */
  public async setTrackingDomain(
    id: string,
    domain: string
  ): Promise<{ success: true; data: { trackingDomain: string; verified: boolean; cname: { type: string; name: string; value: string; status: string } } }> {
    return withRetry(
      () => this.http.put(`/api/v1/brand-theme/${id}/tracking-domain`, { domain }),
      this.retryConfig
    );
  }

  /**
   * Verify a custom tracking domain's CNAME
   */
  public async verifyTrackingDomain(
    id: string
  ): Promise<{ success: true; data: { trackingDomain: string; verified: boolean } }> {
    return withRetry(
      () => this.http.get(`/api/v1/brand-theme/${id}/tracking-domain/verify`),
      this.retryConfig
    );
  }

  /**
   * Remove a custom tracking domain
   */
  public async removeTrackingDomain(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/brand-theme/${id}/tracking-domain`),
      this.retryConfig
    );
  }
}
