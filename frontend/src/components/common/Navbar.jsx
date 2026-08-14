import React from 'react';
import { User, Building2, ShieldCheck, LogOut, LogIn, Sun, Moon } from 'lucide-react';

export default function Navbar({ currentUser, activeRole, onRoleSwitch, onOpenAuth, onLogout, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[4.5rem] py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* GSFC Official Logo Header — Clicking returns to Main Homepage / Student Workspace */}
        <div 
          className="flex items-center gap-2 sm:gap-4 cursor-pointer group shrink-0" 
          onClick={() => onRoleSwitch('student')}
          title="Return to GSFC Main Placement Homepage"
        >
          <div className="h-10 sm:h-14 flex items-center">
            <img 
              src="/gsfc-logo-official.png" 
              alt="GSFC University Logo" 
              className="h-10 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </div>
        </div>

        {/* Segmented Role Navigation Bar */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => onRoleSwitch('student')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeRole === 'student'
                ? 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student <span className="hidden sm:inline">Workspace</span></span>
          </button>

          <button
            onClick={() => onRoleSwitch('company')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeRole === 'company'
                ? 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Recruiter <span className="hidden sm:inline">Portal</span></span>
          </button>

          <button
            onClick={() => onRoleSwitch('admin')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeRole === 'admin'
                ? 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TPC Admin</span>
          </button>
        </div>

        {/* User Auth & Theme Toggle Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all font-black text-xs shrink-0 flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-black text-slate-900 dark:text-slate-100">{currentUser.profile?.name || currentUser.email}</div>
                <div className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentUser.role}
                </div>
              </div>

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md border border-blue-900/20">
                {(currentUser.profile?.name || currentUser.email).slice(0, 2).toUpperCase()}
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-xs font-bold"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-[11px] sm:text-xs shadow-lg shadow-blue-900/20 transition-all shrink-0 whitespace-nowrap min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Sign In <span className="hidden xs:inline">/ Portal</span></span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
