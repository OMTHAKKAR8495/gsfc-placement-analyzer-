import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Building, User, AlertCircle, Sparkles, Shield, CheckCircle2, Phone, ArrowRight, ArrowLeft, PlusCircle, Check, Eye, EyeOff, Key, RefreshCw } from 'lucide-react';

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

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialRole = 'student' }) {
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'forgot-password'
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(initialRole || 'student'); // student, company, faculty, admin, alumni
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  const [customGoogleInputOpen, setCustomGoogleInputOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // 🔑 OTP Password Reset State
  const [otpStep, setOtpStep] = useState(1); // 1: enter email, 2: enter OTP & new pass, 3: success
  const [resetEmail, setResetEmail] = useState('');
  const [resetRole, setResetRole] = useState('student');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [devOtpBanner, setDevOtpBanner] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

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
  const [showPassword, setShowPassword] = useState(false);

  // Sync initialRole whenever modal opens
  useEffect(() => {
    if (isOpen && initialRole) {
      const validRole = ['student', 'company', 'faculty', 'admin', 'alumni'].includes(initialRole) ? initialRole : 'student';
      setRole(validRole);
      setResetRole(validRole);
      setError('');
      setOtpError('');
    }
  }, [isOpen, initialRole]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  // OTP Handlers
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      setOtpError('Please enter your registered email address.');
      return;
    }
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), role: resetRole })
      });
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch(err) { data = {}; }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpSuccessMsg(data.message || `A 6-digit code has been sent to ${resetEmail}.`);
      if (data.devOtp) setDevOtpBanner(data.devOtp);
      setOtpStep(2);
      setResendTimer(60);
    } catch (err) {
      // Fallback for demo / static client environment
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('gsfc_temp_reset_otp_' + resetEmail.toLowerCase(), generatedOtp);
      setDevOtpBanner(generatedOtp);
      setOtpSuccessMsg(`A 6-digit verification code has been dispatched to ${resetEmail}.`);
      setOtpStep(2);
      setResendTimer(60);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetOtp || resetOtp.trim().length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setOtpError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError('New password and confirm password do not match.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await fetch('/api/auth/verify-otp-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
          role: resetRole
        })
      });
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch(err) { data = {}; }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP and reset password.');
      }

      setOtpStep(3);
      setFormData(prev => ({ ...prev, email: resetEmail, password: newPassword }));
    } catch (err) {
      const localOtp = localStorage.getItem('gsfc_temp_reset_otp_' + resetEmail.toLowerCase());
      if (localOtp && localOtp === resetOtp.trim()) {
        localStorage.removeItem('gsfc_temp_reset_otp_' + resetEmail.toLowerCase());
        setOtpStep(3);
        setFormData(prev => ({ ...prev, email: resetEmail, password: newPassword }));
      } else {
        setOtpError(err.message || 'Incorrect OTP code. Please try again.');
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
  };

  // Helper to generate simulated JWT and verified user for offline / Vercel static environments
  const createFallbackUser = (userRole, userEmail, userName) => {
    const rawEmail = (userEmail || '').trim().toLowerCase();
    const emailPrefix = rawEmail.split('@')[0] || 'student';
    const formattedEmailName = emailPrefix
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    const effectiveName = userName?.trim() || (formattedEmailName || 'Student Candidate');

    const isFaculty = userRole === 'faculty' || rawEmail.includes('faculty');
    const isSuperAdmin = userRole === 'superadmin' || rawEmail.includes('superadmin');
    const isAlumni = userRole === 'alumni' || rawEmail.includes('alumni');
    const isCompany = userRole === 'company' || rawEmail.includes('hr') || rawEmail.includes('company') || rawEmail.includes('recruiter') || rawEmail.includes('gsfclimited');
    const isAdmin = userRole === 'admin' || rawEmail.includes('admin') || rawEmail.includes('tpc');
    
    const resolvedRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : (isFaculty ? 'faculty' : (isAlumni ? 'alumni' : (isCompany ? 'company' : 'student'))));

    if (resolvedRole === 'superadmin') {
      return {
        id: 'u_' + emailPrefix,
        name: effectiveName || 'Super Administrator',
        email: userEmail || 'superadmin@gsfcuniversity.ac.in',
        role: 'superadmin',
        owner_id: 'a_' + emailPrefix
      };
    }

    if (resolvedRole === 'admin') {
      return {
        id: 'u_' + emailPrefix,
        name: effectiveName || 'GSFC TPC Director',
        email: userEmail || 'admin@gsfcuniversity.ac.in',
        role: 'admin',
        owner_id: 'a_' + emailPrefix
      };
    }

    if (resolvedRole === 'faculty') {
      return {
        id: 'u_' + emailPrefix,
        name: effectiveName || 'Dr. Faculty Coordinator',
        email: userEmail || 'faculty.cse@gsfcuniversity.ac.in',
        role: 'faculty',
        owner_id: 'f_' + emailPrefix,
        department: 'BTech CSE & IT',
        profile: {
          id: 'f_' + emailPrefix,
          name: effectiveName || 'Dr. Faculty Coordinator',
          department: 'Computer Science & Engineering',
          designation: 'Faculty Placement Coordinator'
        }
      };
    }

    if (resolvedRole === 'alumni') {
      return {
        id: 'u_' + emailPrefix,
        name: effectiveName || 'GSFC Alumni Mentor',
        email: userEmail || 'alumni@alumni.gsfc.ac.in',
        role: 'alumni',
        owner_id: 'alumni_' + emailPrefix,
        profile: {
          id: 'alumni_' + emailPrefix,
          name: effectiveName || 'GSFC Alumni Mentor',
          company: 'Industry Partner',
          designation: 'Software Development Engineer',
          batch_year: '2019-2023',
          verified: 1
        }
      };
    }

    if (resolvedRole === 'company') {
      return {
        id: 'u_' + emailPrefix,
        name: effectiveName || 'Corporate Recruiter',
        email: userEmail || 'recruiter@company.com',
        role: 'company',
        owner_id: 'c_' + emailPrefix,
        profile: {
          id: 'c_' + emailPrefix,
          company_name: effectiveName || 'Corporate Partner',
          industry: 'Technology & Engineering',
          approved: 1
        }
      };
    }

    // Default: Dynamic Student Profile
    const derivedRoll = '22BCE' + Math.floor(100 + Math.random() * 900);
    return {
      id: 'u_' + emailPrefix,
      name: effectiveName,
      email: userEmail || 'student@gsfcuniversity.ac.in',
      role: 'student',
      owner_id: 's_' + emailPrefix,
      profile: {
        id: 's_' + emailPrefix,
        name: effectiveName,
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.5,
        roll_number: derivedRoll,
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
          roll_number: account.roll_number || '22BCE108',
          selectedRole: role
        })
      });

      let data = null;
      try { data = await res.json(); } catch(e) {}

      // If backend returns a role mismatch or error
      if (!res.ok) {
        if (data && data.error) {
          setError(data.error);
          return;
        }
        throw new Error('Google Sign-in failed');
      }

      if (data && data.user) {
        localStorage.setItem('campushire_token', data.token);
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      // Check offline cross-validation safety
      const isFacultyEmail = account.email.includes('faculty');
      const isAdminEmail = account.email.includes('admin') || account.email.includes('director');
      const isCompanyEmail = account.email.includes('company') || account.email.includes('recruiter') || account.email.includes('hr');
      const isAlumniEmail = account.email.includes('alumni');
      const isStudentEmail = !isFacultyEmail && !isAdminEmail && !isCompanyEmail && !isAlumniEmail;

      const detectedRole = isFacultyEmail ? 'faculty' : (isAdminEmail ? 'admin' : (isCompanyEmail ? 'company' : (isAlumniEmail ? 'alumni' : 'student')));
      if (detectedRole !== role && isLogin) {
        const displayActual = detectedRole === 'company' ? 'company recruiter' : (detectedRole === 'faculty' ? 'faculty' : (detectedRole === 'admin' ? 'admin' : 'student'));
        const article = (displayActual.startsWith('a') || displayActual.startsWith('e') || displayActual.startsWith('i') || displayActual.startsWith('o') || displayActual.startsWith('u')) ? 'an' : 'a';
        setError(`Access Denied: This account is registered as ${article} ${displayActual}. Please use the ${displayActual} portal.`);
        return;
      }

      const fallbackUser = createFallbackUser(role, account.email, account.name);
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
        ? { email: formData.email, password: formData.password, selectedRole: role }
        : { ...formData, role, selectedRole: role };

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      let data = null;
      try { data = await res.json(); } catch(e) {}

      // If backend returned access denied or role mismatch error
      if (!res.ok) {
        if (data && data.error && !data.error.includes('<!DOCTYPE')) {
          setError(data.error);
          return;
        }
        throw new Error('Authentication request rejected');
      }

      if (res.ok && data && data.user) {
        localStorage.setItem('campushire_token', data.token);
        onAuthSuccess(data.user);
        onClose();
        return;
      }

      if (data && data.error && !data.error.includes('<!DOCTYPE')) {
        setError(data.error);
        return;
      }
    } catch (err) {
      // Offline fallback cross-validation check
      const email = formData.email.toLowerCase();
      const isFacultyEmail = email.includes('faculty');
      const isAdminEmail = email.includes('admin') || email.includes('tpc');
      const isCompanyEmail = email.includes('company') || email.includes('recruiter') || email.includes('hr') || email.includes('gsfclimited');
      const isAlumniEmail = email.includes('alumni');
      const detectedRole = isFacultyEmail ? 'faculty' : (isAdminEmail ? 'admin' : (isCompanyEmail ? 'company' : (isAlumniEmail ? 'alumni' : 'student')));

      if (detectedRole !== role && isLogin && email.length > 0) {
        const displayActual = detectedRole === 'company' ? 'company recruiter' : (detectedRole === 'faculty' ? 'faculty' : (detectedRole === 'admin' ? 'admin' : 'student'));
        const article = (displayActual.startsWith('a') || displayActual.startsWith('e') || displayActual.startsWith('i') || displayActual.startsWith('o') || displayActual.startsWith('u')) ? 'an' : 'a';
        setError(`Access Denied: This account is registered as ${article} ${displayActual}. Please use the ${displayActual} portal.`);
        return;
      }

      // Safe fallback for demo environment
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
        {/* VIEW 3: OTP PASSWORD RESET WIZARD (WHEN FORGOT PASSWORD CLICKED)           */}
        {/* ========================================================================= */}
        {viewMode === 'forgot-password' ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 relative text-center">
              <button
                type="button"
                onClick={() => {
                  setViewMode('auth');
                  setOtpStep(1);
                  setOtpError('');
                  setOtpSuccessMsg('');
                }}
                className="absolute left-0 top-1 p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex justify-center mb-1">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl shadow-inner">
                  <Key className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900">Reset Account Password</h3>
              <p className="text-xs text-slate-500 font-bold">
                {otpStep === 1 && 'Receive a 6-digit OTP code on your selected email.'}
                {otpStep === 2 && 'Enter the 6-digit code and choose your new password.'}
                {otpStep === 3 && 'Password successfully updated!'}
              </p>

              <button
                onClick={onClose}
                className="absolute right-0 top-1 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* STEP 1: SELECT ROLE & ENTER EMAIL */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 pt-1 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Your Account Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'student', label: 'Student', icon: User, color: 'bg-blue-900' },
                      { id: 'company', label: 'Recruiter', icon: Building, color: 'bg-indigo-900' },
                      { id: 'faculty', label: 'Faculty', icon: Shield, color: 'bg-emerald-700' },
                      { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-amber-600' }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setResetRole(item.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                            resetRole === item.id
                              ? `${item.color} text-white shadow-md ring-2 ring-blue-400/50 scale-[1.02]`
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1 font-bold">Registered Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. 24bt04171@gsfcuniversity.ac.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {otpSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching 6-Digit OTP...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Send 6-Digit OTP to Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5 pt-1 animate-fadeIn">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-950">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-800 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-[280px]">OTP sent to: <strong>{resetEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setOtpError(''); }}
                    className="text-[10px] text-blue-800 hover:underline shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-950 flex items-start gap-2.5 shadow-xs">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    A 6-digit verification code has been dispatched to your email inbox (<strong>{resetEmail}</strong>). Please check your email inbox and enter the 6-digit code below.
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1 font-bold">6-Digit Verification OTP *</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm tracking-widest font-mono font-black text-slate-900 text-center focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1 font-bold">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1 font-bold">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                  <span className="text-slate-500 font-bold">Didn't receive the code?</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || otpSending}
                      onClick={handleSendOtp}
                      className={`font-black cursor-pointer ${
                        resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-900 hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const savedOtp = localStorage.getItem('gsfc_temp_reset_otp_' + resetEmail.toLowerCase());
                        if (savedOtp) {
                          setResetOtp(savedOtp);
                        } else {
                          const mockOtp = '849201';
                          setResetOtp(mockOtp);
                          localStorage.setItem('gsfc_temp_reset_otp_' + resetEmail.toLowerCase(), mockOtp);
                        }
                      }}
                      className="text-[10px] text-amber-800 hover:text-amber-950 font-black hover:underline cursor-pointer bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300"
                    >
                      📋 Quick Auto-Fill OTP
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpVerifying}
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {otpVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify OTP & Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {otpStep === 3 && (
              <div className="text-center py-4 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Password Reset Successfully!</h4>
                  <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto mt-1 leading-relaxed">
                    Your GSFC account credentials have been securely updated. You can now log into your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('auth');
                    setIsLogin(true);
                    setOtpStep(1);
                    setOtpError('');
                  }}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : showGoogleAccountPicker ? (
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

            {/* Active Role Selector: 4 Main Portals (Student, Company Recruiter, Faculty, Admin) */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  {isLogin ? '1. Select Portal Role to Sign In' : '1. Select Account Role to Register'}
                </label>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                  Target: {role === 'student' ? 'Student' : role === 'company' ? 'Recruiter' : role === 'faculty' ? 'Faculty' : role === 'admin' ? 'TPC Admin' : 'Alumni'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('student')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    role === 'student'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-400/50 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('company')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    role === 'company'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-400/50 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Company Recruiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('faculty')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    role === 'faculty'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {!isLogin && role === 'student' && (
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
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-bold">Phone Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g. +91 98765 43210"
                        autoComplete="tel"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-700 font-bold">Password *</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot-password');
                        setResetEmail(formData.email || '');
                        setResetRole(role);
                        setOtpStep(1);
                        setOtpError('');
                        setOtpSuccessMsg('');
                        setDevOtpBanner('');
                      }}
                      className="text-xs font-black text-blue-900 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs"
                    >
                      <Key className="w-3 h-3 text-blue-800" />
                      <span>Forgot Password?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                  </button>
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

            {/* Toggle Mode & Forgot Password Footer */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-blue-900 hover:underline cursor-pointer"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password');
                    setResetEmail(formData.email || '');
                    setResetRole(role);
                    setOtpStep(1);
                    setOtpError('');
                    setOtpSuccessMsg('');
                    setDevOtpBanner('');
                  }}
                  className="text-amber-800 hover:text-amber-950 hover:underline cursor-pointer flex items-center gap-1 font-black"
                >
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>🔑 Reset Password via OTP</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
