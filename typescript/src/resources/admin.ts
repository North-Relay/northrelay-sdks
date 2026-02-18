/**
 * Admin resource - Admin-only operations
 */

import type { HttpClient } from '../utils/http';
import type { AdminMailboxProvision, PoolFallbackMetrics } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class AdminResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Provision Stalwart mailbox for existing user (admin only)
   */
  public async provisionMailbox(request: AdminMailboxProvision): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post('/api/v1/admin/provision-mailbox', request),
      this.retryConfig
    );
  }

  /**
   * Get pool fallback metrics (admin only)
   */
  public async getPoolFallbackMetrics(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: true; data: PoolFallbackMetrics }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    
    return withRetry(
      () => this.http.get(`/api/v1/admin/metrics/pool-fallback?${params.toString()}`),
      this.retryConfig
    );
  }
}
