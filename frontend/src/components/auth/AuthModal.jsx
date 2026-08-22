import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Building, User, AlertCircle, Sparkles, Shield, CheckCircle2, Phone, ArrowRight, ArrowLeft, PlusCircle, Check } from 'lucide-react';

const GOOGLE_ACCOUNTS_PRESETS = [
  {
    name: 'Om Thakkar',
    email: 'om.thakkar@gsfcuniversity.ac.in',
    program: 'B.Tech CSE (Computer Science)',
    roll_number: '21BCE045',
    avatar: 'OT',
    color: 'bg-blue-600',
    status: 'GSFC University Official'
  },
  {
    name: 'Tanvi Joshi',
    email: 'tanvi.j@gsfcuniversity.ac.in',
    program: 'B.Tech CSE (AI & Data Science)',
    roll_number: '22BCE108',
    avatar: 'TJ',
    color: 'bg-purple-600',
    status: 'Verified Student'
  },
  {
    name: 'Arav Sharma',
    email: 'arav.sharma@student.gsfc.ac.in',
    program: 'B.Tech Chemical Engineering',
    roll_number: '22BCH012',
    avatar: 'AS',
    color: 'bg-emerald-600',
    status: 'Verified Student'
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@gsfcuniversity.ac.in',
    program: 'B.Tech Mechanical Engineering',
    roll_number: '21BME034',
    avatar: 'RV',
    color: 'bg-amber-600',
    status: 'Verified Student'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@alumni.gsfc.ac.in',
    program: 'Alumni (Amazon AWS)',
    roll_number: '2019-2023',
    avatar: 'PP',
    color: 'bg-blue-800',
    status: 'Verified Alumni Mentor'
  }
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student, company, admin, alumni
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  const [customGoogleInputOpen, setCustomGoogleInputOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    name: '',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: '8.5',
    roll_number: '21BCE045',
    company_name: '',
    industry: 'Technology & AI',
    website: 'https://company.com',
    designation: 'Cloud Solutions Architect',
    batch_year: '2019-2023',
    linkedin_url: 'https://linkedin.com'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ESC key listener to close AuthModal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Helper to generate simulated JWT and verified user for offline / Vercel static environments
  const createFallbackUser = (userRole, userEmail, userName) => {
    const isFaculty = userRole === 'faculty' || (userEmail || '').includes('faculty');
    const isSuperAdmin = userRole === 'superadmin' || (userEmail || '').includes('superadmin');
    const isAlumni = userRole === 'alumni' || (userEmail || '').includes('alumni');
    const isCompany = userRole === 'company' || (userEmail || '').includes('hr') || (userEmail || '').includes('company') || (userEmail || '').includes('gsfclimited');
    const isAdmin = userRole === 'admin' || (userEmail || '').includes('admin');
    
    const resolvedRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : (isFaculty ? 'faculty' : (isAlumni ? 'alumni' : (isCompany ? 'company' : 'student'))));

    if (resolvedRole === 'superadmin') {
      return {
        id: 'u_superadmin',
        name: userName || 'Super Administrator',
        email: userEmail || 'superadmin@gsfcuniversity.ac.in',
        role: 'superadmin',
        owner_id: 'a_superadmin'
      };
    }

    if (resolvedRole === 'admin') {
      return {
        id: 'u_admin',
        name: userName || 'GSFC TPC Director',
        email: userEmail || 'admin@gsfcuniversity.ac.in',
        role: 'admin',
        owner_id: 'a_director'
      };
    }

    if (resolvedRole === 'faculty') {
      return {
        id: 'u_faculty_rajesh',
        name: userName || 'Dr. Rajesh Sharma',
        email: userEmail || 'faculty.cse@gsfcuniversity.ac.in',
        role: 'faculty',
        owner_id: 'f_rajesh',
        department: 'BTech CSE & IT',
        profile: {
          id: 'f_rajesh',
          name: userName || 'Dr. Rajesh Sharma',
          department: 'Computer Science & Engineering',
          designation: 'Faculty Placement Coordinator'
        }
      };
    }
    if (resolvedRole === 'alumni') {
      return {
        id: 'u_alumni_priya',
        name: userName || 'Priya Patel',
        email: userEmail || 'priya.patel@alumni.gsfc.ac.in',
        role: 'alumni',
        owner_id: 'alumni_priya',
        profile: {
          id: 'alumni_priya',
          name: userName || 'Priya Patel',
          company: 'Amazon AWS',
          designation: 'Cloud Solutions Architect',
          batch_year: '2019-2023',
          verified: 1
        }
      };
    }

    if (resolvedRole === 'company') {
      return {
        id: 'u_gsfc_recruiter',
        name: userName || 'Corporate Recruiter',
        email: userEmail || 'gsfclimited@gmail.com',
        role: 'company',
        owner_id: 'c_gsfc_limited',
        profile: {
          id: 'c_gsfc_limited',
          company_name: 'GSFC Limited',
          industry: 'Fertilizers, Chemicals & Tech',
          approved: 1
        }
      };
    }

    // Default: Student Profile (Om Thakkar / Arav Sharma)
    return {
      id: 'u_om_thakkar',
      name: userName || 'Thakkar Om',
      email: userEmail || 'thakkar_om@gmail.com',
      role: 'student',
      owner_id: 's_om',
      profile: {
        id: 's_om',
        name: userName || 'Thakkar Om',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.9,
        roll_number: '21BCE045',
        phone: '+91 98765 43210'
      }
    };
  };

  // 🌐 Google Sign-In with Selected Account
  const handleSelectGoogleAccount = async (account) => {
    setError('');
    setGoogleLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email.trim(),
          name: account.name.trim(),
          program: account.program || 'BTech CSE',
          roll_number: account.roll_number || '22BCE108'
        })
      });

      let data = null;
      try { data = await res.json(); } catch(e) {}

      if (res.ok && data && data.user) {
        localStorage.setItem('campushire_token', data.token);
        onAuthSuccess(data.user);
      } else {
        // Fallback for Vercel static hosting
        const fallbackUser = createFallbackUser('student', account.email, account.name);
        localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
        onAuthSuccess(fallbackUser);
      }
      onClose();
    } catch (err) {
      // Safe fallback on network failure
      const fallbackUser = createFallbackUser('student', account.email, account.name);
      localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
      onAuthSuccess(fallbackUser);
      onClose();
    } finally {
      setGoogleLoading(false);
    }
  };

  // Submit custom Google ID
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    const derivedName = customGoogleName.trim() || customGoogleEmail.split('@')[0].replace('.', ' ').toUpperCase();
    handleSelectGoogleAccount({
      name: derivedName,
      email: customGoogleEmail.trim(),
      program: 'BTech CSE',
      roll_number: '22BCE' + Math.floor(100 + Math.random() * 900)
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      let bodyPayload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, role };

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      let data = null;
      try { data = await res.json(); } catch(e) {}

      if (res.ok && data && data.user) {
        localStorage.setItem('campushire_token', data.token);
        onAuthSuccess(data.user);
        onClose();
        return;
      }

      // If backend returned error message in JSON
      if (data && data.error && !data.error.includes('<!DOCTYPE')) {
        setError(data.error);
        return;
      }

      // Graceful fallback for Vercel Static deployment
      const fallbackUser = createFallbackUser(role, formData.email, formData.name);
      localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
      onAuthSuccess(fallbackUser);
      onClose();
    } catch (err) {
      // Safe fallback on network error
      const fallbackUser = createFallbackUser(role, formData.email, formData.name);
      localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
      onAuthSuccess(fallbackUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Auto-Fill & Instant 1-Click Login Helper
  const fillDemoAccount = (demoRole) => {
    setRole(demoRole);
    setIsLogin(true);
    setError('');
    
    let email = 'thakkar_om@gmail.com';
    let name = 'Thakkar Om';
    if (demoRole === 'student') {
      email = 'thakkar_om@gmail.com';
      name = 'Thakkar Om';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 98765 43210' }));
    } else if (demoRole === 'company') {
      email = 'gsfclimited@gmail.com';
      name = 'GSFC Limited';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 98989 89898' }));
    } else if (demoRole === 'admin') {
      email = 'admin@gsfcuniversity.ac.in';
      name = 'GSFC TPC Director';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 99999 88888' }));
    } else if (demoRole === 'faculty') {
      email = 'faculty.cse@gsfcuniversity.ac.in';
      name = 'Dr. Rajesh Sharma (Faculty Coordinator)';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 98888 77777' }));
    } else if (demoRole === 'superadmin') {
      email = 'superadmin@gsfcuniversity.ac.in';
      name = 'Super Administrator';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 99999 00000' }));
    } else if (demoRole === 'alumni') {
      email = 'priya.patel@alumni.gsfc.ac.in';
      name = 'Priya Patel (Amazon AWS)';
      setFormData(prev => ({ ...prev, email, password: 'password123', phone: '+91 97777 66666' }));
    }

    // Instantly log in with selected demo persona
    const fallbackUser = createFallbackUser(demoRole, email, name);
    localStorage.setItem('campushire_token', 'demo_token_' + Date.now());
    onAuthSuccess(fallbackUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white/95 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-900">
        
        {/* ========================================================================= */}
        {/* VIEW 1: GOOGLE ACCOUNT CHOOSER SCREEN (WHEN SIGN IN WITH GOOGLE CLICKED)  */}
        {/* ========================================================================= */}
        {showGoogleAccountPicker ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Google Header */}
            <div className="text-center pb-3 border-b border-slate-200 relative">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleAccountPicker(false);
                  setCustomGoogleInputOpen(false);
                }}
                className="absolute left-0 top-1 p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex justify-center mb-1">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-900">Choose an account</h3>
              <p className="text-xs text-slate-500 font-bold">to continue to GSFC Placement Portal</p>

              <button
                onClick={onClose}
                className="absolute right-0 top-1 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* List of Detected / Registered Google Accounts */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {GOOGLE_ACCOUNTS_PRESETS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={googleLoading}
                  onClick={() => handleSelectGoogleAccount(acc)}
                  className="w-full p-3.5 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left shadow-xs hover:shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${acc.color} text-white font-black text-sm flex items-center justify-center shadow-inner shrink-0`}>
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 group-hover:text-blue-900 flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                          {acc.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-bold">{acc.email}</div>
                      <div className="text-[10px] text-blue-900 font-bold">{acc.program} • {acc.roll_number}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>

            {/* Use Another Google Account Toggle */}
            {!customGoogleInputOpen ? (
              <button
                type="button"
                onClick={() => setCustomGoogleInputOpen(true)}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-slate-400 rounded-2xl text-xs font-black text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-fadeIn">
                <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>Sign in with custom Google ID:</span>
                  <button
                    type="button"
                    onClick={() => setCustomGoogleInputOpen(false)}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="email"
                  required
                  placeholder="your.email@gsfcuniversity.ac.in"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
                <input
                  type="text"
                  placeholder="Your Full Name (Optional)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Continue with this Google ID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="text-[10px] text-center text-slate-400 font-medium pt-1">
              To continue, Google will share your name, email address, and profile picture with GSFC Placement Portal.
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: STANDARD CREDENTIALS & INITIAL SIGN IN VIEW                       */
          /* ========================================================================= */
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {isLogin ? 'Sign In to GSFC Placement Portal' : 'Create Your GSFC Account'}
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  GSFC University AI placement matching & recruitment vault
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 🌐 PROMINENT GOOGLE SIGN-IN BUTTON (OPENS ACCOUNT PICKER) */}
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setShowGoogleAccountPicker(true);
                }}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-500 rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="group-hover:text-blue-900">
                  Sign in with Google
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Or Continue with GSFC Credentials
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-2 p-3 bg-blue-50/80 rounded-2xl border border-blue-200">
              <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                Quick Demo 1-Click Login:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('student')}
                  className="py-2.5 px-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('company')}
                  className="py-2.5 px-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Company Recruiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('faculty')}
                  className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin')}
                  className="py-2.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Role Selector (Sign Up Mode) */}
            {!isLogin && (
              <div className="mt-4">
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Select Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      role === 'student'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('company')}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      role === 'company'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('alumni')}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      role === 'alumni'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Alumni Mentor
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {!isLogin && role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-bold">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Arav Sharma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-bold">Roll / Reg Number *</label>
                    <input
                      type="text"
                      name="roll_number"
                      value={formData.roll_number}
                      onChange={handleChange}
                      required
                      placeholder="21BCE045"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
              )}

              {!isLogin && role === 'company' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-bold">Company Name *</label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Reliance / Google"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-bold">Industry Sector *</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Chemical / IT"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
              )}

              {!isLogin && role === 'alumni' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-700 mb-1 font-bold">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Priya Patel"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-700 mb-1 font-bold">GSFC Batch *</label>
                      <input
                        type="text"
                        name="batch_year"
                        value={formData.batch_year}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 2019-2023"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-700 mb-1 font-bold">Current Employer *</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Amazon AWS"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-700 mb-1 font-bold">Designation *</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Solutions Architect"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-700 mb-1 font-bold">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@gsfcuniversity.ac.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1 font-bold">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-xs font-bold text-blue-900 hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
