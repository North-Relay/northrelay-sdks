/**
 * Templates resource - Template management
 */

import type { HttpClient } from '../utils/http';
import type {
  Template, CreateTemplateRequest, UpdateTemplateRequest, PaginatedResponse,
  TemplateDocument, TemplateVersion, AddBlockRequest, UpdateBlockRequest,
  TestSendRequest, ImportTemplateRequest, ImportResult, ExportedTemplate,
  MjmlCompileResult,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class TemplatesResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List all templates
   * 
   * @param options - Pagination and filter options
   * @returns Paginated templates
   */
  public async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    activeOnly?: boolean;
  }): Promise<PaginatedResponse<Template>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.activeOnly) params.set('activeOnly', 'true');

    return withRetry(
      () => this.http.get(`/api/v1/templates?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a template by ID
   * 
   * @param id - Template ID
   * @returns Template details
   */
  public async get(id: string): Promise<{ success: true; data: Template }> {
    return withRetry(
      () => this.http.get(`/api/v1/templates/${id}`),
      this.retryConfig
    );
  }

  /**
   * Create a new template
   * 
   * @param request - Template creation request
   * @returns Created template
   * 
   * @example
   * ```typescript
   * const template = await client.templates.create({
   *   name: 'Welcome Email',
   *   subject: 'Welcome {{name}}!',
   *   htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to our service!</p>',
   *   textContent: 'Hello {{name}}, Welcome to our service!'
   * });
   * ```
   */
  public async create(request: CreateTemplateRequest): Promise<{ success: true; data: Template }> {
    return withRetry(
      () => this.http.post('/api/v1/templates', request),
      this.retryConfig
    );
  }

  /**
   * Update a template
   * 
   * @param id - Template ID
   * @param request - Template update request
   * @returns Updated template
   */
  public async update(id: string, request: UpdateTemplateRequest): Promise<{ success: true; data: Template }> {
    return withRetry(
      () => this.http.patch(`/api/v1/templates/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a template
   * 
   * @param id - Template ID
   * @returns Deletion confirmation
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/templates/${id}`),
      this.retryConfig
    );
  }

  /**
   * Preview a template with variables
   * 
   * @param id - Template ID
   * @param variables - Template variables
   * @returns Rendered template preview
   * 
   * @example
   * ```typescript
   * const preview = await client.templates.preview('tpl_abc123', {
   *   name: 'John Doe',
   *   verificationCode: '123456'
   * });
   * console.log(preview.data.html);
   * ```
   */
  public async preview(
    id: string,
    variables: Record<string, string>
  ): Promise<{
    success: true;
    data: { subject: string; html: string; text?: string };
  }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/render', { templateId: id, variables }),
      this.retryConfig
    );
  }

  /**
   * Extract variables from template content
   * 
   * @param content - Template HTML or text content
   * @returns Extracted variable names
   */
  public async extractVariables(content: string): Promise<{ success: true; data: { variables: string[] } }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/extract-variables', { content }),
      this.retryConfig
    );
  }

  // ─── Block Operations ───────────────────────────────────────────────

  /**
   * Get all blocks for a template
   *
   * @param id - Template ID
   * @returns Template document with blocks
   */
  public async getBlocks(id: string): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.get(`/api/v1/templates/${id}/blocks`),
      this.retryConfig
    );
  }

  /**
   * Add a block to a template
   *
   * @param id - Template ID
   * @param request - Block creation request
   * @returns Updated template document
   */
  public async addBlock(id: string, request: AddBlockRequest): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/blocks`, request),
      this.retryConfig
    );
  }

  /**
   * Update a block within a template
   *
   * @param id - Template ID
   * @param blockId - Block ID
   * @param request - Block update request
   * @returns Updated template document
   */
  public async updateBlock(id: string, blockId: string, request: UpdateBlockRequest): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.patch(`/api/v1/templates/${id}/blocks/${blockId}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a block from a template
   *
   * @param id - Template ID
   * @param blockId - Block ID
   * @returns Updated template document
   */
  public async deleteBlock(id: string, blockId: string): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.delete(`/api/v1/templates/${id}/blocks/${blockId}`),
      this.retryConfig
    );
  }

  /**
   * Duplicate a block within a template
   *
   * @param id - Template ID
   * @param blockId - Block ID to duplicate
   * @returns Updated template document
   */
  public async duplicateBlock(id: string, blockId: string): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/blocks/${blockId}/duplicate`, {}),
      this.retryConfig
    );
  }

  /**
   * Reorder blocks within a template
   *
   * @param id - Template ID
   * @param blockIds - Ordered array of block IDs
   * @returns Updated template document
   */
  public async reorderBlocks(id: string, blockIds: string[]): Promise<{ success: true; data: TemplateDocument }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/blocks/reorder`, { blockIds }),
      this.retryConfig
    );
  }

  // ─── Version Operations ─────────────────────────────────────────────

  /**
   * List versions of a template
   *
   * @param id - Template ID
   * @param options - Pagination options
   * @returns Paginated list of template versions
   */
  public async listVersions(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<TemplateVersion>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    return withRetry(
      () => this.http.get(`/api/v1/templates/${id}/versions?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Restore a template to a previous version
   *
   * @param id - Template ID
   * @param versionId - Version ID to restore
   * @returns Restored template
   */
  public async restoreVersion(id: string, versionId: string): Promise<{ success: true; data: Template }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/versions/${versionId}/restore`, {}),
      this.retryConfig
    );
  }

  // ─── Test & Utility ─────────────────────────────────────────────────

  /**
   * Send a test email using a template
   *
   * @param id - Template ID
   * @param request - Test send configuration
   * @returns Send confirmation
   */
  public async testSend(id: string, request: TestSendRequest): Promise<{ success: true; data: { messageId: string } }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/test-send`, request),
      this.retryConfig
    );
  }

  /**
   * Import one or more templates
   *
   * @param templates - Template(s) to import
   * @returns Import results with counts
   *
   * @example
   * ```typescript
   * const result = await client.templates.import({
   *   name: 'Imported Template',
   *   subject: 'Hello {{name}}',
   *   htmlContent: '<h1>Hello {{name}}</h1>'
   * });
   * ```
   */
  public async import(templates: ImportTemplateRequest | ImportTemplateRequest[]): Promise<{ success: true; data: ImportResult }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/import', templates),
      this.retryConfig
    );
  }

  /**
   * Export templates
   *
   * @param id - Optional template ID to export a single template; omit to export all
   * @returns Exported template data
   */
  public async export(id?: string): Promise<{ success: true; data: ExportedTemplate[] }> {
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    const query = params.toString();

    return withRetry(
      () => this.http.get(`/api/v1/templates/export${query ? `?${query}` : ''}`),
      this.retryConfig
    );
  }

  /**
   * Compile MJML markup to HTML
   *
   * @param mjml - MJML markup string
   * @param options - Compilation options
   * @returns Compiled HTML and any errors
   *
   * @example
   * ```typescript
   * const result = await client.templates.compileMjml('<mjml><mj-body>...</mj-body></mjml>');
   * console.log(result.data.html);
   * ```
   */
  public async compileMjml(mjml: string, options?: {
    minify?: boolean;
  }): Promise<{ success: true; data: MjmlCompileResult }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/compile-mjml', { mjml, ...options }),
      this.retryConfig
    );
  }
}
