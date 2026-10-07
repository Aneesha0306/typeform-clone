const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getFormResponses(formId: number) {
  const response = await fetch(`${API_URL}/forms/${formId}/responses`);
  if (!response.ok) throw new Error('Failed to fetch responses');
  return response.json();
}

export async function submitResponse(formId: number, answers: Array<{ question_id: number; answer_value: string }>) {
  const response = await fetch(`${API_URL}/forms/${formId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) throw new Error('Failed to submit response');
  return response.json();
}