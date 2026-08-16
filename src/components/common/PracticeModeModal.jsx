import React, { useState } from 'react';
import { X, Send, ShieldCheck, Building2, Tag, CheckCircle2, AlertTriangle, XCircle, RotateCcw, Award } from 'lucide-react';

export default function PracticeModeModal({ question, onClose, onQuestionCompleted }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false);

  const maxAttempts = 3;

  const handleEvaluateAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.text || question.question,
          category: question.category,
          difficulty: question.difficulty,
          keyConcepts: question.keyConcepts || question.keyPointsToInclude || question.skillTags,
          suggestedAnswer: question.suggestedAnswer || question.modelAnswer || question.answer,
          studentAnswer: userAnswer
        })
      });

      const data = await res.json();
      setEvaluationResult(data);

      if (data.verdict === 'pass') {
        setShowSuggestedAnswer(true);
        if (onQuestionCompleted) onQuestionCompleted(question.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to connect to AI evaluation server.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    if (attemptCount < maxAttempts) {
      setAttemptCount(prev => prev + 1);
      setUserAnswer('');
      setEvaluationResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
              AI Practice Agent
            </span>

            {question.companyName && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 rounded border border-amber-500/30 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {question.companyName}
              </span>
            )}

            <span className="text-xs text-slate-500 font-bold">{question.category || 'Technical'}</span>
            <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              Attempt {attemptCount} of {maxAttempts}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Question Text */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-blue-900 dark:text-blue-400 block">
              GSFC Placement Question Prompt:
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {question.text || question.question}
            </h3>
          </div>

          {/* Form / Textarea */}
          <form onSubmit={handleEvaluateAnswer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Type Your Answer (STAR Framework: Situation, Task, Action, Result)
              </label>
              <textarea
                rows={4}
                required
                disabled={evaluationResult?.verdict === 'pass' || isEvaluating}
                placeholder="Demonstrate technical accuracy and concrete project examples..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-900 font-mono disabled:opacity-60"
              />
            </div>

            {!evaluationResult && (
              <button
                type="submit"
                disabled={isEvaluating || !userAnswer.trim()}
                className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-xs py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
              >
                {isEvaluating ? (
                  <>Evaluating Answer Quality with AI Recruiter Agent...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Answer for AI Review
                  </>
                )}
              </button>
            )}
          </form>

          {/* EVALUATION RESULT PANEL */}
          {evaluationResult && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in">
              
              {/* Verdict Pill Badge */}
              <div className="flex items-center justify-between">
                <div>
                  {evaluationResult.verdict === 'pass' && (
                    <span className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ✅ Strong Answer ({evaluationResult.score}/100)
                    </span>
                  )}
                  {evaluationResult.verdict === 'needs_improvement' && (
                    <span className="px-4 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> ⚠️ Needs Improvement ({evaluationResult.score}/100)
                    </span>
                  )}
                  {evaluationResult.verdict === 'fail' && (
                    <span className="px-4 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" /> ❌ Not Relevant / Insufficient ({evaluationResult.score}/100)
                    </span>
                  )}
                </div>

                {/* Retry Button */}
                {evaluationResult.verdict !== 'pass' && attemptCount < maxAttempts && (
                  <button
                    onClick={handleRetry}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Try Again ({maxAttempts - attemptCount} left)
                  </button>
                )}
              </div>

              {/* Feedback Text */}
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-black text-slate-900 dark:text-white block mb-1">Recruiter Agent Feedback:</span>
                {evaluationResult.feedback}
              </div>

              {/* Concept Coverage Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                  Concept Coverage Checklist:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(evaluationResult.conceptsCovered || []).map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-[11px] font-bold rounded-lg flex items-center gap-1">
                      ✅ {c}
                    </span>
                  ))}
                  {(evaluationResult.conceptsMissing || []).map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 text-[11px] font-bold rounded-lg flex items-center gap-1">
                      ⭕ {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Unlocked STAR Breakdown / Model Answer */}
              {showSuggestedAnswer && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 animate-in fade-in">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase flex items-center gap-1">
                    <Award className="w-4 h-4" /> Unlocked Recruiter STAR Rubric:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                    {question.suggestedAnswer || question.modelAnswer || 'Situation: Faced query latency bottlenecks on high-concurrency microservices. Task: Reduce query response time under 100ms. Action: Added composite B-Tree indexes and Redis caching layer. Result: Achieved 42% query latency reduction.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
