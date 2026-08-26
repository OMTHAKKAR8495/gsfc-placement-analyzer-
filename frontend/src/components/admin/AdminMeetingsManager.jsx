import React, { useState, useEffect } from 'react';
import { 
  Video, Calendar, Clock, Building2, Briefcase, Users, ShieldAlert, 
  CheckCircle2, AlertTriangle, Search, Filter, Plus, ExternalLink, 
  Download, FileText, RefreshCw, X, Eye, Lock, Sparkles, ChevronRight 
} from 'lucide-react';
import ScheduleMeetingModal from '../meetings/ScheduleMeetingModal';

export default function AdminMeetingsManager({ currentUser, onJoinMeetingRoom }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      const res = await fetch('/api/meetings/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) {
              setMeetings(data);
              setLoading(false);
              return;
            }
          } catch(e) {}
        }
      }
      
      // Seeded Active & Past Proctored Interviews for Demo
      setMeetings([
        {
          id: 'meet_01',
          title: 'L&T Infotech — Full-Stack Technical Round 1',
          room_id: 'gsfc_lt_interview_2026',
          company_name: 'Larsen & Toubro Infotech (LTI)',
          drive_title: 'Software Development Engineer - 2026 Batch',
          scheduled_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          duration_minutes: 45,
          status: 'live',
          student_count: 3,
          violation_count: 1,
          description: 'Live coding and system design proctored interview room.'
        },
        {
          id: 'meet_02',
          title: 'Reliance Industries — AI & Data Science Technical Assessment',
          room_id: 'gsfc_ril_ai_eval',
          company_name: 'Reliance Industries Limited',
          drive_title: 'Junior AI Engineer (Campus Placement)',
          scheduled_at: '2026-08-25 14:00',
          duration_minutes: 60,
          status: 'completed',
          student_count: 5,
          violation_count: 2,
          description: 'Machine learning algorithms and problem solving proctored interview.'
        },
        {
          id: 'meet_03',
          title: 'GSFC Limited — Chemical Operations & Engineering Assessment',
          room_id: 'gsfc_chem_eval_01',
          company_name: 'GSFC Limited',
          drive_title: 'Graduate Chemical Trainee 2026',
          scheduled_at: '2026-08-28 10:30',
          duration_minutes: 30,
          status: 'scheduled',
          student_count: 4,
          violation_count: 0,
          description: 'Technical evaluation round for shortlisted Chemical Engineering students.'
        }
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin meetings:', err);
      setLoading(false);
    }
  };

  const handleViewMeetingDetails = async (meeting) => {
    setSelectedMeeting(meeting);
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      const res = await fetch(`/api/meetings/room/${meeting.room_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetingDetails(data);
      }
      setLoadingDetails(false);
    } catch (err) {
      console.error('Error loading meeting details:', err);
      setLoadingDetails(false);
    }
  };

  // Metrics calculation
  const totalMeetings = meetings.length;
  const liveMeetings = meetings.filter(m => m.status === 'live').length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const totalViolations = meetings.reduce((acc, m) => acc + (m.violation_count || 0), 0);

  // Filtering
  const companiesList = Array.from(new Set(meetings.map(m => m.company_name).filter(Boolean)));

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = 
      (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.drive_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.room_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || m.company_name === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (meetings.length === 0) return;
    const headers = ['Meeting Title', 'Room ID', 'Company', 'Drive', 'Scheduled At', 'Duration (Mins)', 'Status', 'Candidates', 'Violations Flagged'];
    const rows = filteredMeetings.map(m => [
      `"${m.title}"`,
      `"${m.room_id}"`,
      `"${m.company_name || 'GSFC Partner'}"`,
      `"${m.drive_title || ''}"`,
      `"${m.scheduled_at}"`,
      m.duration_minutes,
      `"${m.status}"`,
      m.student_count || 0,
      m.violation_count || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSFC_Online_Video_Meetings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-black">
              TPC Online Interview Governance
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-bold">
              Anti-Cheating Proctoring Enabled
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <Video className="w-6 h-6 text-indigo-400" />
            <span>Online Video Interviews & Proctoring Audit Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee company video meetings, monitor real-time attendance, and inspect proctoring violation audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchMeetings}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition cursor-pointer border border-slate-700"
            title="Refresh Meetings Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition cursor-pointer border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white text-xs font-black rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Total Meetings</span>
            <Video className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalMeetings}</p>
          <span className="text-[10px] text-slate-500 font-bold">Across all campus placement drives</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Live Rooms Now</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{liveMeetings}</p>
          <span className="text-[10px] text-emerald-500 font-bold">Active in-portal video interviews</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Completed Interviews</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{completedMeetings}</p>
          <span className="text-[10px] text-slate-500 font-bold">Evaluations recorded in dossiers</span>
        </div>

        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-sm bg-gradient-to-b from-red-950/20 to-slate-900">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-xs font-bold">Violations Flagged</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400">{totalViolations}</p>
          <span className="text-[10px] text-red-400/80 font-bold">Tab-switch & blur disqualifications</span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by meeting title, company, drive, or Room ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="live">🟢 Live Now</option>
            <option value="scheduled">⏳ Scheduled</option>
            <option value="completed">✅ Completed</option>
          </select>

          {companiesList.length > 0 && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Companies</option>
              {companiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 4. Meetings Table / Cards */}
      {loading ? (
        <div className="p-12 bg-slate-900 rounded-3xl border border-slate-800 text-center text-slate-500 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
          <p className="text-xs font-bold">Loading online video meeting records...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-12 bg-slate-900 rounded-3xl border border-slate-800 text-center text-slate-500">
          <Video className="w-12 h-12 mx-auto mb-2 text-slate-700" />
          <p className="text-sm font-black text-slate-400">No Online Video Meetings Found</p>
          <p className="text-xs text-slate-600 mt-1">Schedule a meeting to begin interviewing shortlisted students online.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map(m => {
            const isLive = m.status === 'live';
            const isCompleted = m.status === 'completed';
            const hasViolations = (m.violation_count || 0) > 0;

            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg relative group"
              >
                <div>
                  {/* Status & Room ID */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      isLive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : (isCompleted ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30')
                    }`}>
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {m.status}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.room_id}
                    </span>
                  </div>

                  {/* Title & Drive */}
                  <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition leading-snug">
                    {m.title}
                  </h3>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{m.company_name || 'Hiring Partner'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Briefcase className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span className="truncate">{m.drive_title}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom metrics and Action button */}
                <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-300 font-bold">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{m.student_count || 0}</span>
                    </span>

                    {hasViolations && (
                      <span className="flex items-center gap-1 text-red-400 font-black px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 rounded-md text-[10px]">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{m.violation_count} Flagged</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewMeetingDetails(m)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Audit
                    </button>

                    <button
                      onClick={() => {
                        if (onJoinMeetingRoom) {
                          onJoinMeetingRoom(m.room_id);
                        } else {
                          window.location.hash = `#meeting/${m.room_id}`;
                        }
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Meeting Audit & Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div>
                <span className="text-[10px] font-mono text-indigo-400">Room: {selectedMeeting.room_id}</span>
                <h3 className="text-base font-black text-white">{selectedMeeting.title}</h3>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading meeting dossier...</span>
                </div>
              ) : meetingDetails ? (
                <>
                  {/* Meeting Metadata Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block">Company</span>
                      <span className="text-amber-400 font-black">{meetingDetails.meeting.company_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Scheduled At</span>
                      <span className="text-white font-bold">{new Date(meetingDetails.meeting.scheduled_at).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Status</span>
                      <span className="text-emerald-400 font-black uppercase">{meetingDetails.meeting.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Duration</span>
                      <span className="text-white font-bold">{meetingDetails.meeting.duration_minutes} Mins</span>
                    </div>
                  </div>

                  {/* Attendees & Outcome Marks */}
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Candidates Roster & Evaluations ({meetingDetails.participants.filter(p => p.role === 'student').length})</span>
                    </h4>

                    <div className="space-y-2">
                      {meetingDetails.participants.filter(p => p.role === 'student').map(p => (
                        <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-black text-white flex items-center gap-2">
                              {p.student_name || 'Candidate'}
                              <span className="text-[10px] text-slate-400 font-mono">({p.student_roll})</span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.student_program} • CGPA {p.student_cgpa}
                              {p.interviewer_notes && <span className="text-indigo-300 block mt-0.5 font-medium">Notes: {p.interviewer_notes}</span>}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {p.evaluation_score > 0 && (
                              <span className="px-2 py-0.5 bg-slate-800 text-amber-300 font-mono text-[10px] font-black rounded-lg">
                                Score: {p.evaluation_score}/10
                              </span>
                            )}
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              p.outcome_status === 'selected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              (p.outcome_status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-400')
                            }`}>
                              {p.outcome_status || 'pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anti-Cheating Violations Audit Table */}
                  <div>
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>Anti-Cheating Proctoring Audit Log ({meetingDetails.violations.length})</span>
                    </h4>

                    {meetingDetails.violations.length === 0 ? (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Zero proctoring violations recorded for this interview session. Full compliance verified.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {meetingDetails.violations.map(v => (
                          <div key={v.id} className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-200">
                            <div className="flex items-center justify-between">
                              <p className="font-black text-red-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                {v.student_name} ({v.student_email})
                              </p>
                              <span className="text-[10px] font-mono text-red-400">
                                {new Date(v.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 font-mono">Type: {v.violation_type} — {v.details}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const rId = selectedMeeting.room_id;
                  setSelectedMeeting(null);
                  if (onJoinMeetingRoom) {
                    onJoinMeetingRoom(rId);
                  } else {
                    window.location.hash = `#meeting/${rId}`;
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                <span>Enter Live Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        currentUser={currentUser}
        onMeetingScheduled={() => {
          setScheduleModalOpen(false);
          fetchMeetings();
        }}
      />
    </div>
  );
}
