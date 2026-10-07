'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getForm } from '@/app/api/forms';
import { getQuestions as getFormQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/app/api/questions';
import { updateForm } from '@/app/api/forms';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableQuestionItem({ question, onDelete, onEdit }: { question: Question; onDelete: (id: number) => void; onEdit: (q: Question) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 text-gray-400">
          ⋮⋮
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{question.question_text}</h4>
          <p className="text-sm text-gray-600">Type: {question.question_type}</p>
          {question.is_required && <p className="text-sm text-red-600">Required: Yes</p>}
          {question.options && question.options.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700">Options:</p>
              <ul className="text-xs text-gray-600 ml-2">
                {question.options.map((opt) => (
                  <li key={opt.id}>• {opt.option_text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(question)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
            Edit
          </button>
          <button onClick={() => onDelete(question.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewQuestion({ question }: { question: Question }) {
  const renderInput = () => {
    switch (question.question_type) {
      case 'short_text':
        return <input type="text" placeholder="Answer..." className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white" />;
      case 'long_text':
        return <textarea placeholder="Answer..." className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white" rows={4} />;
      case 'email':
        return <input type="email" placeholder="your@email.com" className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white" />;
      case 'number':
        return <input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white" />;
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-gray-900">
                <input type="radio" name={`q${question.id}`} className="w-4 h-4" />
                {opt.option_text}
              </label>
            ))}
          </div>
        );
      case 'dropdown':
        return (
          <select className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white">
            <option>Select an option</option>
            {question.options?.map((opt) => (
              <option key={opt.id}>{opt.option_text}</option>
            ))}
          </select>
        );
      case 'yes_no':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-gray-900">
              <input type="radio" name={`q${question.id}`} />
              Yes
            </label>
            <label className="flex items-center gap-2 text-gray-900">
              <input type="radio" name={`q${question.id}`} />
              No
            </label>
          </div>
        );
      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-900">
                {i}
              </button>
            ))}
          </div>
        );
      default:
        return <input type="text" placeholder="Answer..." className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white" />;
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">
        {question.question_text}
        {question.is_required && <span className="text-red-500">*</span>}
      </h3>
      {renderInput()}
    </div>
  );
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formId, setFormId] = useState<number | null>(null);

  // Add question form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('short_text');
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionType, setEditQuestionType] = useState('short_text');
  const [editIsRequired, setEditIsRequired] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCurrentOption, setEditCurrentOption] = useState('');

  // Drag and drop
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    const id = parseInt(params.id as string);
    if (!id || isNaN(id)) return;

    setFormId(id);

    const loadData = async () => {
      try {
        const formData = await getForm(id);
        setForm(formData);

        const questionsData = await getFormQuestions(id);
        setQuestions(questionsData || []);
      } catch (error) {
        console.error('Error loading form:', error);
      }
    };

    loadData();
  }, [params.id]);

  // Load question data into edit form
  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setEditQuestionText(question.question_text);
    setEditQuestionType(question.question_type);
    setEditIsRequired(question.is_required);
    setEditDescription(question.description || '');
    setEditOptions(question.options?.map((o) => o.option_text) || []);
    setEditCurrentOption('');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestionText('');
    setEditQuestionType('short_text');
    setEditIsRequired(false);
    setEditDescription('');
    setEditOptions([]);
    setEditCurrentOption('');
  };

  // Save edited question
  const handleEditQuestion = async () => {
    if (!editQuestionText.trim() || editingId === null) return;

    try {
      const payload: any = {
        question_text: editQuestionText,
        description: editDescription || '',
        is_required: editIsRequired,
      };

      // Add options if MCQ or dropdown
      if ((editQuestionType === 'multiple_choice' || editQuestionType === 'dropdown') && editOptions.length > 0) {
        payload.options = editOptions.map((opt) => ({ option_text: opt }));
      } else {
        // Clear options if not MCQ/dropdown
        payload.options = [];
      }

      await updateQuestion(editingId, payload);

      // Refresh questions to get updated data
      const updatedQuestions = await getFormQuestions(formId!);
      setQuestions(updatedQuestions || []);

      // Close modal
      cancelEdit();
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question. Please try again.');
    }
  };

  const handleAddOption = () => {
    if (currentOption.trim()) {
      setOptions([...options, currentOption]);
      setCurrentOption('');
    }
  };

  const handleDeleteOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Edit modal helpers
  const handleEditAddOption = () => {
    if (editCurrentOption.trim()) {
      setEditOptions([...editOptions, editCurrentOption]);
      setEditCurrentOption('');
    }
  };

  const handleEditDeleteOption = (index: number) => {
    setEditOptions(editOptions.filter((_, i) => i !== index));
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !formId) return;

    try {
      const payload: any = {
        question_text: questionText,
        question_type: questionType,
        is_required: isRequired,
        description: description || '',
      };

      if ((questionType === 'multiple_choice' || questionType === 'dropdown') && options.length > 0) {
        payload.options = options.map((opt) => ({ option_text: opt }));
      }

      const newQuestion = await createQuestion(formId, payload);

      setQuestions([...questions, newQuestion]);
      setQuestionText('');
      setQuestionType('short_text');
      setIsRequired(false);
      setDescription('');
      setOptions([]);
      setCurrentOption('');
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await deleteQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over?.id);
      setQuestions(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const handlePublish = async () => {
    if (!form) return;

    try {
      await updateForm(formId!, { is_published: true });

      const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/respond/${form.public_slug}` : `http://localhost:3000/respond/${form.public_slug}`;

      alert(`✓ Form Published!\n\nPublic URL:\n${publicUrl}\n\nClick OK to see responses.`);

      router.push(`/results/${formId}`);
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Error publishing form');
    }
  };

  if (!form || !formId) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{form.title}</h1>
            <button onClick={() => router.push('/')} className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium">
              ← Back to Home
            </button>
          </div>
          <button onClick={handlePublish} className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">
            Publish
          </button>
        </div>

        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Add Question (Sticky) */}
          <div className="sticky top-6 h-fit">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Question</h2>

              <input
                type="text"
                placeholder="Question text..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
              />

              <select
                value={questionType}
                onChange={(e) => {
                  setQuestionType(e.target.value);
                  setOptions([]);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
              >
                <option value="short_text">Short Text</option>
                <option value="long_text">Long Text</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="dropdown">Dropdown</option>
                <option value="yes_no">Yes/No</option>
                <option value="rating">Rating</option>
              </select>

              {(questionType === 'multiple_choice' || questionType === 'dropdown') && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Add Options</h3>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Enter option..."
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                    />
                    <button onClick={handleAddOption} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Add
                    </button>
                  </div>

                  {options.length > 0 && (
                    <div className="space-y-2">
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                          <span className="text-gray-800">{opt}</span>
                          <button onClick={() => handleDeleteOption(idx)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <textarea
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
                rows={2}
              />

              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
                <span className="text-gray-700">Required</span>
              </label>

              <button onClick={handleAddQuestion} className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">
                Add Question
              </button>
            </div>
          </div>

          {/* Right Column - Questions List + Preview */}
          <div>
            {/* Questions List */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions ({questions.length})</h2>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((question) => (
                    <SortableQuestionItem
                      key={question.id}
                      question={question}
                      onDelete={handleDeleteQuestion}
                      onEdit={startEdit}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {questions.length === 0 && <p className="text-gray-500 text-center py-4">No questions yet</p>}
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
                <p className="text-gray-600 mb-6">{form.description}</p>

                {questions.map((question) => (
                  <PreviewQuestion key={question.id} question={question} />
                ))}

                {questions.length === 0 && <p className="text-gray-500 text-center py-8">Add questions to see preview</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Question</h2>

            {/* Question Text */}
            <input
              type="text"
              placeholder="Question text..."
              value={editQuestionText}
              onChange={(e) => setEditQuestionText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
            />

            {/* Question Type */}
            <select
              value={editQuestionType}
              onChange={(e) => {
                setEditQuestionType(e.target.value);
                setEditOptions([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
            >
              <option value="short_text">Short Text</option>
              <option value="long_text">Long Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="dropdown">Dropdown</option>
              <option value="yes_no">Yes/No</option>
              <option value="rating">Rating</option>
            </select>

            {/* Options Section - Only for MCQ and Dropdown */}
            {(editQuestionType === 'multiple_choice' || editQuestionType === 'dropdown') && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Options</h3>

                {/* Existing Options */}
                {editOptions.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {editOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                        <span className="text-gray-800">{opt}</span>
                        <button
                          onClick={() => handleEditDeleteOption(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Option */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new option..."
                    value={editCurrentOption}
                    onChange={(e) => setEditCurrentOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditAddOption()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  />
                  <button
                    onClick={handleEditAddOption}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <textarea
              placeholder="Description (optional)..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white"
              rows={2}
            />

            {/* Required Checkbox */}
            <label className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                checked={editIsRequired}
                onChange={(e) => setEditIsRequired(e.target.checked)}
              />
              <span className="text-gray-700">Required</span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEditQuestion}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
