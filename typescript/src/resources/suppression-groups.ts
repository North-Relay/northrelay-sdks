/**
 * Suppression Groups resource - topics (suppression groups) and their opt-outs.
 *
 * A member of a suppression group is an address that opted OUT of that
 * topic. To opt someone back in with consent, prefer
 * `client.subscriptions.subscribe({ email, topicIds })` or
 * `client.subscriptions.updatePreferences()`.
 */

import type { HttpClient } from '../utils/http';
import type {
  SuppressionGroup,
  CreateSuppressionGroupRequest,
  UpdateSuppressionGroupRequest,
  SuppressionGroupMember,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

const seg = encodeURIComponent;

function pageQuery(options?: { page?: number; limit?: number }): string {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class SuppressionGroupsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List suppression groups (topics). `published: true` returns only the
   * topics shown on the unsubscribe page, in display order.
   */
  public async list(options?: {
    page?: number;
    /** 1-100, default 25. */
    limit?: number;
    published?: boolean;
  }): Promise<PaginatedResponse<SuppressionGroup>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.published) params.set('published', 'true');
    const qs = params.toString();
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups${qs ? `?${qs}` : ''}`),
      this.retryConfig
    );
  }

  /**
   * Get a suppression group
   */
  public async get(id: string): Promise<{ success: true; data: SuppressionGroup }> {
    return withRetry(() => this.http.get(`/api/v1/suppression-groups/${seg(id)}`), this.retryConfig);
  }

  /**
   * Create a suppression group
   */
  public async create(request: CreateSuppressionGroupRequest): Promise<{ success: true; data: SuppressionGroup }> {
    return this.http.post('/api/v1/suppression-groups', request);
  }

  /**
   * Update a suppression group, including how it appears on the unsubscribe
   * page (`publicLabel`, `publicDescription`, `isPublishedOnUnsub`, `sortOrder`).
   */
  public async update(id: string, request: UpdateSuppressionGroupRequest): Promise<{ success: true; data: SuppressionGroup }> {
    return withRetry(
      () => this.http.patch(`/api/v1/suppression-groups/${seg(id)}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a suppression group
   */
  public async delete(id: string): Promise<{ success: true; data: { id: string; deleted: true } }> {
    return withRetry(() => this.http.delete(`/api/v1/suppression-groups/${seg(id)}`), this.retryConfig);
  }

  // ========== Members (opt-outs) ==========

  /**
   * List the addresses that opted out of a topic.
   */
  public async listMembers(id: string, options?: { page?: number; limit?: number }): Promise<PaginatedResponse<SuppressionGroupMember>> {
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups/${seg(id)}/members${pageQuery(options)}`),
      this.retryConfig
    );
  }

  /**
   * Opt an address out of a topic (email is lowercased by the API).
   */
  public async addMember(id: string, email: string): Promise<{ success: true; data: SuppressionGroupMember }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${seg(id)}/members`, { email }),
      this.retryConfig
    );
  }

  /**
   * Remove an address's opt-out from a topic. Succeeds even when the address
   * was not a member.
   */
  public async removeMember(id: string, email: string): Promise<{ success: true; data: { ok: true; email: string } }> {
    return withRetry(
      () => this.http.delete(`/api/v1/suppression-groups/${seg(id)}/members/${seg(email)}`),
      this.retryConfig
    );
  }

  // ========== Group Suppressions (API-key routes) ==========

  /**
   * List suppressions in a group (API key only; same rows as `listMembers`).
   */
  public async listSuppressions(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SuppressionGroupMember & { id: string; groupId: string }>> {
    return withRetry(
      () => this.http.get(`/api/v1/suppression-groups/${seg(id)}/suppressions${pageQuery(options)}`),
      this.retryConfig
    );
  }

  /**
   * Add email to suppression group (API key only).
   */
  public async addSuppression(id: string, email: string): Promise<{ success: true; data: SuppressionGroupMember }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${seg(id)}/suppressions`, { email }),
      this.retryConfig
    );
  }

  /**
   * Remove email from suppression group (API key only). The email must match
   * exactly; throws 404 when it is not in the group.
   */
  public async removeSuppression(id: string, email: string): Promise<{ success: true; data: { email: string; removed: true } }> {
    return withRetry(
      () => this.http.delete(`/api/v1/suppression-groups/${seg(id)}/suppressions/${seg(email)}`),
      this.retryConfig
    );
  }

  /**
   * Bulk add emails to suppression group (up to 10,000; API key only).
   */
  public async bulkAddSuppressions(id: string, emails: string[]): Promise<{ success: true; data: { action: 'add'; requested: number; added: number } }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${seg(id)}/suppressions/bulk`, { action: 'add', emails }),
      this.retryConfig
    );
  }

  /**
   * Bulk remove emails from suppression group (up to 10,000; API key only).
   */
  public async bulkRemoveSuppressions(id: string, emails: string[]): Promise<{ success: true; data: { action: 'remove'; requested: number; removed: number } }> {
    return withRetry(
      () => this.http.post(`/api/v1/suppression-groups/${seg(id)}/suppressions/bulk`, { action: 'remove', emails }),
      this.retryConfig
    );
  }
}
