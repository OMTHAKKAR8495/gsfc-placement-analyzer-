import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, CheckCircle2, Globe, Building2, MapPin, Layers, Users, Sparkles, AlertCircle } from 'lucide-react';

export default function JobFairManagerModal({ isOpen, onClose, onFairsUpdated }) {
  const [fairs, setFairs] = useState([]);
  const [availableRequirements, setAvailableRequirements] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFairDetails, setSelectedFairDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    venue: 'GSFC University Convention Center',
    mode: 'offline',
    status: 'upcoming',
    requirement_ids: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchFairs();
      fetchRequirements();
    }
  }, [isOpen]);

  const fetchFairs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobfair');
      if (res.ok) {
        const data = await res.json();
        setFairs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching fairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await fetch('/api/company/requirements');
      if (res.ok) {
        const data = await res.json();
        setAvailableRequirements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching requirements:', err);
    }
  };

  const handleCreateFair = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      setError('Title and event date are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/jobfair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Job Fair');

      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        venue: 'GSFC University Convention Center',
        mode: 'offline',
        status: 'upcoming',
        requirement_ids: []
      });
      fetchFairs();
      if (onFairsUpdated) onFairsUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFair = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job fair event?')) return;
    try {
      const res = await fetch(`/api/jobfair/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFairs(prev => prev.filter(f => f.id !== id));
        if (selectedFairDetails?.id === id) setSelectedFairDetails(null);
        if (onFairsUpdated) onFairsUpdated();
      }
    } catch (err) {
      console.error('Error deleting fair:', err);
    }
  };

  const handleOpenDetails = async (fairId) => {
    try {
      const res = await fetch(`/api/jobfair/${fairId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFairDetails(data);
      }
    } catch (err) {
      console.error('Error fetching fair details:', err);
    }
  };

  const handleAttachRequirement = async (fairId, reqId) => {
    try {
      const res = await fetch(`/api/jobfair/${fairId}/add-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement_id: reqId })
      });
      if (res.ok) {
        handleOpenDetails(fairId);
        fetchFairs();
      }
    } catch (err) {
      console.error('Error attaching requirement:', err);
    }
  };

  const handleDetachRequirement = async (fairId, reqId) => {
    try {
      const res = await fetch(`/api/jobfair/${fairId}/remove-company/${reqId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        handleOpenDetails(fairId);
        fetchFairs();
      }
    } catch (err) {
      console.error('Error detaching requirement:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>TPC Administration</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Campus Job Fair & Multi-Employer Conclave Manager
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Schedule pooled hiring drives, attach corporate recruiters, and oversee student registrations.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'View Scheduled Fairs' : 'Schedule New Job Fair'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Create Form */}
        {isCreating ? (
          <form onSubmit={handleCreateFair} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Schedule New Campus Recruitment Conclave
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Fair Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. GSFC University Mega Tech & Chemical Engineering Job Fair 2026"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Event Date</label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="offline">Offline (On-Campus)</option>
                  <option value="hybrid">Hybrid (Online Screening + Offline Interview)</option>
                  <option value="online">Online (Virtual Drive)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Venue / Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. GSFC University Convention Center, Vigyan Bhavan"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Description & Eligibility Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summary of open positions, departments invited, and student preparation guidelines..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Creating...' : 'Schedule Conclave'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* List of Scheduled Job Fairs */
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {fairs.map(fair => (
                <div 
                  key={fair.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                        {fair.status}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase">{fair.mode}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {fair.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-3">
                      <span>📅 {new Date(fair.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>📍 {fair.venue}</span>
                      <span>•</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {fair.companies_count || 0} Drives Attached
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {fair.registrations_count || 0} Registrations
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDetails(fair.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Manage Drives & Students</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFair(fair.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Fair"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Fair Manager Sub-Panel */}
        {selectedFairDetails && (
          <div className="p-6 bg-purple-50/50 dark:bg-purple-950/30 rounded-3xl border border-purple-200 dark:border-purple-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Managing: {selectedFairDetails.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Attach or detach active company requirements, and view registered student profiles.
                </p>
              </div>
              <button
                onClick={() => setSelectedFairDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attached Drives Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Currently Attached Company Placement Drives
              </h4>
              <div className="space-y-2">
                {selectedFairDetails.participating_companies?.map(drive => (
                  <div 
                    key={drive.requirement_id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-black text-slate-900 dark:text-slate-100">{drive.job_title}</span>
                        <span className="text-slate-500 font-bold ml-2">({drive.company_name} • {drive.ctc_range})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDetachRequirement(selectedFairDetails.id, drive.requirement_id)}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold"
                    >
                      Detach
                    </button>
                  </div>
                ))}
              </div>

              {/* Add More Drives Dropdown */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Attach another active placement drive to this conclave:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAttachRequirement(selectedFairDetails.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                >
                  <option value="" disabled>-- Select a placement drive to attach --</option>
                  {availableRequirements
                    .filter(r => !selectedFairDetails.participating_companies?.some(pc => pc.requirement_id === r.id))
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.company_name} • {r.ctc_range})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Registered Students Section */}
            <div className="space-y-3 pt-4 border-t border-purple-200 dark:border-purple-800">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Registered Students ({selectedFairDetails.registered_students?.length || 0})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFairDetails.registered_students?.map(s => (
                  <div 
                    key={s.id}
                    className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold"
                  >
                    <div>
                      <span className="text-slate-900 dark:text-slate-100 font-black">{s.name}</span>
                      <span className="text-slate-400 font-normal ml-2">({s.roll_number} • {s.program} • CGPA: {s.cgpa})</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                      ATS: {s.ats_score || 85}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
