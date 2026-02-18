/**
 * Events resource - Email event tracking and analytics
 */

import type { HttpClient } from '../utils/http';
import type { EmailEvent, PaginatedResponse, EventType } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class EventsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  public async list(options?: {
    page?: number;
    limit?: number;
    eventType?: EventType;
    messageId?: string;
    recipient?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<EmailEvent>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.eventType) params.set('eventType', options.eventType);
    if (options?.messageId) params.set('messageId', options.messageId);
    if (options?.recipient) params.set('recipient', options.recipient);
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);

    return withRetry(
      () => this.http.get(`/api/v1/events?${params.toString()}`),
      this.retryConfig
    );
  }

  public async get(id: string): Promise<{ success: true; data: EmailEvent }> {
    return withRetry(
      () => this.http.get(`/api/v1/events/${id}`),
      this.retryConfig
    );
  }

  public async getByMessageId(messageId: string): Promise<{ success: true; data: EmailEvent[] }> {
    return withRetry(
      () => this.http.get(`/api/v1/events?messageId=${messageId}`),
      this.retryConfig
    );
  }
}
