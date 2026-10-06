const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getForms() {
  const res = await fetch(`${API_URL}/forms`);
  if (!res.ok) throw new Error('Failed to fetch forms');
  return res.json();
}

export async function createForm(title: string, description?: string) {
  const res = await fetch(`${API_URL}/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error('Failed to create form');
  return res.json();
}

export async function updateForm(id: number, data: any) {
  const res = await fetch(`${API_URL}/forms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update form');
  return res.json();
}

export async function deleteForm(id: number) {
  const res = await fetch(`${API_URL}/forms/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete form');
  return res.json();
}