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
   * Get current brand theme
   */
  public async get(): Promise<{ success: true; data: BrandTheme }> {
    return withRetry(
      () => this.http.get('/api/v1/brand-theme'),
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
   * Update brand theme
   */
  public async update(request: UpdateBrandThemeRequest): Promise<{ success: true; data: BrandTheme }> {
    return withRetry(
      () => this.http.put('/api/v1/brand-theme', request),
      this.retryConfig
    );
  }

  /**
   * Delete brand theme
   */
  public async delete(): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete('/api/v1/brand-theme'),
      this.retryConfig
    );
  }
}
