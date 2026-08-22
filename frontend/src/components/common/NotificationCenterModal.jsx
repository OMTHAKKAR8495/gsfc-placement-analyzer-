import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Bell, Check, CheckCheck, Trash2, ExternalLink, Sparkles, 
  Building2, Calendar, Award, MessageSquare, AlertCircle, RefreshCw, ChevronRight, Send
} from 'lucide-react';

export default function NotificationCenterModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onMarkAllRead, 
  onMarkOneRead, 
  onClearAll,
  onOpenOfferModal,
  currentUser
}) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'drives', 'interviews', 'offers', 'general'
  const [selectedNotif, setSelectedNotif] = useState(null);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedNotif) setSelectedNotif(null);
        else onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedNotif, onClose]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'drives') return n.type === 'drive_alert' || n.notification_type === 'drive_alert';
    if (activeFilter === 'interviews') return n.type === 'interview_reminder' || n.notification_type === 'interview_reminder';
    if (activeFilter === 'offers') return n.type === 'offer_letter' || n.notification_type === 'offer_letter';
    if (activeFilter === 'general') return n.type === 'announcement' || n.type === 'message' || n.notification_type === 'message';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'drive_alert':
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      case 'interview_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'offer_letter':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'announcement':
      case 'message':
      default:
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
    }
  };

  const getNotifBadge = (type) => {
    switch (type) {
      case 'drive_alert':
        return { label: 'Placement Drive', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'interview_reminder':
        return { label: 'Interview Call', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'offer_letter':
        return { label: 'Official Offer', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' };
      case 'announcement':
      case 'message':
      default:
        return { label: 'TPC Notice', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
    }
  };

  const handleCardClick = (notif) => {
    if (!notif.is_read && onMarkOneRead) {
      onMarkOneRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 top-[4.25rem] z-40 flex items-start justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)] text-slate-900 dark:text-slate-100 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center font-black">
              <Bell className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>Placement Notification Center</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-300 font-bold">
                Live alerts from TPC Admin & Recruiter Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar (Mark All Read / Clear) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'drives', label: '📢 Drives' },
              { id: 'interviews', label: '💼 Interviews' },
              { id: 'offers', label: '🏆 Offers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition-all cursor-pointer border ${
                  activeFilter === tab.id
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                title="Mark all as read (clear badge)"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                  No Active Notifications
                </h4>
                <p className="text-[10px] text-slate-400">
                  New messages, placement drives, and interview calls will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const badge = getNotifBadge(notif.type || notif.notification_type);
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleCardClick(notif)}
                  className={`pt-2.5 first:pt-0 p-2.5 rounded-2xl transition-all cursor-pointer group ${
                    isUnread
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {getNotifIcon(notif.type || notif.notification_type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                        {notif.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                        {notif.message?.replace(/[*_#]/g, '')}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Notification Detail Modal Popup */}
        {selectedNotif && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Full Message Details
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium space-y-2 whitespace-pre-line text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto">
              <div className="font-black text-slate-900 dark:text-white text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                {selectedNotif.title}
              </div>
              <div>{selectedNotif.message?.replace(/[*#]/g, '')}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                Understood & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
