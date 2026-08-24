import React, { useState, useEffect } from 'react';
import { 
  X, Video, Calendar, Clock, Users, Building2, Briefcase, 
  CheckSquare, Square, RefreshCw, Sparkles, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function ScheduleMeetingModal({ isOpen, onClose, preselectedDriveId, onMeetingScheduled, currentUser }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(preselectedDriveId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Initialize Default Scheduled Time (e.g. Tomorrow at 10:00 AM)
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessResult(null);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
      setScheduledAt(localISOTime);

      fetchDrives();
    }
  }, [isOpen, preselectedDriveId]);

  // Load drives
  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      let url = '/api/company/requirements';
      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        url = '/api/admin/requirements';
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const driveList = Array.isArray(data) ? data : (data.requirements || []);
        setDrives(driveList);

        const activeId = preselectedDriveId || driveList[0]?.id;
        if (activeId) {
          setSelectedDriveId(activeId);
          const foundDrive = driveList.find(d => d.id === activeId);
          if (foundDrive) {
            setTitle(`${foundDrive.company_name || 'Company'} — Technical Video Interview`);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching drives for meeting scheduling:', err);
    }
  };

  // Load candidate applicants when drive changes
  useEffect(() => {
    if (selectedDriveId) {
      fetchApplicants(selectedDriveId);
      const foundDrive = drives.find(d => d.id === selectedDriveId);
      if (foundDrive && !title) {
        setTitle(`${foundDrive.company_name || 'Company'} — Technical Video Interview`);
      }
    }
  }, [selectedDriveId, drives]);

  const fetchApplicants = async (driveId) => {
    try {
      setLoadingCandidates(true);
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      const res = await fetch(`/api/company/applications?requirement_id=${driveId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const applicantsList = Array.isArray(data) ? data : (data.applications || []);
        setCandidates(applicantsList);
        
        // Auto-select all shortlisted candidates by default
        const shortlisted = applicantsList
          .filter(a => a.status === 'shortlisted' || a.status === 'applied' || a.status === 'interview')
          .map(a => a.student_id);
        setSelectedCandidateIds(shortlisted.length > 0 ? shortlisted : applicantsList.map(a => a.student_id));
      }
      setLoadingCandidates(false);
    } catch (err) {
      console.error('Error fetching drive applicants:', err);
      setLoadingCandidates(false);
    }
  };

  const toggleCandidateSelection = (studentId) => {
    setSelectedCandidateIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.student_id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriveId) {
      setError('Please select a hiring drive.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a meeting title.');
      return;
    }
    if (!scheduledAt) {
      setError('Please choose a valid date and time.');
      return;
    }
    if (selectedCandidateIds.length === 0) {
      setError('Please select at least 1 shortlisted student candidate to invite.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;

      const res = await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          driveId: selectedDriveId,
          title: title.trim(),
          description: description.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: parseInt(durationMinutes, 10) || 30,
          studentIds: selectedCandidateIds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule video meeting.');
      }

      setSuccessResult(data.meeting);
      setSubmitting(false);

      if (onMeetingScheduled) {
        onMeetingScheduled(data.meeting);
      }
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Schedule In-Portal Video Interview</h2>
              <p className="text-xs text-slate-400">Native WebRTC room with automated anti-cheating enforcement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {successResult ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Meeting Scheduled Successfully!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Invitations and in-app notifications have been dispatched to <strong>{successResult.invited_count}</strong> student candidate(s).
            </p>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left font-mono text-xs space-y-1.5 max-w-md mx-auto">
              <p className="text-indigo-400 font-bold">Room ID: {successResult.room_id}</p>
              <p className="text-slate-300">Topic: {successResult.title}</p>
              <p className="text-slate-400">Time: {new Date(successResult.scheduled_at).toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close & View Meetings
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-300 font-bold">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Drive */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select Hiring Drive</span>
              </label>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {drives.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.company_name} — {d.title} ({d.ctc_range || 'Competitive'})
                  </option>
                ))}
              </select>
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Meeting Title / Topic</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google Cloud SDE — Technical Interview Round 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Interview Instructions / Agenda (Optional)</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Coding discussion on Data Structures and System Design architecture."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Date, Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scheduled Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Duration</span>
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="15">15 Minutes (Rapid Screening)</option>
                  <option value="30">30 Minutes (Standard)</option>
                  <option value="45">45 Minutes (Technical Deep-Dive)</option>
                  <option value="60">60 Minutes (Full Panel Interview)</option>
                  <option value="90">90 Minutes (Comprehensive)</option>
                </select>
              </div>
            </div>

            {/* Candidate Multi-Select Roster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Shortlisted Candidates ({selectedCandidateIds.length} of {candidates.length} Selected)</span>
                </label>
                {candidates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    {selectedCandidateIds.length === candidates.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {loadingCandidates ? (
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading drive applicants...</span>
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                  No applicants registered for this drive yet.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-800/60 p-1">
                  {candidates.map(c => {
                    const isSelected = selectedCandidateIds.includes(c.student_id);
                    return (
                      <div
                        key={c.student_id || c.id}
                        onClick={() => toggleCandidateSelection(c.student_id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-indigo-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              {c.student_name || c.name || 'Candidate'}
                              <span className="text-[10px] text-slate-400 font-mono">({c.roll_number || 'GSFC'})</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {c.program || 'BTech CSE'} • CGPA {c.cgpa || 8.0} • Match {Math.round(c.match_score || 85)}%
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          c.status === 'shortlisted' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status || 'applied'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || candidates.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white font-black text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/30 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scheduling & Dispatching Invites...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Schedule Meeting & Generate Room ID</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
