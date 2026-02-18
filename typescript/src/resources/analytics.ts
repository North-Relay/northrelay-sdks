/**
 * Analytics resource - Advanced analytics and reporting
 */

import type { HttpClient } from '../utils/http';
import type {
  AnalyticsQuery,
  AnalyticsData,
  EngagementHeatmap,
  GeographicData,
  ProviderStats,
  AnalyticsExport,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class AnalyticsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Query analytics data
   */
  public async query(params: AnalyticsQuery): Promise<{ success: true; data: AnalyticsData[] }> {
    const urlParams = new URLSearchParams();
    if (params.startDate) urlParams.set('startDate', params.startDate);
    if (params.endDate) urlParams.set('endDate', params.endDate);
    if (params.groupBy) urlParams.set('groupBy', params.groupBy);
    if (params.metrics) urlParams.set('metrics', params.metrics.join(','));
    
    return withRetry(
      () => this.http.get(`/api/v1/analytics/query?${urlParams.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get engagement heatmap (opens/clicks by hour and day)
   */
  public async getEngagementHeatmap(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: true; data: EngagementHeatmap[] }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    
    return withRetry(
      () => this.http.get(`/api/v1/analytics/engagement-heatmap?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get geographic analytics
   */
  public async getGeographic(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: true; data: GeographicData[] }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    
    return withRetry(
      () => this.http.get(`/api/v1/analytics/geographic?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get provider statistics
   */
  public async getProviders(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: true; data: ProviderStats[] }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    
    return withRetry(
      () => this.http.get(`/api/v1/analytics/providers?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Request analytics export
   */
  public async requestExport(params: {
    startDate: string;
    endDate: string;
    format?: 'csv' | 'json';
  }): Promise<{ success: true; data: AnalyticsExport }> {
    return withRetry(
      () => this.http.post('/api/v1/analytics/export', params),
      this.retryConfig
    );
  }

  /**
   * Get export status and download URL
   */
  public async getExport(exportId: string): Promise<{ success: true; data: AnalyticsExport }> {
    return withRetry(
      () => this.http.get(`/api/v1/analytics/export/${exportId}`),
      this.retryConfig
    );
  }
}
