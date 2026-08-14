import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, BarChart3, Download, Building, Users, Briefcase, FileSpreadsheet, Sparkles, TrendingUp, PieChart } from 'lucide-react';

export default function AdminDashboard() {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
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

      {/* PLACEMENT ANALYTICS & SKILLS DASHBOARD */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Program Placement Conversion Funnel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-900" /> Program Placement Conversion Funnel
            </h2>
            <div className="space-y-3">
              {analytics.programStats.map((prog, idx) => (
                <div key={idx} className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-black text-slate-900">
                    <span>{prog.program}</span>
                    <span className="text-blue-900">{prog.shortlisted_or_placed} Shortlisted / {prog.total_applications} Applied</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-blue-900 via-indigo-700 to-amber-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${prog.total_applications > 0 ? (prog.shortlisted_or_placed / prog.total_applications) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Requested Skills */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" /> Top In-Demand Tech Skills Across Postings
            </h2>
            <div className="space-y-2.5">
              {analytics.topSkills.map((sk, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/90 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-black text-slate-900">{sk.skill}</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 font-black rounded-lg text-xs">
                    {sk.count} Postings
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
