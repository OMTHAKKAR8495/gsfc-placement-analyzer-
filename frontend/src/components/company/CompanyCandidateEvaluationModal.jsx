import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Clock, Building2, User, Award, FileText, Sparkles, Star, MessageSquare } from 'lucide-react';

export default function CompanyCandidateEvaluationModal({ isOpen, onClose, application, onSaveSuccess }) {
  const [attendance, setAttendance] = useState('pending');
  const [status, setStatus] = useState('applied');
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState(85);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (application) {
      setAttendance(application.attendance_status || 'pending');
      setStatus(application.status || 'applied');
      setNotes(application.evaluation_notes || '');
      setScore(application.evaluation_score || application.match_score || application.matchScore || 85);
      setSavedSuccess(false);
    }
  }, [application]);

  // ESC key listener to close modal
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

  if (!isOpen || !application) return null;

  const targetAppId = application.application_id || application.id;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/company/applications/${targetAppId}/update-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_status: attendance,
          status,
          evaluation_notes: notes,
          evaluation_score: Number(score)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedSuccess(true);
        if (onSaveSuccess) {
          onSaveSuccess({
            application_id: targetAppId,
            id: targetAppId,
            attendance_status: attendance,
            status,
            evaluation_notes: notes,
            evaluation_score: Number(score)
          });
        }
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 600);
      } else {
        alert(data.error || 'Failed to save evaluation data.');
      }
    } catch (err) {
      console.error('Error saving candidate evaluation:', err);
      alert('Error connecting to server: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden my-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-black">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>Candidate Evaluation & Attendance Editor</span>
              </h2>
              <p className="text-xs text-blue-100 font-bold">
                Edit and save interview score, attendance record, and recruiter remarks back to system
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Profile Highlight Card */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {application.candidate_name || application.name}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                <span className="font-mono text-blue-900 dark:text-blue-400 font-black">{application.roll_number || 'GSFC/2026/CSE/001'}</span> • {application.program || 'BTech CSE'} ({application.cgpa || 8.5} CGPA)
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{application.candidate_email || application.email}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 rounded-xl text-xs font-black text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Match</div>
                <div>{application.matchScore || application.match_score || 85}%</div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 rounded-xl text-xs font-black text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400">ATS Score</div>
                <div>{application.ats_score || 92}/100</div>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Attendance Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Interview Attendance Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAttendance('present')}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all ${
                    attendance === 'present'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('absent')}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all ${
                    attendance === 'absent'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('pending')}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all ${
                    attendance === 'pending'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </button>
              </div>
            </div>

            {/* Application Placement Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Recruitment Stage / Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
              >
                <option value="applied">Applied (Under Review)</option>
                <option value="shortlisted">Shortlisted for Rounds</option>
                <option value="interview">Interview Scheduled</option>
                <option value="selected">Selected (Official Offer Issued)</option>
                <option value="rejected">Rejected (Not Eligible)</option>
              </select>
            </div>
          </div>

          {/* Technical Evaluation Score */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Technical Interview Score: <span className="text-blue-900 dark:text-amber-400 text-sm font-black">{score}/100</span>
              </label>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                score >= 80 ? 'bg-emerald-100 text-emerald-900' : score >= 60 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'
              }`}>
                {score >= 80 ? 'Exceptional Candidate' : score >= 60 ? 'Qualified' : 'Needs Upskilling'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-900"
            />
          </div>

          {/* Recruiter & Interviewer Feedback Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-900 dark:text-amber-400" />
              <span>Interviewer Remarks & Faculty Evaluation Notes</span>
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Strong problem-solving in Python & Data Structures. Recommended for Technical Interview Round 2."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900 shadow-sm leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : savedSuccess ? '✅ Saved Successfully!' : '💾 Save Back to System'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
