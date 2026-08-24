import React, { useState, useEffect } from 'react';
import { 
  Shield, QrCode, History, Users, Download, LogOut, 
  Search, CheckCircle2, Clock, Filter, AlertTriangle, 
  Building, UserCheck, RefreshCw, Calendar, Sparkles
} from 'lucide-react';
import UniversalQRScanner from '../scanner/UniversalQRScanner';

export default function SecurityDashboard({ currentUser, onLogout }) {
  const [activeSubTab, setActiveSubTab] = useState('scanner'); // 'scanner' | 'history'
  const [scansList, setScansList] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total_scanned: 0,
    student_scans: 0,
    guest_scans: 0,
    active_events: 1
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const officerName = currentUser?.name || currentUser?.profile?.name || 'Officer Vikram Singh';
  const officerGate = currentUser?.profile?.gate_assigned || 'Main Campus Gate A';
  const officerShift = currentUser?.profile?.shift || 'Day Shift (08:00 AM - 04:00 PM)';

  useEffect(() => {
    fetchScanHistory();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchScanHistory = async () => {
    try {
      setLoadingHistory(true);
      const userId = currentUser?.id || 'u_sec_01';
      const res = await fetch(`/api/events/my-scans?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setScansList(data.scans || []);
        if (data.summary) {
          setSummaryStats(data.summary);
        }
      } else {
        // Sample fallback scans
        setScansList([
          { id: 'log_01', token: 'GSFC-PASS-ANV-101', event_title: 'GSFC Anveshan 2026 Tech & Career Fest', candidate_name: 'Kavya Sharma', candidate_org: 'MS University Vadodara', candidate_type: 'external', scanned_at: '2026-08-24 09:30:15', gate_name: officerGate },
          { id: 'log_02', token: 'GSFC-PASS-STU-24BT04171', event_title: 'GSFC Anveshan 2026 Tech & Career Fest', candidate_name: 'Om Thakkar', candidate_org: 'GSFC University (24BT04171)', candidate_type: 'student', scanned_at: '2026-08-24 09:45:22', gate_name: officerGate }
        ]);
        setSummaryStats({
          total_scanned: 2,
          student_scans: 1,
          guest_scans: 1,
          active_events: 1
        });
      }
    } catch (err) {
      console.error('Error loading security scan history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewScanLogged = (newEntry) => {
    setScansList(prev => [newEntry, ...prev]);
    setSummaryStats(prev => ({
      ...prev,
      total_scanned: prev.total_scanned + 1,
      student_scans: newEntry.candidate_type === 'student' ? prev.student_scans + 1 : prev.student_scans,
      guest_scans: newEntry.candidate_type === 'external' ? prev.guest_scans + 1 : prev.guest_scans
    }));
  };

  const handleExportCSV = () => {
    if (scansList.length === 0) {
      alert('No scan records to export.');
      return;
    }

    const headers = ['Token', 'Candidate Name', 'Type', 'Organization / College', 'Event', 'Gate', 'Scanned Timestamp'];
    const rows = scansList.map(s => [
      `"${s.token || ''}"`,
      `"${s.candidate_name || ''}"`,
      `"${s.candidate_type || ''}"`,
      `"${s.candidate_org || ''}"`,
      `"${s.event_title || 'GSFC Fest'}"`,
      `"${s.gate_name || officerGate}"`,
      `"${s.scanned_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSFC_Security_Scan_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredScans = scansList.filter(s => {
    const matchesSearch = !searchFilter || 
      s.candidate_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.token?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.candidate_org?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'All' || s.candidate_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Officer Command Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
              GSFC CAMPUS SECURITY TERMINAL <span className="text-slate-500">•</span> GATE DESK
            </div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>{officerName}</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700">
                {officerGate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Officer Shift Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-1 shadow-lg">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-400" /> Shift Passes Scanned
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{summaryStats.total_scanned || scansList.length}</div>
            <div className="text-[10px] text-emerald-400 font-bold">Authorized entries logged</div>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-1 shadow-lg">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> GSFC Students
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300">{summaryStats.student_scans || 0}</div>
            <div className="text-[10px] text-slate-400 font-bold">Enrolled candidates</div>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-1 shadow-lg">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" /> External Visitors / Guests
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{summaryStats.guest_scans || 0}</div>
            <div className="text-[10px] text-slate-400 font-bold">Registered public passes</div>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-1 shadow-lg">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Active Gate Assignment
            </div>
            <div className="text-sm font-black text-emerald-400 truncate mt-1">{officerGate}</div>
            <div className="text-[10px] text-slate-400 font-bold truncate">{officerShift}</div>
          </div>
        </div>

        {/* Tab Navigation (Scanner vs Shift Scan History) */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md">
          <button
            type="button"
            onClick={() => setActiveSubTab('scanner')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Scanner Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Shift Scans ({scansList.length})</span>
          </button>
        </div>

        {/* VIEW 1: SCANNER TERMINAL */}
        {activeSubTab === 'scanner' && (
          <div className="space-y-4 animate-fadeIn">
            <UniversalQRScanner
              currentUser={currentUser}
              gateName={officerGate}
              onScanSuccess={handleNewScanLogged}
            />
          </div>
        )}

        {/* VIEW 2: SHIFT SCANNED RECORDS TABLE */}
        {activeSubTab === 'history' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-400" /> My Duty Shift Scanned Entry Records
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Read-only security audit log of all passes verified and checked in at your gate terminal.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchScanHistory}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Shift CSV
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search candidate name, token, organization..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="student">GSFC Students Only</option>
                    <option value="external">External Guests Only</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-black">
                      <tr>
                        <th className="py-3 px-4">Pass Token</th>
                        <th className="py-3 px-4">Candidate Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Organization / College</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {filteredScans.length > 0 ? (
                        filteredScans.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-slate-900/50 transition-all">
                            <td className="py-3 px-4 font-mono font-bold text-amber-400">
                              {s.token}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {s.candidate_name}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                                s.candidate_type === 'student' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {s.candidate_type === 'student' ? 'Student' : 'Guest'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 truncate max-w-[180px]">
                              {s.candidate_org || '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-400 truncate max-w-[180px]">
                              {s.event_title || 'GSFC Fest'}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {s.scanned_at}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3 h-3" /> PRESENT
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500 font-bold">
                            No scan logs found for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
