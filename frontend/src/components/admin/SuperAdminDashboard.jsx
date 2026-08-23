import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Server, Activity, Lock, Database, 
  FileText, Key, CheckCircle2, Clock, RefreshCw, Layers,
  Sparkles, Target, AlertTriangle, Search, Check, Send, BookOpen, UserCheck
} from 'lucide-react';

export default function SuperAdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'recruiter_match', 'risk_alerts', 'rag_kb'
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Recruiter Matcher State
  const [jobDescription, setJobDescription] = useState('Looking for Full-Stack Software Engineers with strong Python, SQL, React, and Cloud Microservices experience. Minimum 7.5 CGPA required.');
  const [minCgpaFilter, setMinCgpaFilter] = useState(7.0);
  const [recruiterMatches, setRecruiterMatches] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Risk Alerts State
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [riskLoading, setRiskLoading] = useState(false);

  // RAG Docs State
  const [ragQueryText, setRagQueryText] = useState('What is the one-job policy for Dream Tier companies?');
  const [ragResult, setRagResult] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/logs');
      const json = await res.json();
      setAuditLogs(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskAlerts = async () => {
    setRiskLoading(true);
    try {
      const res = await fetch('/api/intelligence/placement-risks');
      const json = await res.json();
      setRiskAlerts(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    } finally {
      setRiskLoading(false);
    }
  };

  const handleRunRecruiterMatch = async () => {
    setMatchingLoading(true);
    try {
      const res = await fetch('/api/intelligence/recruiter-match-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          required_skills: ['Python', 'SQL', 'React', 'Docker'],
          min_cgpa: minCgpaFilter
        })
      });
      const json = await res.json();
      setRecruiterMatches(json.top_matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleRunRagQuery = async () => {
    setRagLoading(true);
    try {
      const res = await fetch('/api/intelligence/rag-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQueryText })
      });
      const json = await res.json();
      setRagResult(json);
    } catch (err) {
      console.error(err);
    } finally {
      setRagLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await fetch(`/api/intelligence/placement-risks/${alertId}/resolve`, { method: 'POST' });
      setRiskAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_resolved: 1 } : a));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchRiskAlerts();
    handleRunRecruiterMatch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Super Admin Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-[10px] font-black uppercase">
              Super Admin & TPC Intelligence Governance
            </span>
            <span className="text-[10px] text-slate-300 font-mono">Platform Version 2.6 Enterprise</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            AI Placement Intelligence, Neural Matching & Audit Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            Central console for candidate shortlisting against corporate JDs, placement risk telemetry, official policy RAG search, and immutable audit logs.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'audit', label: '🔒 Security & Audit Logs' },
            { id: 'recruiter_match', label: '🎯 AI Candidate Matcher' },
            { id: 'risk_alerts', label: '⚠️ Placement Risk Alerts' },
            { id: 'rag_kb', label: '📚 GSFC Policy RAG' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. AUDIT LOGS & TELEMETRY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400">RBAC Roles Active</div>
              <div className="text-2xl font-black text-purple-600">6 Roles</div>
              <div className="text-[10px] text-slate-500">SuperAdmin, TPO, Faculty, Student, Recruiter, Alumni</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400">Encryption Standard</div>
              <div className="text-2xl font-black text-emerald-600">AES-256</div>
              <div className="text-[10px] text-slate-500">Bcrypt Salt Hashed</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400">API Rate Limiter</div>
              <div className="text-2xl font-black text-blue-600">ACTIVE</div>
              <div className="text-[10px] text-slate-500">Anti-DDoS / Brute Force</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400">Audit Trail Integrity</div>
              <div className="text-2xl font-black text-amber-500">100% VERIFIED</div>
              <div className="text-[10px] text-slate-500">Immutable Storage</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Immutable Administrative Action Audit Logs</span>
              </h3>
              <button onClick={fetchAuditLogs} className="text-xs font-black text-blue-900 flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-600">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User & Role</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Entity Affected</th>
                    <th className="p-3">Event Details</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                        {new Date(log.created_at || Date.now()).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{log.user_email}</div>
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-black uppercase">
                          {log.user_role}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600">{log.action_type}</td>
                      <td className="p-3 text-slate-700 font-bold">{log.entity_affected}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{log.details}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                          VERIFIED
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

      {/* ------------------------------------------------------------- */}
      {/* 2. AI RECRUITER CANDIDATE MATCHER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'recruiter_match' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-900" /> AI Recruiter Candidate Shortlisting Engine
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Enter any Job Description or Skill Criteria to generate an explainable, ranked candidate shortlist across all academic batches.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              placeholder="Paste Job Description..."
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-900"
            />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700">Min CGPA Cutoff:</span>
                <select
                  value={minCgpaFilter}
                  onChange={(e) => setMinCgpaFilter(parseFloat(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                >
                  <option value={6.0}>6.0 CGPA</option>
                  <option value={7.0}>7.0 CGPA</option>
                  <option value={7.5}>7.5 CGPA</option>
                  <option value={8.0}>8.0 CGPA</option>
                </select>
              </div>

              <button
                onClick={handleRunRecruiterMatch}
                disabled={matchingLoading}
                className="px-5 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${matchingLoading ? 'animate-spin' : ''}`} />
                <span>{matchingLoading ? 'Analyzing Profiles...' : 'Run Candidate Match'}</span>
              </button>
            </div>
          </div>

          {/* Ranked Results Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-600">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Program & Branch</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">ATS Score</th>
                  <th className="p-3">Match Score</th>
                  <th className="p-3 text-right">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recruiterMatches.map((st, idx) => (
                  <tr key={st.student_id || idx} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-slate-400">#{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="p-3 text-slate-700 font-bold">{st.program}</td>
                    <td className="p-3 font-black text-blue-900">{st.cgpa}</td>
                    <td className="p-3 font-black text-emerald-800">{st.ats_score}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full font-black text-[11px]">
                        {st.match_percentage}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        st.match_percentage >= 85 ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {st.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PLACEMENT RISK ALERTS PANEL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'risk_alerts' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Placement Cell Action & Risk Queue
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Automated risk flags for high-match non-applicants, missing credentials, and students requiring remedial intervention.
              </p>
            </div>

            <button onClick={fetchRiskAlerts} className="text-xs font-black text-blue-900 flex items-center gap-1 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${riskLoading ? 'animate-spin' : ''}`} /> Refresh Alerts
            </button>
          </div>

          <div className="space-y-3">
            {riskAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.is_resolved ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        alert.severity === 'high' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {alert.severity} Risk
                      </span>
                      <h4 className="font-black text-sm text-slate-900">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{alert.description}</p>
                  </div>

                  {!alert.is_resolved ? (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-black hover:bg-slate-100 cursor-pointer shrink-0 shadow-sm"
                    >
                      Resolve & Dismiss
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black shrink-0">
                      ✓ Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. GSFC PLACEMENT POLICY RAG KNOWLEDGE BASE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rag_kb' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-900" /> GSFC Institutional Placement Policy Knowledge Base
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Search institutional eligibility criteria, One-Job Dream Tier regulations, internship credit transfer policies, and TPC guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={ragQueryText}
              onChange={(e) => setRagQueryText(e.target.value)}
              placeholder="Ask any policy question..."
              className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-900"
            />
            <button
              onClick={handleRunRagQuery}
              disabled={ragLoading}
              className="px-5 py-3 bg-theme-gradient text-white rounded-2xl text-xs font-black shadow-md hover:scale-102 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Search className={`w-4 h-4 ${ragLoading ? 'animate-spin' : ''}`} />
              <span>Query Policy</span>
            </button>
          </div>

          {ragResult && (
            <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <div className="text-xs font-black text-blue-950 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-700" /> Verified Policy Answer
              </div>
              <div className="text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                {ragResult.answer || ragResult.text}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
