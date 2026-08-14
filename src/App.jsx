import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import StudentDashboard from './components/student/StudentDashboard';
import CompanyDashboard from './components/company/CompanyDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { Eye, EyeOff, Sparkles, ChevronDown, ArrowDown } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['student', 'company', 'admin'].includes(hash) ? hash : 'student';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hideCardsForBGView, setHideCardsForBGView] = useState(false);

  useEffect(() => {
    checkCurrentUser();

    // Listen for browser Back/Forward navigation (popstate & hashchange)
    const handleHashOrPopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (['student', 'company', 'admin'].includes(hash)) {
        setActiveRole(hash);
      } else if (!hash) {
        setActiveRole('student');
      }
    };

    window.addEventListener('popstate', handleHashOrPopState);
    window.addEventListener('hashchange', handleHashOrPopState);

    return () => {
      window.removeEventListener('popstate', handleHashOrPopState);
      window.removeEventListener('hashchange', handleHashOrPopState);
    };
  }, []);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('campushire_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        if (!window.location.hash) {
          setActiveRole(data.user.role);
          window.history.replaceState(null, '', `#${data.user.role}`);
        }
      } else {
        localStorage.removeItem('campushire_token');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleRoleSwitch = (newRole) => {
    setActiveRole(newRole);
    window.location.hash = `#${newRole}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('campushire_token');
    setCurrentUser(null);
    setActiveRole('student');
    window.location.hash = '#student';
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setActiveRole(userData.role);
    window.location.hash = `#${userData.role}`;
    checkCurrentUser();
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans relative selection:bg-blue-600 selection:text-white">
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
      />

      {/* Floating Poster View Controls */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setHideCardsForBGView(!hideCardsForBGView)}
          className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-950 text-white rounded-2xl text-xs font-black shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-2 transition-all hover:scale-105"
          title="Toggle Full Poster View"
        >
          {hideCardsForBGView ? (
            <>
              <Eye className="w-4 h-4 text-emerald-400" /> Restore UI Workspace
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-amber-400" /> View Clear Poster BG
            </>
          )}
        </button>
      </div>

      {/* Main Role Workspaces */}
      <main className={`flex-1 z-10 transition-opacity duration-300 pb-[80vh] ${hideCardsForBGView ? 'opacity-5 pointer-events-none' : 'opacity-100'}`}>
        {activeRole === 'student' && (
          <StudentDashboard
            student={currentUser?.role === 'student' ? currentUser.profile : null}
            onUpdateStudent={(updatedProfile) => {
              setCurrentUser(prev => prev ? { ...prev, profile: updatedProfile } : prev);
            }}
          />
        )}

        {activeRole === 'company' && (
          <CompanyDashboard
            company={currentUser?.role === 'company' ? currentUser.profile : {
              id: 'c_google',
              company_name: 'Google Cloud India (Demo)',
              logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
              industry: 'Cloud & AI',
              website: 'https://cloud.google.com',
              approved: 1
            }}
            onRefreshCompany={checkCurrentUser}
          />
        )}

        {activeRole === 'admin' && (
          <AdminDashboard />
        )}

        {/* Dedicated Empty Scroll Section to View Entire Campus Background Poster */}
        <div className="max-w-4xl mx-auto px-4 mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-xl border border-white/90 rounded-full text-xs font-black text-slate-900 shadow-xl animate-bounce">
            <ArrowDown className="w-4 h-4 text-blue-900" /> Scroll Down to View Full GSFC Campus Poster
          </div>
          <p className="text-xs font-extrabold text-slate-800 mt-2 drop-shadow-sm">
            Swami Vivekanand Bhavan & School of Science Campus View
          </p>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-200/90 py-6 mt-12 text-center text-xs text-slate-800 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/gsfc-logo-official.png" alt="GSFC University" className="h-6 w-auto inline-block" />
            <span className="font-black text-slate-900">GSFC University Placement Portal</span> &copy; 2026 Training & Placement Cell (TPC).
          </div>
          <div className="flex items-center gap-3 text-slate-700 font-bold">
            <span className="text-blue-900 font-extrabold">GSFC University Baroda</span> • 
            <span>Smart Resume Analyzer</span> • 
            <span>NLP Candidate Match Score</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
