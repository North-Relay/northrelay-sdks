/**
 * Basic example - Send a simple email
 * 
 * Usage:
 *   NORTHRELAY_API_KEY=nr_live_xxx npm run example:basic
 */

import { NorthRelayClient } from '@northrelay/sdk';

async function main() {
  // Initialize client
  const client = new NorthRelayClient({
    apiKey: process.env.NORTHRELAY_API_KEY!
  });

  try {
    // Send email
    const result = await client.emails.send({
      from: {
        email: 'noreply@example.com',
        name: 'Example App'
      },
      to: [{
        email: 'user@example.com',
        name: 'John Doe'
      }],
      content: {
        subject: 'Welcome to NorthRelay!',
        html: '<h1>Welcome!</h1><p>Thanks for trying NorthRelay.</p>',
        text: 'Welcome! Thanks for trying NorthRelay.'
      }
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.data.messageId);
    console.log('Status:', result.data.status);
    console.log('Pool:', result.data.pool.type);
    console.log('Quota remaining:', result.data.quota.remaining);

    // Check rate limit
    const rateLimit = client.getRateLimitInfo();
    if (rateLimit) {
      console.log('\nRate Limit Info:');
      console.log('- Limit:', rateLimit.limit);
      console.log('- Remaining:', rateLimit.remaining);
      console.log('- Resets at:', new Date(rateLimit.reset * 1000).toISOString());
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
