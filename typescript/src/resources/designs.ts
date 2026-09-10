import type { HttpClient } from '../utils/http';
import type { CreateBrandThemeRequest } from '../types';

export type DesignScalar = { type: 'string' | 'number' | 'boolean'; format?: 'text' | 'url' | 'html'; required?: boolean; description?: string; example?: string | number | boolean; default?: string | number | boolean };
export type DesignVariable = DesignScalar | { type: 'array'; required?: boolean; description?: string; items: Record<string, DesignScalar> };
export interface EmailDesignDraft {
  name: string; subject: string; html: string; text?: string;
  category?: 'TRANSACTIONAL' | 'AUTHENTICATION' | 'NOTIFICATION' | 'SECURITY' | 'MARKETING' | 'OTHER';
  brand: Partial<CreateBrandThemeRequest>;
  variables?: Record<string, DesignVariable>;
}
export interface EmailDesign { id: string; applicationKey: string; key: string; locale: string; draft: EmailDesignDraft; revision: number; publishedVersion: number | null; }
export interface EmailDesignRelease { id: string; designId: string; version: number; snapshot: EmailDesignDraft; renderer: string; digest: string; revision?: number; }
export interface DesignManifest { schemaVersion: 1; applicationKey: string; dryRun?: boolean; entries: Array<{ key: string; locale?: string; draft: EmailDesignDraft; expectedRevision?: number }>; }
export interface DesignCapabilities {
  contractVersion: string; accountId: string; scopes: string[]; applications: string[] | null; senders: string[] | null;
  permissions: { read: boolean; edit: boolean; publish: boolean; send: boolean };
  limits: { templates: number | null; themes: number | null }; usage: { templates: number; themes: number };
  verifiedDomains: Array<{ hostname: string }>;
}
type Result<T> = { success: true; data: T };
const path = (id: string) => `/api/v1/designs/${encodeURIComponent(id)}`;
/** Published email designs. Writes are explicit; sends require a stable idempotency key. */
export class DesignsResource {
  constructor(private http: HttpClient) {}
  capabilities(): Promise<Result<DesignCapabilities>> { return this.http.get('/api/v1/capabilities'); }
  list(applicationKey?: string): Promise<Result<EmailDesign[]>> { return this.http.get(`/api/v1/designs${applicationKey ? `?applicationKey=${encodeURIComponent(applicationKey)}` : ''}`); }
  get(id: string): Promise<Result<EmailDesign>> { return this.http.get(path(id)); }
  create(input: { applicationKey: string; key: string; locale?: string; draft: EmailDesignDraft }): Promise<Result<EmailDesign>> { return this.http.post('/api/v1/designs', input); }
  update(id: string, draft: EmailDesignDraft, expectedRevision: number): Promise<Result<EmailDesign>> { return this.http.patch(path(id), { draft, expectedRevision }); }
  preview(id: string, input: { variables?: Record<string, unknown>; sample?: boolean; published?: boolean; version?: number } = {}): Promise<Result<{ html: string; text: string; subject: string; renderer: string; releaseId: string | null; contentHash: string; sample: boolean }>> { return this.http.post(`${path(id)}/preview`, input); }
  publish(id: string, expectedRevision: number): Promise<Result<EmailDesignRelease>> { return this.http.post(`${path(id)}/publish`, { expectedRevision }); }
  rollback(id: string, rollbackVersion: number, expectedRevision: number): Promise<Result<EmailDesignRelease>> { return this.http.post(`${path(id)}/rollback`, { rollbackVersion, expectedRevision }); }
  releases(id: string): Promise<Result<EmailDesignRelease[]>> { return this.http.get(`${path(id)}/releases`); }
  send(id: string, input: { to: Array<{ email: string; name?: string }>; variables?: Record<string, unknown>; version?: number; metadata?: Record<string, string> }, idempotencyKey: string): Promise<Result<{ messageId: string; status: string }>> {
    return this.http.post(`${path(id)}/send`, input, { headers: { 'Idempotency-Key': idempotencyKey } });
  }
  deliveries(id: string): Promise<Result<Array<{ id: string; releaseId: string; messageId: string | null; state: string; createdAt: string; events: Array<{ eventType: string; timestamp: string }> }>>> { return this.http.get(`${path(id)}/deliveries`); }
  exportManifest(applicationKey: string): Promise<Result<DesignManifest>> { return this.http.get(`/api/v1/designs/manifest?applicationKey=${encodeURIComponent(applicationKey)}`); }
  applyManifest(manifest: DesignManifest): Promise<Result<{ dryRun: boolean; changes: Array<{ key: string; action: string }> }>> { return this.http.post('/api/v1/designs/manifest', manifest); }
  uploadLogo(applicationKey: string, pngBase64: string): Promise<Result<{ id: string; url: string; public: true; immutable: true }>> { return this.http.post('/api/v1/designs/assets', { applicationKey, pngBase64 }); }
}
