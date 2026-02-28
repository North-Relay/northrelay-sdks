/**
 * Contacts resource - Contact and contact list management
 */

import type { HttpClient } from '../utils/http';
import type {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactList,
  CreateContactListRequest,
  UpdateContactListRequest,
  BulkContactResult,
  ContactImportJob,
  PaginatedResponse,
} from '../types';
import type { RetryConfig } from '../utils/retry';
import { withRetry } from '../utils/retry';

export class ContactsResource {
  constructor(
    private http: HttpClient,
    private retryConfig: RetryConfig
  ) {}

  // ========== Contacts ==========

  /**
   * List contacts
   */
  public async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    listId?: string;
    tags?: string;
  }): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.listId) params.set('listId', options.listId);
    if (options?.tags) params.set('tags', options.tags);
    
    return withRetry(
      () => this.http.get(`/api/v1/contacts?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Create a new contact
   */
  public async create(request: CreateContactRequest): Promise<{ success: true; data: Contact }> {
    return withRetry(
      () => this.http.post('/api/v1/contacts', request),
      this.retryConfig
    );
  }

  /**
   * Delete a contact
   */
  public async delete(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/${id}`),
      this.retryConfig
    );
  }

  /**
   * Bulk delete contacts
   */
  public async bulkDelete(ids: string[]): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete('/api/v1/contacts/bulk', { data: { ids } }),
      this.retryConfig
    );
  }

  /**
   * Bulk create/update contacts
   */
  public async bulkUpsert(contacts: CreateContactRequest[]): Promise<{ success: true; data: BulkContactResult }> {
    return withRetry(
      () => this.http.post('/api/v1/contacts/bulk', { contacts }),
      this.retryConfig
    );
  }

  /**
   * Import contacts from CSV
   */
  public async importCsv(file: File, listId?: string): Promise<{ success: true; data: ContactImportJob }> {
    const formData = new FormData();
    formData.append('file', file);
    if (listId) {
      formData.append('listId', listId);
    }
    
    return withRetry(
      () => this.http.post('/api/v1/contacts/import', formData),
      this.retryConfig
    );
  }

  /**
   * Remove all tags from a contact
   */
  public async removeTags(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/${id}/tags`),
      this.retryConfig
    );
  }

  /**
   * Remove a specific tag from a contact
   */
  public async removeTag(id: string, tag: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/${id}/tags/${encodeURIComponent(tag)}`),
      this.retryConfig
    );
  }

  // ========== Contact Lists ==========

  /**
   * List contact lists
   */
  public async listLists(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ContactList>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/contacts/lists?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Get a contact list
   */
  public async getList(id: string): Promise<{ success: true; data: ContactList }> {
    return withRetry(
      () => this.http.get(`/api/v1/contacts/lists/${id}`),
      this.retryConfig
    );
  }

  /**
   * Create a contact list
   */
  public async createList(request: CreateContactListRequest): Promise<{ success: true; data: ContactList }> {
    return withRetry(
      () => this.http.post('/api/v1/contacts/lists', request),
      this.retryConfig
    );
  }

  /**
   * Update a contact list
   */
  public async updateList(id: string, request: UpdateContactListRequest): Promise<{ success: true; data: ContactList }> {
    return withRetry(
      () => this.http.patch(`/api/v1/contacts/lists/${id}`, request),
      this.retryConfig
    );
  }

  /**
   * Delete a contact list
   */
  public async deleteList(id: string): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/lists/${id}`),
      this.retryConfig
    );
  }

  // ========== List Membership ==========

  /**
   * Get list members
   */
  public async getListMembers(id: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    
    return withRetry(
      () => this.http.get(`/api/v1/contacts/lists/${id}/members?${params.toString()}`),
      this.retryConfig
    );
  }

  /**
   * Add contacts to a list
   */
  public async addToList(id: string, contactIds: string[]): Promise<{ success: true }> {
    return withRetry(
      () => this.http.post(`/api/v1/contacts/lists/${id}/members`, { contactIds }),
      this.retryConfig
    );
  }

  /**
   * Remove contacts from a list
   */
  public async removeFromList(id: string, contactIds: string[]): Promise<{ success: true }> {
    return withRetry(
      () => this.http.delete(`/api/v1/contacts/lists/${id}/members`, { data: { contactIds } }),
      this.retryConfig
    );
  }
}
