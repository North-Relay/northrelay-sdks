import { describe, it, expect } from 'vitest';
import { NorthRelayClient } from '../client';

describe('NorthRelayClient', () => {
  it('should initialize with API key', () => {
    const client = new NorthRelayClient({ apiKey: 'nr_test_abc123' });
    expect(client).toBeDefined();
  });

  it('should have all resource endpoints', () => {
    const client = new NorthRelayClient({ apiKey: 'nr_test_abc123' });
    
    // Core resources
    expect(client.emails).toBeDefined();
    expect(client.templates).toBeDefined();
    expect(client.domains).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.apiKeys).toBeDefined();
    
    // New resources (from PR #307)
    expect(client.campaigns).toBeDefined();
    expect(client.contacts).toBeDefined();
    expect(client.brandTheme).toBeDefined();
  });
});
