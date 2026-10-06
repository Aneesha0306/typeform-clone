'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFormBySlug } from '@/app/api/forms';
import { getQuestions } from '@/app/api/questions';
import { submitResponse } from '@/app/api/responses';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
}

interface Form {
  id: number;
  title: string;
  description?: string;
  is_published: boolean;
}

export default function RespondentFlow() {
  const params = useParams();
  const slug = params.slug as string;
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadForm();
  }, [slug]);

  async function loadForm() {
    try {
      setLoading(true);
      const formData = await getFormBySlug(slug);
      if (!formData || !formData.is_published) {
        setError('Form not found or not published');
        return;
      }
      setForm(formData);
      const questionsData = await getQuestions(formData.id);
      setQuestions(questionsData);
    } catch (err) {
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      setError('This question is required');
      return;
    }
    setError('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    try {
      const answerArray = questions.map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id] || '',
      }));
      await submitResponse(form!.id, answerArray);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit response');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (error && !form) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl text-gray-600">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  if (!form || questions.length === 0) return <div className="flex items-center justify-center h-screen">No questions</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{currentQuestionIndex + 1} of {questions.length}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{form.title}</h1>
          {form.description && <p className="text-gray-600 mb-8">{form.description}</p>}

          {/* Question */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">
              {currentQuestion.question_text}
              {currentQuestion.is_required && <span className="text-red-500">*</span>}
            </h2>

            {/* Answer Input */}
            {currentQuestion.question_type === 'short_text' && (
              <input
                type="text"
                placeholder="Your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
            )}

            {currentQuestion.question_type === 'long_text' && (
              <textarea
                placeholder="Your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 min-h-24"
                autoFocus
              />
            )}

            {currentQuestion.question_type === 'email' && (
              <input
                type="email"
                placeholder="your@email.com"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
            )}

            {currentQuestion.question_type === 'number' && (
              <input
                type="number"
                placeholder="0"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
            )}

            {currentQuestion.question_type === 'yes_no' && (
              <div className="flex gap-4">
                {['Yes', 'No'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers({ ...answers, [currentQuestion.id]: option });
                      setTimeout(handleNext, 300);
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      answers[currentQuestion.id] === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}