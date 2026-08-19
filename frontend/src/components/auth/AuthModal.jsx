import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Building, User, AlertCircle, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student, company, admin
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
          body: JSON.stringify({ email: formData.email, password: formData.password, role: autoRole })
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
      setFormData(prev => ({ ...prev, email: 's_arav@student.edu', password: 'password123' }));
    } else if (demoRole === 'company') {
      setFormData(prev => ({ ...prev, email: 'c_google@recruiter.com', password: 'password123' }));
    } else if (demoRole === 'admin') {
      setFormData(prev => ({ ...prev, email: 'admin@gsfcuniversity.ac.in', password: 'password123' }));
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
              AI Placement matching & recruitment tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-4 p-3 bg-blue-50/80 rounded-2xl border border-blue-200">
          <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-800" />
            Quick Demo Login Shortcuts:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('student')}
              className="py-2 px-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('company')}
              className="py-2 px-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              Demo Recruiter
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
                <label className="block text-xs text-slate-700 mb-1 font-bold">Full Name</label>
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
                <label className="block text-xs text-slate-700 mb-1 font-bold">Roll / Reg Number</label>
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
            <div>
              <label className="block text-xs text-slate-700 mb-1 font-bold">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                placeholder="Google Cloud / Microsoft / Startup Inc"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-700 mb-1 font-bold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 mb-1 font-bold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
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
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isLogin ? (
              'Sign In to Dashboard'
            ) : (
              'Create Campus Account'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs font-bold text-slate-600">
          {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-900 hover:underline font-black"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
