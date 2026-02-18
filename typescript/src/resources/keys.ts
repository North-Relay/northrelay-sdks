/**
 * Keys resource - API key rotation
 */

import type { HttpClient } from '../utils/http';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class KeysResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Rotate an API key (generates new key, invalidates old one)
   */
  public async rotate(id: string): Promise<{ success: true; data: { key: string; id: string } }> {
    return withRetry(
      () => this.http.post(`/api/v1/keys/${id}/rotate`),
      this.retryConfig
    );
  }
}
