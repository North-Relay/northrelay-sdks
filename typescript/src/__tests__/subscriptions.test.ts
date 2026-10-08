import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NorthRelayClient } from '../client';
import { NorthRelayError, NotFoundError } from '../errors';
import { isSubscriptionError } from '../resources/subscriptions';
import { parseWebhookPayload, verifyWebhookSignature } from '../webhooks';

type Recorded = { method?: string; url?: string; contentType?: string; raw: string; body: any };
type Reply = { status?: number; body: unknown };

const requests: Recorded[] = [];
let handler: (req: Recorded) => Reply = () => ({ body: { success: true, data: {} } });
let server: ReturnType<typeof createServer>;
let client: NorthRelayClient;

async function onRequest(req: IncomingMessage, res: ServerResponse) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const contentType = req.headers['content-type'];
  let body: any = null;
  if (raw && contentType?.includes('application/json')) body = JSON.parse(raw);
  const recorded = { method: req.method, url: req.url, contentType, raw, body };
  requests.push(recorded);
  const reply = handler(recorded);
  res.statusCode = reply.status ?? 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(reply.body));
}

beforeAll(async () => {
  server = createServer((req, res) => void onRequest(req, res));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as { port: number };
  client = new NorthRelayClient({ apiKey: 'nr_test_fixture', baseUrl: `http://127.0.0.1:${port}` });
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  requests.length = 0;
  handler = () => ({ body: { success: true, data: {} } });
});

describe('subscriptions', () => {
  it('subscribes with lists, topics and consent and returns the result', async () => {
    const data = {
      contactId: 'c1', email: 'ada@example.com', status: 'PENDING', created: true,
      listIds: ['l1'], addedToListIds: ['l1'], topicIds: ['t1'],
      requiresConfirmation: true, confirmationSent: true,
    };
    handler = () => ({ status: 201, body: { success: true, data } });
    const res = await client.subscriptions.subscribe({
      email: 'ada@example.com',
      listIds: ['l1'],
      topicIds: ['t1'],
      doubleOptIn: true,
      redirectUrl: 'https://example.com/thanks',
      consent: { ip: '203.0.113.7', text: 'Send me the newsletter' },
    });
    expect(res.data).toEqual(data);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/api/v1/subscriptions',
      body: {
        email: 'ada@example.com', listIds: ['l1'], topicIds: ['t1'], doubleOptIn: true,
        redirectUrl: 'https://example.com/thanks', consent: { ip: '203.0.113.7', text: 'Send me the newsletter' },
      },
    });
  });

  it('URL-encodes the email for status, preferences and resend', async () => {
    const email = 'ada+news@example.com';
    await client.subscriptions.get(email);
    await client.subscriptions.updatePreferences(email, { topics: { t1: false }, lists: { l1: true }, resubscribe: true });
    await client.subscriptions.resendConfirmation(email);
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['GET', '/api/v1/subscriptions/ada%2Bnews%40example.com'],
      ['PATCH', '/api/v1/subscriptions/ada%2Bnews%40example.com'],
      ['POST', '/api/v1/subscriptions/ada%2Bnews%40example.com/resend-confirmation'],
    ]);
    expect(requests[1].body).toEqual({ topics: { t1: false }, lists: { l1: true }, resubscribe: true });
  });

  it('unsubscribes at a scope', async () => {
    handler = () => ({ body: { success: true, data: { email: 'ada@example.com', contactId: 'c1', scope: 'list', changed: true } } });
    const res = await client.subscriptions.unsubscribe({ email: 'ada@example.com', scope: 'list', listId: 'l1', reason: 'too many' });
    expect(res.data.changed).toBe(true);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/api/v1/subscriptions/unsubscribe',
      body: { email: 'ada@example.com', scope: 'list', listId: 'l1', reason: 'too many' },
    });
  });

  it('surfaces subscription error codes with the fix', async () => {
    handler = () => ({
      status: 409,
      body: {
        success: false,
        error: {
          code: 'RECIPIENT_UNSUBSCRIBED',
          message: 'ada@example.com has unsubscribed.',
          fix_action: 'Pass "resubscribe": true only with fresh consent.',
          docs_url: 'https://docs.northrelay.ca/docs/api-reference/subscriptions',
        },
      },
    });
    const error = await client.subscriptions.subscribe({ email: 'ada@example.com' }).catch((e) => e);
    expect(error).toBeInstanceOf(NorthRelayError);
    expect(error).toMatchObject({ code: 'RECIPIENT_UNSUBSCRIBED', statusCode: 409, docsUrl: 'https://docs.northrelay.ca/docs/api-reference/subscriptions' });
    expect(error.fixAction).toContain('resubscribe');
    expect(isSubscriptionError(error)).toBe(true);
    expect(isSubscriptionError(error, 'RECIPIENT_UNSUBSCRIBED')).toBe(true);
    expect(isSubscriptionError(error, 'RECIPIENT_SUPPRESSED')).toBe(false);
    expect(isSubscriptionError(new Error('x'))).toBe(false);
  });

  it('does not retry subscribe or resend (they can send email)', async () => {
    handler = () => ({ status: 503, body: { success: false, error: { code: 'UNAVAILABLE', message: 'try later' } } });
    await expect(client.subscriptions.subscribe({ email: 'ada@example.com', doubleOptIn: true })).rejects.toMatchObject({ statusCode: 503 });
    await expect(client.subscriptions.resendConfirmation('ada@example.com')).rejects.toMatchObject({ statusCode: 503 });
    expect(requests).toHaveLength(2);
  });

  it('rejects an empty email before calling the API', async () => {
    await expect(client.subscriptions.get('  ')).rejects.toThrow('email is required');
    expect(requests).toHaveLength(0);
  });
});

describe('contacts', () => {
  it('lists with the query params the API reads', async () => {
    handler = () => ({ body: { success: true, data: [], meta: { page: 2, limit: 10, total_count: 0, has_more: false } } });
    await client.contacts.list({ page: 2, limit: 10, status: 'ACTIVE', tag: 'vip', search: 'ada', sortBy: 'email', sortOrder: 'asc' });
    await client.contacts.list({ tags: 'first, second' });
    const q0 = Object.fromEntries(new URL(requests[0].url!, 'http://x').searchParams);
    expect(q0).toEqual({ page: '2', limit: '10', status: 'ACTIVE', tag: 'vip', search: 'ada', sortBy: 'email', sortOrder: 'asc' });
    expect(requests[1].url).toBe('/api/v1/contacts?tag=first');
    await expect(client.contacts.list({ listId: 'l1' } as any)).rejects.toThrow('getListMembers');
    expect(requests).toHaveLength(2);
  });

  it('gets, updates and deletes one contact', async () => {
    await client.contacts.get('c/1');
    await client.contacts.update('c1', { firstName: 'Ada', status: 'UNSUBSCRIBED' });
    await client.contacts.delete('c1');
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['GET', '/api/v1/contacts/c%2F1'],
      ['PATCH', '/api/v1/contacts/c1'],
      ['DELETE', '/api/v1/contacts/c1'],
    ]);
    expect(requests[1].body).toEqual({ firstName: 'Ada', status: 'UNSUBSCRIBED' });
  });

  it('bulk deletes with contactIds and bulk creates with skipDuplicates', async () => {
    await client.contacts.bulkDelete(['c1', 'c2']);
    await client.contacts.bulkCreate([{ email: 'a@example.com' }], { skipDuplicates: false });
    expect(requests[0]).toMatchObject({ method: 'DELETE', url: '/api/v1/contacts/bulk', body: { contactIds: ['c1', 'c2'] } });
    expect(requests[1]).toMatchObject({ method: 'POST', url: '/api/v1/contacts/bulk', body: { contacts: [{ email: 'a@example.com' }], skipDuplicates: false } });
  });

  it('adds tags and removes them through DELETE /contacts/{id}/tags/{tag}', async () => {
    handler = (req) => req.method === 'GET'
      ? { body: { success: true, data: { id: 'c1', email: 'a@example.com', tags: [{ id: 't1', contactId: 'c1', tag: 'vip' }, { id: 't2', contactId: 'c1', tag: 'beta_2026' }] } } }
      : { body: { success: true, data: { message: 'ok' } } };
    await client.contacts.addTags('c1', ['vip']);
    await client.contacts.removeTag('c1', 'vip');
    const res = await client.contacts.removeTags('c1');
    expect(res.data.removed).toEqual(['vip', 'beta_2026']);
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['POST', '/api/v1/contacts/c1/tags'],
      ['DELETE', '/api/v1/contacts/c1/tags/vip'],
      ['GET', '/api/v1/contacts/c1'],
      ['DELETE', '/api/v1/contacts/c1/tags/vip'],
      ['DELETE', '/api/v1/contacts/c1/tags/beta_2026'],
    ]);
    expect(requests[0].body).toEqual({ tags: ['vip'] });
  });

  it('uploads a CSV as multipart with mappings, listId and tags', async () => {
    handler = () => ({ body: { imported: 1, skipped: 0, addedToList: 1, errors: [] } });
    const res = await client.contacts.importCsv('Email Address,First\nada@example.com,Ada\n', {
      mappings: [{ csvColumn: 'Email Address', field: 'email' }, { csvColumn: 'First', field: 'firstName' }],
      listId: 'l1',
      tags: ['imported', 'spring'],
    });
    expect(res).toEqual({ imported: 1, skipped: 0, addedToList: 1, errors: [] });
    const [req] = requests;
    expect(req.method).toBe('POST');
    expect(req.url).toBe('/api/v1/contacts/import');
    expect(req.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(req.raw).toContain('filename="contacts.csv"');
    expect(req.raw).toContain('ada@example.com,Ada');
    expect(req.raw).toContain('[{"csvColumn":"Email Address","field":"email"},{"csvColumn":"First","field":"firstName"}]');
    expect(req.raw).toMatch(/name="listId"\r\n\r\nl1\r\n/);
    expect(req.raw).toMatch(/name="tags"\r\n\r\nimported,spring\r\n/);
  });

  it('requires mappings for CSV import', async () => {
    await expect(client.contacts.importCsv('Email\n', undefined as any)).rejects.toThrow('mappings');
    expect(requests).toHaveLength(0);
  });
});

describe('list members', () => {
  it('adds by emails and contact ids with createMissing', async () => {
    const data = { added: 2, alreadyMembers: 0, notFound: [], blocked: [{ email: 'gone@example.com', reason: 'RECIPIENT_UNSUBSCRIBED' }] };
    handler = () => ({ body: { success: true, data, added: 2, skipped: 0, message: 'Added 2 contacts to list' } });
    const res = await client.contacts.addListMembers('l1', { emails: ['new@example.com', 'gone@example.com'], contactIds: ['c1'], createMissing: true });
    expect(res.data.blocked[0].reason).toBe('RECIPIENT_UNSUBSCRIBED');
    await client.contacts.addToList('l1', ['c2']);
    expect(requests[0]).toMatchObject({
      method: 'POST', url: '/api/v1/contacts/lists/l1/members',
      body: { emails: ['new@example.com', 'gone@example.com'], contactIds: ['c1'], createMissing: true },
    });
    expect(requests[1].body).toEqual({ contactIds: ['c2'] });
  });

  it('removes by email in the DELETE body and reports NOT_A_MEMBER', async () => {
    await client.contacts.removeListMembers('l1', { emails: ['ada@example.com'] });
    expect(requests[0]).toMatchObject({ method: 'DELETE', url: '/api/v1/contacts/lists/l1/members', body: { emails: ['ada@example.com'] } });
    handler = () => ({ status: 404, body: { success: false, error: { code: 'NOT_A_MEMBER', message: 'Contact(s) not in list' } } });
    await expect(client.contacts.removeFromList('l1', ['c9'])).rejects.toMatchObject({ code: 'NOT_A_MEMBER', statusCode: 404 });
  });

  it('lists members with page, limit and filter', async () => {
    handler = () => ({ body: { data: [], counts: { total: 0, active: 0, suppressed: 0 }, pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } } });
    const res = await client.contacts.getListMembers('l1', { page: 1, limit: 25, filter: 'active' });
    expect(res.counts.total).toBe(0);
    expect(requests[0].url).toBe('/api/v1/contacts/lists/l1/members?page=1&limit=25&filter=active');
  });

  it('maps plain-string error bodies from list routes', async () => {
    handler = () => ({ status: 404, body: { error: 'List not found' } });
    const error = await client.contacts.getList('missing').catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('List not found');
  });
});

describe('topics (suppression groups)', () => {
  it('manages opt-outs and sends the bulk action', async () => {
    await client.suppressionGroups.list({ published: true, limit: 10 });
    await client.suppressionGroups.listMembers('t1', { page: 2 });
    await client.suppressionGroups.addMember('t1', 'ada@example.com');
    await client.suppressionGroups.removeMember('t1', 'ada+x@example.com');
    await client.suppressionGroups.bulkAddSuppressions('t1', ['a@example.com']);
    await client.suppressionGroups.bulkRemoveSuppressions('t1', ['a@example.com']);
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['GET', '/api/v1/suppression-groups?limit=10&published=true'],
      ['GET', '/api/v1/suppression-groups/t1/members?page=2'],
      ['POST', '/api/v1/suppression-groups/t1/members'],
      ['DELETE', '/api/v1/suppression-groups/t1/members/ada%2Bx%40example.com'],
      ['POST', '/api/v1/suppression-groups/t1/suppressions/bulk'],
      ['POST', '/api/v1/suppression-groups/t1/suppressions/bulk'],
    ]);
    expect(requests[2].body).toEqual({ email: 'ada@example.com' });
    expect(requests[4].body).toEqual({ action: 'add', emails: ['a@example.com'] });
    expect(requests[5].body).toEqual({ action: 'remove', emails: ['a@example.com'] });
  });
});

describe('forms', () => {
  it('lists, creates, publishes and sets fields', async () => {
    await client.forms.list({ limit: 5, offset: 10 });
    await client.forms.create({ listId: 'l1', name: 'Newsletter', slug: 'newsletter' });
    await client.forms.update('f1', { status: 'PUBLISHED', requireConfirmation: true });
    await client.forms.setFields('f1', [{ fieldKey: 'email', label: 'Email', type: 'EMAIL', required: true, bindsToContact: 'EMAIL' }]);
    await client.forms.archive('f1');
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['GET', '/api/v1/forms?limit=5&offset=10'],
      ['POST', '/api/v1/forms'],
      ['PATCH', '/api/v1/forms/f1'],
      ['PUT', '/api/v1/forms/f1/fields'],
      ['DELETE', '/api/v1/forms/f1'],
    ]);
    expect(requests[3].body.fields[0]).toMatchObject({ fieldKey: 'email', bindsToContact: 'EMAIL' });
  });
});

describe('webhook payloads', () => {
  const secret = 'whsec_fixture';
  const sign = (body: string) => createHmac('sha256', secret).update(body).digest('hex');

  it('parses and narrows subscription and engagement events', () => {
    const unsub = JSON.stringify({
      eventType: 'contact.unsubscribed', messageId: 'm1', timestamp: '2026-10-06T00:00:00Z', recipient: 'ada@example.com',
      details: { category: 't1', contactEmail: 'ada@example.com', contactId: 'c1', scope: 'topic', topicId: 't1', listId: null, method: 'one_click', campaignId: 'cmp1', reason: null },
    });
    const event = parseWebhookPayload(unsub, sign(unsub), secret);
    if (event.eventType !== 'contact.unsubscribed') throw new Error('wrong event');
    expect(event.details.scope).toBe('topic');
    expect(event.details.method).toBe('one_click');

    const click = JSON.stringify({
      eventType: 'email.clicked', messageId: 'm2', timestamp: '2026-10-06T00:00:00Z',
      details: { email: 'ada@example.com', contactId: null, campaignId: null, trackingId: 'trk1', url: 'https://example.com/a', userAgent: null, engagementType: 'HUMAN' },
    });
    const clicked = parseWebhookPayload(click, sign(click), secret);
    expect(clicked.eventType === 'email.clicked' && clicked.details.url).toBe('https://example.com/a');
  });

  it('rejects bad signatures without throwing on length mismatch', () => {
    const body = JSON.stringify({ eventType: 'list.member_added', messageId: 'm', timestamp: 't', details: {} });
    expect(verifyWebhookSignature(body, 'short', secret)).toBe(false);
    expect(() => parseWebhookPayload(body, sign(body) + '0', secret)).toThrow('Invalid webhook signature');
  });
});
