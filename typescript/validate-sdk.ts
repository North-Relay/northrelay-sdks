/**
 * NorthRelay SDK Validation Script
 * 
 * Tests all major SDK features to ensure the package works correctly
 * after npm publish.
 * 
 * Usage:
 *   export NORTHRELAY_API_KEY=nr_live_...
 *   npx ts-node validate-sdk.ts
 */

import { NorthRelayClient, NorthRelayError } from '@northrelay/sdk';
import { verifyWebhookSignature, parseWebhookEvent } from '@northrelay/sdk/webhooks';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logResult(test: TestResult) {
  const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
  const duration = test.duration ? ` (${test.duration}ms)` : '';
  log(`${icon} ${test.name}${duration}`);
  if (test.error) {
    console.error(`   Error: ${test.error}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    const result: TestResult = { name, status: 'pass', duration };
    results.push(result);
    logResult(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const result: TestResult = {
      name,
      status: 'fail',
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
    results.push(result);
    logResult(result);
  }
}

async function main() {
  log('🚀 Starting NorthRelay SDK Validation');
  log('=====================================\n');

  // Check environment
  const apiKey = process.env.NORTHRELAY_API_KEY;
  if (!apiKey) {
    log('❌ NORTHRELAY_API_KEY environment variable not set');
    log('   Set it with: export NORTHRELAY_API_KEY=nr_live_...');
    process.exit(1);
  }

  if (!apiKey.startsWith('nr_live_') && !apiKey.startsWith('nr_test_')) {
    log('⚠️  API key should start with nr_live_ or nr_test_');
  }

  log(`📦 API Key: ${apiKey.substring(0, 15)}...`);
  log(`🔧 Node Version: ${process.version}`);
  log('');

  // Initialize client
  let client: NorthRelayClient;
  
  await runTest('SDK Initialization', async () => {
    client = new NorthRelayClient({
      apiKey,
      timeout: 30000,
    });

    if (!client.emails) throw new Error('emails resource not initialized');
    if (!client.templates) throw new Error('templates resource not initialized');
    if (!client.domains) throw new Error('domains resource not initialized');
    if (!client.webhooks) throw new Error('webhooks resource not initialized');
    if (!client.campaigns) throw new Error('campaigns resource not initialized');
    if (!client.contacts) throw new Error('contacts resource not initialized');
  });

  // Test: Email Validation
  await runTest('Email Validation', async () => {
    const result = await client!.emails.validate(['test@example.com', 'invalid-email']);
    
    if (!Array.isArray(result.data)) {
      throw new Error('Expected array response');
    }

    if (result.data.length !== 2) {
      throw new Error(`Expected 2 results, got ${result.data.length}`);
    }

    // First should be valid, second invalid
    if (!result.data[0].valid) {
      throw new Error('test@example.com should be valid');
    }
  });

  // Test: Send Email (will fail if no verified domain)
  await runTest('Send Email', async () => {
    try {
      const result = await client!.emails.send({
        from: { email: 'noreply@yourdomain.com', name: 'SDK Test' },
        to: [{ email: 'test@example.com' }],
        content: {
          subject: 'NorthRelay SDK Test',
          text: 'This is a test email from the SDK validation script.',
          html: '<p>This is a test email from the SDK validation script.</p>',
        },
      });

      if (!result.data.messageId) {
        throw new Error('No messageId in response');
      }

      log(`   Message ID: ${result.data.messageId}`);
      log(`   Quota: ${result.data.quota.remaining}/${result.data.quota.limit}`);
    } catch (error) {
      if (error instanceof NorthRelayError) {
        // Expected if domain not verified
        if (error.code === 'DOMAIN_NOT_VERIFIED') {
          throw new Error('Domain not verified (expected - add a verified domain to test)');
        }
        throw error;
      }
      throw error;
    }
  });

  // Test: List Templates
  await runTest('List Templates', async () => {
    const result = await client!.templates.list({ limit: 10 });
    
    if (!Array.isArray(result.data)) {
      throw new Error('Expected array response');
    }

    log(`   Found ${result.data.length} templates`);
  });

  // Test: Create Template
  let templateId: string | undefined;
  await runTest('Create Template', async () => {
    const result = await client!.templates.create({
      name: 'SDK Test Template',
      subject: 'Welcome {{name}}!',
      htmlContent: '<h1>Hello {{name}}</h1><p>Your code is: {{code}}</p>',
      textContent: 'Hello {{name}}, Your code is: {{code}}',
    });

    if (!result.data.id) {
      throw new Error('No template ID in response');
    }

    templateId = result.data.id;
    log(`   Created template: ${templateId}`);
  });

  // Test: Preview Template
  if (templateId) {
    await runTest('Preview Template', async () => {
      const result = await client!.templates.preview(templateId!, {
        name: 'John Doe',
        code: '123456',
      });

      if (!result.data.html.includes('John Doe')) {
        throw new Error('Preview should contain substituted name');
      }

      if (!result.data.html.includes('123456')) {
        throw new Error('Preview should contain substituted code');
      }
    });

    // Test: Delete Template
    await runTest('Delete Template', async () => {
      await client!.templates.delete(templateId!);
      log(`   Deleted template: ${templateId}`);
    });
  }

  // Test: List Domains
  await runTest('List Domains', async () => {
    const result = await client!.domains.list();
    
    if (!Array.isArray(result.data)) {
      throw new Error('Expected array response');
    }

    log(`   Found ${result.data.length} domains`);
  });

  // Test: List Webhooks
  await runTest('List Webhooks', async () => {
    const result = await client!.webhooks.list();
    
    if (!Array.isArray(result.data)) {
      throw new Error('Expected array response');
    }

    log(`   Found ${result.data.length} webhooks`);
  });

  // Test: List Events
  await runTest('List Events', async () => {
    const result = await client!.events.list({ limit: 10 });
    
    if (!Array.isArray(result.data)) {
      throw new Error('Expected array response');
    }

    log(`   Found ${result.data.length} events`);
  });

  // Test: Rate Limit Info
  await runTest('Get Rate Limit Info', async () => {
    const rateLimit = client!.getRateLimitInfo();
    
    if (rateLimit) {
      log(`   Limit: ${rateLimit.limit}`);
      log(`   Remaining: ${rateLimit.remaining}`);
      log(`   Reset: ${new Date(rateLimit.reset * 1000).toISOString()}`);
    } else {
      // OK if no rate limit info yet (no API calls made)
      log('   No rate limit info available yet');
    }
  });

  // Test: Webhook Signature Verification
  await runTest('Webhook Signature Verification', async () => {
    const payload = JSON.stringify({
      id: 'evt_123',
      type: 'Delivered',
      messageId: 'msg_456',
      timestamp: new Date().toISOString(),
      data: { email: 'test@example.com' },
    });

    const secret = 'webhook_secret_123';
    
    // This would normally come from the X-NorthRelay-Signature header
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = verifyWebhookSignature(payload, signature, secret);

    if (!isValid) {
      throw new Error('Webhook signature verification failed');
    }

    // Test with wrong secret
    const isInvalid = verifyWebhookSignature(payload, signature, 'wrong_secret');
    if (isInvalid) {
      throw new Error('Should reject invalid signature');
    }
  });

  // Test: Parse Webhook Event
  await runTest('Parse Webhook Event', async () => {
    const payload = JSON.stringify({
      id: 'evt_123',
      type: 'Delivered',
      messageId: 'msg_456',
      timestamp: new Date().toISOString(),
      data: { email: 'test@example.com' },
    });

    const secret = 'webhook_secret_123';
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const event = parseWebhookEvent(payload, signature, secret);

    if (event.type !== 'Delivered') {
      throw new Error('Event type mismatch');
    }

    if (event.messageId !== 'msg_456') {
      throw new Error('Message ID mismatch');
    }
  });

  // Test: Error Handling
  await runTest('Error Handling', async () => {
    try {
      // Try to get a non-existent template
      await client!.templates.get('tpl_nonexistent_12345');
      throw new Error('Should have thrown NotFoundError');
    } catch (error) {
      if (!(error instanceof NorthRelayError)) {
        throw new Error('Error should be instance of NorthRelayError');
      }

      if (!error.message) {
        throw new Error('Error should have message');
      }

      // Errors should have fix_action and docs_url (No-Support philosophy)
      if (!error.fixAction && !error.docsUrl) {
        // Some errors might not have these, but most should
        log('   Note: Error missing fixAction/docsUrl');
      }
    }
  });

  // Test: Type Safety (compile-time check)
  await runTest('Type Safety Check', async () => {
    // This test validates that TypeScript types are properly exported
    // and can be used in user code
    
    import type {
      SendEmailRequest,
      Template,
      Webhook,
      EmailEvent,
      PaginatedResponse,
    } from '@northrelay/sdk';

    const emailRequest: SendEmailRequest = {
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      content: { subject: 'Test', text: 'Test' },
    };

    // If this compiles, types are working
    if (!emailRequest.from) {
      throw new Error('Type check failed');
    }
  });

  // Summary
  log('\n=====================================');
  log('📊 Test Summary');
  log('=====================================');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;
  const total = results.length;

  log(`✅ Passed: ${passed}/${total}`);
  if (failed > 0) log(`❌ Failed: ${failed}/${total}`);
  if (skipped > 0) log(`⏭️  Skipped: ${skipped}/${total}`);

  const avgDuration =
    results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms`);

  if (failed === 0) {
    log('\n🎉 All tests passed! SDK is working correctly.');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

main().catch((error) => {
  log('💥 Unhandled error:');
  console.error(error);
  process.exit(1);
});
