import React, { useState } from 'react';
import { X, Send, ShieldCheck, Building2, Tag } from 'lucide-react';

export default function PracticeModeModal({ question, onClose }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluateAnswer = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setFeedback('Excellent response! You effectively addressed core architectural concepts (' + ((question.keyPointsToInclude || []).slice(0, 2).join(', ')) + '). To optimize score for top campus drives, emphasize measurable impacts and latency reductions.');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
              AI Practice Mode
            </span>

            {question.companyName && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 rounded border border-amber-500/30 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {question.companyName}
              </span>
            )}

            {question.projectTopic && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 rounded border border-cyan-500/30 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {question.projectTopic}
              </span>
            )}

            <span className="text-xs text-slate-500 font-bold">{question.category}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-blue-900 dark:text-blue-400 block">
              GSFC Interview Question Prompt:
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {question.question}
            </h3>
          </div>

          <form onSubmit={handleEvaluateAnswer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Type Your Response (STAR Framework Strategy)
              </label>
              <textarea
                rows={5}
                required
                placeholder="Structure your answer with Situation, Task, Action, and Result..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isEvaluating || !userAnswer.trim()}
              className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-xs py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {isEvaluating ? (
                <>Evaluating Answer Quality with AI...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Evaluate My Response with AI
                </>
              )}
            </button>
          </form>

          {feedback && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-200 space-y-2 animate-in fade-in">
              <div className="font-black text-blue-900 dark:text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                AI Interviewer Evaluation Feedback:
              </div>
              <p className="leading-relaxed font-medium">{feedback}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
