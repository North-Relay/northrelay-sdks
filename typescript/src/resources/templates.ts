/**
 * Templates resource - Template management
 */

import type { HttpClient } from '../utils/http';
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, TemplateVersion, PaginatedResponse } from '../types';
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
      () => this.http.put(`/api/v1/templates/${id}`, request),
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
      () => this.http.post(`/api/v1/templates/${id}/preview`, { variables }),
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

  /**
   * List version history for a template
   */
  public async listVersions(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: true; data: { versions: TemplateVersion[] }; meta: { page: number; limit: number; total_count: number; has_more: boolean } }> {
    const params = new URLSearchParams();
    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.limit !== undefined) params.set('limit', options.limit.toString());

    return withRetry(
      () => this.http.get(`/api/v1/templates/${id}/versions?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a specific version snapshot of a template
   */
  public async getVersion(id: string, version: number): Promise<{ success: true; data: TemplateVersion }> {
    return withRetry(
      () => this.http.get(`/api/v1/templates/${id}/versions/${version}`),
      this.retryConfig
    );
  }

  /**
   * Restore a template to a specific version
   */
  public async restoreVersion(id: string, version: number): Promise<{ success: true; data: { id: string; restoredFromVersion: number; currentVersion: number; message: string } }> {
    return withRetry(
      () => this.http.post(`/api/v1/templates/${id}/versions/${version}/restore`),
      this.retryConfig
    );
  }

  /**
   * Compile MJML to HTML
   */
  public async compileMjml(mjml: string, options?: { minify?: boolean }): Promise<{ success: true; data: { html: string } }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/compile-mjml', { mjml, ...options }),
      this.retryConfig
    );
  }

  /**
   * Render a template with variables
   */
  public async render(request: {
    templateId?: string;
    subject?: string;
    html?: string;
    text?: string;
    variables?: Record<string, string>;
  }): Promise<{ success: true; data: { subject: string; html: string; text: string } }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/render', request),
      this.retryConfig
    );
  }

  /**
   * Generate templates from starter layouts with a brand theme
   */
  public async generateBulk(options?: {
    themeId?: string;
    layoutIds?: string[];
  }): Promise<{ success: true; data: { created: number; skipped: number; templates: Array<{ id: string; name: string }>; errors: string[] } }> {
    return withRetry(
      () => this.http.post('/api/v1/templates/generate-bulk', options || {}),
      this.retryConfig
    );
  }
}
