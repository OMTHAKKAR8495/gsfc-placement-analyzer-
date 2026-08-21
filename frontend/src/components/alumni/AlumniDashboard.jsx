import React, { useState, useEffect } from 'react';
import { 
  Award, Building, Briefcase, Linkedin, Edit3, CheckCircle2, 
  AlertCircle, Plus, MessageSquare, Save, Users, Sparkles, BookOpen 
} from 'lucide-react';
import MentorshipFeed from './MentorshipFeed';
import CreatePostModal from './CreatePostModal';

export default function AlumniDashboard({ currentUser, onOpenAuth }) {
  const [profile, setProfile] = useState(currentUser?.profile || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const [editForm, setEditForm] = useState({
    name: profile?.name || currentUser?.name || 'GSFC Alumnus',
    company: profile?.company || 'Industry Partner',
    designation: profile?.designation || 'Software Engineer',
    batch_year: profile?.batch_year || '2019-2023',
    linkedin_url: profile?.linkedin_url || '',
    bio: profile?.bio || ''
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/alumni/profile?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditForm({
          name: data.name || '',
          company: data.company || '',
          designation: data.designation || '',
          batch_year: data.batch_year || '2020-2024',
          linkedin_url: data.linkedin_url || '',
          bio: data.bio || ''
        });
      }
    } catch (err) {
      console.error('Error fetching alumni profile:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/alumni/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          ...editForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditingProfile(false);
        setSaveSuccess('Alumni Profile updated successfully!');
        setTimeout(() => setSaveSuccess(''), 3500);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const isVerified = profile?.verified === 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Alumni Profile Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl bg-white/90 dark:bg-slate-900/90 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {editForm.name ? editForm.name.slice(0, 2).toUpperCase() : 'AL'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {profile?.name || editForm.name}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-black border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified GSFC Alumni Mentor</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black border border-amber-300 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending TPO Verification</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile?.designation || editForm.designation}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.company || editForm.company}
                </span>
                <span>•</span>
                <span className="text-slate-500 font-medium">Batch {profile?.batch_year || editForm.batch_year}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditingProfile ? 'Close Editor' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Guide</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Edit Profile Form Panel */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Update Alumni Professional Dossier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">Current Employer / Company</label>
                <input
                  type="text"
                  required
                  value={editForm.company}
                  onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Amazon AWS / GSFC Ltd"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">Designation / Role</label>
                <input
                  type="text"
                  required
                  value={editForm.designation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">GSFC Batch Year</label>
                <input
                  type="text"
                  value={editForm.batch_year}
                  onChange={(e) => setEditForm(prev => ({ ...prev, batch_year: e.target.value }))}
                  placeholder="e.g. 2019-2023"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={editForm.linkedin_url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400">Professional Bio & Industry Domains</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief summary of your background, tech stacks, and domain expertise to help juniors approach you for mentorship..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Bio summary */}
        {profile?.bio && !isEditingProfile && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            <span className="font-black text-slate-900 dark:text-slate-100 block mb-1">Mentor Dossier & Expertise:</span>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Main Mentorship Feed */}
      <MentorshipFeed currentUser={currentUser} onOpenAuth={onOpenAuth} />

      {/* Modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        alumniProfile={profile || { id: currentUser?.owner_id || 'alumni_priya' }}
        onPostCreated={() => window.location.reload()}
      />
    </div>
  );
}
