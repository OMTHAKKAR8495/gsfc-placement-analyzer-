import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Building, User, AlertCircle, Sparkles, Shield, CheckCircle2, Phone, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student, company, admin
  const [googleLoading, setGoogleLoading] = useState(false);
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
    website: 'https://company.com'
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

  // 🌐 1-Click Google Sign-In Handler
  const handleGoogleSignIn = async (customGoogleEmail = null) => {
    setError('');
    setGoogleLoading(true);

    try {
      const email = customGoogleEmail || formData.email || 'tanvi.j@gsfcuniversity.ac.in';
      const name = formData.name || 'Tanvi Joshi (GSFC University)';

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          program: formData.program || 'BTech CSE',
          roll_number: formData.roll_number || '22BCE108'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Sign-in failed');

      localStorage.setItem('campushire_token', data.token);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Google authentication encountered an error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      let data = await res.json();
      if (!res.ok && isLogin) {
        // Fallback auto-registration attempt on login failure
        const isCompany = formData.email.toLowerCase().includes('hr') || formData.email.toLowerCase().includes('company');
        const autoRole = isCompany ? 'company' : 'student';
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password, phone: formData.phone || '+91 98765 43210', role: autoRole })
        });
        const regData = await regRes.json();
        if (regRes.ok) {
          data = regData;
          res = regRes;
        }
      }

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('campushire_token', data.token);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Auto-Fill Helper
  const fillDemoAccount = (demoRole) => {
    setRole(demoRole);
    setIsLogin(true);
    setError('');
    if (demoRole === 'student') {
      setFormData(prev => ({ ...prev, email: 's_arav@student.edu', password: 'password123', phone: '+91 98765 43210' }));
    } else if (demoRole === 'company') {
      setFormData(prev => ({ ...prev, email: 'c_google@recruiter.com', password: 'password123', phone: '+91 98989 89898' }));
    } else if (demoRole === 'admin') {
      setFormData(prev => ({ ...prev, email: 'admin@gsfcuniversity.ac.in', password: 'password123', phone: '+91 99999 88888' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white/95 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-900">
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

        {/* 🌐 PROMINENT GOOGLE SIGN-IN BUTTON */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-500 rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="group-hover:text-blue-900">
              {googleLoading ? 'Connecting to Google Account...' : 'Sign in with Google'}
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('student')}
              className="py-2 px-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('company')}
              className="py-2 px-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin')}
              className="py-2 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              TPC Admin
            </button>
          </div>
        </div>

        {/* Role Selector (Sign Up Mode) */}
        {!isLogin && (
          <div className="mt-4">
            <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Select Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                  role === 'student'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <User className="w-4 h-4" /> Student
              </button>
              <button
                type="button"
                onClick={() => setRole('company')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                  role === 'company'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Building className="w-4 h-4" /> Recruiting Company
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
    </div>
  );
}
