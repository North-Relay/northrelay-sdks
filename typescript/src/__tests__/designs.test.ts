import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { NorthRelayClient } from '../client';

it('preserves catalog digests, application derivation and revision conflicts over HTTP', async () => {
  const requests: Array<{ method?: string; url?: string; body: any; auth?: string; agent?: string }> = [];
  const source = { kind: 'gallery' as const, id: 'welcome', digest: 'a'.repeat(64) };
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    requests.push({ method: req.method, url: req.url, body, auth: req.headers.authorization, agent: req.headers['user-agent'] });
    res.setHeader('Content-Type', 'application/json');
    if (req.url?.endsWith('/sync')) {
      res.statusCode = 409;
      res.end(JSON.stringify({ success: false, error: { code: 'REVISION_CONFLICT', message: 'Reload the draft' } }));
      return;
    }
    const data = req.url?.includes('?cursor=') ? { items: [], gallery: [source], nextCursor: null }
      : req.url?.endsWith('/adopt') ? { id: 'design/one', revision: 3, applicationKey: 'my-app', source }
      : req.url?.endsWith('/catalog') ? { source, preview: { html: '<p>Welcome</p>' } }
      : { id: 'brand/one', updatedAt: '2026-09-23T00:00:00Z', editable: true };
    res.end(JSON.stringify({ success: true, data }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address() as { port: number };
    const client = new NorthRelayClient({ apiKey: 'nr_app_fixture', baseUrl: `http://127.0.0.1:${address.port}` });
    const catalog = await client.designs.catalog('next+/=');
    expect(catalog.data.gallery[0].id).toBe(source.id);
    const { data: brand } = await client.designs.createBrand({ theme: { name: 'My app' } });
    const reviewed = await client.designs.inspectTemplate({ kind: source.kind, id: source.id, brandId: brand.id });
    const { data: design } = await client.designs.adoptTemplate({ ...reviewed.data.source, brandId: brand.id });
    await client.designs.updateBrand(brand.id, { expectedUpdatedAt: brand.updatedAt, theme: { primaryColor: '#123456' } });
    await client.designs.bindBrand(design.id, brand.id, design.revision);
    await expect(client.designs.syncSource(design.id, { expectedRevision: design.revision, sourceDigest: source.digest, apply: false }))
      .rejects.toMatchObject({ statusCode: 409, code: 'REVISION_CONFLICT', message: 'Reload the draft' });
    expect(requests).toHaveLength(7); // No automatic write retry, publication or send.
    expect(requests[0].url).toBe('/api/v1/designs/catalog?cursor=next%2B%2F%3D');
    expect(requests[1].body).toEqual({ theme: { name: 'My app' } });
    expect(requests[3].body).toEqual({ ...source, brandId: 'brand/one' });
    expect(requests[4]).toMatchObject({ method: 'PATCH', url: '/api/v1/designs/brands/brand%2Fone', body: { expectedUpdatedAt: brand.updatedAt } });
    expect(requests[5]).toMatchObject({ url: '/api/v1/designs/design%2Fone/brand', body: { brandId: brand.id, expectedRevision: 3 } });
    expect(requests[6]).toMatchObject({ url: '/api/v1/designs/design%2Fone/sync', body: { expectedRevision: 3, sourceDigest: source.digest, apply: false } });
    const version = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
    expect(requests.every(r => r.auth === 'Bearer nr_app_fixture' && r.agent === `NorthRelay-SDK/${version}`)).toBe(true);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

 it('serializes paginated filters and lifecycle and never retries credential rotation', async () => {
  const requests: any[] = [];
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    requests.push({ method: req.method, url: req.url, body: raw ? JSON.parse(raw) : null });
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = req.method === 'PUT' ? 503 : 200;
    res.end(JSON.stringify(req.method === 'PUT' ? { success: false, error: { code: 'UNAVAILABLE', message: 'Retry manually after checking state' } } : { success: true, data: { items: [], nextCursor: null } }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const client = new NorthRelayClient({ apiKey: 'nr_live_fixture', baseUrl: `http://127.0.0.1:${(server.address() as { port: number }).port}` });
    await client.designs.listPage({ brandId: 'brand&other', status: 'retired', cursor: 'd1', search: 'Welcome home' });
    await client.designs.setLifecycle('a/b', { retired: true, expectedRevision: 4, replacement: { id: 'd2', kind: 'DESIGN' } });
    await client.credentials.update('key&id', { type: 'APPLICATION', name: 'CC', scopes: ['templates:read'], policy: { applications: ['cc'], senders: ['a@example.com'] }, expiresAt: null });
    await expect(client.credentials.rotate('key', 'APPLICATION')).rejects.toMatchObject({ statusCode: 503 });
    expect(requests).toHaveLength(4);
    const query = new URL(requests[0].url, 'http://local').searchParams;
    expect(Object.fromEntries(query)).toEqual({ brandId: 'brand&other', status: 'retired', cursor: 'd1', search: 'Welcome home', paginated: 'true' });
    expect(requests[1]).toMatchObject({ method: 'PATCH', url: '/api/v1/designs/a%2Fb/lifecycle', body: { expectedRevision: 4, retired: true } });
    expect(requests[2]).toMatchObject({ method: 'PATCH', url: '/api/v1/credentials?id=key%26id', body: { expiresAt: null } });
    expect(requests[3].body).toEqual({ id: 'key', type: 'APPLICATION', action: 'rotate' });
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
