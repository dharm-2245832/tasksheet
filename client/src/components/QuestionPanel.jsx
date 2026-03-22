import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function QuestionPanel({ role, token }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get('/api/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions');
    }
  };

  const handleSelect = (e) => {
    const qId = parseInt(e.target.value, 10);
    const q = questions.find(x => x.id === qId);
    setSelectedQuestion(q);
  };

  return (
    <div className="flex flex-col flex-1 mb-4 overflow-hidden">
      <h2 className="text-xl font-bold mb-4">Interview Question</h2>

      {role === 'interviewer' && (
        <select
          onChange={handleSelect}
          className="w-full border border-gray-300 p-2 mb-4 rounded bg-white shadow-sm"
          defaultValue=""
        >
          <option value="" disabled>Select a question...</option>
          {questions.map(q => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
      )}

      {selectedQuestion ? (
        <div className="overflow-y-auto bg-gray-50 p-4 border border-gray-200 rounded flex-1">
          <h3 className="font-semibold text-lg mb-2">{selectedQuestion.title}</h3>
          <div className="flex gap-2 mb-4">
            {selectedQuestion.difficulty && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                {selectedQuestion.difficulty}
              </span>
            )}
            {selectedQuestion.tags && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-200 text-gray-800">
                {selectedQuestion.tags}
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {selectedQuestion.description}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 italic bg-gray-50 p-4 border border-gray-200 rounded flex-1">
          No question selected.
        </div>
      )}
    </div>
  );
}
