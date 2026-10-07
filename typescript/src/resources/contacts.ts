/**
 * Contacts resource - Contact and contact list management
 */

import type { HttpClient } from '../utils/http';
import type {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsOptions,
  ContactList,
  CreateContactListRequest,
  UpdateContactListRequest,
  ListContactListsOptions,
  ContactListPage,
  BulkContactResult,
  BulkDeleteContactsResult,
  ImportCsvOptions,
  ContactImportResult,
  ListMembersOptions,
  ListMembersResponse,
  AddListMembersInput,
  AddListMembersResponse,
  RemoveListMembersInput,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

const seg = encodeURIComponent;

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export class ContactsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  // ========== Contacts ==========

  /**
   * List contacts. Filters: `status`, `tag`, `search`, `source`, sorting.
   * To list the members of one list use `getListMembers(listId)`.
   */
  public async list(options: ListContactsOptions = {}): Promise<PaginatedResponse<Contact>> {
    if ((options as { listId?: unknown }).listId !== undefined) {
      throw new Error('contacts.list() does not filter by list. Use contacts.getListMembers(listId) instead.');
    }
    const tag = options.tag ?? options.tags?.split(',').map((t) => t.trim()).find(Boolean);
    const qs = query({
      page: options.page,
      limit: options.limit,
      status: options.status,
      tag,
      search: options.search,
      source: options.source,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    });
    return withRetry(() => this.http.get(`/api/v1/contacts${qs}`), this.retryConfig);
  }

  /**
   * Get one contact, with its tags and custom fields.
   */
  public async get(id: string): Promise<{ success: true; data: Contact }> {
    return withRetry(() => this.http.get(`/api/v1/contacts/${seg(id)}`), this.retryConfig);
  }

  /**
   * Create a contact. `source` defaults to `API`. Fails with
   * `DUPLICATE_CONTACT` (409) when the email already exists. To subscribe
   * someone to lists or topics with consent evidence, prefer
   * `client.subscriptions.subscribe()`.
   */
  public async create(request: CreateContactRequest): Promise<{ success: true; data: Contact }> {
    return this.http.post('/api/v1/contacts', request);
  }

  /**
   * Update a contact's fields or status. Tags are managed with
   * `addTags()` / `removeTag()`.
   */
  public async update(id: string, request: UpdateContactRequest): Promise<{ success: true; data: Contact }> {
    return withRetry(() => this.http.patch(`/api/v1/contacts/${seg(id)}`, request), this.retryConfig);
  }

  /**
   * Delete a contact.
   */
  public async delete(id: string): Promise<{ success: true; data: { message: string } }> {
    return withRetry(() => this.http.delete(`/api/v1/contacts/${seg(id)}`), this.retryConfig);
  }

  /**
   * Bulk delete contacts by id (up to 1000).
   */
  public async bulkDelete(contactIds: string[]): Promise<{ success: true; data: BulkDeleteContactsResult }> {
    return withRetry(
      () => this.http.delete('/api/v1/contacts/bulk', { data: { contactIds } }),
      this.retryConfig
    );
  }

  /**
   * Bulk create contacts (up to 1000). Existing emails are skipped when
   * `skipDuplicates` is true (default) and reported in `errors` otherwise;
   * existing contacts are never updated.
   */
  public async bulkCreate(
    contacts: CreateContactRequest[],
    options: { skipDuplicates?: boolean } = {}
  ): Promise<{ success: true; data: BulkContactResult }> {
    const body: { contacts: CreateContactRequest[]; skipDuplicates?: boolean } = { contacts };
    if (options.skipDuplicates !== undefined) body.skipDuplicates = options.skipDuplicates;
    return this.http.post('/api/v1/contacts/bulk', body);
  }

  /**
   * @deprecated The API creates and skips; it does not update. Use `bulkCreate()`.
   */
  public async bulkUpsert(contacts: CreateContactRequest[]): Promise<{ success: true; data: BulkContactResult }> {
    return this.bulkCreate(contacts);
  }

  /**
   * Import contacts from a CSV file (at most 2 MiB). Map CSV headers to
   * contact fields with `mappings`; one column must map to `email`.
   * Optionally add every row to `listId` and tag new contacts.
   *
   * @param file CSV content as a `Blob`/`File`, or as a string.
   *
   * @example
   * await client.contacts.importCsv(csvText, {
   *   mappings: [
   *     { csvColumn: 'Email Address', field: 'email' },
   *     { csvColumn: 'First', field: 'firstName' },
   *   ],
   *   listId: 'list_123',
   *   tags: ['imported', 'spring-2026'],
   * });
   */
  public async importCsv(file: Blob | string, options: ImportCsvOptions): Promise<ContactImportResult> {
    if (!options || !Array.isArray(options.mappings)) {
      throw new Error('importCsv requires options.mappings, e.g. [{ csvColumn: "Email", field: "email" }]');
    }
    const filename = options.filename ?? (typeof File !== 'undefined' && file instanceof File ? file.name : 'contacts.csv');
    const blob = typeof file === 'string' ? new Blob([file], { type: 'text/csv' }) : file;
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('mappings', JSON.stringify(options.mappings));
    if (options.listId) form.append('listId', options.listId);
    const tags = Array.isArray(options.tags) ? options.tags.join(',') : options.tags;
    if (tags) form.append('tags', tags);
    return this.http.post('/api/v1/contacts/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * Add tags to a contact (lowercase letters, digits, `-` and `_`; at most 50 per contact).
   */
  public async addTags(id: string, tags: string[]): Promise<{ success: true; data: Contact }> {
    return withRetry(
      () => this.http.post(`/api/v1/contacts/${seg(id)}/tags`, { tags }),
      this.retryConfig
    );
  }

  /**
   * Remove one tag from a contact.
   */
  public async removeTag(id: string, tag: string): Promise<{ success: true; data: { message: string } }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/${seg(id)}/tags/${seg(tag)}`),
      this.retryConfig
    );
  }

  /**
   * Remove several tags from a contact, one request per tag. Without `tags`,
   * removes every tag the contact currently has.
   */
  public async removeTags(id: string, tags?: string[]): Promise<{ success: true; data: { removed: string[] } }> {
    const names = tags ?? ((await this.get(id)).data.tags ?? []).map((t) => t.tag);
    for (const tag of names) await this.removeTag(id, tag);
    return { success: true, data: { removed: names } };
  }

  // ========== Contact Lists ==========

  /**
   * List contact lists.
   */
  public async listLists(options: ListContactListsOptions = {}): Promise<ContactListPage<ContactList>> {
    const qs = query({
      page: options.page,
      limit: options.limit,
      type: options.type,
      isArchived: options.isArchived,
      search: options.search,
    });
    return withRetry(() => this.http.get(`/api/v1/contacts/lists${qs}`), this.retryConfig);
  }

  /**
   * Get a contact list
   */
  public async getList(id: string): Promise<{ data: ContactList }> {
    return withRetry(() => this.http.get(`/api/v1/contacts/lists/${seg(id)}`), this.retryConfig);
  }

  /**
   * Create a contact list. Pass `suppressionGroupId` to tag it with a topic.
   */
  public async createList(request: CreateContactListRequest): Promise<{ data: ContactList }> {
    return this.http.post('/api/v1/contacts/lists', request);
  }

  /**
   * Update a contact list
   */
  public async updateList(id: string, request: UpdateContactListRequest): Promise<{ data: ContactList }> {
    return withRetry(() => this.http.patch(`/api/v1/contacts/lists/${seg(id)}`, request), this.retryConfig);
  }

  /**
   * Delete a contact list
   */
  public async deleteList(id: string): Promise<{ success: true }> {
    return withRetry(() => this.http.delete(`/api/v1/contacts/lists/${seg(id)}`), this.retryConfig);
  }

  // ========== List Membership ==========

  /**
   * List the members of a list, with per-member suppression flags.
   * `filter: 'active'` returns mailable members only; `'suppressed'` the rest.
   */
  public async getListMembers(id: string, options: ListMembersOptions = {}): Promise<ListMembersResponse> {
    const qs = query({ page: options.page, limit: options.limit, filter: options.filter });
    return withRetry(
      () => this.http.get(`/api/v1/contacts/lists/${seg(id)}/members${qs}`),
      this.retryConfig
    );
  }

  /**
   * Add members by contact id and/or email. Unknown emails are reported in
   * `notFound` unless `createMissing` is true. Suppressed or unsubscribed
   * addresses are reported in `blocked`, never silently re-added. This is an
   * owner action: to record a subscriber's own consent use
   * `client.subscriptions.subscribe()`.
   */
  public async addListMembers(id: string, input: AddListMembersInput): Promise<AddListMembersResponse> {
    return withRetry(
      () => this.http.post(`/api/v1/contacts/lists/${seg(id)}/members`, input),
      this.retryConfig
    );
  }

  /**
   * Remove members by contact id and/or email. This deletes the membership
   * (owner removal); it is not an unsubscribe. Throws `NOT_A_MEMBER` (404)
   * when none of them were members.
   */
  public async removeListMembers(id: string, input: RemoveListMembersInput): Promise<{ success: true; data: { removed: number } }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/lists/${seg(id)}/members`, { data: input }),
      this.retryConfig
    );
  }

  /**
   * Add contacts to a list. Accepts contact ids, or the same input as `addListMembers()`.
   */
  public async addToList(id: string, contacts: string[] | AddListMembersInput): Promise<AddListMembersResponse> {
    return this.addListMembers(id, Array.isArray(contacts) ? { contactIds: contacts } : contacts);
  }

  /**
   * Remove contacts from a list. Accepts contact ids, or the same input as `removeListMembers()`.
   */
  public async removeFromList(id: string, contacts: string[] | RemoveListMembersInput): Promise<{ success: true; data: { removed: number } }> {
    return this.removeListMembers(id, Array.isArray(contacts) ? { contactIds: contacts } : contacts);
  }
}
