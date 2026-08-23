import React, { useState, useEffect, useMemo } from 'react';
import { User, Building2, ShieldCheck, LogOut, LogIn, Sun, Moon, HelpCircle, Smartphone, Download, Sparkles, Menu, X, Plus, Users, Award, Bell, Globe, Search, Play, Bot, GraduationCap, Lock, Settings } from 'lucide-react';
import AppDownloadModal from './AppDownloadModal';
import NotificationCenterModal from './NotificationCenterModal';
import EcosystemHubModal from './EcosystemHubModal';
import GlobalSearchModal from './GlobalSearchModal';
import AICopilotDrawer from './AICopilotDrawer';
import FacultyGuidedDemoModal from './FacultyGuidedDemoModal';
import SettingsModal from './SettingsModal';

const getInitials = (val) => {
  if (typeof val === 'string' && val.trim()) {
    return val.trim().substring(0, 2).toUpperCase();
  }
  return 'GS';
};

export default function Navbar({ currentUser, activeRole, onRoleSwitch, onOpenAuth, onLogout, theme, onToggleTheme, onOpenJobPost, onOpenApplicantsFeed }) {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [ecosystemModalOpen, setEcosystemModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('gsfc_user_avatar') || currentUser?.profile?.avatar_url || '');
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem('gsfc_read_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl);
      } else {
        setAvatarUrl(localStorage.getItem('gsfc_user_avatar') || '');
      }
    };
    window.addEventListener('gsfc-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('gsfc-avatar-updated', handleAvatarUpdate);
  }, []);

  useEffect(() => {
    if (currentUser?.profile?.avatar_url && !avatarUrl) {
      setAvatarUrl(currentUser.profile.avatar_url);
    }
  }, [currentUser]);

  const fetchLiveNotifications = async () => {
    try {
      const email = currentUser?.email || currentUser?.profile?.email || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`/api/notifications/feed?email=${encodeURIComponent(email)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // Graceful offline fallback without logging errors
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchLiveNotifications();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAllRead = () => {
    const allIds = new Set([...readNotifIds, ...notifications.map(n => n.id)]);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('gsfc_read_notifications', JSON.stringify([...allIds]));
    } catch (err) {}
  };

  const handleMarkOneRead = (id) => {
    const updated = new Set(readNotifIds);
    updated.add(id);
    setReadNotifIds(updated);
    try {
      localStorage.setItem('gsfc_read_notifications', JSON.stringify([...updated]));
    } catch (err) {}
  };

  const handleClearAll = () => {
    handleMarkAllRead();
    setNotifications([]);
  };

  const formattedNotifications = useMemo(() => {
    return notifications.map(n => ({
      ...n,
      is_read: readNotifIds.has(n.id)
    }));
  }, [notifications, readNotifIds]);

  const unreadCount = formattedNotifications.filter(n => !n.is_read).length;

  // Global shortcut (Cmd+K / Ctrl+K) for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    onRoleSwitch('student');
    window.location.hash = '#student';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleMobileNavClick = (role) => {
    onRoleSwitch(role);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-md transition-colors duration-300">
      <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 min-h-[5.2rem] py-3 flex items-center justify-between gap-2.5 sm:gap-4">
        
        {/* GSFC Official Logo Header */}
        <div 
          className="flex items-center cursor-pointer group shrink-0" 
          onClick={handleLogoClick}
          title="Return to GSFC Main Placement Homepage"
        >
          <img 
            src="/gsfc-logo-official.png" 
            alt="GSFC University Logo - Education Re-Envisioned" 
            className="h-12 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/gsfc-logo-official.jpg';
            }}
          />
        </div>

        {/* Desktop Segmented Role Navigation Bar (Hidden on Mobile < md) */}
        <div className="hidden md:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-inner">
          {(currentUser?.role === 'student' || currentUser?.role === 'admin' || !currentUser) && (
            <button
              onClick={() => onRoleSwitch('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'student'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Workspace</span>
            </button>
          )}

          {/* Alumni Network Tab */}
          <button
            onClick={() => onRoleSwitch('alumni')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeRole === 'alumni'
                ? 'bg-theme-gradient text-white shadow-md'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>Alumni Network</span>
          </button>

          {(currentUser?.role === 'student' || currentUser?.role === 'admin') && (
            <button
              onClick={() => onRoleSwitch('interview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'interview'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Interview Studio</span>
            </button>
          )}

          {(currentUser?.role === 'company' || currentUser?.role === 'admin') && (
            <button
              onClick={() => onRoleSwitch('company')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'company'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recruiter Portal</span>
            </button>
          )}

          {/* Direct Navbar Button: Applied Candidates Feed */}
          {currentUser?.role === 'company' && (
            <button
              onClick={onOpenApplicantsFeed || (() => onRoleSwitch('company'))}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:scale-105 ml-1 cursor-pointer border border-blue-700"
              title="Open Applied Candidates Feed & Attendance Register"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>📥 Applied Candidates Feed</span>
            </button>
          )}

          {/* Quick Upload / Post Job Button for Logged-In Company Recruiters */}
          {currentUser?.role === 'company' && (
            <button
              onClick={onOpenJobPost || (() => onRoleSwitch('company'))}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 shadow-md hover:scale-105 ml-1 cursor-pointer"
              title="Click to open Job Requirement Information Filling Form"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Post / Upload Job</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onRoleSwitch('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'admin'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TPC Admin</span>
            </button>
          )}

          {/* Faculty Hub Tab (Visible only to authorized Faculty and TPC Admins) */}
          {(currentUser?.role === 'faculty' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <button
              onClick={() => onRoleSwitch('faculty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'faculty'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Faculty Hub</span>
            </button>
          )}

          {/* Super Admin Tab (Visible only to Super Administrators) */}
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button
              onClick={() => onRoleSwitch('superadmin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeRole === 'superadmin'
                  ? 'bg-theme-gradient text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Super Admin</span>
            </button>
          )}
        </div>

        {/* Right Navigation & Header Actions Controls */}
        <div className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0 min-w-0">
          {/* 🔍 GLOBAL SEARCH (CMD+K) BUTTON */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Global Placement Search (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <kbd className="px-1.5 py-0.2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono text-slate-400">⌘K</kbd>
          </button>

          {/* 🤖 AI COPILOT LAUNCHER */}
          <button
            onClick={() => setCopilotDrawerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white font-black text-xs shadow-md border border-purple-400/40 hover:scale-105 transition-all cursor-pointer"
            title="Launch AI TPO & Career Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Copilot</span>
          </button>

          {/* 🎬 GUIDED DEMO TOUR */}
          <button
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
            title="13-Step Guided Faculty Demonstration"
          >
            <Play className="w-3 h-3 fill-slate-950" />
            <span>Demo</span>
          </button>

          {/* 🔔 LIVE NOTIFICATION CENTER BELL BUTTON */}
          <button
            onClick={() => setNotifModalOpen(true)}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-bold cursor-pointer"
            title="Placement Notifications & Live TPC Updates"
          >
            <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-md animate-pulse border border-white dark:border-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ⚙️ SETTINGS BUTTON WITH LOGO */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs font-black cursor-pointer group"
            title="Portal & Account Settings"
          >
            <Settings className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-black cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* 🔑 AVATAR DROPDOWN — Sign In/Out & Profile (no overflow at any screen width) */}
          {currentUser ? (
            <div className="relative shrink-0 pl-2 border-l border-slate-200 dark:border-slate-700">
              {/* Avatar Trigger Button */}
              <button
                type="button"
                onClick={() => setAvatarDropdownOpen(prev => !prev)}
                className="relative group cursor-pointer shrink-0 flex items-center gap-1.5"
                title="Account Menu"
              >
                <div className="w-9 h-11 rounded-xl overflow-hidden border-2 border-blue-900 dark:border-amber-400 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-lg transition-all group-hover:scale-105 ring-2 ring-blue-500/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-xs flex items-center justify-center">
                      {getInitials(currentUser?.profile?.name || currentUser?.name || currentUser?.email)}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-md bg-emerald-500 text-white text-[7px] font-black uppercase tracking-wider border border-white dark:border-slate-900 shadow-xs">
                  VERIFIED
                </span>
                {/* Name + Role (visible only on wide screens — no overflow risk) */}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[90px] leading-tight">
                    {currentUser.profile?.name || currentUser.name || currentUser.email}
                  </div>
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {/* Dropdown Popover */}
              {avatarDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setAvatarDropdownOpen(false)}
                  />
                  {/* Menu */}
                  <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-indigo-900">
                      <div className="text-xs font-black text-white truncate">
                        {currentUser.profile?.name || currentUser.name || currentUser.email}
                      </div>
                      <div className="text-[9px] text-blue-300 font-bold uppercase tracking-wider mt-0.5">
                        {currentUser.email || currentUser.profile?.email}
                      </div>
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {currentUser.role}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => { setAvatarDropdownOpen(false); setSettingsModalOpen(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Account Settings</span>
                      </button>
                      <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={() => { setAvatarDropdownOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In / Portal</span>
            </button>
          )}
        </div>

        {/* Mobile Header Action Controls (< md) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Settings Button */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black shrink-0"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Bell Button */}
          <button
            onClick={() => setNotifModalOpen(true)}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black shrink-0"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 text-xs font-black shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white border border-blue-800 text-xs font-black shadow-md shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl p-4 space-y-4 shadow-2xl animate-fadeIn">
          {/* Mobile Role Switch Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {(currentUser?.role === 'student' || currentUser?.role === 'admin' || !currentUser) && (
              <button
                onClick={() => handleMobileNavClick('student')}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all ${
                  activeRole === 'student'
                    ? 'bg-gradient-to-r from-blue-900 to-amber-600 text-white border-blue-900 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4" />
                  <span>Student Workspace</span>
                </div>
                {activeRole === 'student' && <Sparkles className="w-4 h-4 text-amber-300" />}
              </button>
            )}

            {/* Mobile Alumni Network Tab */}
            <button
              onClick={() => handleMobileNavClick('alumni')}
              className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all ${
                activeRole === 'alumni'
                  ? 'bg-gradient-to-r from-blue-900 to-amber-600 text-white border-blue-900 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Alumni Network & Mentorship</span>
              </div>
              {activeRole === 'alumni' && <Sparkles className="w-4 h-4 text-amber-300" />}
            </button>

            {(currentUser?.role === 'student' || currentUser?.role === 'admin') && (
              <button
                onClick={() => handleMobileNavClick('interview')}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all ${
                  activeRole === 'interview'
                    ? 'bg-gradient-to-r from-blue-900 to-amber-600 text-white border-blue-900 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Interview Studio</span>
                </div>
                {activeRole === 'interview' && <Sparkles className="w-4 h-4 text-amber-300" />}
              </button>
            )}

            {(currentUser?.role === 'company' || currentUser?.role === 'admin') && (
              <button
                onClick={() => handleMobileNavClick('company')}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all ${
                  activeRole === 'company'
                    ? 'bg-gradient-to-r from-blue-900 to-amber-600 text-white border-blue-900 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>Recruiter Portal</span>
                </div>
                {activeRole === 'company' && <Sparkles className="w-4 h-4 text-amber-300" />}
              </button>
            )}

            {currentUser?.role === 'company' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenApplicantsFeed) onOpenApplicantsFeed();
                  else handleMobileNavClick('company');
                }}
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all bg-blue-900 text-white border-blue-800 shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>📥 Applied Candidates Feed</span>
                </div>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            )}

            {currentUser?.role === 'company' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenJobPost) onOpenJobPost();
                  else handleMobileNavClick('company');
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>➕ Post / Upload Job Requirement</span>
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleMobileNavClick('admin')}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black border transition-all ${
                  activeRole === 'admin'
                    ? 'bg-gradient-to-r from-blue-900 to-amber-600 text-white border-blue-900 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>TPC Admin Governance</span>
                </div>
                {activeRole === 'admin' && <Sparkles className="w-4 h-4 text-amber-300" />}
              </button>
            )}
          </div>

          {/* Download Mobile App Button on Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setDownloadModalOpen(true);
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg border border-emerald-400/40 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>📱 Download GSFC App (Android APK & iOS)</span>
          </button>

          {/* Settings in Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setSettingsModalOpen(true);
            }}
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-between border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              <span>Portal & Account Settings</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">Preferences &rarr;</span>
          </button>

          {/* User Auth Section on Mobile */}
          {currentUser ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-900 dark:border-amber-400 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-xs flex items-center justify-center">
                      {getInitials(currentUser?.profile?.name || currentUser?.name || currentUser?.email)}
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{currentUser.profile?.name || currentUser.name || currentUser.email}</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="py-2 px-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Portal Account</span>
            </button>
          )}
        </div>
      )}

      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

      {/* 🔔 NOTIFICATION CENTER MODAL */}
      <NotificationCenterModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        notifications={formattedNotifications}
        onMarkAllRead={handleMarkAllRead}
        onMarkOneRead={handleMarkOneRead}
        onClearAll={handleClearAll}
        currentUser={currentUser}
      />

      {/* 🌐 ENTERPRISE MULTI-COLLEGE ECOSYSTEM & OPERATIONS MODAL */}
      <EcosystemHubModal
        isOpen={ecosystemModalOpen}
        onClose={() => setEcosystemModalOpen(false)}
        currentUser={currentUser}
      />

      {/* 🔍 GLOBAL SEARCH (CMD+K) MODAL */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* 🤖 AI PLACEMENT & CAREER COPILOT DRAWER */}
      <AICopilotDrawer
        isOpen={copilotDrawerOpen}
        onClose={() => setCopilotDrawerOpen(false)}
        currentUser={currentUser}
        mode={currentUser?.role === 'admin' ? 'tpo' : 'student'}
      />

      {/* 🎬 13-STEP GUIDED FACULTY DEMO TOUR */}
      <FacultyGuidedDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

      {/* ⚙️ PLATFORM SETTINGS & PREFERENCES MODAL */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenAuth={onOpenAuth}
      />
    </header>
  );
}
