'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getForm } from '@/app/api/forms';
import { getQuestions as getFormQuestions } from '@/app/api/questions';
import { getFormResponses } from '@/app/api/responses';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options?: Array<{ option_text: string }>;
}

interface Answer {
  question_id: number;
  answer_value: string;
}

interface Response {
  answers: Answer[];
}

export default function InsightsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const formId = parseInt(params.id as string);
    if (!formId || isNaN(formId)) return;

    const loadData = async () => {
      try {
        const formData = await getForm(formId);
        setForm(formData);

        const questionsData = await getFormQuestions(formId);
        setQuestions(questionsData || []);
        if (questionsData?.length > 0) {
          setSelectedQuestionId(questionsData[0].id);
        }

        const responsesData = await getFormResponses(formId);
        setResponses(
          (responsesData || []).map((r: any) => ({
            ...r,
            answers: r.answers || [],
          }))
        );
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const getQuestionStats = (questionId: number) => {
    const selectedQuestion = questions.find((q) => q.id === questionId);
    if (!selectedQuestion) return null;

    const answers = responses
      .flatMap((r) => r.answers)
      .filter((a) => a.question_id === questionId)
      .map((a) => a.answer_value);

    return { question: selectedQuestion, answers };
  };

  const renderStats = () => {
    if (!selectedQuestionId) return null;

    const stats = getQuestionStats(selectedQuestionId);
    if (!stats) return null;

    const { question, answers } = stats;

    // MCQ / Dropdown - Count each option
    if (question.question_type === 'multiple_choice' || question.question_type === 'dropdown') {
      const optionCounts: { [key: string]: number } = {};
      question.options?.forEach((opt) => {
        optionCounts[opt.option_text] = 0;
      });

      answers.forEach((ans) => {
        if (ans) {
          optionCounts[ans] = (optionCounts[ans] || 0) + 1;
        }
      });

      const total = answers.filter((a) => a).length;

      return (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Response Distribution</h3>
            {Object.entries(optionCounts).map(([option, count]) => {
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              return (
                <div key={option} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">{option}</span>
                    <span className="font-semibold text-indigo-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Yes/No
    if (question.question_type === 'yes_no') {
      const yesCounts = answers.filter((a) => a === 'Yes').length;
      const noCounts = answers.filter((a) => a === 'No').length;
      const total = yesCounts + noCounts;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-gray-600 text-sm">Yes</p>
              <p className="text-3xl font-bold text-green-600">
                {yesCounts} <span className="text-sm text-gray-500">({((yesCounts / total) * 100).toFixed(1)}%)</span>
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-gray-600 text-sm">No</p>
              <p className="text-3xl font-bold text-red-600">
                {noCounts} <span className="text-sm text-gray-500">({((noCounts / total) * 100).toFixed(1)}%)</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Rating
    if (question.question_type === 'rating') {
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      answers.forEach((ans) => {
        const rating = parseInt(ans);
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating as keyof typeof ratingCounts]++;
        }
      });

      const total = answers.filter((a) => a).length;

      return (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            {[1, 2, 3, 4, 5].map((rating) => {
              const count = ratingCounts[rating as keyof typeof ratingCounts];
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              return (
                <div key={rating} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">⭐ {rating} Star</span>
                    <span className="font-semibold text-indigo-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Text-based (short_text, long_text, email, number)
    const filteredAnswers = answers.filter(
      (a) => a && a.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Responses ({answers.length})</h3>
            <input
              type="text"
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAnswers.length > 0 ? (
              filteredAnswers.map((ans, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-gray-800 break-words">{ans}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No responses found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading insights...</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/results/' + form.id)}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
          >
            ← Back to Responses
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics - {form.title}</h1>
          <p className="text-gray-600">
            Total Responses: <span className="font-bold text-indigo-600">{responses.length}</span>
          </p>
        </div>

        {/* Question Selector */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Question</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuestionId(q.id)}
                className={`p-4 rounded-lg text-left transition ${
                  selectedQuestionId === q.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <p className="font-semibold text-sm">{q.question_text}</p>
                <p className="text-xs mt-1 opacity-75">{q.question_type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {renderStats()}
        </div>
      </div>
    </div>
  );
}