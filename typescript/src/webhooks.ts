/**
 * Webhook signature verification utilities
 */

import * as crypto from 'crypto';
import type { WebhookEvent, WebhookPayload } from './types';

export type {
  WebhookEventType,
  WebhookPayload,
  WebhookPayloadBase,
  ContactSubscribedWebhook,
  ContactConfirmedWebhook,
  ContactUnsubscribedWebhook,
  ListMemberAddedWebhook,
  ListMemberRemovedWebhook,
  EmailOpenedWebhook,
  EmailClickedWebhook,
  EmailLifecycleWebhook,
  ContactSubscribedDetails,
  ContactConfirmedDetails,
  ContactUnsubscribedDetails,
  ListMemberDetails,
  EmailOpenedDetails,
  EmailClickedDetails,
  SubscriptionSource,
  UnsubscribeScope,
  UnsubscribeMethod,
} from './types';

/**
 * Verify webhook signature using HMAC-SHA256
 * 
 * @param payload - Raw webhook payload (JSON string)
 * @param signature - Signature from X-NorthRelay-Signature header
 * @param secret - Webhook secret from dashboard
 * @returns true if signature is valid
 * 
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@northrelay/sdk/webhooks';
 * 
 * app.post('/webhooks/northrelay', (req, res) => {
 *   const signature = req.headers['x-northrelay-signature'];
 *   const secret = process.env.NORTHRELAY_WEBHOOK_SECRET;
 *   
 *   if (!verifyWebhookSignature(req.rawBody, signature, secret)) {
 *     return res.status(401).send('Invalid signature');
 *   }
 *   
 *   const event = req.body;
 *   // Process event...
 *   res.status(200).send('OK');
 * });
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  const given = Buffer.from(typeof signature === 'string' ? signature : '');
  const expected = Buffer.from(expectedSignature);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/**
 * Parse and verify webhook event
 * 
 * @param payload - Raw webhook payload (JSON string)
 * @param signature - Signature from X-NorthRelay-Signature header
 * @param secret - Webhook secret
 * @returns Parsed webhook event
 * @throws Error if signature is invalid or payload is malformed
 * 
 * @example
 * ```typescript
 * import { parseWebhookEvent } from '@northrelay/sdk/webhooks';
 * 
 * app.post('/webhooks/northrelay', (req, res) => {
 *   try {
 *     const event = parseWebhookEvent(
 *       req.rawBody,
 *       req.headers['x-northrelay-signature'],
 *       process.env.NORTHRELAY_WEBHOOK_SECRET
 *     );
 *     
 *     switch (event.type) {
 *       case 'Sent':
 *         console.log('Email sent:', event.data.email);
 *         break;
 *       case 'Delivered':
 *         console.log('Email delivered:', event.data.email);
 *         break;
 *       case 'Bounced':
 *         console.log('Email bounced:', event.data.email);
 *         break;
 *       // ... handle other event types
 *     }
 *     
 *     res.status(200).send('OK');
 *   } catch (error) {
 *     console.error('Webhook verification failed:', error);
 *     res.status(401).send('Invalid signature');
 *   }
 * });
 * ```
 */
export function parseWebhookEvent(
  payload: string,
  signature: string,
  secret: string
): WebhookEvent {
  if (!verifyWebhookSignature(payload, signature, secret)) {
    throw new Error('Invalid webhook signature');
  }

  try {
    const event = JSON.parse(payload) as WebhookEvent;
    return event;
  } catch (error) {
    throw new Error('Invalid webhook payload: ' + (error as Error).message);
  }
}

/**
 * Verify and parse a webhook delivery into the typed `WebhookPayload` union.
 * Switch on `eventType` to narrow `details`.
 *
 * @example
 * ```typescript
 * import { parseWebhookPayload } from '@northrelay/sdk/webhooks';
 *
 * const event = parseWebhookPayload(rawBody, req.headers['x-northrelay-signature'], secret);
 * switch (event.eventType) {
 *   case 'contact.unsubscribed':
 *     // event.details.scope is 'all' | 'list' | 'topic'
 *     markOptedOut(event.details.contactEmail, event.details.scope, event.details.listId ?? event.details.topicId);
 *     break;
 *   case 'list.member_added':
 *     syncMember(event.details.listId, event.details.email);
 *     break;
 *   case 'email.clicked':
 *     recordClick(event.details.email, event.details.url);
 *     break;
 * }
 * ```
 */
export function parseWebhookPayload(
  payload: string,
  signature: string,
  secret: string
): WebhookPayload {
  if (!verifyWebhookSignature(payload, signature, secret)) {
    throw new Error('Invalid webhook signature');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error('Invalid webhook payload: ' + (error as Error).message);
  }
  if (!parsed || typeof parsed !== 'object' || typeof (parsed as { eventType?: unknown }).eventType !== 'string') {
    throw new Error('Invalid webhook payload: missing eventType');
  }
  return parsed as WebhookPayload;
}

/**
 * Construct webhook test payload for development
 * 
 * @param event - Event data
 * @param secret - Webhook secret
 * @returns Object with payload and signature
 * 
 * @example
 * ```typescript
 * import { constructWebhookPayload } from '@northrelay/sdk/webhooks';
 * 
 * const { payload, signature } = constructWebhookPayload({
 *   id: 'evt_123',
 *   type: 'Sent',
 *   messageId: 'msg_456',
 *   timestamp: new Date().toISOString(),
 *   data: {
 *     email: 'user@example.com',
 *     subject: 'Test Email',
 *     status: 'sent'
 *   }
 * }, 'your_webhook_secret');
 * 
 * // Send test webhook
 * await fetch('http://localhost:3000/webhooks/northrelay', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-NorthRelay-Signature': signature
 *   },
 *   body: payload
 * });
 * ```
 */
export function constructWebhookPayload(
  event: WebhookEvent,
  secret: string
): { payload: string; signature: string } {
  const payload = JSON.stringify(event);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return { payload, signature };
}
