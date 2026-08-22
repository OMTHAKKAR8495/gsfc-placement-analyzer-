import React, { useState, useEffect } from 'react';
import { X, Send, HelpCircle, AlertCircle, CheckCircle2, Sparkles, Clock, MessageSquare, Loader2, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  'Eligibility & Drive Rules',
  'Resume & ATS Optimization',
  'Interview Tips & Preparation',
  'Job Fair & Conclave Queries',
  'Corporate Policies & Bonds',
  'General Placement Query'
];

export default function AskQuestionModal({ isOpen, onClose, currentUser, onQuestionCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Eligibility & Drive Rules');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [createdThread, setCreatedThread] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setTitle('');
      setBody('');
      setCategory('Eligibility & Drive Rules');
      setLoading(false);
      setError('');
      setIsSubmitted(false);
      setCountdown(3);
      setCreatedThread(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isSubmitted && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (isSubmitted && countdown === 0) {
      handleFinish();
    }
    return () => clearTimeout(timer);
  }, [isSubmitted, countdown]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (createdThread && onQuestionCreated) {
      onQuestionCreated(createdThread);
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and question details are required.');
      return;
    }

    setLoading(true);
    setError('');

    const studentId = currentUser?.profile?.id || currentUser?.owner_id || currentUser?.id || 'guest_student';
    const studentName = currentUser?.name || currentUser?.profile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'GSFC Student');

    try {
      const res = await fetch('/api/qa/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          title: title.trim(),
          body: body.trim(),
          category
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post question');

      setCreatedThread(data.thread);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={isSubmitted ? handleFinish : onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* ✨ SUCCESS STATE SCREEN */
          <div className="py-4 text-center space-y-6 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Question Submitted Successfully
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Your Question Has Been Submitted!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your doubt is now live in the GSFC Placement Community feed. The <strong className="text-slate-900 dark:text-slate-200">TPO cell and senior alumni mentors</strong> will provide an official verified answer soon.
              </p>
            </div>

            {/* Preview Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md">
                  {category}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Just now
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                "{title}"
              </h4>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active in Community Feed
                </span>
                <span>Auto-redirecting in {countdown}s...</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span>View Question in Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* 📝 INPUT FORM SCREEN */
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Community Placement Q&A</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Ask a Doubt to TPO & Placement Community
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Post your question publicly to get official answers from TPC officers, senior alumni, and fellow candidates.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Category</label>
                <select
                  disabled={loading}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Question Summary (Title)</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Can Chemical Engineering students apply for Data Analytics roles in TCS?"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Question Details / Specific Context</label>
                <textarea
                  required
                  rows={5}
                  disabled={loading}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Provide background (e.g. CGPA, active semester, company criteria) so TPO or alumni can answer accurately..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to Community...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Question</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
