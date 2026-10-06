'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getForm } from '@/app/api/forms';
import { getQuestions } from '@/app/api/questions';

interface Response {
  id: number;
  created_at: string;
  answers: Answer[];
}

interface Answer {
  id: number;
  question_id: number;
  answer_value: string;
}

interface Question {
  id: number;
  question_text: string;
}

interface Form {
  id: number;
  title: string;
}

export default function ResultsPage() {
  const params = useParams();
  const formId = parseInt(params.id as string);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [formId]);

  async function loadData() {
    try {
      setLoading(true);
      const formData = await getForm(formId);
      setForm(formData);
      const questionsData = await getQuestions(formId);
      setQuestions(questionsData);

      // Fetch responses from backend
      const res = await fetch(`http://localhost:8000/forms/${formId}/responses`);
      if (res.ok) {
        const responsesData = await res.json();
        setResponses(responsesData);
      }
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{form?.title} — Results</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {responses.length} response{responses.length !== 1 ? 's' : ''} collected
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {responses.length === 0 ? (
        <p>No responses yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Submitted</th>
                {questions.map((q) => (
                  <th key={q.id} style={{ padding: '12px', textAlign: 'left' }}>
                    {q.question_text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                    {new Date(response.created_at).toLocaleDateString()} {new Date(response.created_at).toLocaleTimeString()}
                  </td>
                  {questions.map((q) => {
                    const answer = response.answers.find((a) => a.question_id === q.id);
                    return (
                      <td key={q.id} style={{ padding: '12px' }}>
                        {answer?.answer_value || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}