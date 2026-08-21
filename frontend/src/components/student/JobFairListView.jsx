import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Globe, Building2, CheckCircle2, X, ArrowRight, Layers, Users, MapPin, Briefcase } from 'lucide-react';
import JobFairCard from '../common/JobFairCard';

export default function JobFairListView({ currentUser, onOpenAuth, onSelectJobDrive }) {
  const [fairs, setFairs] = useState([]);
  const [registeredFairIds, setRegisteredFairIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('all');
  const [selectedFairModal, setSelectedFairModal] = useState(null);
  const [registeringFairId, setRegisteringFairId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchJobFairs();
    if (currentUser?.profile?.id || currentUser?.owner_id) {
      fetchStudentRegistrations();
    }
  }, [currentUser]);

  const fetchJobFairs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobfair');
      if (res.ok) {
        const data = await res.json();
        setFairs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching job fairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRegistrations = async () => {
    const studentId = currentUser?.profile?.id || currentUser?.owner_id || currentUser?.id;
    try {
      const res = await fetch(`/api/jobfair/student/registrations?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setRegisteredFairIds(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching registered fairs:', err);
    }
  };

  const handleRegister = async (fairId) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const studentId = currentUser?.profile?.id || currentUser?.owner_id || currentUser?.id;
    setRegisteringFairId(fairId);
    try {
      const res = await fetch(`/api/jobfair/${fairId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });

      if (res.ok) {
        setRegisteredFairIds(prev => [...prev, fairId]);
        setFairs(prev => prev.map(f => f.id === fairId ? { ...f, registrations_count: (f.registrations_count || 0) + 1 } : f));
        setToastMessage('🎉 Successfully registered for Job Fair! Your profile has been queued for participating recruiters.');
        setTimeout(() => setToastMessage(''), 4500);
      }
    } catch (err) {
      console.error('Error registering for fair:', err);
    } finally {
      setRegisteringFairId(null);
    }
  };

  const filteredFairs = fairs.filter(f => {
    if (modeFilter === 'all') return true;
    return f.mode === modeFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-full text-xs font-black border border-purple-200 dark:border-purple-800">
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Campus Recruitment Conclaves</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              GSFC University Multi-Employer Job Fairs
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
              Explore scheduled pooled campus recruitment drives and multi-employer hiring events. Register in 1 click to broadcast your ATS-scored resume directly to participating corporate hiring panels.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            {['all', 'offline', 'hybrid', 'online'].map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                  modeFilter === m
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of Job Fairs */}
      {loading ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading Upcoming GSFC Job Fairs...</p>
        </div>
      ) : filteredFairs.length === 0 ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">No Job Fairs in this category</h3>
          <p className="text-xs text-slate-500">Check back soon or select "All" modes to view scheduled conclaves.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFairs.map(fair => (
            <JobFairCard
              key={fair.id}
              fair={fair}
              isRegistered={registeredFairIds.includes(fair.id)}
              onRegister={handleRegister}
              onViewDrives={(f) => setSelectedFairModal(f)}
              isRegistering={registeringFairId === fair.id}
            />
          ))}
        </div>
      )}

      {/* Job Fair Attached Drives Modal */}
      {selectedFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFairModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300">
                {selectedFairModal.mode} Conclave
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {selectedFairModal.title}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {new Date(selectedFairModal.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedFairModal.venue}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Participating Corporate Placement Drives</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedFairModal.participating_companies?.length || 0} Open Drives
                </span>
              </h3>

              <div className="space-y-3">
                {selectedFairModal.participating_companies && selectedFairModal.participating_companies.length > 0 ? (
                  selectedFairModal.participating_companies.map((drive, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {drive.logo_url ? (
                          <img src={drive.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            {drive.company_name?.slice(0, 2).toUpperCase() || 'CO'}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {drive.job_title}
                          </h4>
                          <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                            <span>{drive.company_name}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{drive.ctc_range}</span>
                            <span>•</span>
                            <span>Min CGPA: {drive.min_cgpa || 0.0}</span>
                          </p>
                        </div>
                      </div>

                      {onSelectJobDrive && (
                        <button
                          onClick={() => {
                            setSelectedFairModal(null);
                            onSelectJobDrive(drive);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                        >
                          <span>View Job Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No individual drives attached yet. Register to receive email/WhatsApp announcements when drives open.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedFairModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>

              <button
                onClick={() => {
                  handleRegister(selectedFairModal.id);
                  setSelectedFairModal(null);
                }}
                disabled={registeredFairIds.includes(selectedFairModal.id)}
                className="px-6 py-2.5 bg-theme-gradient text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {registeredFairIds.includes(selectedFairModal.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Already Registered</span>
                  </>
                ) : (
                  <span>Register for Conclave</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
