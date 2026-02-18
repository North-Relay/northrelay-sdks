/**
 * Metrics resource - Delivery metrics
 */

import type { HttpClient } from '../utils/http';
import type { DeliveryMetrics, MetricsSummary } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class MetricsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Get delivery metrics
   */
  public async get(options?: {
    startDate?: string;
    endDate?: string;
    poolType?: string;
  }): Promise<{ success: true; data: DeliveryMetrics }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    if (options?.poolType) params.set('poolType', options.poolType);
    
    return withRetry(
      () => this.http.get(`/api/v1/metrics?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get metrics summary
   */
  public async getSummary(options?: {
    period?: 'today' | 'week' | 'month';
  }): Promise<{ success: true; data: MetricsSummary }> {
    const params = new URLSearchParams();
    if (options?.period) params.set('period', options.period);
    
    return withRetry(
      () => this.http.get(`/api/v1/metrics/summary?${params.toString()}`),
      this.retryConfig
    );
  }
}
