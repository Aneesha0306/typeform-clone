const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function submitResponse(formId: number, answers: any[]) {
  const res = await fetch(`${API_URL}/forms/${formId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit response');
  return res.json();
}