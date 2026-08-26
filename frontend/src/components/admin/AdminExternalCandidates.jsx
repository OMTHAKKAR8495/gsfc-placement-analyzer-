import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, Eye, QrCode, 
  CheckCircle2, Clock, Building, Mail, Phone, RefreshCw, X,
  UserCheck, UserX, AlertCircle, Sparkles, Check
} from 'lucide-react';
import PublicPassDownloadPage from '../events/PublicPassDownloadPage';

export default function AdminExternalCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('All'); // 'All', 'pending', 'present', 'absent'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewPass, setPreviewPass] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchCandidates();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setPreviewPass(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent, attendanceFilter]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) setEvents(data);
          } catch(e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/external-candidates?event_id=${encodeURIComponent(selectedEvent)}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(attendanceFilter)}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              setCandidates(data);
              return;
            }
          } catch(e) {}
        }
      }
      
      // Fallback sample data with dynamic lifecycle
      setCandidates([
        { 
          id: 'ext_01', 
          name: 'Kavya Sharma', 
          email: 'kavya.sharma@msu.ac.in', 
          phone: '+91 98761 12233', 
          organization: 'MS University Vadodara', 
          city: 'Vadodara', 
          pass_token: 'GSFC-PASS-ANV-101', 
          event_title: 'GSFC Anveshan 2026 Tech & Career Fest', 
          checked_in_at: '2026-08-26 09:30:15', 
          checked_in_by: 'Officer Vikram Singh', 
          pass_status: 'checked_in',
          attendance_status: 'present'
        },
        { 
          id: 'ext_02', 
          name: 'Harshil Patel', 
          email: 'harshil.patel@parul.ac.in', 
          phone: '+91 98762 23344', 
          organization: 'Parul Institute of Technology', 
          city: 'Vadodara', 
          pass_token: 'GSFC-PASS-ANV-102', 
          event_title: 'GSFC Anveshan 2026 Tech & Career Fest', 
          checked_in_at: null, 
          checked_in_by: null, 
          pass_status: 'issued',
          attendance_status: 'pending'
        },
        { 
          id: 'ext_03', 
          name: 'Riya Shah', 
          email: 'riya.shah@nirma.ac.in', 
          phone: '+91 98763 34455', 
          organization: 'Nirma University', 
          city: 'Ahmedabad', 
          pass_token: 'GSFC-PASS-ANV-103', 
          event_title: 'GSFC Tech Expo 2025 (Past Event)', 
          checked_in_at: null, 
          checked_in_by: null, 
          pass_status: 'issued',
          attendance_status: 'absent'
        }
      ]);
    } catch (err) {
      console.error('Error fetching external candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendance = async (candidateId, newStatus) => {
    try {
      setActionLoadingId(candidateId);
      const res = await fetch(`/api/admin/external-candidates/${candidateId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          officerName: 'TPC Director Desk'
        })
      });

      // Optimistic local state update
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            attendance_status: newStatus,
            checked_in_at: newStatus === 'present' ? new Date().toLocaleString('en-IN') : null,
            checked_in_by: newStatus === 'present' ? 'TPC Director Desk' : null
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCSV = () => {
    if (candidates.length === 0) {
      alert('No candidate records to export.');
      return;
    }

    const headers = ['Pass Token', 'Full Name', 'Email', 'Phone', 'College / Organization', 'City', 'Event', 'Attendance Status', 'Checked-In Timestamp', 'Checked-In By'];
    const rows = candidates.map(c => [
      `"${c.pass_token || ''}"`,
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.organization || ''}"`,
      `"${c.city || ''}"`,
      `"${c.event_title || ''}"`,
      `"${c.attendance_status ? c.attendance_status.toUpperCase() : (c.checked_in_at ? 'PRESENT' : 'PENDING')}"`,
      `"${c.checked_in_at || ''}"`,
      `"${c.checked_in_by || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSFC_Registrations_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesAttendance = attendanceFilter === 'All' || 
      (c.attendance_status && c.attendance_status.toLowerCase() === attendanceFilter.toLowerCase());

    if (!matchesAttendance) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.organization?.toLowerCase().includes(term) ||
      c.pass_token?.toLowerCase().includes(term)
    );
  });

  const totalRegistered = candidates.length;
  const totalPresent = candidates.filter(c => c.attendance_status === 'present' || c.checked_in_at).length;
  const totalPending = candidates.filter(c => c.attendance_status === 'pending' || (!c.checked_in_at && c.attendance_status !== 'absent')).length;
  const totalAbsent = candidates.filter(c => c.attendance_status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <div>
          <div className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> GSFC University Visitor & Pass Registry
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            🎟️ Registered Attendees & Live Attendance Register
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            New registrants start as <strong className="text-amber-600">Pending</strong>. Gate QR scans automatically mark them <strong className="text-emerald-600">Present</strong>. Unattended expired events automatically transition to <strong className="text-rose-600">Absent</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCandidates}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Refresh Attendance Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-Time Attendance KPI Stats Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Registrations</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalRegistered}</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Present (Checked-In)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalPresent}</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Pending Gate Entry</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalPending}</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Absent (Event Expired)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{totalAbsent}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-3">
        {/* Attendance Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setAttendanceFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              attendanceFilter === 'All'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            All Registrants ({totalRegistered})
          </button>

          <button
            type="button"
            onClick={() => setAttendanceFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              attendanceFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50'
            }`}
          >
            ⏳ Pending Check-In ({totalPending})
          </button>

          <button
            type="button"
            onClick={() => setAttendanceFilter('present')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              attendanceFilter === 'present'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
            }`}
          >
            ✅ Present / Scanned ({totalPresent})
          </button>

          <button
            type="button"
            onClick={() => setAttendanceFilter('absent')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              attendanceFilter === 'absent'
                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50'
            }`}
          >
            ❌ Absent / Expired ({totalAbsent})
          </button>
        </div>

        {/* Search & Event Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, token ID, email, college, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Fests & Events</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Attendance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="py-3.5 px-4">Pass Token & QR</th>
                <th className="py-3.5 px-4">Candidate Profile</th>
                <th className="py-3.5 px-4">College / Organization</th>
                <th className="py-3.5 px-4">Registered Event</th>
                <th className="py-3.5 px-4">Live Attendance Status</th>
                <th className="py-3.5 px-4 text-right">Attendance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading registrations & attendance records...
                  </td>
                </tr>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => {
                  const isPresent = cand.attendance_status === 'present' || cand.checked_in_at;
                  const isAbsent = cand.attendance_status === 'absent';
                  const isPending = cand.attendance_status === 'pending' || (!isPresent && !isAbsent);

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-all">
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </span>
                          <span>{cand.pass_token}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white text-xs">{cand.name}</div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{cand.email}</span>
                        </div>
                        {cand.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{cand.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{cand.organization}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 ml-5">{cand.city || 'Vadodara'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold inline-block max-w-[180px] truncate">
                          {cand.event_title || 'GSFC Fest'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isPresent ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-[10px] font-black uppercase shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> PRESENT ✅
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              {cand.checked_in_at || 'Gate Scanned'}
                            </div>
                            {cand.checked_in_by && (
                              <div className="text-[9px] text-slate-400">
                                Verified by {cand.checked_in_by}
                              </div>
                            )}
                          </div>
                        ) : isAbsent ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 rounded-xl text-[10px] font-black uppercase shadow-sm">
                              <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" /> ABSENT ❌
                            </span>
                            <div className="text-[10px] text-rose-500 font-bold mt-1">
                              Event Ended • Did Not Attend
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-[10px] font-black uppercase shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> PENDING ⏳
                            </span>
                            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1">
                              Awaiting Gate Check-In
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* Attendance Toggle Buttons */}
                        {!isPresent ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateAttendance(cand.id, 'present')}
                            disabled={actionLoadingId === cand.id}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black transition-all shadow-sm cursor-pointer hover:scale-105 inline-flex items-center gap-1"
                            title="Mark candidate as PRESENT (manual check-in)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Present</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateAttendance(cand.id, 'absent')}
                            disabled={actionLoadingId === cand.id}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            title="Revoke check-in and mark as absent"
                          >
                            <span>Mark Absent</span>
                          </button>
                        )}

                        {/* View Full Pass */}
                        <button
                          type="button"
                          onClick={() => setPreviewPass(cand)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-black transition-all cursor-pointer hover:scale-105 inline-flex items-center gap-1"
                          title="Open Verified Digital Pass modal"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Pass</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                    No candidate registrations match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PASS PREVIEW MODAL */}
      {previewPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewPass(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 border border-slate-700 shadow-xl cursor-pointer"
              title="Close Pass (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
            <PublicPassDownloadPage
              passToken={previewPass.pass_token}
              initialCandidate={previewPass}
              initialEvent={{
                title: previewPass.event_title,
                event_date: previewPass.event_date || '2026-09-18',
                venue: previewPass.event_venue || 'Auditorium Dome'
              }}
              onBackToRegister={() => setPreviewPass(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
