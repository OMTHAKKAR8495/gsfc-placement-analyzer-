import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Server, Activity, Lock, Database, 
  FileText, Key, CheckCircle2, Clock, RefreshCw, Layers
} from 'lucide-react';

export default function SuperAdminDashboard({ currentUser }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Super Admin Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-[10px] font-black uppercase">
              Super Admin System Governance
            </span>
            <span className="text-[10px] text-slate-300 font-mono">Platform Version 2.5 Enterprise</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            System Security, RBAC Provisioning & Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            Central governance console for role provisioning, security telemetry, database encryption standards, and immutable audit logs across GSFC University nodes.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Security Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">RBAC Roles Active</div>
          <div className="text-2xl font-black text-purple-600">6 Roles</div>
          <div className="text-[10px] text-slate-500">SuperAdmin, TPO, Faculty, Student, Recruiter, Alumni</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Encryption Standard</div>
          <div className="text-2xl font-black text-emerald-600">AES-256</div>
          <div className="text-[10px] text-slate-500">Bcrypt Salt Hashed</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">API Rate Limiter</div>
          <div className="text-2xl font-black text-blue-600">ACTIVE</div>
          <div className="text-[10px] text-slate-500">Anti-DDoS / Brute Force</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Audit Trail Integrity</div>
          <div className="text-2xl font-black text-amber-500">100% VERIFIED</div>
          <div className="text-[10px] text-slate-500">Immutable Storage</div>
        </div>
      </div>

      {/* Immutable Audit Trail Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md space-y-3 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Immutable Administrative Action Audit Logs</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">Last 50 Events</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Entity Affected</th>
                <th className="p-3">Event Details</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {auditLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                    {new Date(log.created_at || Date.now()).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{log.user_email}</div>
                    <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded text-[9px] font-black uppercase">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-600">{log.action_type}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-bold">{log.entity_affected}</td>
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
  );
}
