/**
 * Emails resource - Email sending, scheduling, and validation
 */

import type { HttpClient } from '../utils/http';
import type { SendEmailRequest, SendEmailResponse, EmailEvent } from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class EmailsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Send a transactional email
   * 
   * @param request - Email send request
   * @returns Send response with message ID and quota info
   * 
   * @example
   * ```typescript
   * const result = await client.emails.send({
   *   from: { email: 'noreply@example.com', name: 'Example' },
   *   to: [{ email: 'user@example.com', name: 'User' }],
   *   content: {
   *     subject: 'Welcome!',
   *     html: '<h1>Welcome to our service!</h1>',
   *     text: 'Welcome to our service!'
   *   }
   * });
   * console.log('Message ID:', result.data.messageId);
   * ```
   */
  public async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    return withRetry(
      () => this.http.post<SendEmailResponse>('/api/v1/emails/send', request),
      this.retryConfig
    );
  }

  /**
   * Send email using a template
   * 
   * @param templateId - Template ID
   * @param to - Recipient(s)
   * @param variables - Template variables
   * @param options - Additional options (from, cc, bcc, themeId)
   * @returns Send response
   * 
   * @example
   * ```typescript
   * const result = await client.emails.sendTemplate(
   *   'tpl_abc123',
   *   [{ email: 'user@example.com' }],
   *   { name: 'John', verificationCode: '123456' },
   *   { from: { email: 'noreply@example.com' } }
   * );
   * ```
   */
  public async sendTemplate(
    templateId: string,
    to: Array<{ email: string; name?: string }>,
    variables: Record<string, string>,
    options: {
      from: { email: string; name?: string };
      cc?: Array<{ email: string; name?: string }>;
      bcc?: Array<{ email: string; name?: string }>;
      replyTo?: { email: string; name?: string };
      themeId?: string;
    }
  ): Promise<SendEmailResponse> {
    const request: SendEmailRequest = {
      from: options.from,
      to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      content: {
        subject: '', // Will be filled from template
        templateId,
      },
      variables,
      themeId: options.themeId,
    };

    return this.send(request);
  }

  /**
   * Schedule an email for future delivery
   * 
   * @param request - Email send request
   * @param scheduledFor - ISO 8601 timestamp
   * @returns Scheduled email details
   * 
   * @example
   * ```typescript
   * const futureDate = new Date();
   * futureDate.setHours(futureDate.getHours() + 24);
   * 
   * const result = await client.emails.schedule(
   *   {
   *     from: { email: 'noreply@example.com' },
   *     to: [{ email: 'user@example.com' }],
   *     content: { subject: 'Reminder', text: 'Your appointment is tomorrow' }
   *   },
   *   futureDate.toISOString()
   * );
   * ```
   */
  public async schedule(
    request: SendEmailRequest,
    scheduledFor: string
  ): Promise<{ success: true; data: { id: string; scheduledFor: string } }> {
    return withRetry(
      () =>
        this.http.post('/api/v1/emails/schedule', {
          ...request,
          scheduledFor,
        }),
      this.retryConfig
    );
  }

  /**
   * Cancel a scheduled email
   * 
   * @param messageId - Message ID of scheduled email
   * @returns Cancellation confirmation
   */
  public async cancel(messageId: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/emails/${messageId}/cancel`),
      this.retryConfig
    );
  }

  /**
   * Validate email addresses (syntax and deliverability)
   * 
   * @param emails - Email address(es) to validate
   * @returns Validation results
   * 
   * @example
   * ```typescript
   * const result = await client.emails.validate('user@example.com');
   * console.log('Valid:', result.data.valid);
   * console.log('Deliverable:', result.data.deliverable);
   * ```
   */
  public async validate(
    emails: string | string[]
  ): Promise<{
    success: true;
    data: Array<{
      email: string;
      valid: boolean;
      deliverable: boolean;
      reason?: string;
    }>;
  }> {
    const emailList = Array.isArray(emails) ? emails : [emails];

    if (emailList.length === 1) {
      return withRetry(
        () => this.http.post('/api/v1/emails/validate', { email: emailList[0] }),
        this.retryConfig
      );
    } else {
      return withRetry(
        () => this.http.post('/api/v1/emails/validate/bulk', { emails: emailList }),
        this.retryConfig
      );
    }
  }

  /**
   * Send batch emails (up to 1000 recipients)
   * 
   * @param emails - Array of email send requests
   * @returns Batch send results
   * 
   * @example
   * ```typescript
   * const result = await client.emails.sendBatch([
   *   {
   *     from: { email: 'noreply@example.com' },
   *     to: [{ email: 'user1@example.com' }],
   *     content: { subject: 'Hello 1', text: 'Message 1' }
   *   },
   *   {
   *     from: { email: 'noreply@example.com' },
   *     to: [{ email: 'user2@example.com' }],
   *     content: { subject: 'Hello 2', text: 'Message 2' }
   *   }
   * ]);
   * ```
   */
  public async sendBatch(
    emails: SendEmailRequest[]
  ): Promise<{
    success: true;
    data: { accepted: number; rejected: number; results: Array<{ messageId: string; status: string }> };
  }> {
    if (emails.length === 0) {
      throw new Error('At least one email is required');
    }

    if (emails.length > 1000) {
      throw new Error('Maximum 1000 emails per batch');
    }

    return withRetry(
      () => this.http.post('/api/v1/emails/batch', { emails }),
      this.retryConfig
    );
  }

  /**
   * Get email events for a specific message
   * 
   * @param messageId - Message ID
   * @returns Email events (sent, delivered, opened, clicked, bounced, etc.)
   */
  public async getEvents(messageId: string): Promise<{ success: true; data: EmailEvent[] }> {
    return withRetry(
      () => this.http.get(`/api/v1/emails/${messageId}/events`),
      this.retryConfig
    );
  }
}
