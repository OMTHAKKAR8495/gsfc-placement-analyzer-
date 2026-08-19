import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Bell, Mail, Phone, Calendar, CheckCircle, Clock, ExternalLink, RefreshCw, Send, Users, ShieldCheck } from 'lucide-react';

export default function NotificationLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterChannel, setFilterChannel] = useState('ALL'); // 'ALL', 'whatsapp', 'email'
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'drive_alert', 'interview_reminder', 'offer_letter'

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesChan = filterChannel === 'ALL' || log.channel === filterChannel;
    const matchesTyp = filterType === 'ALL' || log.notification_type === filterType;
    return matchesChan && matchesTyp;
  });

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>WhatsApp & Email Communication Audit Log</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] uppercase font-black">
                  Live Dispatch Monitor
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-bold">
                Real-time delivery status for drive broadcasts, interview calls, and offer letters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER CHIPS */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-700">Channel:</span>
            <button
              onClick={() => setFilterChannel('ALL')}
              className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                filterChannel === 'ALL' ? 'bg-blue-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterChannel('whatsapp')}
              className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 ${
                filterChannel === 'whatsapp' ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-green-800 hover:bg-green-50'
              }`}
            >
              <Phone className="w-3 h-3" /> WhatsApp
            </button>
            <button
              onClick={() => setFilterChannel('email')}
              className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 ${
                filterChannel === 'email' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-blue-800 hover:bg-blue-50'
              }`}
            >
              <Mail className="w-3 h-3" /> Email
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-700">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="drive_alert">📢 Drive Broadcasts</option>
              <option value="interview_reminder">🎓 Interview Calls</option>
              <option value="offer_letter">🏆 Offer Letters</option>
            </select>
          </div>
        </div>

        {/* LOGS TABLE / FEED */}
        <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-bold">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900 mb-2" />
              Loading communication records...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-bold">
              No communication logs recorded for the selected filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isWa = log.channel === 'whatsapp';
              const cleanPhone = (log.recipient_phone || '919876543210').replace(/[^0-9]/g, '');
              const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${encodeURIComponent(log.message)}`;

              return (
                <div 
                  key={log.id} 
                  className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                        isWa ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {isWa ? <Phone className="w-2.5 h-2.5" /> : <Mail className="w-2.5 h-2.5" />}
                        {log.channel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase ${
                        log.notification_type === 'offer_letter'
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : log.notification_type === 'interview_reminder'
                            ? 'bg-purple-100 text-purple-950 border border-purple-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {log.notification_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{log.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase">
                        {log.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 font-medium">
                    <span>Recipient: </span>
                    <strong className="text-slate-900">{log.recipient_name}</strong> ({log.recipient_email || log.recipient_phone})
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {log.message}
                  </div>

                  {isWa && (
                    <div className="flex justify-end pt-1">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Open in WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
