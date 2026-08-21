import React, { useState } from 'react';
import { X, Send, Tag, Sparkles, AlertCircle } from 'lucide-react';

const SUGGESTED_TAGS = ['Interview Tips', 'Career Roadmap', 'Cloud & DevOps', 'Core Engineering', 'Resume Advice', 'System Design', 'Higher Studies', 'Off-Campus Hiring'];

export default function CreatePostModal({ isOpen, onClose, alumniProfile, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Interview Tips', 'Career Roadmap']);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags(prev => [...prev, tag]);
      }
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 5) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    if (!alumniProfile?.id) {
      setError('Alumni profile required to publish.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/alumni/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumni_id: alumniProfile.id,
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      onPostCreated(data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Alumni Knowledge Share</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Publish Mentorship Advice & Placement Guide
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Share your industry learnings, interview rounds experience, or company preparation roadmap with GSFC students.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">
              Post Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to Crack Amazon AWS Cloud Architecture Rounds (Tips from GSFC CSE Alum)"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">
              Detailed Insights & Recommendations
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share concrete preparation steps, technical concepts tested, typical questions asked, and actionable suggestions for juniors..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Topic Tags */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Topic Tags (Select up to 5)</span>
              <span className="text-[10px] text-slate-400 font-bold">{selectedTags.length}/5 Selected</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
              >
                + Add Tag
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Publishing...' : 'Publish to Student Feed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
