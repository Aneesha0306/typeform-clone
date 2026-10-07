'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFormBySlug } from '@/app/api/forms';
import { getQuestions as getFormQuestions } from '@/app/api/questions';
import { submitResponse } from '@/app/api/responses';

interface Question {
  id: number;
  form_id: number;
  question_text: string;
  question_type: string;
  description?: string;
  is_required: boolean;
  order: number;
  options?: Array<{ id: number; option_text: string; order: number }>;
}

interface Form {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  public_slug: string;
}

export default function RespondPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const slug = params.slug as string;
    if (!slug) return;

    const loadForm = async () => {
      try {
        const formData = await getFormBySlug(slug);
        setForm(formData);

        const questionsData = await getFormQuestions(formData.id);
        setQuestions(questionsData || []);
      } catch (error) {
        console.error('Error loading form:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [params.slug]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter key to go next
      if (e.key === 'Enter' && !submitting && currentIndex < questions.length - 1) {
        e.preventDefault();
        setCurrentIndex(currentIndex + 1);
      }
      // Arrow Right to go next
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        e.preventDefault();
        setCurrentIndex(currentIndex + 1);
      }
      // Arrow Left to go back
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, submitting, questions.length]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
  if (!form) return;

  try {
    setSubmitting(true);

    const answersList = questions.map((q) => ({
      question_id: q.id,
      answer_value: answers[q.id] || '',
    }));

    await submitResponse(form.id, answersList);
    setSubmitted(true);
  } catch (error) {
    console.error('Error submitting response:', error);
    alert('Error submitting form. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600 text-lg">Loading form...</div>
      </div>
    );
  }

  if (form && !form.is_published) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Available</h2>
          <p className="text-gray-600">This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600 text-lg">Form not found</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">Thank you for your response!</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar and Counter */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Header - Show only on first question */}
        {currentIndex === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{form.title}</h1>
            <p className="text-gray-600 text-lg">{form.description}</p>
          </div>
        )}

        {/* Current Question - One at a time */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-8 min-h-96 flex flex-col justify-between">
            <div>
              <label className="block text-2xl font-semibold text-gray-900 mb-4">
                {currentQuestion.question_text}
                {currentQuestion.is_required && <span className="text-red-500 ml-2">*</span>}
              </label>

              {currentQuestion.description && (
                <p className="text-sm text-gray-600 mb-6">{currentQuestion.description}</p>
              )}

              {/* Render Input based on type */}
              {currentQuestion.question_type === 'short_text' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Your answer..."
                  autoFocus
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              )}

              {currentQuestion.question_type === 'long_text' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Your answer..."
                  rows={6}
                  autoFocus
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              )}

              {currentQuestion.question_type === 'email' && (
                <input
                  type="email"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="your@email.com"
                  autoFocus
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              )}

              {currentQuestion.question_type === 'number' && (
                <input
                  type="number"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              )}

              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer p-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                      <input
                        type="radio"
                        name={`q${currentQuestion.id}`}
                        value={option.option_text}
                        checked={answers[currentQuestion.id] === option.option_text}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-lg text-gray-700">{option.option_text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'dropdown' && (
                <select
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                >
                  <option value="">Select an option</option>
                  {currentQuestion.options?.map((option) => (
                    <option key={option.id} value={option.option_text}>
                      {option.option_text}
                    </option>
                  ))}
                </select>
              )}

              {currentQuestion.question_type === 'yes_no' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                    <input
                      type="radio"
                      name={`q${currentQuestion.id}`}
                      value="Yes"
                      checked={answers[currentQuestion.id] === 'Yes'}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-lg text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                    <input
                      type="radio"
                      name={`q${currentQuestion.id}`}
                      value="No"
                      checked={answers[currentQuestion.id] === 'No'}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-lg text-gray-700">No</span>
                  </label>
                </div>
              )}

              {currentQuestion.question_type === 'rating' && (
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerChange(currentQuestion.id, i.toString())}
                      className={`px-6 py-3 text-lg rounded-lg font-semibold transition ${
                        answers[currentQuestion.id] === i.toString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              {currentIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
                >
                  ← Previous
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>

            {/* Keyboard Hints */}
            <div className="text-xs text-gray-400 mt-4 text-center">
              Press <kbd>Enter</kbd> to continue or use <kbd>←</kbd> <kbd>→</kbd> arrows
            </div>
          </div>
        )}
      </div>
    </div>
  );
}