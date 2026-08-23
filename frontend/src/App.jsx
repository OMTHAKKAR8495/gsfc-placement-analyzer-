import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import StudentDashboard from './components/student/StudentDashboard';
import CompanyDashboard from './components/company/CompanyDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import InterviewStudioView from './components/student/InterviewStudioView';
import AlumniDashboard from './components/alumni/AlumniDashboard';
import AIBugChatbotWidget from './components/common/AIBugChatbotWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { Eye, EyeOff, Sparkles, ChevronDown, ArrowDown, Sun, Moon, WifiOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';

const resolveBaseWorkspace = (rawHash) => {
  if (!rawHash) return 'student';
  const clean = rawHash.replace(/^#/, '').toLowerCase().trim();
  if (clean.startsWith('student') || clean === 'qa' || clean === 'community' || clean === 'job_fairs' || clean === 'applications' || clean === 'drives' || clean === 'profile' || clean.includes('intelligence')) {
    return 'student';
  }
  if (clean.startsWith('admin') || clean === 'tpc') return 'admin';
  if (clean.startsWith('faculty')) return 'faculty';
  if (clean.startsWith('company') || clean === 'recruiter') return 'company';
  if (clean.startsWith('alumni') || clean === 'mentorship') return 'alumni';
  if (clean.startsWith('interview') || clean === 'studio') return 'interview';
  if (clean.startsWith('superadmin')) return 'superadmin';
  return clean;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campushire_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isOffline, setIsOffline] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    const rawHash = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, '');
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('gsfc_active_workspace') : null;
    if (rawHash) {
      const base = resolveBaseWorkspace(rawHash);
      if (['student', 'interview', 'company', 'admin', 'alumni', 'faculty', 'superadmin'].includes(base)) {
        return base;
      }
    }
    if (savedRole && ['student', 'interview', 'company', 'admin', 'alumni', 'faculty', 'superadmin'].includes(savedRole)) {
      return savedRole;
    }
    return 'student';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hideCardsForBGView, setHideCardsForBGView] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [themeHue, setThemeHue] = useState(() => localStorage.getItem('gsfc_theme_hue') || '215');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Hide native splash screen once React mounts
    SplashScreen.hide().catch(() => {});

    // Configure Native Status Bar colors
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#1E3A8A' }).catch(() => {});

    // Network status listener for graceful offline banner
    Network.getStatus().then(status => setIsOffline(!status.connected)).catch(() => {});
    const netListener = Network.addListener('networkStatusChange', status => {
      setIsOffline(!status.connected);
    });

    // Native Android Hardware Back Button handler
    const backListener = CapacitorApp.addListener('backButton', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'student') {
        window.location.hash = '#student';
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      netListener.then(l => l.remove()).catch(() => {});
      backListener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  // Helper to validate whether user role is permitted to access target workspace
  const isRoleAllowedInWorkspace = (user, targetWorkspace) => {
    const base = resolveBaseWorkspace(targetWorkspace);
    // Main Student Homepage & Alumni Network are universally accessible to all users & guests
    if (base === 'student' || base === 'alumni' || !base) {
      return true;
    }
    if (!user) {
      // Guest: can only access Student & Alumni Workspaces
      return false;
    }
    if (user.role === 'superadmin' || user.role === 'admin') {
      // Super Admin & Admin: have oversight access to all workspaces
      return true;
    }
    if (user.role === 'faculty') {
      // Faculty: scoped to Faculty Hub, Student Workspace, and Alumni Network
      return base === 'faculty' || base === 'student' || base === 'alumni';
    }
    if (user.role === 'company') {
      // Recruiter: can access Recruiter Portal, Main Homepage, and Alumni Network
      return base === 'company' || base === 'student' || base === 'alumni';
    }
    if (user.role === 'alumni') {
      // Alumni: can access Alumni Network and Student Homepage
      return base === 'alumni' || base === 'student';
    }
    if (user.role === 'student') {
      // Student: scoped to Student Workspace, Interview Studio, and Alumni Network
      return base === 'student' || base === 'interview' || base === 'alumni';
    }
    return true;
  };

  // Keep a ref to currentUser for event listeners and route guards without re-binding effects
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // 1. Check current authenticated user ONCE on app mount
  useEffect(() => {
    checkCurrentUser();
  }, []);

  // 2. Set light / dark mode class and dynamic theme hue on document element
  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('gsfc_user_settings') || '{}');
      const classes = [theme];
      if (savedSettings.compactDensity) classes.push('compact-density');
      if (savedSettings.highContrast) classes.push('high-contrast');
      if (savedSettings.reducedMotion) classes.push('reduce-motion');
      document.documentElement.className = classes.join(' ');
    } catch(e) {
      document.documentElement.className = theme;
    }

    localStorage.setItem('theme', theme);
    document.documentElement.style.setProperty('--theme-hue', themeHue);
    document.documentElement.setAttribute('data-theme-hue', themeHue);
    localStorage.setItem('gsfc_theme_hue', themeHue);
  }, [theme, themeHue]);

  // 3. Browser Navigation, Global Shortcuts, and Event Listeners
  useEffect(() => {
    const handleHashOrPopState = () => {
      const rawHash = window.location.hash.replace(/^#/, '');
      const base = resolveBaseWorkspace(rawHash);
      if (isRoleAllowedInWorkspace(currentUserRef.current, base)) {
        setActiveRole(base);
      } else {
        setActiveRole('student');
        window.location.hash = '#student';
      }
    };
    window.addEventListener('hashchange', handleHashOrPopState);
    window.addEventListener('popstate', handleHashOrPopState);

    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-gsfc-global-search'));
      }
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (authModalOpen) setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    const handleUserUpdated = (e) => {
      if (e.detail?.user) {
        setCurrentUser(e.detail.user);
      }
    };
    window.addEventListener('gsfc-user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('hashchange', handleHashOrPopState);
      window.removeEventListener('popstate', handleHashOrPopState);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('gsfc-user-updated', handleUserUpdated);
    };
  }, [authModalOpen]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('campushire_token');
    if (!token) {
      setCurrentUser(null);
      localStorage.removeItem('campushire_user');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 204 = demo/offline token — server acknowledged it, keep the localStorage user as-is
      if (res.status === 204) {
        // User is already loaded from localStorage initial state — just ensure correct routing
        const savedUser = localStorage.getItem('campushire_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Only update routing, don't call setCurrentUser again (it's already set)
            const currentHash = window.location.hash.replace('#', '');
            if (isRoleAllowedInWorkspace(parsedUser, currentHash)) {
              const base = resolveBaseWorkspace(currentHash);
              setActiveRole(base);
              localStorage.setItem('gsfc_active_workspace', base);
            } else {
              const defaultRoleWorkspace = parsedUser.role === 'faculty' 
                ? 'faculty' 
                : (parsedUser.role === 'superadmin' ? 'superadmin' : (parsedUser.role === 'company' ? 'company' : (parsedUser.role === 'admin' ? 'admin' : 'student')));
              setActiveRole(defaultRoleWorkspace);
              localStorage.setItem('gsfc_active_workspace', defaultRoleWorkspace);
              window.history.replaceState(null, '', `#${defaultRoleWorkspace}`);
            }
          } catch(e) {}
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const freshUser = data.user;
          // Restore avatar from localStorage — stored as base64, not in DB
          try {
            const userEmail = (freshUser.email || '').toLowerCase();
            const savedAvatar = localStorage.getItem('gsfc_user_avatar_' + userEmail)
              || localStorage.getItem('gsfc_user_avatar');
            if (savedAvatar) {
              if (!freshUser.profile) freshUser.profile = {};
              freshUser.profile.avatar_url = savedAvatar;
            }
          } catch(e) {}

          setCurrentUser(freshUser);
          localStorage.setItem('campushire_user', JSON.stringify(freshUser));
          
          const currentHash = window.location.hash.replace('#', '');
          if (isRoleAllowedInWorkspace(freshUser, currentHash)) {
            const base = resolveBaseWorkspace(currentHash);
            setActiveRole(base);
            localStorage.setItem('gsfc_active_workspace', base);
          } else {
            const defaultRoleWorkspace = freshUser.role === 'faculty' 
              ? 'faculty' 
              : (freshUser.role === 'superadmin' ? 'superadmin' : (freshUser.role === 'company' ? 'company' : (freshUser.role === 'admin' ? 'admin' : 'student')));
            setActiveRole(defaultRoleWorkspace);
            localStorage.setItem('gsfc_active_workspace', defaultRoleWorkspace);
            window.history.replaceState(null, '', `#${defaultRoleWorkspace}`);
          }
          return;
        }
      }
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('campushire_token');
        localStorage.removeItem('campushire_user');
        setCurrentUser(null);
      }
    } catch (err) {
      // Network failure — user already loaded from localStorage initial state, no action needed
      console.warn('Network notice: Preserving active client session.');
    }
  };

  const handleRoleSwitch = (newRole) => {
    if (!isRoleAllowedInWorkspace(currentUser, newRole)) {
      alert(`Access Restricted: Your account (${currentUser?.role || 'Guest'}) does not have permission to access the ${newRole} workspace.`);
      return;
    }
    setActiveRole(newRole);
    window.location.hash = `#${newRole}`;
    if (newRole === 'student') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campushire_token');
    localStorage.removeItem('campushire_user');
    localStorage.removeItem('gsfc_user_avatar');
    localStorage.removeItem('gsfc_candidate_name');
    setCurrentUser(null);
    setActiveRole('student');
    window.location.hash = '#student';
    window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: '' } }));
    window.dispatchEvent(new CustomEvent('gsfc-user-updated', { detail: { user: null } }));
  };

  const handleAuthSuccess = (userData) => {
    const userEmail = (userData?.email || userData?.profile?.email || '').toLowerCase();
    
    // Restore avatar from localStorage (stored as base64, not in DB) — only non-DB field
    if (userEmail) {
      try {
        const savedAvatar = localStorage.getItem('gsfc_user_avatar_' + userEmail)
          || localStorage.getItem('gsfc_user_avatar');
        if (savedAvatar) {
          if (!userData.profile) userData.profile = {};
          userData.profile.avatar_url = savedAvatar;
          localStorage.setItem('gsfc_user_avatar', savedAvatar);
          window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: savedAvatar } }));
        }
        if (userData.name) {
          localStorage.setItem('gsfc_candidate_name', userData.name);
        }
      } catch(e) {}
    }

    setCurrentUser(userData);
    localStorage.setItem('campushire_user', JSON.stringify(userData));
    window.dispatchEvent(new CustomEvent('gsfc-user-updated', { detail: { user: userData } }));

    const defaultWorkspace = userData.role === 'faculty' 
      ? 'faculty' 
      : (userData.role === 'superadmin' ? 'superadmin' : (userData.role === 'company' ? 'company' : (userData.role === 'admin' ? 'admin' : (userData.role === 'alumni' ? 'alumni' : 'student'))));
    setActiveRole(defaultWorkspace);
    window.location.hash = `#${defaultWorkspace}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [openPostModalSignal, setOpenPostModalSignal] = useState(0);
  const [openApplicantsFeedSignal, setOpenApplicantsFeedSignal] = useState(0);

  const handleOpenJobPost = () => {
    setActiveRole('company');
    window.location.hash = '#company';
    setOpenPostModalSignal(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenApplicantsFeed = () => {
    setActiveRole('company');
    window.location.hash = '#company';
    setOpenApplicantsFeedSignal(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ToastProvider>
      <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans relative selection:bg-blue-600 selection:text-white transition-colors duration-300">
        {/* 100% Crystal Clear GSFC Background Image Layer */}
        <div className="gsfc-background-wrapper"></div>
        <div className="gsfc-overlay-layer"></div>

        {/* GSFC Navbar */}
        <Navbar
          currentUser={currentUser}
          activeRole={activeRole}
          onRoleSwitch={handleRoleSwitch}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenJobPost={handleOpenJobPost}
          onOpenApplicantsFeed={handleOpenApplicantsFeed}
        />

        {isOffline && (
          <div className="bg-amber-500 text-slate-950 font-black text-xs py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg relative z-50">
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Network connection lost. Offline mode active — portal sync will resume automatically when reconnected.</span>
          </div>
        )}

        {/* Main Role Workspaces Wrapped in Global Error Boundary */}
        <ErrorBoundary>
          <main className={`flex-1 relative transition-opacity duration-300 pb-[80vh] ${hideCardsForBGView ? 'opacity-5 pointer-events-none' : 'opacity-100'}`}>
            {activeRole === 'student' && (
              <StudentDashboard
                student={currentUser?.role === 'student' ? currentUser.profile : null}
                currentUser={currentUser}
                onUpdateStudent={(updatedProfile) => {
                  setCurrentUser(prev => prev ? { ...prev, profile: updatedProfile } : prev);
                }}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                onOpenJobPost={handleOpenJobPost}
              />
            )}

            {activeRole === 'company' && (
              <CompanyDashboard
                currentUser={currentUser}
                company={currentUser?.role === 'company' ? currentUser.profile : null}
                onCompanyAuthSuccess={handleAuthSuccess}
                onRefreshCompany={checkCurrentUser}
                openPostModalSignal={openPostModalSignal}
                openApplicantsFeedSignal={openApplicantsFeedSignal}
              />
            )}

            {activeRole === 'interview' && (
              <InterviewStudioView
                studentProfile={currentUser?.profile}
              />
            )}

            {activeRole === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                onAdminAuthSuccess={handleAuthSuccess}
              />
            )}

            {activeRole === 'alumni' && (
              <AlumniDashboard
                currentUser={currentUser}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {activeRole === 'faculty' && (
              <FacultyDashboard
                currentUser={currentUser}
              />
            )}

            {activeRole === 'superadmin' && (
              <SuperAdminDashboard
                currentUser={currentUser}
              />
            )}

            {/* Dedicated Empty Scroll Section */}
            <div className="max-w-4xl mx-auto px-4 mt-20 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-700 rounded-full text-xs font-black text-slate-900 dark:text-slate-100 shadow-xl animate-bounce">
                <ArrowDown className="w-4 h-4 text-blue-900 dark:text-blue-400" /> Scroll Down to View Full GSFC Campus Poster
              </div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-300 mt-2 drop-shadow-sm">
                Swami Vivekanand Bhavan & School of Science Campus View
              </p>
            </div>
          </main>
        </ErrorBoundary>

        {/* Floating AI Bug & Placement Assistant Chatbot + Unified Quick Actions Box */}
        <AIBugChatbotWidget 
          hideCardsForBGView={hideCardsForBGView}
          onToggleBGView={() => setHideCardsForBGView(!hideCardsForBGView)}
        />

        {/* Auth Modal with Initial Role Binding */}
        <AuthModal
          isOpen={authModalOpen}
          initialRole={activeRole}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Footer */}
        <footer className="glass-panel border-t border-slate-200/90 dark:border-slate-800 py-6 mt-12 text-center text-xs text-slate-800 dark:text-slate-300 z-10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src="/gsfc-logo-official.png" alt="GSFC University" className="h-6 w-auto inline-block" />
              <span className="font-black text-slate-900 dark:text-slate-100">GSFC University Placement Portal</span> &copy; 2026 Training & Placement Cell (TPC).
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
              <span className="text-blue-900 dark:text-blue-400 font-extrabold">GSFC University Baroda</span> • 
              <span>Smart Resume Analyzer</span> • 
              <span>NLP Candidate Match Score</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
