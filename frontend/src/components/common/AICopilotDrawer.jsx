import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Sparkles, Send, Bot, User, Table, BarChart2, CornerDownLeft, 
  HelpCircle, RefreshCw, Layers, ShieldCheck, Download, Award, ChevronRight, FileText
} from 'lucide-react';

export default function AICopilotDrawer({ 
  isOpen, 
  onClose, 
  currentUser, 
  mode = 'tpo' // 'tpo' or 'student'
}) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isTpoMode = mode === 'tpo' || currentUser?.role === 'admin';

  const defaultPromptSuggestions = isTpoMode ? [
    'Show students eligible for the next company',
    'Which students are at high risk of remaining unplaced?',
    'Which department has the highest placement rate?',
    'What skills are most demanded by recruiters?',
    'Generate executive placement report for management'
  ] : [
    'Which skills should I learn for Google Cloud?',
    'Why is my ATS score low and how to fix it?',
    'Which companies suit my profile?',
    'Create a 30-day placement preparation plan',
    'Give me top Java & DSA interview questions'
  ];

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = isTpoMode ? {
        sender: 'ai',
        text: `🏛️ **GSFC AI TPO Copilot Ready.**\n\nI am connected to the live placement database. You can ask me natural-language queries about candidate eligibility, departmental placement rates, at-risk student detection, or management reporting.`,
        suggested: defaultPromptSuggestions
      } : {
        sender: 'ai',
        text: `🚀 **GSFC AI Student Career Copilot Ready.**\n\nI have access to your academic profile and live recruiter requirements. Ask me for personalized skill recommendations, resume fixes, company matching, or mock interview questions.`,
        suggested: defaultPromptSuggestions
      };
      setMessages([welcome]);
    }
  }, [isOpen, isTpoMode]);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (customQuery) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const endpoint = isTpoMode ? '/api/intelligence/tpo-copilot' : '/api/intelligence/student-copilot';
      const payload = isTpoMode 
        ? { query: textToSend, history: messages.slice(-4) }
        : { query: textToSend, studentId: currentUser?.profile?.id || currentUser?.id };

      const token = localStorage.getItem('campushire_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      const aiMsg = {
        sender: 'ai',
        text: data.response || data.answer || 'Query processed.',
        table: data.table,
        chart: data.chart,
        suggested: data.suggestedFollowUps || data.suggestedQuestions || defaultPromptSuggestions.slice(0, 3)
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `⚠️ Error retrieving placement intelligence: ${err.message}. Please retry.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 top-[4.25rem] z-40 flex items-start justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)] text-slate-900 dark:text-slate-100 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Copilot Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-black shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black">
                  {isTpoMode ? 'GSFC AI TPO Copilot' : 'GSFC Career Copilot'}
                </h3>
                <span className="px-2 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Live DB
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-bold">
                {isTpoMode ? 'Natural Language Placement Intelligence Engine' : 'Personalized AI Placement Mentor'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Copilot"
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close Copilot (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {messages.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div 
                key={idx} 
                className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-end justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-xl bg-blue-900 text-amber-300 flex items-center justify-center font-black shrink-0 text-xs shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2.5 ${
                  isAi 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl rounded-tl-xs shadow-xs border border-slate-200/80 dark:border-slate-700' 
                    : 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3 rounded-2xl rounded-tr-xs shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Render Quick Suggested Prompts */}
                  {msg.suggested && msg.suggested.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Suggested Inquiries
                      </div>
                      <div className="flex flex-col gap-1">
                        {msg.suggested.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition flex items-center justify-between group cursor-pointer"
                          >
                            <span>{sug}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Formatted Intelligence Result Payload */}
                  {msg.data && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-blue-900 dark:text-blue-400 flex items-center gap-1">
                          <BarChart2 className="w-3.5 h-3.5" /> Intelligence Output
                        </span>
                        {msg.data.totalCount !== undefined && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded text-[10px]">
                            {msg.data.totalCount} records
                          </span>
                        )}
                      </div>

                      {/* Render Table Data if present */}
                      {Array.isArray(msg.data.table) && msg.data.table.length > 0 && (
                        <div className="overflow-x-auto max-h-48 rounded border border-slate-100 dark:border-slate-800">
                          <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0">
                              <tr>
                                {Object.keys(msg.data.table[0]).map((k, kIdx) => (
                                  <th key={kIdx} className="px-2 py-1 uppercase">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {msg.data.table.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  {Object.values(row).map((val, vIdx) => (
                                    <td key={vIdx} className="px-2 py-1 font-medium">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 text-xs shadow-xs mb-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 italic">
              <div className="w-6 h-6 rounded-lg bg-blue-900 text-amber-300 flex items-center justify-center animate-spin">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Analyzing live placement intelligence...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTpoMode ? "Ask TPO Copilot (e.g. 'Show students with CGPA > 8.0')..." : "Ask Career Copilot (e.g. 'How to improve my resume')..."}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-900 shadow-xs"
            />
            <button
              type="submit"
              aria-label="Send Query"
              disabled={loading || !query.trim()}
              className="p-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 text-white rounded-2xl shadow-md transition-transform hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
