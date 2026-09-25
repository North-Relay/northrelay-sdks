import type { HttpClient } from '../utils/http';

export type CredentialType = 'USER' | 'APPLICATION';
export interface CredentialPolicy { applications: string[]; senders: string[]; }
export type CredentialInput = { name: string; scopes: string[]; expiresAt?: string | null } & (
  { type: 'USER'; policy?: never } | { type: 'APPLICATION'; policy: CredentialPolicy }
);
export interface Credential { id: string; type: CredentialType; name: string; scopes: string[]; active: boolean; isRevoked: boolean; expiresAt: string | null; lastUsedAt: string | null; createdAt: string; keyPrefix: string; policy: CredentialPolicy | null; }
type Result<T> = { success: true; data: T };
/** Account full_access required. Secrets are returned once. Writes are never retried. */
export class CredentialsResource {
  constructor(private http: HttpClient) {}
  list(): Promise<Result<Credential[]>> { return this.http.get('/api/v1/credentials'); }
  create(input: CredentialInput): Promise<Result<Partial<Credential> & { id: string; key: string }>> { return this.http.post('/api/v1/credentials', input); }
  update(id: string, input: CredentialInput): Promise<Result<Partial<Credential> & { id: string }>> { return this.http.patch(`/api/v1/credentials?id=${encodeURIComponent(id)}`, input); }
  /** Immediately invalidates the old secret. Persist the returned key securely. */
  rotate(id: string, type: CredentialType): Promise<Result<{ id: string; type: CredentialType; key: string }>> { return this.http.put('/api/v1/credentials', { id, type, action: 'rotate' }); }
  revoke(id: string, type: CredentialType): Promise<Result<{ id: string; type: CredentialType; revoked: boolean }>> { return this.http.put('/api/v1/credentials', { id, type, action: 'revoke' }); }
}
