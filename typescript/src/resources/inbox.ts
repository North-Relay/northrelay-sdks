/**
 * Inbox resource - Inbox sender address management
 */

import type { HttpClient } from '../utils/http';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export interface SenderAddress {
  email: string;
  name?: string;
  verified: boolean;
  domain: string;
}

export class InboxResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Get sender addresses for an inbox
   *
   * @param inboxId - Inbox/mailbox user ID
   * @returns List of verified sender addresses
   */
  public async getSenderAddresses(inboxId: string): Promise<{ success: true; data: SenderAddress[] }> {
    return withRetry(
      () => this.http.get(`/api/v1/inbox/${inboxId}/sender-addresses`),
      this.retryConfig
    );
  }

  /**
   * Validate a sender address for an inbox
   *
   * @param email - Sender email address to validate
   * @returns Validation result
   */
  public async validateSender(email: string): Promise<{ success: true; data: { valid: boolean; reason?: string } }> {
    return withRetry(
      () => this.http.post('/api/v1/inbox/validate-sender', { email }),
      this.retryConfig
    );
  }
}
