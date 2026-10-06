'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getForm, updateForm } from '@/app/api/forms';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/app/api/questions';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  description?: string;
  is_required: boolean;
  order: number;
}

interface Form {
  id: number;
  title: string;
  description?: string;
  is_published: boolean;
  public_slug: string;
}

export default function FormBuilder() {
  const params = useParams();
  const formId = parseInt(params.id as string);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('short_text');
  const [error, setError] = useState('');

  useEffect(() => {
    loadForm();
  }, [formId]);

  async function loadForm() {
    try {
      setLoading(true);
      const formData = await getForm(formId);
      setForm(formData);
      const questionsData = await getQuestions(formId);
      setQuestions(questionsData);
    } catch (err) {
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion() {
    if (!newQuestionText.trim()) return;
    try {
      await createQuestion(formId, {
        question_text: newQuestionText,
        question_type: newQuestionType,
        is_required: false,
      });
      setNewQuestionText('');
      loadForm();
    } catch (err) {
      setError('Failed to add question');
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(questionId);
      loadForm();
    } catch (err) {
      setError('Failed to delete question');
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!form) return <p>Form not found</p>;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{form.title}</h1>
      {form.description && <p>{form.description}</p>}
      <p style={{ fontSize: '12px', color: '#666' }}>
        Status: {form.is_published ? '✅ Published' : '📝 Draft'}
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Add Question</h2>
        <input
          type="text"
          placeholder="Question text"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
        />
        <select
          value={newQuestionType}
          onChange={(e) => setNewQuestionType(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option>short_text</option>
          <option>long_text</option>
          <option>multiple_choice</option>
          <option>dropdown</option>
          <option>email</option>
          <option>number</option>
          <option>yes_no</option>
          <option>rating</option>
        </select>
        <button onClick={handleAddQuestion} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Add Question
        </button>
      </div>

      <div>
        <h2>Questions ({questions.length})</h2>
        {questions.length === 0 ? (
          <p>No questions yet. Add one!</p>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              style={{
                padding: '15px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            >
              <h3>{q.question_text}</h3>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Type: {q.question_type} | Required: {q.is_required ? 'Yes' : 'No'}
              </p>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                style={{ padding: '6px 12px', cursor: 'pointer', background: '#ff6b6b', color: 'white' }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}