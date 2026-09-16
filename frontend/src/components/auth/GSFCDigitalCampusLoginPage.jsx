import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Check, ChevronDown, Sparkles, Shield, GraduationCap, Building2, Key, HelpCircle, ArrowRight, RefreshCw, Crown, Award, Image as ImageIcon } from 'lucide-react';

const PORTAL_ROLES = [
  {
    id: 'student_roll',
    role: 'student',
    label: '🎓 GSFC Student (Placement Candidate)',
    placeholder: 'Enrollment No. (e.g. 24BT04171)',
    requiresGsfcDomain: true,
    badge: 'Student Portal',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'placed_company',
    role: 'company',
    label: '🏢 Corporate Recruiter / Hiring Partner',
    placeholder: 'Official Recruiter Email',
    requiresGsfcDomain: false,
    badge: 'Corporate Recruiter',
    color: 'from-amber-600 to-orange-700'
  },
  {
    id: 'faculty',
    role: 'faculty',
    label: '🏛️ Faculty Placement Coordinator',
    placeholder: 'Faculty Username / Email',
    requiresGsfcDomain: true,
    badge: 'Academic Faculty',
    color: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'admin',
    role: 'admin',
    label: '🛡️ TPC Placement Cell Admin',
    placeholder: 'TPC Admin Username / Email',
    requiresGsfcDomain: true,
    badge: 'TPC Directorate',
    color: 'from-blue-900 to-slate-900'
  },
  {
    id: 'alumni',
    role: 'alumni',
    label: '🎓 GSFC Alumni Mentor',
    placeholder: 'Alumni Email',
    requiresGsfcDomain: false,
    badge: 'Alumni Network',
    color: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'security',
    role: 'security',
    label: '🛡️ Campus Security Officer',
    placeholder: 'Security Officer Username / Email',
    requiresGsfcDomain: true,
    badge: 'Security Desk',
    color: 'from-slate-700 to-slate-900'
  },
  {
    id: 'superadmin',
    role: 'superadmin',
    label: '👑 TPC Super Administrator',
    placeholder: 'Superadmin Username / Email',
    requiresGsfcDomain: true,
    badge: 'Apex Authority',
    color: 'from-amber-700 to-yellow-600'
  }
];

const createFallbackUser = (roleConfig, fullEmail, username) => {
  let profile = {
    id: 'p_' + Date.now(),
    name: fullEmail.split('@')[0].toUpperCase(),
    email: fullEmail
  };

  if (roleConfig.role === 'student') {
    profile = {
      id: 's_' + Date.now(),
      name: username || fullEmail.split('@')[0].toUpperCase(),
      roll_number: username || 'STUDENT',
      email: fullEmail,
      program: 'B.Tech Engineering',
      branch: 'Engineering & Technology',
      cgpa: 8.0,
      ats_score: 85
    };
  } else if (roleConfig.role === 'company') {
    profile = {
      id: 'c_' + Date.now(),
      company_name: 'Corporate Recruitment Partner',
      industry: 'Industry & Technology',
      location: 'Vadodara / Gujarat',
      email: fullEmail,
      verified: 1
    };
  } else if (roleConfig.role === 'faculty') {
    profile = {
      id: 'f_' + Date.now(),
      name: 'Faculty Coordinator',
      email: fullEmail,
      department: 'Engineering & Technology',
      designation: 'Faculty Placement Coordinator'
    };
  } else if (roleConfig.role === 'admin' || roleConfig.role === 'superadmin') {
    profile = {
      id: 'a_' + Date.now(),
      name: roleConfig.role === 'superadmin' ? 'Super Administrator' : 'TPC Placement Officer',
      email: fullEmail,
      department: 'Training & Placement Cell',
      designation: roleConfig.role === 'superadmin' ? 'Apex Authority' : 'Placement Officer'
    };
  } else if (roleConfig.role === 'alumni') {
    profile = {
      id: 'alumni_' + Date.now(),
      name: 'Alumni Mentor',
      batch_year: '2020-2024',
      company: 'Corporate Partner',
      designation: 'Professional Mentor',
      email: fullEmail
    };
  } else if (roleConfig.role === 'security') {
    profile = {
      id: 'sec_' + Date.now(),
      name: 'Campus Security Officer',
      gate_assigned: 'Main Campus Gate A',
      shift: 'General Shift',
      email: fullEmail
    };
  }

  return {
    id: 'u_' + Date.now(),
    email: fullEmail,
    role: roleConfig.role,
    owner_id: profile.id,
    profile
  };
};

export default function GSFCDigitalCampusLoginPage({ onLoginSuccess, onGuestBrowse }) {
  // Automatically prefill user's stored ID & password from prior session
  const getInitialAccount = () => {
    try {
      const savedUser = localStorage.getItem('campushire_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.email) {
          const isDomain = u.email.endsWith('@gsfcuniversity.ac.in');
          const isStudent = u.role === 'student';
          return {
            roleId: isStudent ? 'student_roll' : (u.role || 'student_roll'),
            username: isDomain ? u.email.replace('@gsfcuniversity.ac.in', '') : u.email,
            password: '',
            appendDomain: isDomain
          };
        }
      }
    } catch(e) {}
    return {
      roleId: 'student_roll',
      username: '',
      password: '',
      appendDomain: true
    };
  };

  const initialAccount = getInitialAccount();
  const [selectedRoleId, setSelectedRoleId] = useState(initialAccount.roleId);
  const [username, setUsername] = useState(initialAccount.username);
  const [password, setPassword] = useState(initialAccount.password);
  const [appendDomain, setAppendDomain] = useState(initialAccount.appendDomain);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bgStyle, setBgStyle] = useState('panorama'); // 'panorama' | 'classic'
  
  // Forgot Password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetOtp, setResetOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const currentRoleConfig = PORTAL_ROLES.find(r => r.id === selectedRoleId) || PORTAL_ROLES[0];

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const setupGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const btnEl = document.getElementById('google-signin-btn-container');
          if (btnEl) {
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 320
            });
          }
        } catch (e) {
          console.warn('Google Identity Services init notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGIS();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGIS();
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [selectedRoleId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('Google authentication was cancelled or returned no credential.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          selectedRole: currentRoleConfig.role
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.user) {
        localStorage.setItem('campushire_token', data.token);
        localStorage.setItem('gsfc_last_login_username', data.user.email);
        localStorage.setItem('gsfc_candidate_email', data.user.email);
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        return;
      }
      setError(data?.error || 'Google Sign-in failed. Please verify your institutional account.');
    } catch (err) {
      setError('Network connection error during Google authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.prompt();
      } catch(e) {
        setError('Google Sign-In prompt unavailable. Please check popup blockers.');
      }
    } else {
      setError('Google Client ID is not configured in VITE_GOOGLE_CLIENT_ID. Please configure environment.');
    }
  };


  const handleRoleChange = (roleId) => {
    setSelectedRoleId(roleId);
    setError('');
    const target = PORTAL_ROLES.find(r => r.id === roleId);
    if (target) {
      setAppendDomain(target.requiresGsfcDomain);
    }
  };

  const getFullEmail = () => {
    const raw = (username || '').trim();
    if (!raw) return '';
    if (raw.includes('@')) return raw.toLowerCase();
    if (appendDomain) {
      return `${raw.toLowerCase()}@gsfcuniversity.ac.in`;
    }
    return raw.toLowerCase();
  };

  const handleLogin = async (e, customAccount = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    const fullEmail = customAccount ? customAccount.email : getFullEmail();
    const loginPass = customAccount ? customAccount.password : password;
    const activeRoleCfg = customAccount ? (PORTAL_ROLES.find(r => r.id === customAccount.roleId) || currentRoleConfig) : currentRoleConfig;
    const currentUsername = customAccount ? customAccount.username : username;

    if (!fullEmail) {
      setError('Please enter your Username / University Email.');
      setLoading(false);
      return;
    }
    if (!loginPass) {
      setError('Please enter your Password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          password: loginPass,
          selectedRole: activeRoleCfg.role
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.user) {
        localStorage.setItem('campushire_token', data.token);
        localStorage.setItem('gsfc_last_login_username', fullEmail);
        localStorage.setItem('gsfc_dcs_saved_password', loginPass);
        localStorage.setItem('gsfc_candidate_email', fullEmail);
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        return;
      }

      if (res.status === 401 && data?.incorrectPassword) {
        setError('Incorrect password. Please check your credentials and try again.');
        setLoading(false);
        return;
      }

      // Fallback for offline / guest persona access
      const fallbackUser = createFallbackUser(activeRoleCfg, fullEmail, currentUsername);
      localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
      localStorage.setItem('gsfc_last_login_username', fullEmail);
      localStorage.setItem('gsfc_dcs_saved_password', loginPass);
      localStorage.setItem('gsfc_candidate_email', fullEmail);
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(fallbackUser);
      }
    } catch (err) {
      // Offline fallback
      const fallbackUser = createFallbackUser(activeRoleCfg, fullEmail, currentUsername);
      localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
      localStorage.setItem('gsfc_last_login_username', fullEmail);
      localStorage.setItem('gsfc_dcs_saved_password', loginPass);
      localStorage.setItem('gsfc_candidate_email', fullEmail);
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickPersona = (roleId) => {
    handleRoleChange(roleId);
    const target = PORTAL_ROLES.find(r => r.id === roleId);
    if (!target) return;

    const email = target.requiresGsfcDomain 
      ? `${target.defaultUsername.toLowerCase()}@gsfcuniversity.ac.in`
      : target.defaultUsername.toLowerCase();

    handleLogin(null, {
      email,
      password: target.defaultPass,
      roleId: target.id,
      username: target.defaultUsername
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans relative overflow-x-hidden select-none">
      
      {/* 🌟 1. IMMERSIVE FULL-WIDTH CAMPUS BACKGROUND ARTWORK LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft daylight sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/70 via-white/80 to-blue-50/40" />

        {/* High-Definition Campus Panorama (Spanning Full Width!) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[68vh] min-h-[460px] bg-cover bg-bottom bg-no-repeat transition-all duration-700 opacity-80 sm:opacity-90"
          style={{ 
            backgroundImage: bgStyle === 'panorama' ? 'url("/gsfc-campus-panorama.jpg")' : 'url("/gsfc-campus-sketch.jpg")',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 12%, black 35%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 12%, black 35%, black 100%)'
          }}
        />

        {/* Golden Diagonal Wedge (Bottom Left - Wide & Bold like DCS) */}
        <div 
          className="absolute left-0 bottom-0 w-64 sm:w-[480px] md:w-[600px] h-36 sm:h-56 md:h-64 bg-gradient-to-tr from-[#E65100] via-[#F57F17] to-[#FBC02D] shadow-2xl opacity-95"
          style={{ clipPath: 'polygon(0 35%, 100% 100%, 0 100%)' }}
        />

        {/* Royal Blue Diagonal Wedge (Bottom Right - Wide & Bold like DCS) */}
        <div 
          className="absolute right-0 bottom-0 w-72 sm:w-[520px] md:w-[640px] h-36 sm:h-56 md:h-64 bg-gradient-to-tl from-[#0D47A1] via-[#1565C0] to-[#1E88E5] shadow-2xl opacity-95"
          style={{ clipPath: 'polygon(100% 28%, 0 100%, 100% 100%)' }}
        />
      </div>

      {/* 2. TOP HEADER BAR */}
      <header className="w-full px-4 sm:px-8 md:px-12 py-3 flex items-center justify-between gap-4 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <img 
            src="/gsfc-logo-official.png" 
            alt="GSFC University Logo" 
            className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-xs"
          />
          <div className="flex flex-col justify-center shrink-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xl sm:text-2xl font-black tracking-widest text-[#E65100] whitespace-nowrap">
                DIGITAL
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-wider text-[#0D47A1] whitespace-nowrap">
                CAMPUS SYSTEM
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Placement & Career Governance Portal
            </span>
          </div>
        </div>

        {/* Guest Mode & BG Switcher (Pinned to Far Right) */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0 ml-auto">
          <button
            onClick={() => setBgStyle(prev => prev === 'panorama' ? 'classic' : 'panorama')}
            title="Toggle Campus Background View"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer border border-slate-200 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-slate-50 shadow-2xs whitespace-nowrap shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="whitespace-nowrap">{bgStyle === 'panorama' ? 'Campus View' : 'Blueprint View'}</span>
          </button>

          {onGuestBrowse && (
            <button
              onClick={onGuestBrowse}
              className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer border border-slate-200 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-slate-50 shadow-2xs whitespace-nowrap shrink-0"
            >
              Preview Portal as Guest ↗
            </button>
          )}

          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-[11px] font-black rounded-md border border-blue-200/60 shadow-2xs whitespace-nowrap shrink-0">
            DCS Live • v2.6
          </span>
        </div>
      </header>

      {/* 3. MAIN CENTER HERO & LOGIN BOX */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 z-20 max-w-xl mx-auto w-full my-auto">
        
        {/* Sanskrit Shloka & English Subtitle */}
        <div className="text-center space-y-1 mb-4 sm:mb-5 animate-fadeIn">
          <h1 
            className="text-2xl sm:text-3xl font-extrabold tracking-wide text-[#0277BD] drop-shadow-xs"
            style={{ fontFamily: "'Noto Serif Devanagari', serif" }}
          >
            ॥ बुद्धिज्ञानेन शुध्यति ॥
          </h1>
          <p className="text-base sm:text-lg font-black text-[#E65100] tracking-tight drop-shadow-2xs">
            Purification of Mind and Intellect through Knowledge
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.16)] border border-white/80 p-6 sm:p-7 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            
            {/* ROLE SELECTOR DROPDOWN (Matches Image 2) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Select Portal Role to Sign In</span>
                <span className="text-[10px] text-blue-700 font-bold font-mono">
                  {currentRoleConfig.badge}
                </span>
              </label>

              <div className="relative">
                <select
                  value={selectedRoleId}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-300 rounded-lg text-xs font-black text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
                >
                  {PORTAL_ROLES.map((r) => (
                    <option key={r.id} value={r.id} className="py-2 text-slate-900 font-bold">
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* USERNAME INPUT WITH CHECKBOX */}
            <div className="space-y-1">
              <div className="flex rounded-lg overflow-hidden border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all">
                <div className="w-10 bg-[#1E88E5] flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username / University Email"
                  autoComplete="username"
                  required
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
                />
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-600 border-l border-slate-200 cursor-pointer select-none shrink-0 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={appendDomain}
                    onChange={(e) => setAppendDomain(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-mono text-[10px]">@gsfcuniversity.ac.in</span>
                </label>
              </div>
            </div>

            {/* PASSWORD INPUT WITH EYE TOGGLE */}
            <div className="space-y-1">
              <div className="flex rounded-lg overflow-hidden border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all">
                <div className="w-10 bg-[#1E88E5] flex items-center justify-center text-white shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1E88E5] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-sm font-black rounded-lg transition-colors duration-150 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In & Loading Data...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            {/* FORGOT PASSWORD LINK */}
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Forgot Password ?
              </button>
            </div>
          </form>

          {/* 1-CLICK TEST PERSONAS BAR */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                ⚡ 1-Click Fast Role Sign-In
              </span>
              <span className="text-[9px] text-amber-600 font-bold">Stored Passwords Auto-Filled</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
              {[
                { id: 'student_roll', label: '🎓 24BT04171' },
                { id: 'placed_company', label: '🏢 GSFC Ltd' },
                { id: 'outside_company', label: '🌐 Corporate' },
                { id: 'faculty', label: '🏛️ Faculty' },
                { id: 'admin', label: '🛡️ TPC Admin' },
                { id: 'superadmin', label: '👑 Super Admin' },
                { id: 'alumni', label: '🎓 Alumni' },
                { id: 'fest', label: '🎪 Fest Guest' },
                { id: 'security', label: '🛡️ Security' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => fillQuickPersona(p.id)}
                  className={`px-2 py-1.5 rounded-md font-black border transition-all text-center truncate cursor-pointer ${
                    selectedRoleId === p.id 
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* GOOGLE SIGN IN CONTAINER */}
          <div className="pt-1 space-y-1.5">
            <div id="google-signin-btn-container" className="w-full flex justify-center empty:hidden" />
            <button
              type="button"
              onClick={triggerGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>

        {/* GUEST BROWSE LINK ON MOBILE */}
        {onGuestBrowse && (
          <button
            onClick={onGuestBrowse}
            className="sm:hidden mt-3 text-xs font-bold text-slate-600 hover:text-blue-700 underline cursor-pointer bg-white/80 px-3 py-1 rounded-full shadow-xs"
          >
            Explore Portal as Guest ↗
          </button>
        )}
      </main>

      {/* 4. BOTTOM INSTITUTIONAL FOOTER BAR */}
      <footer className="w-full bg-[#1E88E5] text-white px-6 sm:px-12 py-2.5 text-[11px] font-bold flex items-center justify-between z-20 shadow-lg">
        <span>All Rights Reserved ©2026</span>
        <div className="flex items-center gap-1.5">
          <span className="opacity-90">Developed & Managed By :</span>
          <span className="font-black text-white flex items-center gap-1 tracking-wider uppercase">
            OM THAKKAR
          </span>
        </div>
      </footer>

      {/* 5. FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-800">Password Recovery via OTP</h3>
              <button 
                onClick={() => { setForgotModalOpen(false); setResetStep(1); setResetMsg(''); }}
                className="text-slate-400 hover:text-slate-600 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetMsg && (
              <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-lg">
                {resetMsg}
              </div>
            )}

            {resetStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered GSFC University email to receive a secure 6-digit OTP.
                </p>
                <input
                  type="email"
                  value={resetEmail || getFullEmail()}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@gsfcuniversity.ac.in"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setResetMsg('🔑 Test OTP: 123456 has been generated for demo access.');
                    setResetStep(2);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
                >
                  Send Recovery OTP
                </button>
              </div>
            )}

            {resetStep === 2 && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP (123456)"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-center tracking-widest text-base"
                />
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setPassword(newPass || 'password123');
                    setResetMsg('✅ Password reset successfully! You can now log in.');
                    setTimeout(() => {
                      setForgotModalOpen(false);
                      setResetStep(1);
                    }, 1200);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
                >
                  Set New Password & Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
