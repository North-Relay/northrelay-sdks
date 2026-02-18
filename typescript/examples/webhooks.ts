/**
 * Webhook example - Verify and handle webhook events
 * 
 * Usage:
 *   NORTHRELAY_API_KEY=nr_live_xxx WEBHOOK_SECRET=xxx npm run example:webhooks
 */

import { NorthRelayClient, verifyWebhookSignature, parseWebhookEvent } from '@northrelay/sdk';
import express from 'express';

const app = express();
const client = new NorthRelayClient({
  apiKey: process.env.NORTHRELAY_API_KEY!
});

// IMPORTANT: Use raw body parser for webhook endpoint
app.post('/webhooks/northrelay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-northrelay-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET!;
  const payload = req.body.toString('utf8');

  try {
    // Verify signature and parse event
    const event = parseWebhookEvent(payload, signature, secret);

    console.log('📨 Webhook received:', event.type);
    console.log('   Message ID:', event.messageId);
    console.log('   Timestamp:', event.timestamp);

    // Handle different event types
    switch (event.type) {
      case 'Sent':
        console.log('✉️  Email sent to:', event.data.email);
        // Update database: mark email as sent
        break;

      case 'Delivered':
        console.log('✅ Email delivered to:', event.data.email);
        // Update database: mark email as delivered
        break;

      case 'Bounced':
        console.log('❌ Email bounced:', event.data.email);
        console.log('   Reason:', event.data.status);
        // Update database: mark email as bounced
        // Remove from mailing list if hard bounce
        break;

      case 'Opened':
        console.log('👀 Email opened by:', event.data.email);
        // Update analytics: increment open count
        break;

      case 'Clicked':
        console.log('🖱️  Link clicked by:', event.data.email);
        // Update analytics: track link clicks
        break;

      case 'Complained':
        console.log('🚫 Spam complaint from:', event.data.email);
        // Immediately remove from mailing list
        break;

      case 'Unsubscribed':
        console.log('👋 Unsubscribed:', event.data.email);
        // Update database: mark as unsubscribed
        break;

      default:
        console.log('❓ Unknown event type:', event.type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook verification failed:', error);
    res.status(401).send('Invalid signature');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Setup webhook on startup
async function setupWebhook() {
  try {
    // Create webhook
    const webhook = await client.webhooks.create({
      url: 'https://your-app.com/webhooks/northrelay', // Replace with your URL
      events: ['Sent', 'Delivered', 'Bounced', 'Opened', 'Clicked', 'Complained', 'Unsubscribed'],
      description: 'Production webhook for email events'
    });

    console.log('✅ Webhook created successfully!');
    console.log('   ID:', webhook.data.id);
    console.log('   URL:', webhook.data.url);
    console.log('   Secret:', webhook.data.secret);
    console.log('   Events:', webhook.data.events.join(', '));
    console.log('\n⚠️  IMPORTANT: Save the secret above to your .env file!');
    console.log('   WEBHOOK_SECRET=' + webhook.data.secret);

    // Test webhook delivery
    console.log('\n🧪 Testing webhook delivery...');
    const test = await client.webhooks.testDelivery(webhook.data.id);
    console.log('   Delivered:', test.data.delivered);
    console.log('   Status code:', test.data.statusCode);

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/webhooks/northrelay`);
  console.log('\n📝 To set up webhook, uncomment setupWebhook() call below');
  // setupWebhook(); // Uncomment this to create webhook
});
