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
export type CatalogSource = { kind: "template" | "gallery"; id: string };
export type CatalogItem = CatalogSource & { name: string; subject: string; category: string; shared: boolean; description?: string };
export interface DesignBrand { id: string; updatedAt: string; applicationKey: string | null; editable: boolean; theme: Partial<CreateBrandThemeRequest>; }
export interface EmailDesign { retiredAt?: string | null; replacementId?: string | null; replacementKind?: "DESIGN" | "TEMPLATE" | null; brandThemeId?: string | null; source?: (CatalogSource & { digest: string }) | null; id: string; applicationKey: string; key: string; locale: string; draft: EmailDesignDraft; revision: number; publishedVersion: number | null; }
export interface EmailDesignRelease { id: string; designId: string; version: number; snapshot: EmailDesignDraft; renderer: string; digest: string; revision?: number; }
export interface DesignManifest { schemaVersion: 1; applicationKey: string; dryRun?: boolean; entries: Array<{ key: string; locale?: string; draft: EmailDesignDraft; expectedRevision?: number }>; }
export interface DesignCapabilities {
  contractVersion: string; accountId: string; scopes: string[]; applications: string[] | null; senders: string[] | null;
  permissions: { read: boolean; edit: boolean; publish: boolean; send: boolean };
  limits: { templates: number | null; themes: number | null }; usage: { templates: number; themes: number };
  verifiedDomains: Array<{ hostname: string }>;
}
export type EmailDesignSummary = Omit<EmailDesign, 'draft'> & { draft: Pick<EmailDesignDraft, 'name' | 'subject' | 'category'> };
export type EmailDesignReleaseSummary = Omit<EmailDesignRelease, 'snapshot'> & { snapshot?: EmailDesignDraft };
export interface DesignListOptions { applicationKey?: string; cursor?: string; search?: string; brandId?: string; category?: EmailDesignDraft['category']; status?: 'all' | 'active' | 'retired'; limit?: number; }
export type CatalogOptions = Pick<DesignListOptions, 'cursor' | 'search' | 'brandId' | 'category'>;
const queryString = (options: object) => new URLSearchParams(Object.entries(options).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)] as [string, string])).toString();
type Result<T> = { success: true; data: T };
const path = (id: string) => `/api/v1/designs/${encodeURIComponent(id)}`;
/** Published email designs. Writes are explicit; sends require a stable idempotency key. */
export class DesignsResource {
  constructor(private http: HttpClient) {}
  catalog(options?: string | CatalogOptions): Promise<Result<{ items: CatalogItem[]; gallery: CatalogItem[]; nextCursor: string | null }>> { const query = queryString(typeof options === 'string' ? { cursor: options } : options ?? {}); return this.http.get(`/api/v1/designs/catalog${query ? `?${query}` : ''}`); }
  inspectTemplate(source: CatalogSource & { brandId?: string }): Promise<Result<{ source: CatalogSource & { digest: string }; draft: EmailDesignDraft; preview: { html: string; text: string; subject: string } }>> { return this.http.post('/api/v1/designs/catalog', source); }
  adoptTemplate(input: CatalogSource & { digest: string; applicationKey?: string; brandId?: string }): Promise<Result<EmailDesign>> { return this.http.post('/api/v1/designs/catalog/adopt', input); }
  syncSource(id: string, input: { expectedRevision: number; sourceDigest: string; apply?: boolean }): Promise<Result<unknown>> { return this.http.post(`${path(id)}/sync`, input); }
  brands(): Promise<Result<DesignBrand[]>> { return this.http.get('/api/v1/designs/brands'); }
  createBrand(input: { applicationKey?: string; theme: Omit<Partial<CreateBrandThemeRequest>, 'isDefault' | 'name'> & { name: string } }): Promise<Result<DesignBrand>> { return this.http.post('/api/v1/designs/brands', input); }
  updateBrand(id: string, input: { expectedUpdatedAt: string; theme: Omit<Partial<CreateBrandThemeRequest>, 'isDefault'> }): Promise<Result<DesignBrand>> { return this.http.patch(`/api/v1/designs/brands/${encodeURIComponent(id)}`, input); }
  bindBrand(id: string, brandId: string, expectedRevision: number): Promise<Result<EmailDesign>> { return this.http.post(`${path(id)}/brand`, { brandId, expectedRevision }); }
  capabilities(): Promise<Result<DesignCapabilities>> { return this.http.get('/api/v1/capabilities'); }
  list(applicationKey?: string): Promise<Result<EmailDesignSummary[]>> { return this.http.get(`/api/v1/designs${applicationKey ? `?applicationKey=${encodeURIComponent(applicationKey)}` : ''}`); }
  listPage(options: DesignListOptions = {}): Promise<Result<{ items: EmailDesignSummary[]; nextCursor: string | null }>> { return this.http.get(`/api/v1/designs?${queryString({ ...options, paginated: true })}`); }
  setLifecycle(id: string, input: { retired: boolean; expectedRevision: number; replacement?: { id: string; kind: 'TEMPLATE' | 'DESIGN' } }): Promise<Result<{ id: string; retired: boolean }>> { return this.http.patch(`${path(id)}/lifecycle`, input); }
  get(id: string): Promise<Result<EmailDesign>> { return this.http.get(path(id)); }
  create(input: { applicationKey: string; key: string; locale?: string; draft: EmailDesignDraft }): Promise<Result<EmailDesign>> { return this.http.post('/api/v1/designs', input); }
  update(id: string, draft: EmailDesignDraft, expectedRevision: number): Promise<Result<EmailDesign>> { return this.http.patch(path(id), { draft, expectedRevision }); }
  preview(id: string, input: { variables?: Record<string, unknown>; sample?: boolean; published?: boolean; version?: number } = {}): Promise<Result<{ html: string; text: string; subject: string; renderer: string; releaseId: string | null; contentHash: string; sample: boolean }>> { return this.http.post(`${path(id)}/preview`, input); }
  publish(id: string, expectedRevision: number): Promise<Result<EmailDesignRelease>> { return this.http.post(`${path(id)}/publish`, { expectedRevision }); }
  rollback(id: string, rollbackVersion: number, expectedRevision: number): Promise<Result<EmailDesignRelease>> { return this.http.post(`${path(id)}/rollback`, { rollbackVersion, expectedRevision }); }
  release(id: string, version: number): Promise<Result<EmailDesignRelease>> { return this.http.get(`${path(id)}/releases?version=${version}`); }
  releases(id: string): Promise<Result<EmailDesignReleaseSummary[]>> { return this.http.get(`${path(id)}/releases`); }
  send(id: string, input: { to: Array<{ email: string; name?: string }>; variables?: Record<string, unknown>; version?: number; metadata?: Record<string, string> }, idempotencyKey: string): Promise<Result<{ messageId: string; status: string }>> {
    return this.http.post(`${path(id)}/send`, input, { headers: { 'Idempotency-Key': idempotencyKey } });
  }
  deliveries(id: string): Promise<Result<Array<{ id: string; releaseId: string; messageId: string | null; state: string; createdAt: string; events: Array<{ eventType: string; timestamp: string }> }>>> { return this.http.get(`${path(id)}/deliveries`); }
  exportManifest(applicationKey: string): Promise<Result<DesignManifest>> { return this.http.get(`/api/v1/designs/manifest?applicationKey=${encodeURIComponent(applicationKey)}`); }
  applyManifest(manifest: DesignManifest): Promise<Result<{ dryRun: boolean; changes: Array<{ key: string; action: string }> }>> { return this.http.post('/api/v1/designs/manifest', manifest); }
  uploadLogo(applicationKey: string, pngBase64: string): Promise<Result<{ id: string; url: string; public: true; immutable: true }>> { return this.http.post('/api/v1/designs/assets', { applicationKey, pngBase64 }); }
}
