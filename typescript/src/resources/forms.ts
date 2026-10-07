/**
 * Forms resource - hosted signup forms that subscribe people to a list.
 *
 * Managing forms needs `contacts:read` / `contacts:write`. Submissions are
 * normally posted by the browser to the public submit endpoint; `submit()`
 * is provided for server-side relays and tests.
 */

import type { HttpClient } from '../utils/http';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

const seg = encodeURIComponent;

export type SignupFormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type FormFieldType =
  | 'TEXT'
  | 'EMAIL'
  | 'NUMBER'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'TEXTAREA'
  | 'HIDDEN';

export type FormFieldBinding = 'EMAIL' | 'FIRST_NAME' | 'LAST_NAME' | 'PHONE';

export interface FormFieldInput {
  /** Lowercase, starts with a letter: `^[a-z][a-z0-9_]*$`. */
  fieldKey: string;
  label: string;
  helpText?: string | null;
  placeholder?: string | null;
  type: FormFieldType;
  required?: boolean;
  validationRules?: Record<string, unknown>;
  defaultValue?: string | null;
  /** Map the answer onto a contact field. One EMAIL field bound to EMAIL is required. */
  bindsToContact?: FormFieldBinding | null;
}

export interface FormField extends Required<Pick<FormFieldInput, 'fieldKey' | 'label' | 'type'>> {
  id: string;
  formId: string;
  sortOrder: number;
  helpText: string | null;
  placeholder: string | null;
  required: boolean;
  validationRules: Record<string, unknown>;
  defaultValue: string | null;
  bindsToContact: FormFieldBinding | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignupForm {
  id: string;
  userId: string;
  listId: string;
  slug: string;
  name: string;
  status: SignupFormStatus;
  /** Double opt-in: contacts stay PENDING until they confirm. Default true. */
  requireConfirmation: boolean;
  turnstileEnabled: boolean;
  sendWelcomeEmail: boolean;
  confirmationTemplateId: string | null;
  welcomeTemplateId: string | null;
  headline: string | null;
  subheadline: string | null;
  submitButtonLabel: string;
  successMessage: string | null;
  successRedirectUrl: string | null;
  allowedOrigins: string[];
  poweredByDisabled: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Included by `list()`. */
  list?: { id: string; name: string; [key: string]: unknown };
  /** Included by `get()`. */
  fields?: FormField[];
  _count?: { submissions: number };
}

export interface CreateFormRequest {
  listId: string;
  name: string;
  /** Lowercase letters, digits and hyphens. */
  slug: string;
}

export interface UpdateFormRequest {
  name?: string;
  status?: SignupFormStatus;
  requireConfirmation?: boolean;
  turnstileEnabled?: boolean;
  sendWelcomeEmail?: boolean;
  /** Must contain `{{confirm_url}}`. */
  confirmationTemplateId?: string | null;
  welcomeTemplateId?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  submitButtonLabel?: string;
  /** Set either `successMessage` or `successRedirectUrl`, not both. */
  successMessage?: string | null;
  successRedirectUrl?: string | null;
  allowedOrigins?: string[];
  poweredByDisabled?: boolean;
}

export interface FormSubmitResult {
  data: { ok: true; requiresConfirmation: boolean };
}

export class FormsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  /**
   * List active (non-archived) forms.
   */
  public async list(options: { limit?: number; offset?: number } = {}): Promise<{
    success: true;
    data: { forms: SignupForm[]; total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    const qs = params.toString();
    return withRetry(() => this.http.get(`/api/v1/forms${qs ? `?${qs}` : ''}`), this.retryConfig);
  }

  /**
   * Get a form with its fields and list.
   */
  public async get(id: string): Promise<{ success: true; data: { form: SignupForm } }> {
    return withRetry(() => this.http.get(`/api/v1/forms/${seg(id)}`), this.retryConfig);
  }

  /**
   * Create a DRAFT form for a list, with a single required email field.
   */
  public async create(request: CreateFormRequest): Promise<{ success: true; data: { form: SignupForm } }> {
    return this.http.post('/api/v1/forms', request);
  }

  /**
   * Update a form's settings; set `status: 'PUBLISHED'` to accept submissions.
   */
  public async update(id: string, request: UpdateFormRequest): Promise<{ success: true; data: { form: SignupForm } }> {
    return withRetry(() => this.http.patch(`/api/v1/forms/${seg(id)}`, request), this.retryConfig);
  }

  /**
   * Archive a form (it stops accepting submissions).
   */
  public async archive(id: string): Promise<{ success: true; data: { ok: true } }> {
    return withRetry(() => this.http.delete(`/api/v1/forms/${seg(id)}`), this.retryConfig);
  }

  /**
   * Replace a form's fields (order is preserved).
   */
  public async setFields(id: string, fields: FormFieldInput[]): Promise<{ success: true; data: { fields: FormField[] } }> {
    return withRetry(() => this.http.put(`/api/v1/forms/${seg(id)}/fields`, { fields }), this.retryConfig);
  }

  /**
   * Submit answers to a PUBLISHED form, keyed by `fieldKey` (public endpoint,
   * subject to the form's origin, CAPTCHA and rate limits). Not retried.
   */
  public async submit(id: string, values: Record<string, unknown>): Promise<FormSubmitResult> {
    return this.http.post(`/api/v1/forms/${seg(id)}/submit`, values);
  }
}
