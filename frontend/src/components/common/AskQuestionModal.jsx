import React, { useState } from 'react';
import { X, Send, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';

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

  if (!isOpen) return null;

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

      onQuestionCreated(data.thread);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Can Chemical Engineering students apply for Data Analytics roles in TCS?"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">Question Details / Specific Context</label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide background (e.g. CGPA, active semester, company criteria) so TPO or alumni can answer accurately..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Posting...' : 'Post Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
