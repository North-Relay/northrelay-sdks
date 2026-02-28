/**
 * Webhook signature verification utilities
 */

import * as crypto from 'crypto';
import type { WebhookEvent } from './types';

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
  if (!payload || !signature || !secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // HMAC-SHA256 hex is always 64 characters. Reject obviously wrong signatures
  // before the constant-time comparison. This check does not leak timing
  // information about the expected value since 64 is a fixed, public constant.
  if (signature.length !== 64) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
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
