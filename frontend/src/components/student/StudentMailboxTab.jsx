import React, { useState, useEffect } from 'react';
import { 
  Mail, Inbox, Building2, ShieldCheck, UserCheck, Clock, Calendar, 
  MapPin, Video, CheckCircle2, AlertCircle, Trash2, ArrowRight, 
  ExternalLink, Search, Filter, RefreshCw, Send, Check, Sparkles, X, ChevronRight
} from 'lucide-react';
import { studentInboxStorage } from '../../utils/studentInboxStorage';
import { useToast } from '../../context/ToastContext';

export default function StudentMailboxTab({ currentStudent, currentUser }) {
  const { showToast } = useToast();

  const [messages, setMessages] = useState(() => studentInboxStorage.getMessages());
  const [filterType, setFilterType] = useState('all'); // 'all', 'company', 'admin', 'unread'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const studentEmail = (currentUser?.email || currentStudent?.email || '24bt04171@gsfcuniversity.ac.in').toLowerCase();

  const refreshMessages = () => {
    const list = studentInboxStorage.getMessages(studentEmail);
    setMessages(list);
  };

  useEffect(() => {
    refreshMessages();
    const handleUpdate = (e) => {
      if (e.detail) {
        setMessages(e.detail);
      } else {
        refreshMessages();
      }
    };
    window.addEventListener('student_inbox_updated', handleUpdate);
    return () => window.removeEventListener('student_inbox_updated', handleUpdate);
  }, [studentEmail]);

  const handleOpenMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      studentInboxStorage.markAsRead(msg.id);
      refreshMessages();
    }
  };

  const handleDelete = (msgId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this message from your mailbox?')) {
      studentInboxStorage.deleteMessage(msgId);
      refreshMessages();
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
      showToast({ type: 'info', title: 'Message Deleted', message: 'The message was removed from your mailbox.' });
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;
    setSendingReply(true);
    setTimeout(() => {
      setSendingReply(false);
      setReplyText('');
      showToast({
        type: 'success',
        title: '✉️ Response Dispatched',
        message: `Your confirmation/reply was sent directly to ${selectedMessage.sender_name}!`,
        triggerCrackles: true
      });
    }, 600);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const filteredMessages = messages.filter(m => {
    const matchesFilter = filterType === 'all' ? true :
                          filterType === 'unread' ? !m.is_read :
                          m.sender_type === filterType;
    const matchesSearch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.company_name && m.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          m.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-700/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-xl">
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-slate-900" />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-md animate-pulse">
                {unreadCount} New
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                Direct Recruiter & TPC Inquiries
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Placement Mailbox & Interview Calls
            </h2>
            <p className="text-xs text-blue-200/80">
              Official interview invitations, assessment links, and direct recruiter messages for <strong className="text-white">{currentStudent?.name || currentUser?.name || 'Om Thakkar'}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-blue-200 font-bold">Total Mailbox Items</div>
            <div className="text-2xl font-black text-white">{messages.length} Messages</div>
          </div>
          <button
            onClick={refreshMessages}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Mails (${messages.length})` },
            { id: 'unread', label: `🔔 Unread (${unreadCount})` },
            { id: 'company', label: '🏢 Company Calls' },
            { id: 'admin', label: '👑 TPC Notices' },
            { id: 'faculty', label: '👨‍🏫 Faculty Notes' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterType === btn.id
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search interview mails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Main Mailbox Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Message List */}
        <div className="lg:col-span-1 space-y-3 max-h-[650px] overflow-y-auto pr-1">
          {filteredMessages.map(msg => {
            const isSelected = selectedMessage?.id === msg.id;
            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-md scale-101'
                    : msg.is_read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-amber-50/70 border-amber-300 hover:border-amber-400 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                      msg.sender_type === 'company' ? 'bg-indigo-100 text-indigo-900 border-indigo-200' :
                      msg.sender_type === 'admin' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                      'bg-emerald-100 text-emerald-900 border-emerald-200'
                    }`}>
                      {msg.company_name || msg.sender_name}
                    </span>
                    {!msg.is_read && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                  {msg.subject}
                </h4>

                <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {msg.body}
                </p>

                {msg.scheduled_date && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-900 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Drive Date: {msg.scheduled_date}</span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMessages.length === 0 && (
            <div className="text-center py-12 glass-panel rounded-2xl p-6 text-slate-500 space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-xs font-black text-slate-700">No messages in this folder</div>
              <p className="text-[11px] text-slate-500">When companies or faculty reach out, their invitations will appear here.</p>
            </div>
          )}
        </div>

        {/* Right: Message Detail Viewer */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 bg-white">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-lg bg-blue-100 text-blue-900 border border-blue-200">
                      {selectedMessage.sender_type === 'company' ? 'Corporate Recruiter' : selectedMessage.sender_type === 'admin' ? 'TPC Placement Officer' : 'Faculty Mentor'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedMessage.subject}
                  </h3>
                  <div className="text-xs text-slate-600 font-medium">
                    From: <strong className="text-slate-900">{selectedMessage.sender_name}</strong> &lt;{selectedMessage.sender_email}&gt;
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(selectedMessage.id, e)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                  title="Delete Message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Event / Interview Callout Banner (if scheduled) */}
              {selectedMessage.scheduled_date && (
                <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 rounded-2xl border-2 border-blue-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedMessage.event_stage || 'Official Drive Event'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black text-[10px] rounded-md border border-emerald-300">
                      Scheduled Call
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-900" />
                      <span>{selectedMessage.scheduled_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-900" />
                      <span>{selectedMessage.scheduled_time || '10:00 AM IST'}</span>
                    </div>
                    {selectedMessage.meeting_link && (
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-emerald-700" />
                        <a
                          href={selectedMessage.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline truncate"
                        >
                          Join Meeting Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {selectedMessage.body}
              </div>

              {/* Quick Reply / Availability Confirmation Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-200">
                <label className="block font-black text-xs text-slate-800">
                  Quick Reply & Confirm Interview Availability:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Thank you for the invite! I confirm my availability on the scheduled date."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-all hover:scale-102"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? 'Sending...' : 'Send Confirmation'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3 flex flex-col items-center justify-center min-h-[400px]">
              <Mail className="w-12 h-12 text-slate-300" />
              <h4 className="text-sm font-black text-slate-700">Select an Interview Email to Read</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose any communication from the list on the left to view official call letters, interview links, and schedule dates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
