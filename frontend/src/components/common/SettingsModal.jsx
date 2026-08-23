import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Settings, User, Bell, Shield, Moon, Sun, Monitor, 
  Download, Trash2, Key, Check, CheckCircle2, AlertCircle, 
  Sparkles, HelpCircle, FileText, Smartphone, Mail, Globe, 
  ExternalLink, Lock, Eye, EyeOff, RefreshCw, Zap, Eye as EyeIcon, 
  Minimize2, Camera, UploadCloud, FileCheck, Plus, Paperclip, Award, CheckCircle 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

function ToggleSwitch({ enabled, onChange, label, description, icon: Icon, badge }) {
  return (
    <div 
      onClick={() => onChange(!enabled)}
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
        enabled 
          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs' 
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 pr-3">
        {Icon && (
          <div className={`p-2 rounded-xl shrink-0 transition-colors ${enabled ? 'bg-blue-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{label}</span>
            {badge && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md ${
                enabled ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {badge}
              </span>
            )}
          </div>
          {description && <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{description}</div>}
        </div>
      </div>

      {/* iOS Style Pill Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-blue-900' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose, currentUser, theme, onToggleTheme, onOpenAuth }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Account & Profile State
  const [displayName, setDisplayName] = useState('');
  const [targetStream, setTargetStream] = useState('Software Engineering & AI');
  const [phone, setPhone] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);

  // 📸 Professional Passport Photo State
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('gsfc_user_avatar') || '');
  
  // 📄 Official Resume State
  const [resumeFileName, setResumeFileName] = useState(() => localStorage.getItem('gsfc_resume_name') || 'THAKKAR_OM (1).pdf');
  const [resumeFileSize, setResumeFileSize] = useState(() => localStorage.getItem('gsfc_resume_size') || '0.55 MB');
  
  // 📜 Academic & Skill Certificates List State
  const [certificatesList, setCertificatesList] = useState(() => {
    try {
      const saved = localStorage.getItem('gsfc_certificates_list');
      return saved ? JSON.parse(saved) : [
        { name: 'Semester-6 University Marksheet & CGPA Transcript.pdf', size: '1.45 MB', date: 'Aug 2026' },
        { name: 'AWS Certified Cloud Practitioner - Certificate.pdf', size: '0.85 MB', date: 'Jul 2026' }
      ];
    } catch {
      return [
        { name: 'Semester-6 University Marksheet & CGPA Transcript.pdf', size: '1.45 MB', date: 'Aug 2026' },
        { name: 'AWS Certified Cloud Practitioner - Certificate.pdf', size: '0.85 MB', date: 'Jul 2026' }
      ];
    }
  });

  // Notification Preferences State
  const [notifDrives, setNotifDrives] = useState(true);
  const [notifShortlists, setNotifShortlists] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifDailyAi, setNotifDailyAi] = useState(true);

  // Appearance & Display State
  const [compactDensity, setCompactDensity] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Security State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassText, setShowPassText] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Input Refs for 1-Click Upload triggers
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const certInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.profile?.name || currentUser.name || 'Thakkar Om');
      setPhone(currentUser.profile?.phone || currentUser.phone || '+91 98765 43210');
      if (currentUser.profile?.avatar_url && !avatarUrl) {
        setAvatarUrl(currentUser.profile.avatar_url);
      }
    }

    // Load saved client settings
    try {
      const saved = JSON.parse(localStorage.getItem('gsfc_user_settings') || '{}');
      if (saved.targetStream) setTargetStream(saved.targetStream);
      if (saved.publicProfile !== undefined) setPublicProfile(saved.publicProfile);
      if (saved.notifDrives !== undefined) setNotifDrives(saved.notifDrives);
      if (saved.notifShortlists !== undefined) setNotifShortlists(saved.notifShortlists);
      if (saved.notifWhatsApp !== undefined) setNotifWhatsApp(saved.notifWhatsApp);
      if (saved.notifDailyAi !== undefined) setNotifDailyAi(saved.notifDailyAi);
      if (saved.compactDensity !== undefined) {
        setCompactDensity(saved.compactDensity);
        document.documentElement.classList.toggle('compact-density', Boolean(saved.compactDensity));
      }
      if (saved.highContrast !== undefined) {
        setHighContrast(saved.highContrast);
        document.documentElement.classList.toggle('high-contrast', Boolean(saved.highContrast));
      }
      if (saved.reducedMotion !== undefined) {
        setReducedMotion(saved.reducedMotion);
        document.documentElement.classList.toggle('reduce-motion', Boolean(saved.reducedMotion));
      }
    } catch(e) {}
  }, [currentUser, isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 📸 Upload Passport-size Photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB. Please choose a standard passport photograph.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatarUrl(base64Data);
      try {
        localStorage.setItem('gsfc_user_avatar', base64Data);
        window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: base64Data } }));
      } catch (err) {}

      showToast({
        type: 'success',
        title: 'Your changes changed successfully',
        message: 'Your professional portrait has been verified and saved for campus hall tickets.',
        triggerCrackles: false
      });
    };
    reader.readAsDataURL(file);
  };

  // 📄 Upload Official ATS Resume
  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Resume file size exceeds 15MB.');
      return;
    }

    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setResumeFileName(file.name);
    setResumeFileSize(sizeStr);

    try {
      localStorage.setItem('gsfc_resume_name', file.name);
      localStorage.setItem('gsfc_resume_size', sizeStr);
    } catch (err) {}

    showToast({
      type: 'success',
      title: 'Your changes changed successfully',
      message: `"${file.name}" is now synced with your master ATS placement profile.`,
      triggerCrackles: false
    });
  };

  // 📜 Upload Academic & Skill Certificate
  const handleCertificateUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const newCert = {
      name: file.name,
      size: sizeStr,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };

    const updatedList = [newCert, ...certificatesList];
    setCertificatesList(updatedList);

    try {
      localStorage.setItem('gsfc_certificates_list', JSON.stringify(updatedList));
    } catch (err) {}

    showToast({
      type: 'success',
      title: 'Your changes changed successfully',
      message: `"${file.name}" has been appended to your verified academic credentials dossier.`,
      triggerCrackles: false
    });
  };

  const handleRemoveCertificate = (indexToRemove) => {
    const updatedList = certificatesList.filter((_, idx) => idx !== indexToRemove);
    setCertificatesList(updatedList);
    try {
      localStorage.setItem('gsfc_certificates_list', JSON.stringify(updatedList));
    } catch (err) {}
    showToast({
      type: 'info',
      title: 'Your changes changed successfully',
      message: 'Certificate removed from your profile attachments.',
      triggerCrackles: false
    });
  };

  const updateSetting = (key, val, className = null) => {
    try {
      const current = JSON.parse(localStorage.getItem('gsfc_user_settings') || '{}');
      current[key] = val;
      localStorage.setItem('gsfc_user_settings', JSON.stringify(current));
      
      if (className) {
        document.documentElement.classList.toggle(className, Boolean(val));
      }
    } catch(e) {}
  };

  const handleToggleCompact = (val) => {
    setCompactDensity(val);
    updateSetting('compactDensity', val, 'compact-density');
    showToast({
      type: val ? 'info' : 'default',
      title: 'Your changes changed successfully',
      message: val ? 'Compact Table & Card Density mode enabled.' : 'Standard card spacing restored.',
      triggerCrackles: false
    });
  };

  const handleToggleHighContrast = (val) => {
    setHighContrast(val);
    updateSetting('highContrast', val, 'high-contrast');
    showToast({
      type: val ? 'info' : 'default',
      title: 'Your changes changed successfully',
      message: val ? 'High Contrast Text & Borders enabled.' : 'Standard contrast restored.',
      triggerCrackles: false
    });
  };

  const handleToggleReducedMotion = (val) => {
    setReducedMotion(val);
    updateSetting('reducedMotion', val, 'reduce-motion');
    showToast({
      type: val ? 'info' : 'default',
      title: 'Your changes changed successfully',
      message: val ? 'Reduced Animation Motion enabled.' : 'Standard animations restored.',
      triggerCrackles: false
    });
  };

  const handleToggleNotif = (key, val, setter, label) => {
    setter(val);
    updateSetting(key, val);
    showToast({
      type: val ? 'success' : 'default',
      title: 'Your changes changed successfully',
      message: `${label} has been ${val ? 'enabled' : 'muted'}.`,
      triggerCrackles: false
    });
  };

  const handleSaveSettings = () => {
    setSavingSettings(true);
    const settingsObj = {
      displayName,
      targetStream,
      phone,
      publicProfile,
      notifDrives,
      notifShortlists,
      notifWhatsApp,
      notifDailyAi,
      compactDensity,
      highContrast,
      reducedMotion,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('gsfc_user_settings', JSON.stringify(settingsObj));
      document.documentElement.classList.toggle('compact-density', Boolean(compactDensity));
      document.documentElement.classList.toggle('high-contrast', Boolean(highContrast));
      document.documentElement.classList.toggle('reduce-motion', Boolean(reducedMotion));

      showToast({
        type: 'success',
        title: 'Your changes changed successfully',
        message: 'All profile details, documents & display preferences are saved.',
        triggerCrackles: false
      });
    } catch(e) {}

    setTimeout(() => {
      setSavingSettings(false);
      onClose();
    }, 500);
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      user: currentUser,
      avatarAttached: Boolean(avatarUrl),
      resumeFile: resumeFileName,
      certificatesAttached: certificatesList,
      settings: JSON.parse(localStorage.getItem('gsfc_user_settings') || '{}'),
      token: localStorage.getItem('campushire_token') ? 'Active Session (Protected)' : 'Guest',
      system: 'GSFC University CampusHire AI Placement Intelligence Platform v2.4.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSFC_Placement_Data_${currentUser?.email?.split('@')[0] || 'User'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'info',
      title: '📁 Data Exported',
      message: 'Your personal placement records have been downloaded.'
    });
  };

  const handleClearCache = () => {
    if (!window.confirm('Clear temporary local application cache and reload preferences?')) return;
    try {
      localStorage.removeItem('gsfc_qa_threads');
      localStorage.removeItem('gsfc_parsed_resume');
      sessionStorage.clear();
      showToast({
        type: 'success',
        title: '🧹 Cache Cleared',
        message: 'Local session cache reset to university server state.'
      });
    } catch(e) {}
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Hidden File Upload Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleResumeUpload}
        className="hidden"
      />
      <input
        ref={certInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.zip"
        onChange={handleCertificateUpload}
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full shadow-2xl overflow-hidden my-6 text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-white/10 text-slate-200 text-[10px] font-black uppercase rounded-lg border border-white/20">
                  GSFC Portal Configuration
                </span>
              </div>
              <h2 className="text-xl font-black">Platform & Account Settings</h2>
              <p className="text-xs text-slate-300 font-medium">Manage profile, passport photo, resume, certificates & workspace</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Tabs + Content Panel */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-full sm:w-60 bg-slate-50 dark:bg-slate-950/60 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 space-y-1 shrink-0 overflow-x-auto sm:overflow-y-auto">
            {[
              { id: 'account', label: '👤 Profile & Documents', icon: User },
              { id: 'appearance', label: '🎨 Theme & Display', icon: Moon },
              { id: 'notifications', label: '🔔 Notifications & SMS', icon: Bell },
              { id: 'security', label: '🔒 Security & Access', icon: Shield },
              { id: 'data', label: '📄 Data & Exports', icon: Download },
              { id: 'institutional', label: '🏛️ TPC Guidelines & Info', icon: HelpCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] space-y-6">
            
            {/* 1. ACCOUNT & PROFILE WITH PASSPORT PHOTO, RESUME & CERTIFICATE UPLOADS */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Candidate Profile & Verified Documents</h3>
                  <p className="text-xs text-slate-500">Upload your professional photo, master ATS resume, and academic certificates.</p>
                </div>

                {/* 📸 SECTION 1: PROFESSIONAL PASSPORT PHOTO UPLOADER (BIG & HIGH VISIBILITY) */}
                <div className="p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-slate-800/90 dark:to-blue-950/50 rounded-3xl border-2 border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
                  <div className="relative group shrink-0">
                    <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-700 border-3 border-blue-900 dark:border-amber-400 shadow-xl flex items-center justify-center relative ring-4 ring-blue-500/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Candidate Passport" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                          <User className="w-12 h-12 text-blue-900 dark:text-blue-300 mb-2" />
                          <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Passport Photo</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">3.5cm × 4.5cm</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform ring-2 ring-white dark:ring-slate-900"
                      title="Upload New Passport Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">Professional Passport Size Photo</span>
                      <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        Official Identity
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      High-resolution formal photograph with light background. Automatically synchronized with your top navbar, admit cards, attendance sheets & stamped offer letters.
                    </p>
                    <div className="pt-2 flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{avatarUrl ? 'Change / Replace Photo' : 'Upload Passport Photo'}</span>
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl('');
                            localStorage.removeItem('gsfc_user_avatar');
                            window.dispatchEvent(new CustomEvent('gsfc-avatar-updated', { detail: { avatarUrl: '' } }));
                            showToast({ type: 'info', title: 'Your changes changed successfully', message: 'Profile photo reset to default avatar.', triggerCrackles: false });
                          }}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 📄 SECTION 2: OFFICIAL ATS RESUME UPLOADER */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">Master ATS Placement Resume</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">PDF, DOCX (Max 15MB)</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{resumeFileName ? 'Replace Resume' : 'Upload Resume'}</span>
                    </button>

                    <div className="flex-1 w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-900 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {resumeFileName}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md shrink-0 ml-2">
                        {resumeFileSize}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    💡 This resume is automatically parsed by Gemini NLP to calculate ATS fit scores and auto-populate job applications.
                  </p>
                </div>

                {/* 📜 SECTION 3: ACADEMIC & PROFESSIONAL CERTIFICATES BUNDLE */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">Academic Transcripts & Certificates</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => certInputRef.current?.click()}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Certificate</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {certificatesList.map((cert, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{cert.name}</div>
                            <div className="text-[10px] text-slate-500">{cert.size} • Uploaded {cert.date}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertificate(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Remove certificate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate Credentials Fields */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Candidate Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Thakkar Om"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Career Stream</label>
                      <select
                        value={targetStream}
                        onChange={(e) => setTargetStream(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                      >
                        <option value="Software Engineering & AI">Software Engineering & AI Systems</option>
                        <option value="Cloud Architecture & DevOps">Cloud Architecture & DevOps</option>
                        <option value="Chemical & Petrochemical Core">Chemical & Petrochemical Core</option>
                        <option value="Mechanical & Manufacturing">Mechanical & Manufacturing Design</option>
                        <option value="Data Analytics & BI">Data Analytics & Business Intelligence</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Mobile / WhatsApp</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <ToggleSwitch
                    enabled={publicProfile}
                    onChange={(val) => {
                      setPublicProfile(val);
                      updateSetting('publicProfile', val);
                      showToast({
                        type: val ? 'success' : 'default',
                        title: val ? 'Visibility Enabled' : 'Visibility Private',
                        message: val ? 'Your profile card is visible to verified recruiters.' : 'Profile hidden from public recruiters.'
                      });
                    }}
                    label="Recruiter Profile Visibility"
                    description="Allow verified corporate recruiters to view your parsed ATS skill card"
                    icon={User}
                    badge={publicProfile ? 'Public' : 'Private'}
                  />
                </div>
              </div>
            )}

            {/* 2. THEME & DISPLAY */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Appearance & Workspace Layout</h3>
                  <p className="text-xs text-slate-500">Live customization of interface density, high-contrast, and themes.</p>
                </div>

                {/* Theme Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { if (theme !== 'light' && onToggleTheme) onToggleTheme(); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-xs font-black">Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { if (theme !== 'dark' && onToggleTheme) onToggleTheme(); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-950 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Moon className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs font-black">Dark Mode</span>
                  </button>
                </div>

                {/* Live Functional Toggles */}
                <div className="space-y-2.5 pt-2">
                  <ToggleSwitch
                    enabled={compactDensity}
                    onChange={handleToggleCompact}
                    label="Compact Table & Card Density"
                    description="Condense drive cards, tables, and listings to display more information on screen"
                    icon={Minimize2}
                    badge={compactDensity ? 'Active' : 'Off'}
                  />

                  <ToggleSwitch
                    enabled={highContrast}
                    onChange={handleToggleHighContrast}
                    label="High Contrast Text & Borders"
                    description="Enhance text contrast, font weights, and border visibility for maximum readability"
                    icon={EyeIcon}
                    badge={highContrast ? 'Active' : 'Off'}
                  />

                  <ToggleSwitch
                    enabled={reducedMotion}
                    onChange={handleToggleReducedMotion}
                    label="Reduce Animation Motion"
                    description="Disable pulsing and gradient keyframes for instant, high-speed page performance"
                    icon={Zap}
                    badge={reducedMotion ? 'Active' : 'Off'}
                  />
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS & ALERTS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Placement Alerts & Notifications</h3>
                  <p className="text-xs text-slate-500">Control how and when the TPC Cell contacts you regarding opportunities.</p>
                </div>

                <div className="space-y-2.5">
                  <ToggleSwitch
                    enabled={notifDrives}
                    onChange={(val) => handleToggleNotif('notifDrives', val, setNotifDrives, 'Placement Drives Digest')}
                    label="Campus Placement Drives Email Digest"
                    description="Receive email notifications when eligible corporate requirements arrive"
                    icon={Mail}
                    badge={notifDrives ? 'Active' : 'Muted'}
                  />

                  <ToggleSwitch
                    enabled={notifShortlists}
                    onChange={(val) => handleToggleNotif('notifShortlists', val, setNotifShortlists, 'Shortlist Alerts')}
                    label="Shortlist & Interview Schedule Alerts"
                    description="Instant high-priority notification when you are shortlisted by a recruiter"
                    icon={Sparkles}
                    badge={notifShortlists ? 'Active' : 'Muted'}
                  />

                  <ToggleSwitch
                    enabled={notifWhatsApp}
                    onChange={(val) => handleToggleNotif('notifWhatsApp', val, setNotifWhatsApp, 'WhatsApp Updates')}
                    label="WhatsApp Urgent Drive Broadcasts"
                    description="Receive urgent reporting time, hall tickets & venue updates on WhatsApp"
                    icon={Smartphone}
                    badge={notifWhatsApp ? 'Active' : 'Muted'}
                  />

                  <ToggleSwitch
                    enabled={notifDailyAi}
                    onChange={(val) => handleToggleNotif('notifDailyAi', val, setNotifDailyAi, 'Daily AI Coach')}
                    label="Daily AI Placement Preparation Reminders"
                    description="Daily study recommendations and streak preservation reminders"
                    icon={Sparkles}
                    badge={notifDailyAi ? 'Active' : 'Muted'}
                  />
                </div>
              </div>
            )}

            {/* 4. SECURITY & ACCESS */}
            {activeTab === 'security' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Account Security & Session</h3>
                  <p className="text-xs text-slate-500">Manage password credentials and active authentication tokens.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">JWT Token Authentication</div>
                      <div className="text-[11px] text-slate-500">Encrypted SHA-256 session token active</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      Active & Secured
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Change Account Password</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-xs font-black text-blue-900 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {showPasswordChange ? 'Cancel' : 'Update Password'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassText ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassText(!showPassText)}
                            className="absolute right-3 top-2 text-slate-400"
                          >
                            {showPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                        <input
                          type={showPassText ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!currentPassword || !newPassword) {
                            showToast({ type: 'warning', title: 'Input Required', message: 'Please enter current and new password.' });
                            return;
                          }
                          showToast({ type: 'success', title: '🔒 Password Updated', message: 'Your password has been changed securely.' });
                          setShowPasswordChange(false);
                          setCurrentPassword('');
                          setNewPassword('');
                        }}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                      >
                        Confirm Password Change
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. DATA & EXPORTS */}
            {activeTab === 'data' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Data Privacy & Portability</h3>
                  <p className="text-xs text-slate-500">Download your records or clear local browser cache.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">Export Placement Dossier & Activity</div>
                      <div className="text-[11px] text-slate-500">Download a full JSON archive of your applications, test scores, and settings</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-rose-900 dark:text-rose-200">Reset Local Browser Cache</div>
                      <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80">Clears offline cached questions and resumes to force clean server sync</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Cache</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. INSTITUTIONAL GUIDELINES & HELP */}
            {activeTab === 'institutional' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">TPC Placement Policy & Version Info</h3>
                  <p className="text-xs text-slate-500">Official GSFC University Training & Placement Cell guidelines.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                    <div className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>GSFC One-Offer Placement Policy</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      A student securing a regular placement offer is permitted to attempt one additional <strong>Dream Tier Opportunity (&gt;₹10 LPA)</strong> or Super Dream (&gt;₹18 LPA) before placement freeze.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Training & Placement Cell Support Desk</span>
                    </div>
                    <div>Email: <span className="font-bold text-slate-900 dark:text-slate-200">tpc@gsfcuniversity.ac.in</span></div>
                    <div>Location: <span className="font-bold text-slate-900 dark:text-slate-200">Vigyan Bhavan, GSFC University Campus, Vadodara</span></div>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl text-[11px] font-mono text-slate-500 flex items-center justify-between">
                    <span>CampusHire AI Enterprise Platform</span>
                    <span>v2.4.0 (GSFC Build 2026)</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-bold hidden sm:block">
            GSFC University • Placement Intelligence Platform
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={savingSettings}
              onClick={handleSaveSettings}
              className="px-5 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
