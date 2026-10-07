/**
 * Subscriptions resource - consent-aware subscribe / unsubscribe, status and
 * preferences for mailing lists and topics.
 *
 * A *list* is a contact list (`client.contacts.*List*`). A *topic* is a
 * suppression group (`client.suppressionGroups`): membership in a topic means
 * the address opted OUT of it, so subscribing to a topic removes the opt-out.
 *
 * API reference: https://docs.northrelay.ca/api-reference/subscriptions
 */

import type { HttpClient } from '../utils/http';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';
import { NorthRelayError } from '../errors';
import type { SubscriptionErrorCode, UnsubscribeScope } from '../types';


/** Consent evidence stored on the contact (CASL / GDPR). */
export interface SubscriptionConsent {
  /** IP address the subscriber consented from (forward it from your server). */
  ip?: string;
  userAgent?: string;
  /** The wording the subscriber agreed to. */
  text?: string;
}

export interface SubscribeRequest {
  /** Normalised to lowercase by the API. */
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** Lists to add the contact to (at most 50). */
  listIds?: string[];
  /** Topics to (re)join, i.e. remove any opt-out (at most 50). */
  topicIds?: string[];
  /** At most 50. */
  tags?: string[];
  customFields?: Record<string, string>;
  metadata?: Record<string, unknown>;
  /**
   * Send a confirmation email; the contact stays `PENDING` until the
   * recipient clicks the link.
   */
  doubleOptIn?: boolean;
  /** Your template for the confirmation email; must contain `{{confirm_url}}`. */
  confirmationTemplateId?: string;
  /** Where to send the recipient after confirming; https only. */
  redirectUrl?: string;
  /**
   * Required to re-add someone who unsubscribed. Only set it when they gave
   * fresh consent, ideally with `doubleOptIn: true`.
   */
  resubscribe?: boolean;
  consent?: SubscriptionConsent;
}

export interface SubscribeResult {
  contactId: string;
  email: string;
  status: 'ACTIVE' | 'PENDING';
  /** True when the contact was created by this call (HTTP 201). */
  created: boolean;
  listIds: string[];
  /** Lists the contact was not already an active member of. */
  addedToListIds: string[];
  topicIds: string[];
  requiresConfirmation: boolean;
  confirmationSent: boolean;
}

export interface UnsubscribeRequest {
  email: string;
  /** `all` (default) unsubscribes from everything; `list` / `topic` need `listId` / `topicId`. */
  scope?: UnsubscribeScope;
  listId?: string;
  topicId?: string;
  reason?: string;
}

export interface UnsubscribeResult {
  email: string;
  /** Null when the address is not a contact (it is still suppressed for scope `all`). */
  contactId: string | null;
  scope: UnsubscribeScope;
  /** False when the address was already unsubscribed at that scope. */
  changed: boolean;
}

export interface SubscriptionStatus {
  email: string;
  contact: {
    id: string;
    status: string;
    firstName: string | null;
    lastName: string | null;
    subscribedAt: string;
    unsubscribedAt: string | null;
    confirmedAt: string | null;
    consent: { source: string | null; at: string | null; ip: string | null; userAgent: string | null; text: string | null };
  } | null;
  /** Account-level suppression (Bounce, Complaint, Unsubscribe or Manual). */
  suppression: { reason: string; since: string } | null;
  /** True when only transactional mail reaches this address. */
  unsubscribedFromAll: boolean;
  pendingConfirmation: { expiresAt: string } | null;
  lists: Array<{ id: string; name: string; subscribed: boolean; addedAt: string; removedAt: string | null }>;
  topics: Array<{ id: string; name: string; label: string | null; description: string | null; subscribed: boolean }>;
}

export interface UpdatePreferencesRequest {
  /** topicId -> subscribed */
  topics?: Record<string, boolean>;
  /** listId -> subscribed */
  lists?: Record<string, boolean>;
  /** Unsubscribe from everything (takes precedence over `topics` / `lists`). */
  unsubscribeAll?: boolean;
  /** Required to re-join lists after an unsubscribe from everything. */
  resubscribe?: boolean;
  consent?: SubscriptionConsent;
}

export interface ResendConfirmationResult {
  email: string;
  confirmationSent: boolean;
  /** The confirmation link now expires 7 days from the resend. */
  expiresAt: string;
}

const SUBSCRIPTION_ERROR_CODES: readonly SubscriptionErrorCode[] = [
  'LIST_NOT_FOUND',
  'TOPIC_NOT_FOUND',
  'CONTACT_NOT_FOUND',
  'CONTACT_BLOCKED',
  'RECIPIENT_SUPPRESSED',
  'RECIPIENT_UNSUBSCRIBED',
  'NO_PENDING_CONFIRMATION',
  'FREE_TIER_CONTACT_LIMIT',
  'VALIDATION_ERROR',
];

/**
 * True when `error` is an API error with one of the subscription error codes
 * (optionally a specific one).
 *
 * @example
 * try { await client.subscriptions.subscribe({ email }); }
 * catch (e) {
 *   if (isSubscriptionError(e, 'RECIPIENT_UNSUBSCRIBED')) askForFreshConsent();
 * }
 */
export function isSubscriptionError(
  error: unknown,
  code?: SubscriptionErrorCode
): error is NorthRelayError & { code: SubscriptionErrorCode } {
  if (!(error instanceof NorthRelayError)) return false;
  if (!SUBSCRIPTION_ERROR_CODES.includes(error.code as SubscriptionErrorCode)) return false;
  return code === undefined || error.code === code;
}

function emailPath(email: string): string {
  if (typeof email !== 'string' || !email.trim()) throw new Error('email is required');
  return encodeURIComponent(email.trim());
}

export class SubscriptionsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * Subscribe an address to lists and topics, recording consent evidence.
   * Creates the contact when needed. With `doubleOptIn: true` a confirmation
   * email is sent and the contact stays `PENDING` until confirmed.
   *
   * Not retried automatically (a retry could send a second confirmation).
   *
   * Errors (`error.code`): `LIST_NOT_FOUND`, `TOPIC_NOT_FOUND` (404);
   * `RECIPIENT_UNSUBSCRIBED` (409, pass `resubscribe: true` with fresh consent);
   * `RECIPIENT_SUPPRESSED`, `CONTACT_BLOCKED` (409, cannot be overridden);
   * `FREE_TIER_CONTACT_LIMIT` (403); `VALIDATION_ERROR` (400).
   */
  public async subscribe(request: SubscribeRequest): Promise<{ success: true; data: SubscribeResult }> {
    return this.http.post('/api/v1/subscriptions', request);
  }

  /**
   * Opt an address out of everything (`scope: 'all'`, the default), one list
   * or one topic. Use it when your own product collects the opt-out.
   */
  public async unsubscribe(request: UnsubscribeRequest): Promise<{ success: true; data: UnsubscribeResult }> {
    return withRetry(() => this.http.post('/api/v1/subscriptions/unsubscribe', request), this.retryConfig);
  }

  /**
   * Full subscription status of an address: contact, consent evidence,
   * suppression, pending confirmation, every list membership and every topic.
   */
  public async get(email: string): Promise<{ success: true; data: SubscriptionStatus }> {
    const path = `/api/v1/subscriptions/${emailPath(email)}`;
    return withRetry(() => this.http.get(path), this.retryConfig);
  }

  /**
   * Update an address's preferences and return the new status. Provide at
   * least one of `topics`, `lists` or `unsubscribeAll`.
   *
   * @example
   * await client.subscriptions.updatePreferences('ada@example.com', {
   *   topics: { [productNewsId]: false },
   *   lists: { [weeklyDigestId]: true },
   * });
   */
  public async updatePreferences(
    email: string,
    request: UpdatePreferencesRequest
  ): Promise<{ success: true; data: SubscriptionStatus }> {
    const path = `/api/v1/subscriptions/${emailPath(email)}`;
    return withRetry(() => this.http.patch(path, request), this.retryConfig);
  }

  /**
   * Re-send the double opt-in email to a `PENDING` contact subscribed through
   * the API and extend the link by 7 days. Throws `NO_PENDING_CONFIRMATION`
   * (409) or `CONTACT_NOT_FOUND` (404). Not retried automatically.
   */
  public async resendConfirmation(email: string): Promise<{ success: true; data: ResendConfirmationResult }> {
    return this.http.post(`/api/v1/subscriptions/${emailPath(email)}/resend-confirmation`);
  }
}
