import React, { useState, useEffect, useMemo } from 'react';
import { 
  HelpCircle, MessageSquare, Search, Plus, CheckCircle2, 
  Clock, ShieldCheck, Tag, Filter, User, Sparkles, ChevronRight, Trash2,
  Users, Bookmark, AlertCircle, RefreshCw, LogIn
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
  // Navigation Mode: 'community' | 'my_questions'
  const [activeView, setActiveView] = useState('community');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'resolved' | 'unanswered'
  const [searchQuery, setSearchQuery] = useState('');
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [myQuestionsCount, setMyQuestionsCount] = useState(0);

  // Authenticated Student identity
  const currentStudentId = currentUser?.profile?.id || currentUser?.owner_id || currentUser?.id;
  const currentEmailPrefix = currentUser?.email ? currentUser.email.split('@')[0] : '';

  useEffect(() => {
    fetchThreads();

    const handleUpdate = () => fetchThreads();
    window.addEventListener('qa-threads-updated', handleUpdate);
    window.addEventListener('qa-thread-created', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('qa-threads-updated', handleUpdate);
      window.removeEventListener('qa-thread-created', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [activeView, selectedCategory, statusFilter, currentUser]);

  const fetchThreads = async () => {
    setLoading(true);
    const token = localStorage.getItem('campushire_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let remoteThreads = [];
    let localThreads = [];

    // Local fallback for offline/static environments
    try {
      localThreads = JSON.parse(localStorage.getItem('gsfc_qa_threads') || '[]');
    } catch (e) {}

    try {
      let url = activeView === 'my_questions' ? '/api/qa/my-questions' : '/api/qa/threads';
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (currentStudentId) params.append('student_id', currentStudentId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        remoteThreads = Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.warn('Backend QA fetch notice, using cached / local state:', err.message);
    }

    // Default Seed Threads
    const SEED_THREADS = [
      {
        id: 'thread_cgpa_policy',
        student_id: 's_arav',
        student_name: 'Arav Sharma',
        title: 'What is the university policy for Tier-1 companies if someone has 1 active backlog?',
        body: 'I have a CGPA of 8.9 in BTech CSE but had a backlog in Sem 4 mathematics that is cleared in re-eval. Will I be eligible for Google / Microsoft on-campus shortlist?',
        category: 'Eligibility & Drive Rules',
        status: 'resolved',
        replies_count: 1,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'thread_resume_ats',
        student_id: 's_rohan',
        student_name: 'Rohan Patel',
        title: 'How does CampusHire AI compute the ATS score for core mechanical design resumes?',
        body: 'I added STAAD Pro and AutoCAD projects, but want to know if project metrics help improve the score above 90.',
        category: 'Resume & ATS Optimization',
        status: 'open',
        replies_count: 2,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];

    // Merge and deduplicate by thread ID
    const map = new Map();
    const sourceList = remoteThreads.length > 0 
      ? remoteThreads 
      : [...localThreads, ...SEED_THREADS];

    sourceList.forEach(t => {
      if (t && t.id && !map.has(t.id)) {
        if (activeView === 'my_questions') {
          // Strict Student Isolation: Only show questions created by the logged-in student
          const isMine = (
            (currentStudentId && (t.student_id === currentStudentId || t.student_id === `s_${currentStudentId}` || t.student_id === `u_${currentStudentId}`)) ||
            (currentEmailPrefix && t.student_id && t.student_id.toLowerCase().includes(currentEmailPrefix.toLowerCase())) ||
            (currentUser?.name && t.student_name && currentUser.name.toLowerCase() === t.student_name.toLowerCase()) ||
            (currentUser?.email && t.student_name && t.student_name.toLowerCase().includes(currentEmailPrefix.toLowerCase()))
          );
          if (!isMine) return;
        }

        // Category Filter
        if (selectedCategory !== 'All' && t.category !== selectedCategory) return;

        // Status Filter
        if (statusFilter === 'open' && t.status !== 'open') return;
        if (statusFilter === 'resolved' && t.status !== 'resolved') return;
        if (statusFilter === 'unanswered' && (t.replies_count || 0) > 0) return;

        map.set(t.id, t);
      }
    });

    const finalThreads = Array.from(map.values());
    setThreads(finalThreads);

    // Calculate My Questions count
    if (currentStudentId || currentEmailPrefix) {
      const allPool = remoteThreads.length > 0 ? remoteThreads : [...localThreads, ...SEED_THREADS];
      const count = allPool.filter(t => (
        (currentStudentId && (t.student_id === currentStudentId || t.student_id === `s_${currentStudentId}`)) ||
        (currentEmailPrefix && t.student_id && t.student_id.toLowerCase().includes(currentEmailPrefix.toLowerCase())) ||
        (currentUser?.name && t.student_name && currentUser.name.toLowerCase() === t.student_name.toLowerCase())
      )).length;
      setMyQuestionsCount(count);
    }

    setLoading(false);
  };

  const handleDeleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const token = localStorage.getItem('campushire_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`/api/qa/threads/${threadId}`, { method: 'DELETE', headers }).catch(() => {});
    } catch (err) {}

    // Update local state and persistent storage
    try {
      const stored = JSON.parse(localStorage.getItem('gsfc_qa_threads') || '[]');
      const filtered = stored.filter(t => t.id !== threadId);
      localStorage.setItem('gsfc_qa_threads', JSON.stringify(filtered));
      window.dispatchEvent(new Event('qa-threads-updated'));
    } catch (e) {}

    setThreads(prev => prev.filter(t => t.id !== threadId));
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.body && t.body.toLowerCase().includes(q)) ||
        (t.student_name && t.student_name.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    });
  }, [threads, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 rounded-full text-xs font-black border border-cyan-200 dark:border-cyan-800">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>CampusHire AI Placement Community Hub</span>
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

      {/* 🧭 NAVIGATION TAB BAR: [Community Questions] vs [My Questions] */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveView('community')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeView === 'community'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community Questions</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser && onOpenAuth) {
                onOpenAuth();
                return;
              }
              setActiveView('my_questions');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeView === 'my_questions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Questions</span>
            {currentUser && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeView === 'my_questions'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {myQuestionsCount}
              </span>
            )}
          </button>
        </div>

        {/* View mode descriptor */}
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>
            {activeView === 'my_questions' 
              ? 'Showing only questions raised by your student account' 
              : 'Showing live public questions across all engineering departments'}
          </span>
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
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
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

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shrink-0 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'unanswered', label: 'Unanswered' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-xl font-black capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threads List */}
      {loading ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading Q&A Threads from Database...</p>
        </div>
      ) : activeView === 'my_questions' && !currentUser ? (
        <div className="p-12 text-center space-y-4 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-md">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <LogIn className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Sign In to View Your Questions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Log in with your GSFC student credentials to view and manage all questions, verified answers, and doubt discussions associated with your account.
            </p>
          </div>
          <button
            onClick={() => onOpenAuth && onOpenAuth()}
            className="px-5 py-2.5 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-transform"
          >
            Sign In Now
          </button>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="p-12 text-center space-y-4 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-md">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            {activeView === 'my_questions' ? <User className="w-7 h-7" /> : <HelpCircle className="w-7 h-7" />}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {activeView === 'my_questions' ? "You Haven't Raised Any Questions Yet" : "No Questions Found"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeView === 'my_questions'
                ? "Need clarification regarding eligibility criteria, interview rounds, or corporate drive policies? Post your doubt to get official answers from the TPC Cell."
                : "No community questions match your current filters. Try changing your search or category."}
            </p>
          </div>
          {activeView === 'my_questions' && (
            <button
              onClick={() => setAskModalOpen(true)}
              className="px-5 py-2.5 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-transform inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ask Your First Question</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map(thread => {
            const isResolved = thread.status === 'resolved';
            const isMyThread = (
              (currentStudentId && (thread.student_id === currentStudentId || thread.student_id === `s_${currentStudentId}`)) ||
              (currentEmailPrefix && thread.student_id && thread.student_id.toLowerCase().includes(currentEmailPrefix.toLowerCase())) ||
              (currentUser?.name && thread.student_name && currentUser.name.toLowerCase() === thread.student_name.toLowerCase())
            );

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

                    {isMyThread && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        <span>Your Question</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors leading-snug">
                    {thread.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                    {thread.body}
                  </p>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium pt-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {thread.student_name}
                    </span>
                    <span>•</span>
                    <span>{new Date(thread.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                      (thread.replies_count || 0) > 0
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{thread.replies_count || 0} Replies</span>
                    </div>

                    {(currentUser?.role === 'admin' || 
                      currentUser?.role === 'superadmin' ||
                      isMyThread ||
                      thread.student_id === 'guest_student') && (
                      <button
                        title="Delete Question"
                        onClick={(e) => handleDeleteThread(e, thread.id)}
                        className="px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 dark:hover:bg-rose-600 rounded-xl text-[11px] font-bold transition-all border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
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
          setMyQuestionsCount(prev => prev + 1);
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
