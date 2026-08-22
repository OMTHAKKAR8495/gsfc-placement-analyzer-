import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageSquare, Search, Plus, CheckCircle2, 
  Clock, ShieldCheck, Tag, Filter, User, Sparkles, ChevronRight, Trash2 
} from 'lucide-react';
import AskQuestionModal from './AskQuestionModal';
import QAThreadView from './QAThreadView';

const CATEGORIES = [
  'All',
  'Eligibility & Drive Rules',
  'Resume & ATS Optimization',
  'Interview Tips & Preparation',
  'Job Fair & Conclave Queries',
  'Corporate Policies & Bonds',
  'General Placement Query'
];

export default function QABoard({ currentUser, onOpenAuth }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  useEffect(() => {
    fetchThreads();
  }, [selectedCategory, statusFilter]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      let url = '/api/qa/threads';
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setThreads(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching Q&A threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/qa/threads/${threadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  const filteredThreads = threads.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.body && t.body.toLowerCase().includes(q)) ||
      (t.student_name && t.student_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-gradient-to-r from-blue-900/10 via-cyan-900/10 to-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 rounded-full text-xs font-black border border-cyan-200 dark:border-cyan-800">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Open Community Knowledge Exchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Community Q&A & TPO Doubt Clarification
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
              Have questions about eligibility criteria, backlog rules, ATS scoring, or interview rounds? Ask publicly to get verified answers from GSFC TPO officers, alumni mentors, and peers.
            </p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                if (onOpenAuth) onOpenAuth();
              } else {
                setAskModalOpen(true);
              }
            }}
            className="px-5 py-3 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ask a Doubt / Question</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="space-y-3">
        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar & Status Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doubts, companies, rules..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            {['all', 'open', 'resolved'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl font-black capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threads List */}
      {loading ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading Community Q&A Threads...</p>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">No Questions Found</h3>
          <p className="text-xs text-slate-500">Have a query? Be the first to ask the TPO cell!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map(thread => {
            const isResolved = thread.status === 'resolved';

            return (
              <div
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className="glass-panel p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md bg-white/90 dark:bg-slate-900/90 transition-all hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg text-[10px] font-black border border-blue-200 dark:border-blue-800">
                      {thread.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    }`}>
                      {isResolved ? '✓ Resolved' : 'Open'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors leading-snug">
                    {thread.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                    {thread.body}
                  </p>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium pt-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {thread.student_name}
                    </span>
                    <span>•</span>
                    <span>{new Date(thread.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>{thread.replies_count || 0} Replies</span>
                    </div>

                    {(currentUser?.role === 'admin' || currentUser?.owner_id === thread.student_id || currentUser?.id === thread.student_id) && (
                      <button
                        title="Delete Question"
                        onClick={(e) => handleDeleteThread(e, thread.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View Thread</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        currentUser={currentUser}
        onQuestionCreated={(newThread) => {
          setThreads(prev => [newThread, ...prev]);
        }}
      />

      {/* Thread Detail Modal */}
      {selectedThreadId && (
        <QAThreadView
          threadId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onThreadUpdated={fetchThreads}
        />
      )}
    </div>
  );
}
