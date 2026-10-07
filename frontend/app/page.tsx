'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getForms, createForm, deleteForm, updateForm } from '@/app/api/forms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Form {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  public_slug?: string;
}

interface FormWithResponses extends Form {
  responseCount: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<FormWithResponses[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      setLoading(true);
      const formsData = await getForms();
      
      // Fetch response count for each form
      const formsWithCount = await Promise.all(
        formsData.map(async (form: Form) => {
          try {
            const res = await fetch(`${API_URL}/forms/${form.id}/responses`);
            const responses = res.ok ? await res.json() : [];
            return {
              ...form,
              responseCount: responses.length || 0
            };
          } catch (error) {
            return { ...form, responseCount: 0 };
          }
        })
      );
      
      setForms(formsWithCount);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateForm() {
    if (!newTitle.trim()) {
      alert('Please enter a form title');
      return;
    }

    try {
      const newForm = await createForm(newTitle, '');
      setNewTitle('');
      // Auto-navigate to builder
      router.push(`/builder/${newForm.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form');
    }
  }

  async function handlePublish(formId: number, isPublished: boolean) {
    try {
      const form = forms.find((f) => f.id === formId);
      if (!form) return;
      
      await updateForm(formId, {
        ...form,
        is_published: !isPublished
      });
      
      loadForms();
    } catch (error) {
      console.error('Error publishing form:', error);
    }
  }

  async function handleDelete(formId: number) {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      await deleteForm(formId);
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111', margin: '0 0 10px 0' }}>
          Typeform Clone
        </h1>
        <p style={{ color: '#666', margin: '0 0 30px 0' }}>
          Create, manage, and share forms with ease
        </p>

        {/* Create Form Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '40px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111', margin: '0 0 16px 0' }}>
            Create New Form
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateForm()}
              placeholder="Enter form title..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: '#111',
                backgroundColor: '#fff'
              }}
            />
            <button
              onClick={handleCreateForm}
              style={{
                padding: '12px 32px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111', marginBottom: '24px' }}>
          Your Forms ({forms.length})
        </h2>

        {loading ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : forms.length === 0 ? (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <p style={{ color: '#666', fontSize: '16px' }}>
              No forms yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}
          >
            {forms.map((form) => (
              <div
                key={form.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')
                }
              >
                {/* Form Title */}
                <h3
                  onClick={() => router.push(`/builder/${form.id}`)}
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#3b82f6',
                    margin: '0 0 8px 0',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  {form.title}
                </h3>

                {/* Description */}
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>
                  {form.description || 'No description'}
                </p>

                {/* Stats */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                      Responses
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', margin: '0' }}>
                      {form.responseCount}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                      Status
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: form.is_published ? '#d1fae5' : '#fef3c7',
                        color: form.is_published ? '#059669' : '#d97706'
                      }}
                    >
                      {form.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Public Link (if published) */}
                {form.is_published && form.public_slug && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                      Public Link
                    </p>
                    <a
                      href={typeof window !== 'undefined' ? `${window.location.origin}/respond/${form.public_slug}` : `http://localhost:3000/respond/${form.public_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        wordBreak: 'break-all'
                      }}
                    >
                      {typeof window !== 'undefined' ? `${window.location.origin.replace('https://', '').replace('http://', '')}/respond/${form.public_slug}` : `localhost:3000/respond/${form.public_slug}`}
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push(`/builder/${form.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#e3e8ef',
                      color: '#111',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d1d9e6')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e3e8ef')}
                  >
                    Edit
                  </button>

                  {form.responseCount > 0 && (
                    <button
                      onClick={() => router.push(`/results/${form.id}`)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                    >
                      Responses
                    </button>
                  )}

                  <button
                    onClick={() => handlePublish(form.id, form.is_published)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: form.is_published ? '#f97316' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = form.is_published
                        ? '#ea580c'
                        : '#2563eb')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = form.is_published
                        ? '#f97316'
                        : '#3b82f6')
                    }
                  >
                    {form.is_published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    onClick={() => handleDelete(form.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}