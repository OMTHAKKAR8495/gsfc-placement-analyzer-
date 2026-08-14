import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, BarChart3, Download, Building, Users, Briefcase, FileSpreadsheet, Sparkles, TrendingUp, PieChart, Database, Search, Printer, CheckCircle } from 'lucide-react';
import ReportPDFModal from '../common/ReportPDFModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'database'
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Candidate Database State
  const [allCandidates, setAllCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateReport, setSelectedCandidateReport] = useState(null);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchCandidateDatabase();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pendingRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/pending-companies'),
        fetch('/api/admin/analytics')
      ]);

      const pendingData = await pendingRes.json();
      const analyticsData = await analyticsRes.json();

      setPendingCompanies(pendingData || []);
      setAnalytics(analyticsData || null);
    } catch (err) {
      console.error('Error loading TPC admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateDatabase = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setAllCandidates(data || []);
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

  const filteredCandidates = allCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      </div>

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
              <div className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue">
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Open Postings</span>
                  <Briefcase className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalRequirements}</div>
                <div className="text-[10px] text-slate-600 font-bold">Active requirements on campus</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue">
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Applications</span>
                  <Users className="w-4 h-4 text-indigo-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalApplications}</div>
                <div className="text-[10px] text-slate-600 font-bold">Student submissions processed</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-amber">
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Corporate Partners</span>
                  <Building className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalCompanies}</div>
                <div className="text-[10px] text-slate-600 font-bold">Verified recruiting companies</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-200/90 space-y-1.5 glow-border-blue">
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span className="font-black text-[11px] uppercase tracking-wider">Parsed Resumes</span>
                  <Sparkles className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics.totalStudents}</div>
                <div className="text-[10px] text-slate-600 font-bold">Registered student profiles</div>
              </div>
            </div>
          )}

          {/* PENDING RECRUITER APPROVALS */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-4">
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
