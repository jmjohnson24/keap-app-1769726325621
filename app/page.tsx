'use client';

import { useState, useEffect } from 'react';
import { keapAPI, Contact, Note } from '../lib/keap';

type View = 'list' | 'add' | 'edit' | 'view';

export default function Home() {
  const [view, setView] = useState<View>('list');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({ title: '', body: '' });

  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async (search?: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await keapAPI.getContacts(search);
      setContacts(response.contacts || []);
    } catch (err) {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (contactId: number) => {
    try {
      const response = await keapAPI.getNotes(contactId);
      setNotes(response.notes || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadContacts(searchTerm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const contactData: Contact = {
      given_name: formData.given_name,
      family_name: formData.family_name,
      email_addresses: formData.email ? [{ email: formData.email, field: 'EMAIL1' }] : [],
      phone_numbers: formData.phone ? [{ number: formData.phone, field: 'PHONE1' }] : [],
      addresses: formData.address ? [{
        line1: formData.address,
        locality: formData.city,
        region: formData.state,
        zip_code: formData.zip,
        country_code: 'US',
        field: 'BILLING'
      }] : []
    };

    try {
      if (view === 'edit' && selectedContact?.id) {
        await keapAPI.updateContact(selectedContact.id, contactData);
      } else {
        await keapAPI.createContact(contactData);
      }
      resetForm();
      setView('list');
      loadContacts();
    } catch (err) {
      setError('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      given_name: contact.given_name || '',
      family_name: contact.family_name || '',
      email: contact.email_addresses?.[0]?.email || '',
      phone: contact.phone_numbers?.[0]?.number || '',
      address: contact.addresses?.[0]?.line1 || '',
      city: contact.addresses?.[0]?.locality || '',
      state: contact.addresses?.[0]?.region || '',
      zip: contact.addresses?.[0]?.zip_code || ''
    });
    setView('edit');
  };

  const handleView = async (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.id) {
      await loadNotes(contact.id);
    }
    setView('view');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await keapAPI.deleteContact(id);
        loadContacts();
      } catch (err) {
        setError('Failed to delete contact');
      }
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact?.id || !newNote.title.trim()) return;

    try {
      await keapAPI.createNote({
        title: newNote.title,
        body: newNote.body,
        contact_id: selectedContact.id
      });
      setNewNote({ title: '', body: '' });
      loadNotes(selectedContact.id);
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const resetForm = () => {
    setFormData({
      given_name: '',
      family_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    });
    setSelectedContact(null);
    setError('');
  };

  const renderContactList = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pool Maintenance CRM</h1>
        <button
          onClick={() => { resetForm(); setView('add'); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Contact
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => { setSearchTerm(''); loadContacts(); }}
          className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Clear
        </button>
      </form>

      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {contact.given_name} {contact.family_name}
                </h3>
                <p className="text-gray-600">{contact.email_addresses?.[0]?.email}</p>
                <p className="text-gray-600">{contact.phone_numbers?.[0]?.number}</p>
                {contact.addresses?.[0] && (
                  <p className="text-gray-600 text-sm">
                    {contact.addresses[0].line1}, {contact.addresses[0].locality}, {contact.addresses[0].region} {contact.addresses[0].zip_code}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(contact)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(contact)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => contact.id && handleDelete(contact.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {view === 'edit' ? 'Edit Contact' : 'Add New Contact'}
        </h2>
        <button
          onClick={() => setView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to List
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              required
              value={formData.given_name}
              onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              required
              value={formData.family_name}
              onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : (view === 'edit' ? 'Update Contact' : 'Add Contact')}
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderContactView = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {selectedContact?.given_name} {selectedContact?.family_name}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(selectedContact!)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setView('list')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-2">
            <p><strong>Email:</strong> {selectedContact?.email_addresses?.[0]?.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {selectedContact?.phone_numbers?.[0]?.number || 'N/A'}</p>
            {selectedContact?.addresses?.[0] && (
              <div>
                <strong>Address:</strong>
                <p className="ml-4">
                  {selectedContact.addresses[0].line1}<br />
                  {selectedContact.addresses[0].locality}, {selectedContact.addresses[0].region} {selectedContact.addresses[0].zip_code}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          
          <form onSubmit={handleAddNote} className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <textarea
              placeholder="Note content"
              value={newNote.body}
              onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Note
            </button>
          </form>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-sm">{note.title}</h4>
                <p className="text-gray-700 text-sm mt-1">{note.body}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {note.date_created ? new Date(note.date_created).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-gray-500 text-sm">No notes yet. Add one above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {view === 'list' && renderContactList()}
        {(view === 'add' || view === 'edit') && renderForm()}
        {view === 'view' && renderContactView()}
      </div>
    </div>
  );
}