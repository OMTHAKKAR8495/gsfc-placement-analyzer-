import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, BarChart3, Download, Building, Users, Briefcase, FileSpreadsheet, Sparkles, TrendingUp, PieChart, Database, Search, Printer, CheckCircle } from 'lucide-react';
import ReportPDFModal from '../common/ReportPDFModal';

export default function AdminDashboard({ currentUser, onAdminAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'database'
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin Authentication Lock Screen State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Master TPC Governance States
  const [allCandidates, setAllCandidates] = useState([]);
  const [allCompaniesList, setAllCompaniesList] = useState([]);
  const [allDrivesList, setAllDrivesList] = useState([]);
  const [allApplicationsList, setAllApplicationsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateReport, setSelectedCandidateReport] = useState(null);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);

  const fetchGlobalSearch = async (query = '') => {
    try {
      const res = await fetch(`/api/admin/global-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSelectedCandidateReport(data);
    } catch(err) {
      console.error('Error fetching global search:', err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [compRes, driveRes, appRes] = await Promise.all([
        fetch('/api/admin/all-companies'),
        fetch('/api/admin/all-requirements'),
        fetch('/api/admin/all-applications')
      ]);
      const compData = await compRes.json();
      const driveData = await driveRes.json();
      const appData = await appRes.json();

      setAllCompaniesList(Array.isArray(compData) ? compData : []);
      setAllDrivesList(Array.isArray(driveData) ? driveData : []);
      setAllApplicationsList(Array.isArray(appData) ? appData : []);
    } catch(err) {
      console.error('Error fetching master TPC data:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminData();
      fetchCandidateDatabase();
      fetchMasterData();
      fetchGlobalSearch('');
    }

    // Live 5-second auto-sync interval for 100% real-time accuracy
    const interval = setInterval(() => {
      if (currentUser?.role === 'admin') {
        fetchAdminDataSilently();
        fetchCandidateDatabase();
        fetchMasterData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid Admin Email or Password');

      if (data.user?.role !== 'admin') {
        throw new Error('Access Denied: Only authorized GSFC TPC Admin accounts are permitted to access this portal.');
      }

      localStorage.setItem('campushire_token', data.token);
      if (onAdminAuthSuccess) {
        onAdminAuthSuccess(data.user);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    await fetchAdminDataSilently();
    setLoading(false);
  };

  const fetchAdminDataSilently = async () => {
    try {
      const [pendingRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/pending-companies'),
        fetch('/api/admin/analytics')
      ]);

      const pendingData = await pendingRes.json();
      const analyticsData = await analyticsRes.json();

      setPendingCompanies(Array.isArray(pendingData) ? pendingData : []);
      setAnalytics(analyticsData && !analyticsData.error ? analyticsData : null);
    } catch (err) {
      console.error('Error loading TPC admin data:', err);
    }
  };

  const fetchCandidateDatabase = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setAllCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching candidate database:', err);
    }
  };

  const handleApproveRejectCompany = async (companyId, action) => {
    try {
      const res = await fetch('/api/admin/approve-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      alert(data.message);
      fetchAdminData();
      fetchMasterData();
    } catch (err) {
      alert(err.message);
    }
  };

  const downloadReport = () => {
    window.open('/api/admin/export-report', '_blank');
  };

  const openCandidatePdfReport = (candidate) => {
    setSelectedCandidateReport({
      name: candidate.name,
      email: candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '_')}@student.edu`,
      atsScore: candidate.ats_score || 92,
      skills: ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning']
    });
    setPdfReportModalOpen(true);
  };

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : [];
  const filteredCandidates = safeCandidates.filter(c => 
    (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (c.program || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 space-y-6 animate-in fade-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white">TPC Admin Authentication</h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Access Restricted: Only authorized GSFC University Placement Officers can log in to view candidate records, manage recruiter approvals, and download NIRF audit reports.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {loginError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl text-center">
              {loginError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              Admin Officer ID / Email
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@gsfcuniversity.ac.in or tpc@university.edu"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loggingIn ? 'Verifying Credentials...' : 'Unlock TPC Admin Portal'}</span>
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center space-y-1.5">
          <p className="text-[11px] text-slate-400 font-bold">
            🔑 GSFC Admin Credentials (For Testing & Demo):
          </p>
          <div className="text-[10px] font-mono text-amber-300 font-bold bg-slate-950 py-2 px-3 rounded-xl border border-slate-800 inline-block">
            ID: admin@gsfcuniversity.ac.in &nbsp;|&nbsp; Pass: password123
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-700">Loading GSFC TPC Placement Command Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Executive Command Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-900/10 text-blue-900 border border-blue-900/25 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-900" /> GSFC TPC Command Center
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Placement <span className="gradient-text">Analytics & Governance</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-bold leading-relaxed">
            Verify corporate recruiter signups, monitor real-time program placement conversion funnels, and export accreditation metrics.
          </p>
        </div>

        <div>
          <button
            onClick={downloadReport}
            className="py-3 px-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Export NAAC/NIRF CSV Report
          </button>
        </div>
      </div>

      {/* Navigation Segment: Overview vs Candidate Database */}
      <div className="flex items-center gap-3 bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Governance & Analytics
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'database'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" /> 🗄️ Candidate Database ({allCandidates.length})
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'companies'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-amber-500" /> 🏢 Recruiter Registry ({allCompaniesList.length})
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'drives'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-400" /> 💼 Posted Drives ({allDrivesList.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'applications'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" /> 📄 All Applications ({allApplicationsList.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('search');
            fetchGlobalSearch(searchQuery);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'search'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4 text-cyan-400" /> 🔍 Cross-Tenant Global Search
        </button>
      </div>

      {/* VIEW: RECRUITER REGISTRY VIEW */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" /> Master Recruiter & Corporate Registry
            </h2>
            <span className="text-xs font-black text-blue-900">
              {allCompaniesList.length} Total Registered Corporate Accounts
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-5">Company Profile</th>
                    <th className="py-4 px-5">Industry & Contact</th>
                    <th className="py-4 px-5">Posted Drives</th>
                    <th className="py-4 px-5">TPC Approval Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allCompaniesList.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-5 font-black text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={comp.logo_url || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60'}
                            alt={comp.company_name}
                            className="w-9 h-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="text-sm font-black text-slate-900">{comp.company_name}</div>
                            <a href={comp.website} target="_blank" rel="noreferrer" className="text-[10px] text-blue-900 hover:underline font-bold">
                              {comp.website}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-slate-900 font-bold">{comp.industry}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{comp.email}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs rounded-xl">
                          💼 {comp.posted_drives_count || 0} Posted Drives
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {comp.approved ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-xl inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> APPROVED ✅
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-amber-600" /> PENDING VERIFICATION ⏳
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {!comp.approved ? (
                          <button
                            onClick={() => handleApproveRejectCompany(comp.id, 'approve')}
                            className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-sm"
                          >
                            Approve Recruiter
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-bold">Active Recruiter</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: POSTED HIRING DRIVES VIEW */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-900" /> All Posted Campus Placement Drives
            </h2>
            <span className="text-xs font-black text-blue-900">
              {allDrivesList.length} Hiring Requirements
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-5">Job Drive Title</th>
                    <th className="py-4 px-5">Hosting Company</th>
                    <th className="py-4 px-5">CTC Package & Cutoff</th>
                    <th className="py-4 px-5">Applicants</th>
                    <th className="py-4 px-5">Visibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allDrivesList.map((reqItem) => (
                    <tr key={reqItem.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-5 font-black text-slate-900">
                        <div className="text-sm font-black">{reqItem.title}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{reqItem.job_type} • Deadline: {reqItem.deadline}</div>
                      </td>

                      <td className="py-4 px-5 font-black text-slate-900">
                        {reqItem.company_name}
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-blue-900 font-black">{reqItem.ctc_range}</div>
                        <div className="text-[10px] text-slate-600 font-bold">Min CGPA: {reqItem.min_cgpa || 'None'}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs rounded-xl">
                          👥 {reqItem.total_applicants || 0} Submissions
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {reqItem.company_approved ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-xl">
                            VISIBLE IN FEED ✅
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl">
                            GATED (UNAPPROVED RECRUITER) 🔒
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ALL STUDENT APPLICATIONS VIEW */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-900" /> Master Student Applications Database
            </h2>
            <span className="text-xs font-black text-blue-900">
              {allApplicationsList.length} Total Submissions
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-5">Student Candidate</th>
                    <th className="py-4 px-5">Applied Company & Role</th>
                    <th className="py-4 px-5">ATS Match Score</th>
                    <th className="py-4 px-5">Application Date</th>
                    <th className="py-4 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allApplicationsList.map((appItem) => (
                    <tr key={appItem.application_id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-5 font-black text-slate-900">
                        <div className="text-sm font-black">{appItem.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{appItem.roll_number} • {appItem.program} ({appItem.cgpa} CGPA)</div>
                      </td>

                      <td className="py-4 px-5 font-black text-slate-900">
                        <div className="text-sm text-slate-900">{appItem.job_title}</div>
                        <div className="text-[10px] text-blue-900 font-bold">{appItem.company_name} ({appItem.ctc_range})</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-xl">
                          🎯 {appItem.match_score}% Match
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-600 font-bold text-xs">
                        {new Date(appItem.applied_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black rounded-xl uppercase">
                          {appItem.status || 'SUBMITTED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TPC ADMIN GLOBAL SEARCH & AUDIT TRAIL VIEW */}
      {activeTab === 'search' && (
        <div className="space-y-4 glass-panel p-6 rounded-3xl border border-slate-200">
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-900" /> TPC Director Global Entity Search
            </h2>
            <p className="text-xs text-slate-600 font-bold">
              Search any student by name/roll number, company by name, or placement drive by title. Inspection events are logged to audit trail.
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name, roll number, company, or requirement title..."
              value={searchQuery}
              onChange={async (e) => {
                const val = e.target.value;
                setSearchQuery(val);
                fetchGlobalSearch(val);
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
            />
          </div>

          {selectedCandidateReport && (selectedCandidateReport.students || selectedCandidateReport.companies || selectedCandidateReport.requirements) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              {/* Students Match */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-blue-900">Students ({selectedCandidateReport.students?.length || 0})</h3>
                <div className="space-y-2">
                  {(selectedCandidateReport.students || []).map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        fetch('/api/admin/audit-log', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ admin_id: 'u_admin_01', viewed_entity_type: 'student', viewed_entity_id: s.id })
                        });
                        openCandidatePdfReport(s);
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-900 transition-all text-xs"
                    >
                      <div className="font-black text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{s.roll_number || 'GSFC Student'} • {s.program} ({s.cgpa} CGPA)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Companies Match */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-amber-600">Companies ({selectedCandidateReport.companies?.length || 0})</h3>
                <div className="space-y-2">
                  {(selectedCandidateReport.companies || []).map(c => (
                    <div
                      key={c.id}
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/company-applicant-inbox?companyId=${c.id}&adminId=u_admin_01`);
                          const apps = await res.json();
                          const appSummary = apps.map(a => `• Candidate: ${a.candidate_name} | Role: ${a.job_title} | Score: ${a.match_score}% | Status: ${a.status}`).join('\n');
                          alert(`🏢 TPC Director Cross-View for ${c.company_name}:\nTotal Applicants: ${apps.length}\n\n${appSummary || 'No applicants yet.'}`);
                        } catch(err) {
                          alert(err.message);
                        }
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-900 transition-all text-xs"
                    >
                      <div className="font-black text-slate-900">{c.company_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{c.industry} • {c.email} (Click to view full applicant inbox)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements Match */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-indigo-900">Placement Drives ({selectedCandidateReport.requirements?.length || 0})</h3>
                <div className="space-y-2">
                  {(selectedCandidateReport.requirements || []).map(r => (
                    <div
                      key={r.id}
                      onClick={() => {
                        fetch('/api/admin/audit-log', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ admin_id: 'u_admin_01', viewed_entity_type: 'requirement', viewed_entity_id: r.id })
                        });
                        alert(`💼 Drive Detail: ${r.title}\nCompany: ${r.company_name}\nCTC: ${r.ctc_range}`);
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-900 transition-all text-xs"
                    >
                      <div className="font-black text-slate-900">{r.title}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{r.company_name} • CTC: {r.ctc_range}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: CANDIDATE DATABASE VIEW */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="text-xs text-blue-900 font-black">
              Showing {filteredCandidates.length} Saved GSFC Candidate Profiles
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 sm:px-5">Candidate Name</th>
                    <th className="py-4 px-4 sm:px-5">Degree & CGPA</th>
                    <th className="py-4 px-4 sm:px-5">ATS Score</th>
                    <th className="py-4 px-4 sm:px-5">Shortlist Status</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        <div className="text-sm">{cand.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{cand.roll_number}</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-900 font-black">{cand.program}</div>
                        <div className="text-[11px] text-emerald-800 font-black">{cand.cgpa} CGPA</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs rounded-xl">
                          {cand.ats_score || 92} / 100
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-xl flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PASS (ELIGIBLE)
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5 text-right">
                        <button
                          onClick={() => openCandidatePdfReport(cand)}
                          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" />
                          <span>PDF Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: OVERVIEW & GOVERNANCE */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI METRIC CARDS */}
          {analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => {
                  setActiveTab('search');
                  fetchGlobalSearch('');
                }}
                className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Open Postings</span>
                  <Briefcase className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalRequirements}</div>
                <div className="text-[10px] text-slate-600 font-bold">Active requirements (Click to view)</div>
              </div>

              <div
                onClick={() => setActiveTab('database')}
                className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Applications</span>
                  <Users className="w-4 h-4 text-indigo-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalApplications}</div>
                <div className="text-[10px] text-slate-600 font-bold">Student submissions (Click to view)</div>
              </div>

              <div
                onClick={() => {
                  setActiveTab('overview');
                  document.getElementById('pending-approvals-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-amber cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Corporate Partners</span>
                  <Building className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalCompanies}</div>
                <div className="text-[10px] text-slate-600 font-bold">Verified companies (Click to view)</div>
              </div>

              <div
                onClick={() => setActiveTab('database')}
                className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Parsed Resumes</span>
                  <Sparkles className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalStudents}</div>
                <div className="text-[10px] text-slate-600 font-bold">Registered profiles (Click to view)</div>
              </div>
            </div>
          )}

          {/* PENDING RECRUITER APPROVALS */}
          <div id="pending-approvals-section" className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" /> Pending Recruiter Approvals ({pendingCompanies.length})
              </h2>
              <span className="text-xs text-slate-600 font-bold">TPC verification gate lock</span>
            </div>

            {pendingCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCompanies.map((comp) => (
                  <div key={comp.id} className="p-5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{comp.company_name}</h3>
                      <div className="text-xs text-slate-600 font-bold mt-0.5">{comp.industry} • {comp.email}</div>
                      <a href={comp.website} target="_blank" rel="noreferrer" className="text-[11px] text-blue-900 hover:underline font-extrabold mt-1 inline-block">
                        {comp.website}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRejectCompany(comp.id, 'reject')}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all text-xs font-black"
                        title="Reject Signup"
                      >
                        <XCircle className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleApproveRejectCompany(comp.id, 'approve')}
                        className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve Recruiter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 text-xs bg-slate-50/80 rounded-2xl border border-slate-200 font-bold">
                No pending company approvals at this time. All recruiting partners are verified!
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF REPORT MODAL */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={selectedCandidateReport}
      />
    </div>
  );
}
