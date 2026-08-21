import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, CheckCircle2, Clock, 
  ShieldCheck, Award, User, CornerDownRight, Check, AlertCircle 
} from 'lucide-react';

export default function QAThreadView({ threadId, onClose, currentUser, onOpenAuth, onThreadUpdated }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (threadId) fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qa/threads/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSubmittingReply(true);
    const authorId = currentUser.owner_id || currentUser.id;
    const authorName = currentUser.name || currentUser.profile?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Community Member');
    const authorRole = currentUser.role || 'student';

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

      if (res.ok) {
        const data = await res.json();
        setThread(prev => ({
          ...prev,
          replies: [...(prev.replies || []), data.reply],
          replies_count: (prev.replies_count || 0) + 1
        }));
        setReplyText('');
        if (onThreadUpdated) onThreadUpdated();
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleResolve = async () => {
    if (!thread) return;
    setResolving(true);
    const newStatus = thread.status === 'open' ? 'resolved' : 'open';
    try {
      const res = await fetch(`/api/qa/threads/${threadId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setThread(prev => ({ ...prev, status: newStatus }));
        if (onThreadUpdated) onThreadUpdated();
      }
    } catch (err) {
      console.error('Error resolving thread:', err);
    } finally {
      setResolving(false);
    }
  };

  if (!threadId) return null;

  const isTpoOrAdmin = currentUser?.role === 'admin';
  const isOriginalAuthor = currentUser?.owner_id === thread?.student_id || currentUser?.id === thread?.student_id;
  const canResolve = isTpoOrAdmin || isOriginalAuthor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !thread ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Loading Thread Details...</p>
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
                  {thread.student_name || 'GSFC Student'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(thread.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Replies Stream */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Answers & Community Clarifications</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">
                  {thread.replies?.length || 0} Replies
                </span>
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!thread.replies || thread.replies.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                    No replies yet. Be the first to provide clarity on this placement doubt!
                  </p>
                ) : (
                  thread.replies.map(reply => {
                    const isTpo = reply.author_role === 'tpo' || reply.author_role === 'admin';
                    const isAlumni = reply.author_role === 'alumni';

                    return (
                      <div 
                        key={reply.id}
                        className={`p-4 rounded-2xl border space-y-2 text-xs ${
                          isTpo
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm'
                            : isAlumni
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-slate-100">
                              {reply.author_name}
                            </span>
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
              <form onSubmit={handlePostReply} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your answer, official TPO guidelines, or alumni experience..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="px-5 py-2.5 bg-theme-gradient hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReply ? 'Submitting...' : 'Post Reply'}</span>
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
