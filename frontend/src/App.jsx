import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import StudentDashboard from './components/student/StudentDashboard';
import CompanyDashboard from './components/company/CompanyDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import SecurityDashboard from './components/security/SecurityDashboard';
import FestCandidateDashboard from './components/events/FestCandidateDashboard';
import InterviewStudioView from './components/student/InterviewStudioView';
import AlumniDashboard from './components/alumni/AlumniDashboard';
import PublicDocumentVerifyPage from './components/public/PublicDocumentVerifyPage';
import PublicEventRegisterPage from './components/events/PublicEventRegisterPage';
import PublicPassDownloadPage from './components/events/PublicPassDownloadPage';
import LiveVideoMeetingRoom from './components/meetings/LiveVideoMeetingRoom';
import AIBugChatbotWidget from './components/common/AIBugChatbotWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { Eye, EyeOff, Sparkles, ChevronDown, ArrowDown, Sun, Moon, WifiOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';

export const resolveBaseWorkspace = (rawHash) => {
  if (!rawHash) return 'student';
  const clean = rawHash.replace(/^#/, '').toLowerCase().trim();
  if (
    clean.startsWith('verify-document') ||
    clean.startsWith('verify') ||
    clean.startsWith('blockchain') ||
    clean.startsWith('ledger')
  ) {
    return 'verify-document';
  }
  if (
    clean.startsWith('fest') ||
    clean.startsWith('event') ||
    clean.startsWith('guest') ||
    clean.startsWith('event-pass') ||
    clean === 'events' ||
    clean === 'fests'
  ) {
    return 'fest';
  }
  if (
    clean.startsWith('student') ||
    clean === 'qa' ||
    clean === 'community' ||
    clean === 'job_fairs' ||
    clean === 'applications' ||
    clean === 'drives' ||
    clean === 'profile' ||
    clean.includes('intelligence') ||
    clean.includes('leaderboard')
  ) {
    return 'student';
  }
  if (clean.startsWith('admin') || clean === 'tpc') return 'admin';
  if (clean.startsWith('faculty')) return 'faculty';
  if (clean.startsWith('security') || clean === 'guard') return 'security';
  if (clean.startsWith('company') || clean === 'recruiter') return 'company';
  if (clean.startsWith('alumni') || clean === 'mentorship') return 'alumni';
  if (clean.startsWith('interview') || clean === 'studio') return 'interview';
  if (clean.startsWith('meeting')) return 'meeting';
  if (clean.startsWith('superadmin')) return 'superadmin';
  return clean;
};

export const getDefaultWorkspaceForRole = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'superadmin') return 'superadmin';
  if (role === 'faculty') return 'faculty';
  if (role === 'security') return 'security';
  if (role === 'company') return 'company';
  if (role === 'alumni') return 'alumni';
  if (role === 'fest') return 'fest';
  return 'student'; // student, guest, or unauthenticated
};

export const isRoleAllowedInWorkspace = (user, targetWorkspace) => {
  const base = resolveBaseWorkspace(targetWorkspace);

  // Main Student Homepage, Fest Portal & Alumni Network are universally accessible to all users & guests
  if (base === 'student' || base === 'alumni' || base === 'fest' || !base) {
    return true;
  }

  // Unauthenticated guests cannot access protected workspaces
  if (!user) {
    return false;
  }

  // Super Admin & Admin have oversight access to all workspaces
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true;
  }

  // Faculty: scoped to Faculty Hub, Student Workspace, Fest Portal, and Alumni Network
  if (user.role === 'faculty') {
    return base === 'faculty' || base === 'student' || base === 'alumni' || base === 'fest';
  }

  // Security: restricted exclusively to Security Terminal Desk
  if (user.role === 'security') {
    return base === 'security';
  }

  // Fest Guest: scoped to Fest Portal, Student Workspace, and Alumni Network
  if (user.role === 'fest') {
    return base === 'fest' || base === 'student' || base === 'alumni';
  }

  // Recruiter: scoped to Recruiter Portal, Main Homepage, and Alumni Network
  if (user.role === 'company') {
    return base === 'company' || base === 'student' || base === 'alumni';
  }

  // Alumni: scoped to Alumni Network and Student Homepage
  if (user.role === 'alumni') {
    return base === 'alumni' || base === 'student';
  }

  // Student: scoped to Student Workspace, Interview Studio, and Alumni Network
  if (user.role === 'student') {
    return base === 'student' || base === 'interview' || base === 'alumni' || base === 'meeting' || base === 'fest';
  }

  // Meeting Room: accessible to all authenticated attendees
  if (base === 'meeting') {
    return !!user;
  }

  return false;
};

export const sanitizeUserRole = (user) => {
  if (!user) return null;
  return user;
};

export const getInitialActiveRole = () => {
  let user = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('campushire_user') : null;
    user = raw ? JSON.parse(raw) : null;
    user = sanitizeUserRole(user);
    if (user && raw && JSON.stringify(user) !== raw) {
      localStorage.setItem('campushire_user', JSON.stringify(user));
    }
  } catch (e) {
    user = null;
  }

  const rawHash = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, '');
  const savedRoleHint = typeof window !== 'undefined' ? localStorage.getItem('gsfc_active_workspace') : null;

  // 1. Try URL hash first, ONLY IF permitted for this user
  if (rawHash) {
    const baseFromHash = resolveBaseWorkspace(rawHash);
    if (isRoleAllowedInWorkspace(user, baseFromHash)) {
      return baseFromHash;
    }
  }

  // 2. Try saved role hint ONLY IF permitted for this user (never trust blindly)
  if (savedRoleHint) {
    const baseFromHint = resolveBaseWorkspace(savedRoleHint);
    if (isRoleAllowedInWorkspace(user, baseFromHint)) {
      return baseFromHint;
    }
  }

  // 3. Fall back to user's authorized default workspace
  return getDefaultWorkspaceForRole(user?.role);
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campushire_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeUserRole(parsed);
      if (sanitized && JSON.stringify(sanitized) !== saved) {
        localStorage.setItem('campushire_user', JSON.stringify(sanitized));
      }
      return sanitized;
    } catch (e) {
      return null;
    }
  });

  const resolvePublicRoute = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash.replace(/^#\/?/, '');
    
    if (path.startsWith('/event/')) {
      return { type: 'event', param: path.replace('/event/', '') };
    }
    if (path.startsWith('/pass/')) {
      return { type: 'pass', param: path.replace('/pass/', '') };
    }
    if (hash.startsWith('event/')) {
      return { type: 'event', param: hash.replace('event/', '') };
    }
    if (hash.startsWith('fest/') && !hash.includes('pass=')) {
      const slug = hash.replace('fest/', '');
      if (slug && slug !== 'feed') return { type: 'event', param: slug };
    }
    if (hash.startsWith('pass/')) {
      return { type: 'pass', param: hash.replace('pass/', '') };
    }
    if (hash.startsWith('event-pass/')) {
      return { type: 'pass', param: hash.replace('event-pass/', '') };
    }
    if (hash.includes('pass=')) {
      const match = hash.match(/pass=([^&]+)/);
      if (match) return { type: 'pass', param: match[1] };
    }
    return null;
  };

  const [publicRoute, setPublicRoute] = useState(resolvePublicRoute);

  const [isOffline, setIsOffline] = useState(false);
  const [activeRole, setActiveRole] = useState(() => getInitialActiveRole());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [openPostModalSignal, setOpenPostModalSignal] = useState(0);
  const [openApplicantsFeedSignal, setOpenApplicantsFeedSignal] = useState(0);
  const [hideCardsForBGView, setHideCardsForBGView] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [themeHue, setThemeHue] = useState(() => localStorage.getItem('gsfc_theme_hue') || '215');

  // Keep a ref to currentUser for event listeners and route guards without re-binding effects
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Synchronize and enforce activeRole against currentUser synchronously on mount
  useEffect(() => {
    const currentHash = window.location.hash.replace(/^#/, '');
    const baseHash = resolveBaseWorkspace(currentHash);
    
    // Check if the current hash or activeRole is permitted
    if (currentHash && isRoleAllowedInWorkspace(currentUser, baseHash)) {
      if (activeRole !== baseHash) {
        setActiveRole(baseHash);
      }
      localStorage.setItem('gsfc_active_workspace', baseHash);
    } else if (isRoleAllowedInWorkspace(currentUser, activeRole)) {
      localStorage.setItem('gsfc_active_workspace', activeRole);
      if (currentHash && !isRoleAllowedInWorkspace(currentUser, baseHash)) {
        window.history.replaceState(null, '', `#${activeRole}`);
      }
    } else {
      const defaultRole = getDefaultWorkspaceForRole(currentUser?.role);
      setActiveRole(defaultRole);
      localStorage.setItem('gsfc_active_workspace', defaultRole);
      window.history.replaceState(null, '', `#${defaultRole}`);
    }
  }, []);

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
      const route = resolvePublicRoute();
      if (route) {
        setPublicRoute(route);
        return;
      }
      setPublicRoute(null);

      const rawHash = window.location.hash.replace(/^#/, '');
      const base = resolveBaseWorkspace(rawHash);
      const user = currentUserRef.current;
      if (isRoleAllowedInWorkspace(user, base)) {
        setActiveRole(base);
        localStorage.setItem('gsfc_active_workspace', base);
      } else {
        const fallbackRole = getDefaultWorkspaceForRole(user?.role);
        setActiveRole(fallbackRole);
        localStorage.setItem('gsfc_active_workspace', fallbackRole);
        window.history.replaceState(null, '', `#${fallbackRole}`);
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
    const savedUserStr = localStorage.getItem('campushire_user');
    let localUser = null;
    try {
      localUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    } catch(e) {}

    const token = localStorage.getItem('campushire_token');

    // 1. If an authenticated user session is in localStorage, preserve them 100% and NEVER overwrite their role on refresh!
    if (localUser && localUser.role) {
      setCurrentUser(localUser);
      const currentHash = window.location.hash.replace(/^#/, '');
      const baseHash = resolveBaseWorkspace(currentHash);
      const defaultRoleWorkspace = getDefaultWorkspaceForRole(localUser.role);
      if (currentHash && currentHash !== 'student' && isRoleAllowedInWorkspace(localUser, baseHash)) {
        setActiveRole(baseHash);
        localStorage.setItem('gsfc_active_workspace', baseHash);
      } else {
        setActiveRole(defaultRoleWorkspace);
        localStorage.setItem('gsfc_active_workspace', defaultRoleWorkspace);
      }
      return;
    }

    if (!token) {
      setCurrentUser(null);
      const safeGuestRole = isRoleAllowedInWorkspace(null, activeRole) ? activeRole : 'student';
      if (activeRole !== safeGuestRole) {
        setActiveRole(safeGuestRole);
      }
      localStorage.setItem('gsfc_active_workspace', safeGuestRole);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok && res.status === 200) {
        const data = await res.json();
        if (data && data.user) {
          const freshUser = data.user;
          setCurrentUser(freshUser);
          localStorage.setItem('campushire_user', JSON.stringify(freshUser));
          const defaultRoleWorkspace = getDefaultWorkspaceForRole(freshUser.role);
          setActiveRole(defaultRoleWorkspace);
          localStorage.setItem('gsfc_active_workspace', defaultRoleWorkspace);
        }
      }
    } catch (err) {}
  };

  const handleRoleSwitch = (newRole) => {
    const base = resolveBaseWorkspace(newRole);
    if (!isRoleAllowedInWorkspace(currentUser, base)) {
      alert(`Access Restricted: Your account (${currentUser?.role || 'Guest'}) does not have permission to access the ${newRole} workspace.`);
      return;
    }
    setActiveRole(base);
    localStorage.setItem('gsfc_active_workspace', base);
    window.location.hash = `#${base}`;
    if (base === 'student') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campushire_token');
    localStorage.removeItem('campushire_user');
    localStorage.removeItem('gsfc_active_workspace');
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
    
    // Restore avatar strictly for this user account (stored as base64, not in DB)
    if (userEmail) {
      try {
        const savedAvatar = localStorage.getItem('gsfc_user_avatar_' + userEmail) || userData?.profile?.photo_url || '';
        if (savedAvatar) {
          if (!userData.profile) userData.profile = {};
          userData.profile.avatar_url = savedAvatar;
          window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: savedAvatar, email: userEmail } }));
        } else {
          window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: '', email: userEmail } }));
        }
        if (userData.name) {
          localStorage.setItem('gsfc_candidate_name', userData.name);
        }
      } catch(e) {}
    }

    setCurrentUser(userData);
    localStorage.setItem('campushire_user', JSON.stringify(userData));
    window.dispatchEvent(new CustomEvent('gsfc-user-updated', { detail: { user: userData } }));

    const defaultWorkspace = getDefaultWorkspaceForRole(userData?.role);
    setActiveRole(defaultWorkspace);
    localStorage.setItem('gsfc_active_workspace', defaultWorkspace);
    window.location.hash = `#${defaultWorkspace}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenJobPost = () => {
    if (isRoleAllowedInWorkspace(currentUser, 'company')) {
      setActiveRole('company');
      localStorage.setItem('gsfc_active_workspace', 'company');
      window.location.hash = '#company';
    }
    setOpenPostModalSignal(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenApplicantsFeed = () => {
    if (isRoleAllowedInWorkspace(currentUser, 'company')) {
      setActiveRole('company');
      localStorage.setItem('gsfc_active_workspace', 'company');
      window.location.hash = '#company';
    }
    setOpenApplicantsFeedSignal(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🌐 Direct Standalone Public Event Registration & Pass View Routes
  if (publicRoute?.type === 'event') {
    return (
      <PublicEventRegisterPage
        eventSlug={publicRoute.param}
        onBackToHome={() => {
          window.history.pushState({}, '', '/');
          setPublicRoute(null);
        }}
      />
    );
  }

  if (publicRoute?.type === 'pass') {
    return (
      <PublicPassDownloadPage
        passToken={publicRoute.param}
        onBackToRegister={() => {
          window.history.pushState({}, '', '/');
          setPublicRoute(null);
        }}
      />
    );
  }

  // 🛡️ Dedicated Security Officer Terminal View
  if (currentUser?.role === 'security' || activeRole === 'security') {
    return (
      <SecurityDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // 📹 Full-Screen In-Portal Live Video Meeting Room (with Anti-Cheating Lock)
  const currentHashString = typeof window !== 'undefined' ? window.location.hash : '';
  if (currentHashString.startsWith('#meeting/') || activeRole === 'meeting') {
    const targetRoomId = currentHashString.startsWith('#meeting/')
      ? currentHashString.replace('#meeting/', '')
      : 'GSFC-MEET-GOOG-2026';

    return (
      <LiveVideoMeetingRoom
        roomId={targetRoomId}
        currentUser={currentUser}
        onLeaveRoom={() => {
          const fallback = getDefaultWorkspaceForRole(currentUser?.role);
          setActiveRole(fallback);
          localStorage.setItem('gsfc_active_workspace', fallback);
          window.location.hash = `#${fallback}`;
        }}
      />
    );
  }

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

            {activeRole === 'fest' && (
              <FestCandidateDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchWorkspace={handleRoleSwitch}
              />
            )}

            {/* ⛓️ PUBLIC BLOCKCHAIN-ANCHORED DOCUMENT VERIFICATION PAGE */}
            {activeRole === 'verify-document' && (
              <PublicDocumentVerifyPage
                onNavigateBack={() => handleRoleSwitch('student')}
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

export default function RootApp() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  );
}


