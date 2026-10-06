'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getForms, createForm, deleteForm, updateForm } from './api/forms';

interface Form {
  id: number;
  title: string;
  description?: string;
  is_published: boolean;
  public_slug: string;
  created_at: string;
}

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      setLoading(true);
      const data = await getForms();
      setForms(data);
    } catch (err) {
      setError('Failed to load forms');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      await createForm(newTitle);
      setNewTitle('');
      loadForms();
    } catch (err) {
      setError('Failed to create form');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this form?')) return;
    try {
      await deleteForm(id);
      loadForms();
    } catch (err) {
      setError('Failed to delete form');
    }
  }

  async function handlePublish(id: number, published: boolean) {
    try {
      await updateForm(id, { is_published: !published });
      loadForms();
    } catch (err) {
      setError('Failed to update form');
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Typeform Clone</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Create New Form</h2>
        <input
          type="text"
          placeholder="Form title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleCreate} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Create
        </button>
      </div>

      {loading ? (
        <p>Loading forms...</p>
      ) : forms.length === 0 ? (
        <p>No forms yet. Create one!</p>
      ) : (
        <div>
          <h2>Your Forms ({forms.length})</h2>
          {forms.map((form) => (
            <div
              key={form.id}
              style={{
                padding: '15px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Link href={`/builder/${form.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ cursor: 'pointer', color: '#0066cc' }}>{form.title}</h3>
                </Link>
                <p>{form.description}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Status: {form.is_published ? '✅ Published' : '📝 Draft'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handlePublish(form.id, form.is_published)}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  {form.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(form.id)}
                  style={{ padding: '6px 12px', cursor: 'pointer', background: '#ff6b6b', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}