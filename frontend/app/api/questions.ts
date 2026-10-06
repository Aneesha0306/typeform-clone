const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getQuestions(formId: number) {
  const res = await fetch(`${API_URL}/forms/${formId}/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function createQuestion(formId: number, data: any) {
  const res = await fetch(`${API_URL}/forms/${formId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create question');
  return res.json();
}

export async function updateQuestion(questionId: number, data: any) {
  const res = await fetch(`${API_URL}/questions/${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update question');
  return res.json();
}

export async function deleteQuestion(questionId: number) {
  const res = await fetch(`${API_URL}/questions/${questionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
}