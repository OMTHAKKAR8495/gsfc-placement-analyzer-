import React, { useState } from 'react';
import { User, Building2, ShieldCheck, LogOut, LogIn, Sun, Moon, HelpCircle, Smartphone, Download, Sparkles, Menu, X, Plus, Users } from 'lucide-react';
import AppDownloadModal from './AppDownloadModal';

export default function Navbar({ currentUser, activeRole, onRoleSwitch, onOpenAuth, onLogout, theme, onToggleTheme, onOpenJobPost, onOpenApplicantsFeed }) {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[4rem] py-2 flex items-center justify-between gap-2">
        
        {/* GSFC Official Logo Header */}
        <div 
          className="flex items-center cursor-pointer group shrink-0" 
          onClick={handleLogoClick}
          title="Return to GSFC Main Placement Homepage"
        >
          <img 
            src="/gsfc-logo-official.png" 
            alt="GSFC University Logo - Education Re-Envisioned" 
            className="h-10 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform" 
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
        </div>

        {/* Desktop Controls (Theme, User, Download App) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all font-black text-xs shrink-0 flex items-center justify-center cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-black text-slate-900 dark:text-slate-100">{currentUser.profile?.name || currentUser.email}</div>
                <div className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentUser.role}
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md border border-blue-900/20">
                {(currentUser.profile?.name || currentUser.email).slice(0, 2).toUpperCase()}
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-xs font-bold cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs shadow-lg transition-all shrink-0 cursor-pointer min-h-[38px]"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Sign In / Portal</span>
            </button>
          )}

          <button
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-black text-xs shadow-md transition-all shrink-0 border border-emerald-400/40 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>Download App</span>
          </button>
        </div>

        {/* Mobile Header Action Controls (< md) */}
        <div className="flex md:hidden items-center gap-2">
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

          {/* User Auth Section on Mobile */}
          {currentUser ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-slate-100">{currentUser.profile?.name || currentUser.email}</div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{currentUser.role}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="py-2 px-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-black rounded-xl flex items-center gap-1.5"
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
    </header>
  );
}
