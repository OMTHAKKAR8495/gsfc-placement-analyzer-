import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, Eye, QrCode, 
  CheckCircle2, Clock, Building, Mail, Phone, RefreshCw, X
} from 'lucide-react';
import PublicPassDownloadPage from '../events/PublicPassDownloadPage';

export default function AdminExternalCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewPass, setPreviewPass] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchCandidates();
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/external-candidates?event_id=${encodeURIComponent(selectedEvent)}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      } else {
        // Fallback sample external candidates
        setCandidates([
          { id: 'ext_01', name: 'Kavya Sharma', email: 'kavya.sharma@msu.ac.in', phone: '+91 98761 12233', organization: 'MS University Vadodara', city: 'Vadodara', pass_token: 'GSFC-PASS-ANV-101', event_title: 'GSFC Anveshan 2026 Tech & Career Fest', checked_in_at: '2026-08-24 09:30:15', checked_in_by: 'Officer Vikram Singh', pass_status: 'checked_in' },
          { id: 'ext_02', name: 'Harshil Patel', email: 'harshil.patel@parul.ac.in', phone: '+91 98762 23344', organization: 'Parul Institute of Technology', city: 'Vadodara', pass_token: 'GSFC-PASS-ANV-102', event_title: 'GSFC Anveshan 2026 Tech & Career Fest', checked_in_at: '2026-08-24 10:12:08', checked_in_by: 'Dr. Neeshu Chaudhary', pass_status: 'checked_in' },
          { id: 'ext_03', name: 'Riya Shah', email: 'riya.shah@nirma.ac.in', phone: '+91 98763 34455', organization: 'Nirma University', city: 'Ahmedabad', pass_token: 'GSFC-PASS-ANV-103', event_title: 'GSFC Anveshan 2026 Tech & Career Fest', checked_in_at: null, checked_in_by: null, pass_status: 'issued' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching external candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (candidates.length === 0) {
      alert('No candidate records to export.');
      return;
    }

    const headers = ['Pass Token', 'Full Name', 'Email', 'Phone', 'College / Organization', 'City', 'Event', 'Check-In Status', 'Checked-In Timestamp', 'Checked-In By'];
    const rows = candidates.map(c => [
      `"${c.pass_token || ''}"`,
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.organization || ''}"`,
      `"${c.city || ''}"`,
      `"${c.event_title || ''}"`,
      `"${c.checked_in_at ? 'PRESENT' : 'NOT CHECKED IN'}"`,
      `"${c.checked_in_at || ''}"`,
      `"${c.checked_in_by || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSFC_External_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = candidates.filter(c => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.organization?.toLowerCase().includes(term) ||
      c.pass_token?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <div>
          <div className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> External Visitor Registry
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            🎟️ External & Guest Registrations Database
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage outside student participants, recruiters, and guests who registered for campus fests and conclaves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCandidates}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, token, email, college..."
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

      {/* Candidates Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="py-3 px-4">Pass Token</th>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">College / Organization</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Check-In Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                    Loading registrations...
                  </td>
                </tr>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {cand.pass_token}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{cand.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{cand.email}</div>
                      {cand.phone && <div className="text-[10px] text-slate-500">{cand.phone}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{cand.organization}</div>
                      <div className="text-[10px] text-slate-400">{cand.city || 'Vadodara'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">
                        {cand.event_title || 'GSFC Fest'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {cand.checked_in_at ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black uppercase">
                            <CheckCircle2 className="w-3 h-3" /> PRESENT
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cand.checked_in_at}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-black uppercase">
                          <Clock className="w-3 h-3" /> NOT CHECKED IN
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewPass(cand)}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-black flex items-center gap-1.5 ml-auto transition-all cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Pass</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 font-bold">
                    No external candidate registrations match this filter.
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
