'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getForm } from '@/app/api/forms';
import { getFormResponses } from '@/app/api/responses';
import { getQuestions as getFormQuestions } from '@/app/api/questions';

interface Answer {
  id: number;
  question_id: number;
  response_id: number;
  answer_value: string;
}

interface Question {
  id: number;
  form_id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order: number;
  description?: string;
}

interface Response {
  id: number;
  form_id: number;
  created_at: string;
  answers: Answer[];
}

interface FormData {
  id: number;
  title: string;
  description: string;
  public_slug: string;
  questions: Question[];
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const formId = parseInt(params.id as string);
    if (!formId || isNaN(formId)) return;

    const fetchData = async () => {
      try {
        const formData = await getForm(formId);
        const questionsData = await getFormQuestions(formId);
        const formWithQuestions = {
          ...formData,
          questions: questionsData || [],
        };
        setForm(formWithQuestions);

        const responsesData = await getFormResponses(formId);
        const fixedResponses = (responsesData || []).map((r: any) => ({
          ...r,
          answers: r.answers || [],
        }));
        setResponses(fixedResponses);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading responses...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Form not found</div>
      </div>
    );
  }

  const getAnswerForQuestion = (response: Response, questionId: number) => {
    if (!response || !response.answers || response.answers.length === 0) return 'No answer';
    const answer = response.answers.find((a) => a.question_id === questionId);
    return answer?.answer_value || 'No answer';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const publicUrl = `http://localhost:3000/respond/${form.public_slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back and Analytics - Side by Side */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
          >
            ← Back
          </button>
          <button
            onClick={() => router.push(`/insights/${form.id}`)}
            className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 whitespace-nowrap"
          >
            📊 View Analytics
          </button>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{form.title}</h1>
          <p className="text-gray-600">{form.description}</p>
          <p className="text-sm text-gray-500 mt-2">
            Total Responses: <span className="font-bold text-lg text-indigo-600">{responses.length}</span>
          </p>
        </div>

        {/* Share Link Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Form</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                alert('Link copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Copy
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Open
            </a>
          </div>
        </div>

        {/* Responses List */}
        {responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No responses yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response, index) => (
              <div
                key={response.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Row Header - Click to Expand */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === response.id ? null : response.id)
                  }
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(response.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {response.answers.length} / {form.questions.length} questions
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === response.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === response.id && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="space-y-6">
                      {form.questions.map((question) => (
                        <div key={question.id} className="pb-4 border-b border-gray-200 last:border-b-0">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            {question.question_text}
                            {question.is_required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                          </h3>
                          <p className="text-gray-900 bg-white rounded p-3 border border-gray-200">
                            {getAnswerForQuestion(response, question.id)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}