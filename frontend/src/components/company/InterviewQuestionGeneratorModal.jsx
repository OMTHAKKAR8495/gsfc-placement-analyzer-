import React, { useState, useEffect } from 'react';
import { X, Sparkles, HelpCircle, Copy, Check, FileText } from 'lucide-react';

export default function InterviewQuestionGeneratorModal({ isOpen, onClose, requirement, studentCandidate }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && requirement) {
      generateQuestions();
    }
  }, [isOpen, requirement, studentCandidate]);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: requirement.id,
          student_id: studentCandidate?.student_id || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Question generation failed');

      setQuestions(data.questions || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = () => {
    const text = questions.map((q, idx) => `Q${idx+1} [${q.category}]: ${q.question}\nKey Points: ${q.expectedKeyPoints?.join(', ')}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">AI Interview Question Generator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <span className="text-indigo-300 font-semibold">{requirement.title}</span>
              {studentCandidate && <> • Candidate: <span className="text-emerald-400 font-semibold">{studentCandidate.name}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-300">Generating tailored interview questions with Gemini AI...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={copyToClipboard}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copied ? 'Copied to Clipboard' : 'Copy All Questions'}
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-bold uppercase text-[10px]">
                      {q.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{q.difficulty}</span>
                  </div>

                  <div className="font-bold text-white text-sm">{q.question}</div>

                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>Expected Key Evaluation Points: {q.expectedKeyPoints?.join('; ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
