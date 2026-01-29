const API_KEY = 'KeapAK-99e0c9ee9da830cb526ec442774ac95e0f1259529534921d9e';
const BASE_URL = 'https://api.infusionsoft.com/crm/rest';

interface Contact {
  id?: number;
  given_name?: string;
  family_name?: string;
  email_addresses?: Array<{
    email: string;
    field: string;
  }>;
  phone_numbers?: Array<{
    number: string;
    field: string;
  }>;
  addresses?: Array<{
    line1?: string;
    line2?: string;
    locality?: string;
    region?: string;
    zip_code?: string;
    country_code?: string;
    field: string;
  }>;
  custom_fields?: Array<{
    id: number;
    content: string;
  }>;
}

interface Note {
  id?: number;
  title?: string;
  body?: string;
  contact_id?: number;
  date_created?: string;
  last_updated?: string;
}

class KeapAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getContacts(search?: string): Promise<{ contacts: Contact[] }> {
    let endpoint = '/v2/contacts?page_size=100';
    if (search) {
      endpoint += `&filter=given_name~'${search}' OR family_name~'${search}'`;
    }
    return this.request(endpoint);
  }

  async getContact(id: number): Promise<Contact> {
    return this.request(`/v2/contacts/${id}`);
  }

  async createContact(contact: Contact): Promise<Contact> {
    return this.request('/v2/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
    return this.request(`/v2/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(contact),
    });
  }

  async deleteContact(id: number): Promise<void> {
    return this.request(`/v2/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotes(contactId: number): Promise<{ notes: Note[] }> {
    return this.request(`/v2/notes?contact_id=${contactId}&page_size=100`);
  }

  async createNote(note: Omit<Note, 'id'>): Promise<Note> {
    return this.request('/v2/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateNote(id: number, note: Partial<Note>): Promise<Note> {
    return this.request(`/v2/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(note),
    });
  }

  async deleteNote(id: number): Promise<void> {
    return this.request(`/v2/notes/${id}`, {
      method: 'DELETE',
    });
  }
}

export const keapAPI = new KeapAPI();
export type { Contact, Note };