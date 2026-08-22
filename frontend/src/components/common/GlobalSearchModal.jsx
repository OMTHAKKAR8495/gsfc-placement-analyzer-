import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, X, User, Building2, Briefcase, Sparkles, 
  ArrowRight, CornerDownLeft, Filter
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Global key listener for ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/intelligence/global-search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Error in global search:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    if (item.link) {
      window.location.hash = item.link;
    }
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 top-[4.25rem] z-50 flex items-start justify-center p-3 pt-10 sm:pt-16 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-900 dark:text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students, companies, drives, skills, or reports (e.g. 'Rahul', 'Google', 'Python')..."
            className="flex-1 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              Clear
            </button>
          )}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-400">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {loading && (
            <div className="p-6 text-center text-slate-400 italic flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Searching placement intelligence...</span>
            </div>
          )}

          {!loading && results.length === 0 && searchTerm.trim() && (
            <div className="p-6 text-center text-slate-400 font-medium">
              No matching records found for "{searchTerm}".
            </div>
          )}

          {!searchTerm.trim() && (
            <div className="p-6 text-center space-y-2 text-slate-400">
              <div className="text-xs font-bold">Quick Search Ideas:</div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {['Rahul Verma', 'Google Cloud', 'Chemical Engineering', 'BTech CSE', 'Dream Offer'].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchTerm(s)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-blue-50 hover:text-blue-900 cursor-pointer"
                  >
                    🔍 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((item, idx) => {
            return (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                className="pt-1.5 first:pt-0 p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                    {item.type === 'student' && <User className="w-4 h-4" />}
                    {item.type === 'company' && <Building2 className="w-4 h-4" />}
                    {item.type === 'drive' && <Briefcase className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
