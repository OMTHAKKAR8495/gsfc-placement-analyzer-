import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import StudentDashboard from './components/student/StudentDashboard';
import CompanyDashboard from './components/company/CompanyDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import InterviewStudioView from './components/student/InterviewStudioView';
import AIBugChatbotWidget from './components/common/AIBugChatbotWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { Eye, EyeOff, Sparkles, ChevronDown, ArrowDown, Sun, Moon, WifiOff } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';

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
    const hash = window.location.hash.replace('#', '');
    return ['student', 'interview', 'company', 'admin'].includes(hash) ? hash : 'student';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hideCardsForBGView, setHideCardsForBGView] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [themeHue, setThemeHue] = useState(() => localStorage.getItem('gsfc_theme_hue') || '215');

  useEffect(() => {
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
    // Main Student Homepage is universally accessible to all users & guests
    if (targetWorkspace === 'student' || !targetWorkspace) {
      return true;
    }
    if (!user) {
      // Guest: can only access Student Workspace
      return false;
    }
    if (user.role === 'admin') {
      // Admin: has oversight access to all workspaces
      return true;
    }
    if (user.role === 'company') {
      // Recruiter: can access Recruiter Portal and Main Homepage
      return targetWorkspace === 'company' || targetWorkspace === 'student';
    }
    if (user.role === 'student') {
      // Student: scoped ONLY to Student Workspace and Interview Studio
      return targetWorkspace === 'student' || targetWorkspace === 'interview';
    }
    return true;
  };

  useEffect(() => {
    checkCurrentUser();

    // Set light / dark mode class and dynamic theme hue on document element
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.style.setProperty('--theme-hue', themeHue);
    document.documentElement.setAttribute('data-theme-hue', themeHue);
    localStorage.setItem('gsfc_theme_hue', themeHue);

    // Listen for browser Back/Forward navigation with Strict Role-Scoped Route Guards
    const handleHashOrPopState = () => {
      const hash = window.location.hash.replace('#', '');
      const targetWorkspace = ['student', 'interview', 'company', 'admin'].includes(hash) ? hash : 'student';

      if (!isRoleAllowedInWorkspace(currentUser, targetWorkspace)) {
        const defaultRole = currentUser ? (currentUser.role === 'company' ? 'company' : currentUser.role) : 'student';
        setActiveRole(defaultRole);
        window.history.replaceState(null, '', `#${defaultRole}`);
        return;
      }

      setActiveRole(targetWorkspace);
    };

    window.addEventListener('popstate', handleHashOrPopState);
    window.addEventListener('hashchange', handleHashOrPopState);

    return () => {
      window.removeEventListener('popstate', handleHashOrPopState);
      window.removeEventListener('hashchange', handleHashOrPopState);
    };
  }, [theme, themeHue, currentUser]);

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
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('campushire_user', JSON.stringify(data.user));
          
          // Route user to their default role workspace on initial load
          const currentHash = window.location.hash.replace('#', '');
          if (!isRoleAllowedInWorkspace(data.user, currentHash)) {
            const defaultRoleWorkspace = data.user.role === 'company' ? 'company' : (data.user.role === 'admin' ? 'admin' : 'student');
            setActiveRole(defaultRoleWorkspace);
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
    setCurrentUser(null);
    setActiveRole('student');
    window.location.hash = '#student';
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('campushire_user', JSON.stringify(userData));
    const defaultWorkspace = userData.role === 'company' ? 'company' : (userData.role === 'admin' ? 'admin' : 'student');
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

        {/* Floating Controls Bar (Poster View Toggle & Light/Dark Theme) */}
        <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-2">
          <button
            onClick={() => setHideCardsForBGView(!hideCardsForBGView)}
            className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-950 text-white rounded-2xl text-xs font-black shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-2 transition-all hover:scale-105"
            title="Toggle Full Poster View"
          >
            {hideCardsForBGView ? (
              <>
                <Eye className="w-4 h-4 text-emerald-400" /> Restore Workspace UI
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-amber-400" /> View Clear Poster BG
              </>
            )}
          </button>
        </div>

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

        {/* Floating AI Bug & Placement Assistant Chatbot */}
        <AIBugChatbotWidget />

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
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
