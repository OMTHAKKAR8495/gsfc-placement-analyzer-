import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Settings, User, Bell, Shield, Moon, Sun, Monitor, 
  Download, Trash2, Key, Check, CheckCircle2, AlertCircle, 
  Sparkles, HelpCircle, FileText, Smartphone, Mail, Globe, 
  ExternalLink, Lock, Eye, EyeOff, RefreshCw 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function SettingsModal({ isOpen, onClose, currentUser, theme, onToggleTheme, onOpenAuth }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Account & Profile State
  const [displayName, setDisplayName] = useState('');
  const [targetStream, setTargetStream] = useState('Software Engineering & AI');
  const [phone, setPhone] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);

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

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.profile?.name || currentUser.name || '');
      setPhone(currentUser.profile?.phone || currentUser.phone || '+91 95584 13347');
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
      if (saved.compactDensity !== undefined) setCompactDensity(saved.compactDensity);
      if (saved.highContrast !== undefined) setHighContrast(saved.highContrast);
      if (saved.reducedMotion !== undefined) setReducedMotion(saved.reducedMotion);
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
      showToast({
        type: 'success',
        title: '⚙️ Settings Saved',
        message: 'Your portal preferences have been successfully updated.',
        triggerCrackles: true
      });
    } catch(e) {}

    setTimeout(() => {
      setSavingSettings(false);
      onClose();
    }, 600);
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      user: currentUser,
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
              <p className="text-xs text-slate-300 font-medium">Manage preferences, notifications, security & display</p>
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
              { id: 'account', label: '👤 Account & Profile', icon: User },
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
            
            {/* 1. ACCOUNT & PROFILE */}
            {activeTab === 'account' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Account Credentials & Profile</h3>
                  <p className="text-xs text-slate-500">Your verified university identity registered on CampusHire AI.</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-blue-950 dark:text-blue-200">
                        {currentUser?.name || currentUser?.profile?.name || 'GSFC Candidate'}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {currentUser?.email || 'student@gsfcuniversity.ac.in'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      {currentUser?.role || 'Verified Student'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Om Thakkar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Career Stream</label>
                    <select
                      value={targetStream}
                      onChange={(e) => setTargetStream(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                    >
                      <option value="Software Engineering & AI">Software Engineering & AI Systems</option>
                      <option value="Cloud Architecture & DevOps">Cloud Architecture & DevOps</option>
                      <option value="Chemical & Petrochemical Core">Chemical & Petrochemical Core</option>
                      <option value="Mechanical & Manufacturing">Mechanical & Manufacturing Design</option>
                      <option value="Data Analytics & BI">Data Analytics & Business Intelligence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Mobile / WhatsApp</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 95584 13347"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Recruiter Profile Visibility</div>
                      <div className="text-[11px] text-slate-500">Allow verified corporate recruiters to view your parsed ATS skill card</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. THEME & DISPLAY */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Appearance & Workspace Layout</h3>
                  <p className="text-xs text-slate-500">Customize the visual presentation and interface density.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { if (theme !== 'light' && onToggleTheme) onToggleTheme(); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-xs font-black">Light Mode</span>
                  </button>

                  <button
                    onClick={() => { if (theme !== 'dark' && onToggleTheme) onToggleTheme(); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-950 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs font-black">Dark Mode</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Compact Table & Card Density</div>
                      <div className="text-[11px] text-slate-500">Condense drive cards and listings to display more information on screen</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={compactDensity}
                      onChange={(e) => setCompactDensity(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">High Contrast Text</div>
                      <div className="text-[11px] text-slate-500">Enhance font weights and color borders for maximum readability</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Reduce Animation Motion</div>
                      <div className="text-[11px] text-slate-500">Disable pulsing and gradient animations for smoother browser performance</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reducedMotion}
                      onChange={(e) => setReducedMotion(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Campus Placement Drives Email Digest</div>
                        <div className="text-[11px] text-slate-500">Receive email notifications when eligible corporate requirements arrive</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifDrives}
                      onChange={(e) => setNotifDrives(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Shortlist & Interview Schedule Alerts</div>
                        <div className="text-[11px] text-slate-500">Instant high-priority notification when you are shortlisted by a recruiter</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifShortlists}
                      onChange={(e) => setNotifShortlists(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">WhatsApp Urgent Drive Broadcasts</div>
                        <div className="text-[11px] text-slate-500">Receive urgent reporting time, hall tickets & venue updates on WhatsApp</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWhatsApp}
                      onChange={(e) => setNotifWhatsApp(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Daily AI Placement Preparation Reminders</div>
                        <div className="text-[11px] text-slate-500">Daily study recommendations and streak preservation reminders</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifDailyAi}
                      onChange={(e) => setNotifDailyAi(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                  </div>
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
