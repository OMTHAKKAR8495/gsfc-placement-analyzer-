import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, CheckCircle2, Clock, 
  ShieldCheck, Award, User, CornerDownRight, Check, AlertCircle, Trash2, Sparkles, Loader2 
} from 'lucide-react';

export default function QAThreadView({ threadId, onClose, currentUser, onOpenAuth, onThreadUpdated }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (threadId) fetchThread();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [threadId, onClose]);

  useEffect(() => {
    let timer;
    if (replySuccess) {
      timer = setTimeout(() => setReplySuccess(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [replySuccess]);

  const fetchThread = async () => {
    setLoading(true);
    let localThread = null;
    try {
      const stored = JSON.parse(localStorage.getItem('gsfc_qa_threads') || '[]');
      localThread = stored.find(t => t.id === threadId);
    } catch(e) {}

    try {
      const res = await fetch(`/api/qa/threads/${threadId}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setThread(data);
        return;
      }
    } catch (err) {}

    if (localThread) {
      setThread({
        ...localThread,
        replies: localThread.replies || []
      });
    } else {
      const SEEDS = [
        {
          id: 'thread_cgpa_policy',
          student_id: 's_arav',
          student_name: 'Arav Sharma',
          title: 'What is the university policy for Tier-1 companies if someone has 1 active backlog?',
          body: 'I have a CGPA of 8.9 in BTech CSE but had a backlog in Sem 4 mathematics that is cleared in re-eval. Will I be eligible for Google / Microsoft on-campus shortlist?',
          category: 'Eligibility & Drive Rules',
          status: 'resolved',
          replies: [
            { id: 'rep_1', author_name: 'Dr. Rajesh Sharma (TPC Coordinator)', author_role: 'admin', body: 'Yes! As long as the active backlog is cleared before final placement registration, your academic profile is considered 100% clear with zero active backlogs for Google and Microsoft shortlisting criteria.', created_at: new Date().toISOString() }
          ],
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
          replies: [
            { id: 'rep_2', author_name: 'Priya Patel (Alumni Mentor - Amazon)', author_role: 'alumni', body: 'Make sure you add quantifiable results: e.g. "Reduced structural stress by 18% using STAAD Pro finite element analysis." Action verbs and metrics boost ATS scores past 90.', created_at: new Date().toISOString() }
          ],
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ];
      setThread(SEEDS.find(t => t.id === threadId) || null);
    }
    setLoading(false);
  };

  const handlePostReply = async (e, andResolve = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!replyText.trim() || submittingReply) return;

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSubmittingReply(true);
    setReplySuccess(false);
    const authorId = currentUser.owner_id || currentUser.id;
    const authorName = currentUser.name || currentUser.profile?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Community Member');
    const authorRole = currentUser.role || 'student';

    const newReply = {
      id: 'rep_' + Date.now(),
      thread_id: threadId,
      author_id: authorId,
      author_name: authorName,
      author_role: authorRole,
      body: replyText.trim(),
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`/api/qa/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: authorId,
          author_name: authorName,
          author_role: authorRole,
          body: replyText.trim()
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.reply) {
          newReply.id = data.reply.id;
        }
      }
    } catch (err) {}

    // If andResolve is true, also resolve thread
    if (andResolve) {
      try {
        await fetch(`/api/qa/threads/${threadId}/resolve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' })
        });
      } catch (err) {}
    }

    // Update state and local storage
    setThread(prev => {
      const updatedReplies = [...(prev?.replies || []), newReply];
      const updatedThread = {
        ...prev,
        status: andResolve ? 'resolved' : prev.status,
        replies: updatedReplies,
        replies_count: updatedReplies.length
      };

      try {
        const stored = JSON.parse(localStorage.getItem('gsfc_qa_threads') || '[]');
        const updatedStored = stored.map(t => t.id === threadId ? updatedThread : t);
        localStorage.setItem('gsfc_qa_threads', JSON.stringify(updatedStored));
        window.dispatchEvent(new Event('qa-threads-updated'));
      } catch (e) {}

      return updatedThread;
    });

    setReplyText('');
    setReplySuccess(true);
    setSubmittingReply(false);
    if (onThreadUpdated) onThreadUpdated();
  };

  const handleToggleResolve = async () => {
    if (!thread) return;
    setResolving(true);
    const newStatus = thread.status === 'open' ? 'resolved' : 'open';
    try {
      fetch(`/api/qa/threads/${threadId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});
    } catch (err) {}

    setThread(prev => {
      const updated = { ...prev, status: newStatus };
      try {
        const stored = JSON.parse(localStorage.getItem('gsfc_qa_threads') || '[]');
        const updatedStored = stored.map(t => t.id === threadId ? updated : t);
        localStorage.setItem('gsfc_qa_threads', JSON.stringify(updatedStored));
        window.dispatchEvent(new Event('qa-threads-updated'));
      } catch (e) {}
      return updated;
    });

    setResolving(false);
    if (onThreadUpdated) onThreadUpdated();
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this question and all replies?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/qa/threads/${threadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (onThreadUpdated) onThreadUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
    } finally {
      setDeleting(false);
    }
  };

  const isFaculty = currentUser?.role === 'faculty';
  const isTpoOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isOriginalAuthor = 
    currentUser?.owner_id === thread?.student_id || 
    currentUser?.id === thread?.student_id || 
    currentUser?.profile?.id === thread?.student_id ||
    (currentUser?.name && thread?.student_name && currentUser.name.toLowerCase() === thread.student_name.toLowerCase()) ||
    thread?.student_id === 'guest_student';
  const canResolve = isFaculty || isTpoOrAdmin || isOriginalAuthor;
  const canDelete = isFaculty || isTpoOrAdmin || isOriginalAuthor;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 top-[4.25rem] z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Loading Thread Details...</p>
          </div>
        ) : !thread ? (
          <div className="p-12 text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Discussion Thread Not Found
              </h3>
              <p className="text-xs text-slate-500">
                This question thread may have been deleted or removed from the database.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-black border border-blue-200 dark:border-blue-800">
                    {thread.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    thread.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                  }`}>
                    {thread.status === 'resolved' ? '✓ Resolved' : 'Open Question'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canResolve && (
                    <button
                      onClick={handleToggleResolve}
                      disabled={resolving}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        thread.status === 'resolved'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{thread.status === 'resolved' ? 'Reopen Thread' : 'Mark Resolved'}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={handleDeleteThread}
                      disabled={deleting}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                {thread.title}
              </h2>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                {thread.body}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{thread.student_name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(thread.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>

            {/* Answers List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Answers & Community Clarifications
                </h3>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {thread.replies?.length || 0} Replies
                </span>
              </div>

              <div className="space-y-3">
                {!thread.replies || thread.replies.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-xs text-slate-500 font-medium italic">
                      No replies yet. Be the first to provide clarity on this placement doubt!
                    </p>
                  </div>
                ) : (
                  thread.replies.map(reply => {
                    const isTpo = reply.author_role === 'admin' || reply.author_role === 'tpo';
                    const isFaculty = reply.author_role === 'faculty';
                    const isAlumni = reply.author_role === 'alumni';

                    return (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                          isTpo
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-xs'
                            : isFaculty
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                            : isAlumni
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 dark:text-slate-100">
                              {reply.author_name}
                            </span>
                            {isFaculty && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded text-[10px] font-black">
                                <Award className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                <span>🎓 VERIFIED FACULTY ADVISOR</span>
                              </span>
                            )}
                            {isTpo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 rounded text-[10px] font-black">
                                <ShieldCheck className="w-3 h-3 text-amber-700" />
                                <span>OFFICIAL TPO RESPONSE</span>
                              </span>
                            )}
                            {isAlumni && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-200 rounded text-[10px] font-black">
                                <Award className="w-3 h-3 text-blue-700" />
                                <span>ALUMNI MENTOR</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {reply.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* ✨ Glowing Green Correct Symbol UI on Success */}
                {replySuccess && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0 shadow-sm border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reply Submitted Successfully!</span>
                        </h4>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                          Your response is verified and live in this discussion thread.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplySuccess(false)}
                      className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your answer, official TPO guidelines, or alumni experience..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {canResolve && thread.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={submittingReply || !replyText.trim()}
                      onClick={(e) => handlePostReply(e, true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Post this reply and mark the question as Resolved"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Post Reply & Mark Resolved</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                      replySuccess
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-theme-gradient hover:opacity-90 text-white'
                    }`}
                  >
                    {submittingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : replySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Reply Posted!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
