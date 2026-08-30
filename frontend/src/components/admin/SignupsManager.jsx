import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, Search, Filter, RefreshCw, Download, 
  CheckCircle2, XCircle, ShieldAlert, Building, GraduationCap, 
  ShieldCheck, Award, Clock, Calendar, ChevronLeft, ChevronRight,
  FileSpreadsheet, AlertTriangle, Phone, Mail, Check, X, Shield, Lock, Unlock
} from 'lucide-react';

const API_BASE = '/api/admin';

export default function SignupsManager() {
  const [signups, setSignups] = useState([]);
  const [stats, setStats] = useState({
    totalSignups: 0,
    todaySignups: 0,
    weekSignups: 0,
    pendingApprovals: 0,
    roleBreakdown: { student: 0, company: 0, faculty: 0, alumni: 0, security: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Filters State
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    fetchSignups();
  }, [roleFilter, statusFilter, datePreset, currentPage, pageSize]);

  const fetchSignups = async (overrideSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        role: roleFilter,
        status: statusFilter,
        datePreset: datePreset,
        search: overrideSearch
      });

      const res = await fetch(`${API_BASE}/signups?${params}`);
      const data = await res.json();
      if (data.success) {
        setSignups(data.signups || []);
        setStats(data.stats || {});
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching signups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSignups(search);
  };

  const handleStatusAction = async (userId, action, role) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`${API_BASE}/signups/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, role })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: data.message });
        fetchSignups();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to update status.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleExportCsv = () => {
    const url = `${API_BASE}/signups/export-csv?role=${encodeURIComponent(roleFilter)}&status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}`;
    window.open(url, '_blank');
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-200">
            <GraduationCap className="w-3 h-3 text-blue-700" /> Student
          </span>
        );
      case 'company':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
            <Building className="w-3 h-3 text-amber-700" /> Recruiter
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-700" /> Faculty
          </span>
        );
      case 'alumni':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
            <Award className="w-3 h-3 text-purple-700" /> Alumni
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-700" /> Security
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
            <Users className="w-3 h-3 text-slate-600" /> {role}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified / Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Review
        </span>
      );
    }
    if (status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Restricted / Blocked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & KPI Overview Cards */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl bg-white/95 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-800 text-amber-300 flex items-center justify-center shadow-lg font-black shrink-0">
              <UserPlus className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Master User Signups & Account Registrations
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full text-[10px] font-black uppercase">
                  Whole Website Stream
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Real-time registry of all candidate, corporate recruiter, faculty, and alumni accounts registered on the portal.
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => fetchSignups()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={totalCount === 0}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📥 Export Signups CSV</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fadeIn ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Quick KPI Stat Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-blue-900 tracking-wider">Total Registered</p>
              <p className="text-xl font-black text-blue-950 mt-0.5">{stats.totalSignups || totalCount}</p>
            </div>
            <Users className="w-7 h-7 text-blue-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">Registered Today</p>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{stats.todaySignups || 0}</p>
            </div>
            <Calendar className="w-7 h-7 text-emerald-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Pending Approvals</p>
              <p className="text-xl font-black text-amber-950 mt-0.5">{stats.pendingApprovals || 0}</p>
            </div>
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Past 7 Days</p>
              <p className="text-xl font-black text-purple-950 mt-0.5">{stats.weekSignups || 0}</p>
            </div>
            <Clock className="w-7 h-7 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Advanced Multi-Filter Control Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md bg-white/95 space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, org, roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchSignups('');
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </form>

          {/* Filter Selectors */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-full sm:w-auto"
              >
                <option value="all">All Roles ({stats.totalSignups || totalCount})</option>
                <option value="student">🎓 Students ({stats.roleBreakdown?.student || 0})</option>
                <option value="company">🏢 Recruiters ({stats.roleBreakdown?.company || 0})</option>
                <option value="faculty">👩‍🏫 Faculty ({stats.roleBreakdown?.faculty || 0})</option>
                <option value="alumni">🎓 Alumni ({stats.roleBreakdown?.alumni || 0})</option>
                <option value="security">🛡️ Security ({stats.roleBreakdown?.security || 0})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-full sm:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="approved">✅ Active / Approved</option>
                <option value="pending">⏳ Pending Review ({stats.pendingApprovals || 0})</option>
                <option value="blocked">🚫 Restricted / Blocked</option>
              </select>
            </div>

            {/* Date Preset */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Timeframe:</label>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-full sm:w-auto"
              >
                <option value="all">All Time</option>
                <option value="today">Registered Today</option>
                <option value="yesterday">Registered Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Signups Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 shadow-xl overflow-hidden bg-white/95">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
            <p className="text-xs font-black text-slate-600">Loading user signups from database...</p>
          </div>
        ) : signups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-slate-800">No signups found matching your filters</h3>
            <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto">
              Try adjusting your role, status, or date filters to view user registrations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Organization / Branch</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered At</th>
                  <th className="py-3 px-4">Logins</th>
                  <th className="py-3 px-4 text-right">Admin Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {signups.map((user) => {
                  const isActionLoading = actionLoadingId === user.user_id;
                  return (
                    <tr key={user.user_id} className="hover:bg-blue-50/30 transition-all">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-xs">{user.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.roll_number && (
                          <div className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-1.5 py-0.2 rounded w-max mt-1">
                            Roll: {user.roll_number}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{user.organization_or_branch || 'N/A'}</div>
                        {user.designation_or_program && (
                          <div className="text-[10px] text-slate-500">{user.designation_or_program}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-mono text-xs flex items-center gap-1">
                          {user.phone ? (
                            <>
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(user.unified_status)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{formatRelativeTime(user.created_at)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatFullDate(user.created_at)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold font-mono text-[11px]">
                          {user.login_count} sessions
                        </span>
                      </td>

                      {/* Direct Admin Action Controls */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve for pending companies or alumni */}
                          {(user.role === 'company' || user.role === 'alumni') && user.unified_status === 'pending' && (
                            <button
                              onClick={() => handleStatusAction(user.user_id, 'approve', user.role)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Approve registration"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Block/Unblock actions for students/faculty/companies */}
                          {user.unified_status === 'blocked' ? (
                            <button
                              onClick={() => handleStatusAction(user.user_id, 'unblock', user.role)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Unblock and restore account access"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            user.role !== 'admin' && (
                              <button
                                onClick={() => handleStatusAction(user.user_id, 'block', user.role)}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                                title="Restrict account access"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Block</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-bold">
            Showing <span className="font-black text-slate-900">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span> to{' '}
            <span className="font-black text-slate-900">{Math.min(totalCount, currentPage * pageSize)}</span> of{' '}
            <span className="font-black text-slate-900">{totalCount}</span> user signups
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="px-3 py-1.5 bg-blue-900 text-white rounded-xl font-black text-xs">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages || 1, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
