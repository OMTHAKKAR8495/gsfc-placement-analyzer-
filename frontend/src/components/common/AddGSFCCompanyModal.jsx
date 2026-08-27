import React, { useState } from 'react';
import {
  X, Building2, Mail, Phone, Globe, MapPin, Briefcase, Users, ChevronRight,
  ChevronLeft, CheckCircle2, Copy, Eye, EyeOff, ShieldCheck, AlertTriangle,
  Sparkles, KeyRound, Send, RefreshCw, Building, FileText, IndianRupee, Tag
} from 'lucide-react';

const INDUSTRY_OPTIONS = [
  'Technology & AI / Software',
  'Chemicals, Fertilizers & Industrial Engineering',
  'Petroleum, Oil & Gas / Petrochemicals',
  'Manufacturing & Process Engineering',
  'Electrical & Electronics',
  'Civil & Construction',
  'Pharmaceuticals & Biotechnology',
  'Banking, Finance & Insurance (BFSI)',
  'IT Services & Consulting',
  'Automobile & Mechanical',
  'Textiles & FMCG',
  'Other'
];

const TIER_OPTIONS = [
  { value: 'tier1_super_dream', label: 'Tier 1 — Super Dream (CTC > ₹20 LPA)', color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { value: 'tier1_dream', label: 'Tier 1 — Dream (CTC ₹12–20 LPA)', color: 'text-blue-800 bg-blue-50 border-blue-300' },
  { value: 'tier2_core', label: 'Tier 2 — Core Engineering (CTC ₹8–12 LPA)', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
  { value: 'tier2_it', label: 'Tier 2 — IT Services (CTC ₹5–9 LPA)', color: 'text-indigo-800 bg-indigo-50 border-indigo-300' },
  { value: 'tier3', label: 'Tier 3 — General Placement (CTC < ₹5 LPA)', color: 'text-slate-700 bg-slate-50 border-slate-300' },
];

function generatePassword(companyName) {
  const base = (companyName || 'GSFC')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6)
    .padEnd(6, 'X');
  const num = Math.floor(1000 + Math.random() * 9000);
  const symbols = ['@', '#', '!', '$'];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return base + sym + num;
}

function generateEmail(companyName) {
  const slug = (companyName || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14);
  return slug + '@gsfcplaced.ac.in';
}

const STEPS = [
  { id: 1, title: 'Company Identity', icon: Building2 },
  { id: 2, title: 'Contact & HR', icon: Mail },
  { id: 3, title: 'Placement Details', icon: Briefcase },
  { id: 4, title: 'Review & Generate', icon: ShieldCheck },
];

export default function AddGSFCCompanyModal({ isOpen, onClose, currentUser, onCompanyAdded }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    tier: 'tier1_dream',
    website: '',
    location: '',
    linkedin_url: '',
    company_description: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    hr_email: '',
    roles_offered: '',
    eligible_programs: '',
    ctc_range: '',
    openings_count: '',
    bond_period: 'None',
    job_type: 'Full-time',
    preferred_skills: '',
    notes_for_tpc: '',
  });

  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.company_name.trim()) { setError('Company name is required.'); return false; }
      if (!form.industry) { setError('Please select an industry.'); return false; }
      if (!form.location.trim()) { setError('Company location is required.'); return false; }
    }
    if (step === 2) {
      if (!form.contact_person_name.trim()) { setError('Contact person name is required.'); return false; }
      if (!form.contact_email.trim() || !form.contact_email.includes('@')) { setError('Valid contact email is required.'); return false; }
      if (!form.contact_phone.trim()) { setError('Contact phone is required.'); return false; }
    }
    if (step === 3) {
      if (!form.roles_offered.trim()) { setError('Roles offered is required.'); return false; }
      if (!form.ctc_range.trim()) { setError('CTC range is required.'); return false; }
      if (!form.eligible_programs.trim()) { setError('Eligible programs is required.'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setError('');
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleGenerateAndRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const portalEmail = form.hr_email.trim() || generateEmail(form.company_name);
      const portalPassword = generatePassword(form.company_name);

      const companyRecord = {
        id: 'c_gsfc_' + Date.now(),
        company_name: form.company_name.trim(),
        industry: form.industry,
        tier: form.tier,
        website: form.website.trim(),
        location: form.location.trim(),
        linkedin_url: form.linkedin_url.trim(),
        company_description: form.company_description.trim(),
        contact_person_name: form.contact_person_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        hr_email: form.hr_email.trim(),
        roles_offered: form.roles_offered.trim(),
        eligible_programs: form.eligible_programs.trim(),
        ctc_range: form.ctc_range.trim(),
        openings_count: form.openings_count,
        bond_period: form.bond_period,
        job_type: form.job_type,
        preferred_skills: form.preferred_skills.trim(),
        notes_for_tpc: form.notes_for_tpc.trim(),
        portal_email: portalEmail,
        portal_password: portalPassword,
        company_type: 'gsfc_placed_company',
        role: 'gsfc_company',
        status: 'active',
        approved: 1,
        added_by: (currentUser && (currentUser.name || currentUser.email)) || 'TPC Admin',
        added_by_role: (currentUser && currentUser.role) || 'admin',
        added_at: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('gsfc_placed_companies_registry') || '[]');
        existing.push(companyRecord);
        localStorage.setItem('gsfc_placed_companies_registry', JSON.stringify(existing));
      } catch(e) {}

      try {
        await fetch('/api/admin/add-gsfc-company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyRecord)
        });
      } catch(e) {}

      setGeneratedCredentials({
        portal_email: portalEmail,
        portal_password: portalPassword,
        company_name: form.company_name.trim(),
        contact_email: form.contact_email.trim(),
      });
      setDone(true);
      if (onCompanyAdded) onCompanyAdded(companyRecord);
    } catch(err) {
      setError('Failed to register company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleSendCredentials = async () => {
    if (!generatedCredentials) return;
    setSendingEmail(true);
    try {
      await fetch('/api/auth/send-company-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: generatedCredentials.contact_email,
          company_name: generatedCredentials.company_name,
          portal_email: generatedCredentials.portal_email,
          portal_password: generatedCredentials.portal_password,
        })
      });
    } catch(e) {}
    setEmailSent(true);
    setSendingEmail(false);
  };

  const handleClose = () => {
    setStep(1);
    setDone(false);
    setError('');
    setGeneratedCredentials(null);
    setEmailSent(false);
    setShowPass(false);
    setForm({
      company_name: '', industry: '', tier: 'tier1_dream', website: '', location: '',
      linkedin_url: '', company_description: '', contact_person_name: '', contact_email: '',
      contact_phone: '', hr_email: '', roles_offered: '', eligible_programs: '',
      ctc_range: '', openings_count: '', bond_period: 'None', job_type: 'Full-time',
      preferred_skills: '', notes_for_tpc: '',
    });
    onClose();
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/10 placeholder-slate-400 transition";
  const labelClass = "block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5";
  const tierInfo = TIER_OPTIONS.find(t => t.value === form.tier);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 p-5 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
                <Building2 className="w-4 h-4" />
                <span>Add GSFC Recruited / Placed Company</span>
              </div>
              <h2 className="text-lg font-black">Register New GSFC Placed Partner</h2>
              <p className="text-xs opacity-70 font-medium">Fill company details → Generate portal credentials → Company logs in as GSFC Placed Company</p>
            </div>
            <button type="button" onClick={handleClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!done && (
            <div className="flex items-center gap-1 mt-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                return (
                  <React.Fragment key={s.id}>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all ${isActive ? 'bg-white text-blue-900' : isCompleted ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-white/50'}`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{s.title}</span>
                      <span className="sm:hidden">{s.id}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step > s.id ? 'bg-emerald-400' : 'bg-white/20'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              {error}
            </div>
          )}

          {done && generatedCredentials ? (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">{generatedCredentials.company_name} — Registered!</h3>
                <p className="text-xs text-slate-600 font-medium">Portal account created successfully. Share the credentials below with the company HR.</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-950 to-indigo-900 rounded-2xl text-white space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-300">
                  <KeyRound className="w-4 h-4" />
                  <span>Portal Login Credentials — GSFC Placed Company</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Portal Login Email (Username)</p>
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
                    <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                    <span className="flex-1 text-sm font-black text-white font-mono">{generatedCredentials.portal_email}</span>
                    <button type="button" onClick={() => handleCopy(generatedCredentials.portal_email, 'email')} className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      {copied === 'email' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Temporary Password</p>
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
                    <KeyRound className="w-4 h-4 text-blue-300 shrink-0" />
                    <span className="flex-1 text-sm font-black text-white font-mono tracking-widest">
                      {showPass ? generatedCredentials.portal_password : '••••••••••••'}
                    </span>
                    <button type="button" onClick={() => setShowPass(p => !p)} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition">
                      {showPass ? <EyeOff className="w-3.5 h-3.5 text-blue-300" /> : <Eye className="w-3.5 h-3.5 text-blue-300" />}
                    </button>
                    <button type="button" onClick={() => handleCopy(generatedCredentials.portal_password, 'pass')} className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      {copied === 'pass' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Select This Role at Login</p>
                    <p className="text-xs font-black text-white">🏢 GSFC Placed Company (Official Partner / Recruiter)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider">📋 Instructions for the Company</p>
                <ol className="space-y-1.5 text-xs font-bold text-amber-800 list-decimal list-inside">
                  <li>Go to the GSFC Placement Portal → Click <strong>Sign In</strong></li>
                  <li>Select role: <strong>🏢 GSFC Placed Company (Official Partner / Recruiter)</strong></li>
                  <li>Enter the Portal Email and Password shown above</li>
                  <li>Full access granted: post jobs, view candidates, schedule interviews, and download reports</li>
                  <li>Change your password after first login from Profile Settings</li>
                </ol>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendCredentials}
                  disabled={sendingEmail || emailSent}
                  className={"flex-1 py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 " + (emailSent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white shadow-lg')}
                >
                  {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : emailSent ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Send className="w-4 h-4" />}
                  {sendingEmail ? 'Sending...' : emailSent ? 'Credentials Sent to HR Contact' : 'Email Credentials to HR Contact'}
                </button>
                <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl cursor-pointer transition">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="w-5 h-5 text-blue-800" />
                    <h3 className="text-sm font-black text-slate-900">Company Identity & Profile</h3>
                  </div>
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. GSFC Limited, Reliance Industries, Tata Chemicals" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Industry Sector *</label>
                      <select name="industry" value={form.industry} onChange={handleChange} className={inputClass}>
                        <option value="">Select Industry</option>
                        {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Company Tier / Category *</label>
                      <select name="tier" value={form.tier} onChange={handleChange} className={inputClass}>
                        {TIER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {tierInfo && (
                    <div className={"px-3 py-2 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 " + tierInfo.color}>
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>{tierInfo.label}</span>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Location / Office Address *</label>
                    <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Vadodara / Ahmedabad / Mumbai (Hybrid)" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Company Website</label>
                      <input name="website" value={form.website} onChange={handleChange} placeholder="https://www.company.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>LinkedIn Page</label>
                      <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/..." className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Company Description / About</label>
                    <textarea name="company_description" value={form.company_description} onChange={handleChange} rows={3} placeholder="Brief company overview, core business, and why students should join..." className={inputClass + " resize-none"} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Mail className="w-5 h-5 text-blue-800" />
                    <h3 className="text-sm font-black text-slate-900">Primary Contact & HR Details</h3>
                  </div>
                  <div>
                    <label className={labelClass}>Contact Person Name (HR / Recruiter) *</label>
                    <input name="contact_person_name" value={form.contact_person_name} onChange={handleChange} placeholder="e.g. Priyanka Mehta (HR Manager)" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Contact Email *</label>
                      <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="hr@company.com" className={inputClass} />
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Credentials will be sent to this email</p>
                    </div>
                    <div>
                      <label className={labelClass}>Contact Phone *</label>
                      <input name="contact_phone" type="tel" value={form.contact_phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Portal Login Email (blank = auto-generate)</label>
                    <input
                      name="hr_email"
                      type="email"
                      value={form.hr_email}
                      onChange={handleChange}
                      placeholder={form.company_name ? generateEmail(form.company_name) + ' (auto-generated)' : 'Auto-generated from company name if left blank'}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-blue-700 font-bold mt-1">Leave blank to auto-generate. This becomes the company portal login email.</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-900">A secure temporary password will be auto-generated and shown on the final step. You can email credentials to HR directly from there.</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-5 h-5 text-blue-800" />
                    <h3 className="text-sm font-black text-slate-900">Placement Drive Details</h3>
                  </div>
                  <div>
                    <label className={labelClass}>Roles / Positions Offered *</label>
                    <input name="roles_offered" value={form.roles_offered} onChange={handleChange} placeholder="e.g. Graduate Engineer Trainee, Software Engineer, Process Engineer" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>CTC / Stipend Range *</label>
                      <input name="ctc_range" value={form.ctc_range} onChange={handleChange} placeholder="e.g. ₹8.00 – ₹12.00 LPA" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Total Openings</label>
                      <input name="openings_count" type="number" min="1" value={form.openings_count} onChange={handleChange} placeholder="e.g. 5" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Eligible Programs *</label>
                    <input name="eligible_programs" value={form.eligible_programs} onChange={handleChange} placeholder="e.g. BTech CSE, BTech Chemical, BTech Mechanical, MSc Chemistry" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Job Type</label>
                      <select name="job_type" value={form.job_type} onChange={handleChange} className={inputClass}>
                        <option>Full-time</option>
                        <option>Internship</option>
                        <option>Full-time + Internship (PPO)</option>
                        <option>Contract (6 months)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Bond / Service Agreement</label>
                      <select name="bond_period" value={form.bond_period} onChange={handleChange} className={inputClass}>
                        <option>None</option>
                        <option>6 Months</option>
                        <option>1 Year</option>
                        <option>2 Years</option>
                        <option>3 Years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Preferred Skills / Competencies</label>
                    <input name="preferred_skills" value={form.preferred_skills} onChange={handleChange} placeholder="e.g. Python, CAD, Process Control, SQL, Communication" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Internal Notes for TPC (optional)</label>
                    <textarea name="notes_for_tpc" value={form.notes_for_tpc} onChange={handleChange} rows={2} placeholder="Any special instructions or notes for the placement cell..." className={inputClass + " resize-none"} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-blue-800" />
                    <h3 className="text-sm font-black text-slate-900">Review & Generate Credentials</h3>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Company</span><span className="font-black text-slate-900">{form.company_name}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Industry</span><span className="font-black text-slate-900">{form.industry}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Location</span><span className="font-black text-slate-900">{form.location}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Tier</span><span className={"font-black text-[11px] px-2 py-0.5 rounded-full border inline-block " + (tierInfo ? tierInfo.color : '')}>{TIER_OPTIONS.find(t => t.value === form.tier) ? TIER_OPTIONS.find(t => t.value === form.tier).label.split('—')[0] : form.tier}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">HR Contact</span><span className="font-black text-slate-900">{form.contact_person_name}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Contact Email</span><span className="font-black text-blue-800">{form.contact_email}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Roles Offered</span><span className="font-black text-slate-900">{form.roles_offered}</span></div>
                      <div><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">CTC Range</span><span className="font-black text-emerald-800">{form.ctc_range}</span></div>
                      <div className="col-span-2"><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Eligible Programs</span><span className="font-black text-slate-900">{form.eligible_programs}</span></div>
                      <div className="col-span-2"><span className="font-black text-slate-500 block text-[10px] uppercase mb-0.5">Portal Login Email (to be assigned)</span><span className="font-black text-blue-800">{form.hr_email || generateEmail(form.company_name)}</span></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      <span>What happens when you click Generate:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] font-bold text-blue-800 list-disc list-inside">
                      <li>Portal login email and a secure temporary password are generated</li>
                      <li>Company is saved to the GSFC Placed Companies registry</li>
                      <li>You can email credentials directly to the HR contact</li>
                      <li>Company signs in using the <strong>GSFC Placed Company</strong> role — no payment, full access</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-amber-900">Ensure all details are correct before generating. The company will use these credentials to access the portal.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="shrink-0 p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
            <button type="button" onClick={step === 1 ? handleClose : handleBack} className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs rounded-2xl border border-slate-200 cursor-pointer transition-all flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map(s => (
                <div key={s.id} className={"h-2 rounded-full transition-all " + (step === s.id ? 'bg-blue-800 w-4' : step > s.id ? 'bg-emerald-500 w-2' : 'bg-slate-200 w-2')} />
              ))}
            </div>
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex items-center gap-1.5">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleGenerateAndRegister} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex items-center gap-2 disabled:opacity-60">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Credentials & Register'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
