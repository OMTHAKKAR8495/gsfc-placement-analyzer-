import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, MessageSquare, CheckCircle2, Building, 
  Linkedin, Send, Clock, Plus, Tag, Share2, Award, UserCheck, ChevronDown, ChevronUp 
} from 'lucide-react';
import CreatePostModal from './CreatePostModal';

export default function MentorshipFeed({ currentUser, onOpenAuth }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = '/api/alumni/posts';
      const params = new URLSearchParams();
      if (selectedTag) params.append('tag', selectedTag);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching mentorship posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComments = async (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await fetch(`/api/alumni/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsMap(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    }
  };

  const handlePostComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/alumni/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: currentUser.owner_id || currentUser.id,
          author_name: currentUser.name || currentUser.profile?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'GSFC Student'),
          author_role: currentUser.role || 'student',
          content: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // Update comments count on post
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.author_name && p.author_name.toLowerCase().includes(q)) ||
      (p.author_company && p.author_company.toLowerCase().includes(q))
    );
  });

  const allTags = Array.from(
    new Set(posts.flatMap(p => Array.isArray(p.tags) ? p.tags : []))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-teal-900/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-black border border-blue-200 dark:border-blue-800">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>GSFC University Alumni Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Alumni Mentorship & Placement Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
              Connect directly with GSFC University alumni working across top global firms like Amazon AWS, Reliance, GSFC Ltd, and TCS. Read firsthand interview breakdowns, career roadmaps, and ask questions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser?.role === 'alumni' ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-3 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Mentorship Post</span>
              </button>
            ) : currentUser?.role === 'admin' ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post TPO / Alumni Notice</span>
              </button>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 block">Are you a GSFC Graduate?</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">Join as Alumni Mentor</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alumni, company, or advice..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border ${
              selectedTag === ''
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            All Topics
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-blue-50'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading GSFC Alumni Insights...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">No Mentorship Posts Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or tag filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const isCommentsOpen = activeCommentsPostId === post.id;
            const comments = commentsMap[post.id] || [];

            return (
              <div 
                key={post.id}
                className="glass-panel p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 bg-white/90 dark:bg-slate-900/90 transition-all hover:border-blue-300 dark:hover:border-blue-800"
              >
                {/* Author Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                      {post.author_name ? post.author_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AL'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {post.author_name || 'GSFC Alumni Mentor'}
                        </span>
                        {post.author_verified === 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Alumni</span>
                          </span>
                        )}
                        {post.author_batch && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            Batch {post.author_batch}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                        <span>{post.author_designation || 'Engineer'}</span>
                        {post.author_company && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {post.author_company}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {post.author_linkedin && (
                    <a
                      href={post.author_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition-colors shrink-0"
                      title="View LinkedIn Profile"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-normal whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Tags */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Post Footer & Comments Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(post.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{post.comments_count || 0} Student Doubts & Comments</span>
                    {isCommentsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Thread Comments */}
                {isCommentsOpen && (
                  <div className="space-y-3 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl animate-fade-in">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Mentorship Discussion & Q&A
                    </h4>

                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No comments yet. Be the first to ask a question to this alumnus!
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {comments.map(c => {
                          const isAlumniAuthor = c.author_role === 'alumni';
                          const isAdminAuthor = c.author_role === 'admin' || c.author_role === 'tpo';

                          return (
                            <div 
                              key={c.id} 
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isAlumniAuthor 
                                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                                  : isAdminAuthor
                                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 dark:text-slate-100">
                                    {c.author_name}
                                  </span>
                                  {isAlumniAuthor && (
                                    <span className="px-1.5 py-0.2 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 text-[9px] font-black rounded">
                                      ALUMNI
                                    </span>
                                  )}
                                  {isAdminAuthor && (
                                    <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[9px] font-black rounded">
                                      TPO ADMIN
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(c.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                {c.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New Comment Input Box */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post.id); }}
                        placeholder="Ask a question or share feedback with this alumnus..."
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handlePostComment(post.id)}
                        disabled={submittingComment || !commentInputs[post.id]?.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal for Logged-In Mentors */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        alumniProfile={currentUser?.profile || { id: currentUser?.owner_id || 'alumni_priya' }}
        onPostCreated={(newPost) => {
          setPosts(prev => [newPost, ...prev]);
        }}
      />
    </div>
  );
}
