import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Filter, Search, Eye, X, Briefcase, FileText, Clock,
  MessageSquare, Database, ChevronDown, ChevronUp, Building2, Download,
  Phone, Mail, ShieldCheck, CheckCircle, XCircle, AlertCircle, Send, ExternalLink
} from 'lucide-react';

import QABoard from '../common/QABoard';

export default function FacultyDashboard({ currentUser, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('applications');
  
  // Tracker filter states
  const [department, setDepartment] = useState('ALL');
  const [minCgpa, setMinCgpa] = useState('0');
  const [minAts, setMinAts] = useState('0');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [placementStatus, setPlacementStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignedSuccessMsg, setAssignedSuccessMsg] = useState('');

  // Activity drawer
  const [selectedStudentActivity, setSelectedStudentActivity] = useState(null);

  // Application database
  const [expandedStudents, setExpandedStudents] = useState({});
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // WhatsApp Interview Modal
  const [waModal, setWaModal] = useState(null); // { student }
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);

  // Email Modal
  const [emailModal, setEmailModal] = useState(null); // { student }
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Doc Verification Modal
  const [docsModal, setDocsModal] = useState(null); // { student }
  const [docStatuses, setDocStatuses] = useState({});
  const [docsSaved, setDocsSaved] = useState(false);


  const fetchFacultyAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ department, minCgpa, minAts, skill: selectedSkill, status: placementStatus, search: searchQuery });
      const res = await fetch(`/api/faculty/department-analytics?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching faculty analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFacultyAnalytics(); }, [department, minCgpa, minAts, selectedSkill, placementStatus, searchQuery]);

  // ── PDF Report Generator ──────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const students = appDbStudents.length > 0 ? appDbStudents : (data?.students || []);
    const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const reportTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const statusBadge = (status) => {
      if (!status) return `<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase">—</span>`;
      const s = status.toLowerCase();
      const color = s.includes('placed') || s === 'selected' || s === 'offer' ? '#065f46;background:#d1fae5'
        : s === 'rejected' || s === 'declined' ? '#991b1b;background:#fee2e2'
        : s === 'interview' || s.includes('process') ? '#1e40af;background:#dbeafe'
        : s === 'shortlisted' ? '#6b21a8;background:#ede9fe'
        : '#92400e;background:#fef3c7';
      return `<span style="color:${color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase">${status}</span>`;
    };

    const studentRows = students.map((s, idx) => {
      const appsHtml = (s.applications && s.applications.length > 0)
        ? s.applications.map(app => `
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:6px 12px;font-size:11px;color:#1e293b;font-weight:600">${app.requirement_title || 'Software Engineer'}</td>
              <td style="padding:6px 12px;font-size:11px;color:#475569">${app.company_name || 'GSFC Limited'}</td>
              <td style="padding:6px 12px;font-size:11px;color:#059669;font-weight:700;text-align:center">${app.ctc_range || '—'}</td>
              <td style="padding:6px 12px;text-align:center">${statusBadge(app.status || 'Applied')}</td>
              <td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-align:right;font-family:monospace">
                ${app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
              </td>
            </tr>`).join('')
        : `<tr><td colspan="5" style="padding:10px 12px;font-size:11px;color:#94a3b8;font-style:italic">No applications submitted yet.</td></tr>`;

      const placedColor = s.placement_status === 'Placed' ? '#065f46;background:#d1fae5'
        : s.placement_status === 'In-Process' ? '#1e40af;background:#dbeafe'
        : '#64748b;background:#f1f5f9';

      return `
        <div style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;page-break-inside:avoid">
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#4f46e5);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;flex-shrink:0">
              ${(s.name || 'S').charAt(0)}
            </div>
            <div style="flex:1">
              <div style="font-weight:900;font-size:13px;color:#0f172a">${s.name}</div>
              <div style="font-size:10px;color:#64748b;font-family:monospace">${s.roll_number} · ${s.program}</div>
            </div>
            <div style="text-align:center;margin-right:16px">
              <div style="font-size:12px;font-weight:900;color:#059669">${s.cgpa}</div>
              <div style="font-size:9px;color:#94a3b8;text-transform:uppercase">CGPA</div>
            </div>
            <div style="text-align:center;margin-right:16px">
              <div style="font-size:12px;font-weight:900;color:#2563eb">${s.ats_score || 88}%</div>
              <div style="font-size:9px;color:#94a3b8;text-transform:uppercase">ATS</div>
            </div>
            <div style="text-align:center;margin-right:16px">
              <div style="font-size:12px;font-weight:900;color:#4f46e5">${s.applications_count || 0}</div>
              <div style="font-size:9px;color:#94a3b8;text-transform:uppercase">Applied</div>
            </div>
            <span style="color:${placedColor};padding:4px 10px;border-radius:6px;font-size:10px;font-weight:900;text-transform:uppercase">${s.placement_status}</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:6px 12px;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:900;text-align:left">Drive / Role</th>
                <th style="padding:6px 12px;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:900;text-align:left">Company</th>
                <th style="padding:6px 12px;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:900;text-align:center">CTC</th>
                <th style="padding:6px 12px;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:900;text-align:center">Status</th>
                <th style="padding:6px 12px;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:900;text-align:right">Date</th>
              </tr>
            </thead>
            <tbody>${appsHtml}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>GSFC University — Faculty Placement Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0f172a; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body style="padding:32px;max-width:960px;margin:0 auto">

  <!-- Letterhead -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #1e3a8a;margin-bottom:24px">
    <div style="display:flex;align-items:center;gap:16px">
      <div style="width:56px;height:56px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);border-radius:12px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-weight:900;font-size:18px">GU</span>
      </div>
      <div>
        <div style="font-size:20px;font-weight:900;color:#1e3a8a">GSFC University</div>
        <div style="font-size:11px;color:#64748b;font-weight:600">Training & Placement Cell · Faculty Placement Advisor Report</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#64748b">Generated by: <strong>${currentUser?.name || 'Faculty Advisor'}</strong></div>
      <div style="font-size:11px;color:#64748b">${reportDate} at ${reportTime}</div>
      <div style="margin-top:6px;padding:4px 12px;background:#1e3a8a;color:white;border-radius:6px;font-size:10px;font-weight:900;display:inline-block">CONFIDENTIAL — Faculty Use Only</div>
    </div>
  </div>

  <!-- Report Title -->
  <div style="margin-bottom:24px">
    <h1 style="font-size:22px;font-weight:900;color:#0f172a">Candidate Application Database Report</h1>
    <p style="font-size:12px;color:#64748b;margin-top:4px">Academic Year 2026-2027 · Department: ${department === 'ALL' ? 'All Departments' : department} · Status Filter: ${appStatusFilter === 'ALL' ? 'All' : appStatusFilter}</p>
  </div>

  <!-- KPI Summary -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
    ${[
      { label: 'Total Students', value: students.length, color: '#1e40af' },
      { label: 'Avg CGPA', value: `${data?.avg_cgpa || '—'}/10`, color: '#059669' },
      { label: 'Active Applicants', value: students.filter(s => s.applications_count > 0).length, color: '#4f46e5' },
      { label: 'Placement Rate', value: `${data?.placement_conversion_rate || 0}%`, color: '#d97706' },
    ].map(kpi => `
      <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
        <div style="font-size:9px;text-transform:uppercase;color:#94a3b8;font-weight:900;margin-bottom:4px">${kpi.label}</div>
        <div style="font-size:22px;font-weight:900;color:${kpi.color}">${kpi.value}</div>
      </div>`).join('')}
  </div>

  <!-- Student Records -->
  <h2 style="font-size:14px;font-weight:900;color:#0f172a;margin-bottom:14px;display:flex;align-items:center;gap:8px">
    📋 Student Application Records (${students.length} candidates)
  </h2>

  ${studentRows || '<p style="color:#94a3b8;font-style:italic">No student records found.</p>'}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#94a3b8">GSFC University Placement Portal · Confidential Faculty Report</div>
    <div style="font-size:10px;color:#94a3b8">Page 1 of 1</div>
  </div>

  <!-- Print Button (hidden when printing) -->
  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:12px 32px;background:#1e3a8a;color:white;border:none;border-radius:8px;font-size:14px;font-weight:900;cursor:pointer">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding:12px 24px;margin-left:12px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;font-weight:900;cursor:pointer">
      ✕ Close
    </button>
  </div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=750,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
      // Auto-trigger print after a short delay for assets to load
      setTimeout(() => win.print(), 600);
    } else {
      alert('Please allow popups for this site to download the PDF report.');
    }
  };

  const handleOpenStudentActivity = async (student) => {
    try {
      const res = await fetch(`/api/faculty/student-activity/${student.id}`);
      const json = await res.json();
      setSelectedStudentActivity(json);
    } catch (err) {
      setSelectedStudentActivity(student);
    }
  };

  const handleAssignTraining = async (student) => {
    try {
      const res = await fetch('/api/faculty/assign-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, studentName: student.name, trainingModule: '14-Day DSA & Technical Interview Sprint', deadlineDays: 14 })
      });
      const resData = await res.json();
      setAssignedSuccessMsg(resData.message);
      setTimeout(() => setAssignedSuccessMsg(''), 4000);
    } catch (err) {}
  };

  const clearFilters = () => { setDepartment('ALL'); setMinCgpa('0'); setMinAts('0'); setSelectedSkill(''); setPlacementStatus('ALL'); setSearchQuery(''); };

  const toggleStudentExpand = (studentId) => setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));

  // ── Open WhatsApp modal with pre-filled interview message ──────────────────
  const openWaModal = (student) => {
    setWaPhone(student.phone || '');
    setWaMessage(
`Dear ${student.name},

This is to inform you that you have been shortlisted for a Campus Placement Interview at GSFC University.

📅 Interview Details will be shared by the Training & Placement Cell (TPC) shortly.

Please carry the following documents:
• Updated Resume (2 copies)
• All Semester Marksheets
• Aadhar Card / Govt. ID Proof
• Passport Size Photographs (2)

For any queries, contact the TPC office.

Best Regards,
${currentUser?.name || 'Faculty Advisor'}
GSFC University — T&P Cell`);
    setWaSending(false);
    setWaModal({ student });
  };

  const sendWhatsApp = () => {
    if (!waPhone.trim()) return alert('Please enter a valid WhatsApp number (with country code, e.g. 919876543210)');
    const cleaned = waPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(waMessage);
    window.open(`https://wa.me/${cleaned}?text=${encoded}`, '_blank');
    setWaSending(true);
    setTimeout(() => { setWaModal(null); setWaSending(false); }, 800);
  };

  // ── Open Email modal with pre-filled template ──────────────────────────────
  const openEmailModal = (student) => {
    setEmailSubject(`Campus Placement Interview Invitation — GSFC University`);
    setEmailBody(
`Dear ${student.name} (${student.roll_number}),

We are pleased to inform you that you have been shortlisted for a Campus Placement Interview at GSFC University.

Your Profile:
• CGPA: ${student.cgpa}
• Program: ${student.program}
• ATS Compliance: ${student.ats_score || 88}%

Full interview schedule and venue details will be communicated by the TPC office shortly.

Please ensure your documents are in order before the interview date.

Best Regards,
${currentUser?.name || 'Faculty Advisor'}
Training & Placement Cell
GSFC University, Vadodara`);
    setEmailModal({ student });
  };

  const sendEmail = (student) => {
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:${student.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // ── Doc Verification Modal ─────────────────────────────────────────────────
  const openDocsModal = (student) => {
    // Simulate documents from student's resume/profile data
    const mockDocs = [
      { id: 'resume', label: '📄 Resume / CV', status: student.resume_url ? 'uploaded' : 'missing', url: student.resume_url || null },
      { id: 'marksheet', label: '📋 All Semester Marksheets', status: 'uploaded', url: null },
      { id: 'id_proof', label: '🪪 Aadhar / Govt. ID Proof', status: 'uploaded', url: null },
      { id: 'photo', label: '🖼️ Passport Size Photo', status: 'uploaded', url: null },
      { id: 'noc', label: '📝 No-Objection Certificate', status: 'missing', url: null },
      { id: 'offer_letter', label: '📑 Previous Offer Letter (if any)', status: student.placement_status === 'Placed' ? 'uploaded' : 'missing', url: null },
    ];
    const initial = {};
    mockDocs.forEach(d => { initial[d.id] = d.status === 'uploaded' ? 'pending' : 'missing'; });
    setDocStatuses(initial);
    setDocsSaved(false);
    setDocsModal({ student, docs: mockDocs });
  };

  const saveDocVerification = () => {
    setDocsSaved(true);
    setTimeout(() => { setDocsModal(null); setDocsSaved(false); }, 1500);
  };


  const appDbStudents = (data?.students || []).filter(s => {
    const matchesSearch = !appSearchQuery ||
      (s.name || '').toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(appSearchQuery.toLowerCase());
    const matchesStatus = appStatusFilter === 'ALL' || s.placement_status === appStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-600';
    const s = status.toLowerCase();
    if (s === 'selected' || s === 'placed' || s === 'offer') return 'bg-emerald-100 text-emerald-800';
    if (s === 'rejected' || s === 'declined') return 'bg-red-100 text-red-700';
    if (s === 'interview' || s === 'in-process') return 'bg-blue-100 text-blue-800';
    if (s === 'shortlisted') return 'bg-purple-100 text-purple-800';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn">

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase">Faculty Mentorship & Guidance Hub</span>
            <span className="text-[10px] text-slate-300 font-mono">GSFC University • Academic Year 2026-2027</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Faculty Placement Advisor Portal</h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            View who applied where in the Application Database, filter candidates, inspect full activity dossiers, and answer student placement doubts with official Faculty verification.
          </p>
        </div>
        <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold text-slate-200 border border-white/20 shrink-0">
          {currentUser?.name || 'Dr. Rajesh Sharma'} · Faculty
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: data?.total_students || 0, color: 'text-blue-900 dark:text-blue-400', sub: 'In Database' },
          { label: 'Avg CGPA', value: `${data?.avg_cgpa || '0.00'}/10`, color: 'text-emerald-600', sub: 'Academic Standing' },
          { label: 'Active Applicants', value: data?.students?.filter(s => s.applications_count > 0).length || 0, color: 'text-indigo-600', sub: 'Applied to Drives' },
          { label: 'Placement Rate', value: `${data?.placement_conversion_rate || 0}%`, color: 'text-amber-500', sub: 'Offer Conversion' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-[10px] font-black uppercase text-slate-400">{kpi.label}</div>
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-slate-500">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
        {[
          { id: 'applications', icon: <Database className="w-4 h-4 text-indigo-300" />, label: '📋 Application Database', activeClass: 'bg-indigo-700' },
          { id: 'tracker', icon: <Users className="w-4 h-4 text-emerald-400" />, label: '🔍 Student Filter & Activity', activeClass: 'bg-blue-900' },
          { id: 'doubts', icon: <MessageSquare className="w-4 h-4 text-amber-300" />, label: '💬 Answer Student Doubts', activeClass: 'bg-emerald-700' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === tab.id ? `${tab.activeClass} text-white shadow-md` : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {assignedSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-between">
          <span>{assignedSuccessMsg}</span>
          <button onClick={() => setAssignedSuccessMsg('')} className="p-1 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: APPLICATION DATABASE                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">

          {/* Search bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white shrink-0">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Candidate Application Database</span>
              <span className="text-[10px] font-bold text-slate-400">— see which student applied to which drive</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input type="text" value={appSearchQuery} onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="Search name / roll no..." className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold w-52 text-slate-800 dark:text-slate-200 placeholder-slate-400" />
              </div>
              <select value={appStatusFilter} onChange={(e) => setAppStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                <option value="ALL">All Statuses</option>
                <option value="Placed">Placed</option>
                <option value="In-Process">In-Process</option>
                <option value="Unplaced">Not Applied</option>
              </select>
              <span className="text-[10px] font-bold text-slate-400 self-center">{appDbStudents.length} student{appDbStudents.length !== 1 ? 's' : ''}</span>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                title="Download PDF report of Application Database"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF Report
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm font-bold animate-pulse">Loading candidate data...</div>
          ) : appDbStudents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-bold bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              No students found.
            </div>
          ) : (
            <div className="space-y-2">
              {appDbStudents.map((s, idx) => (
                <div key={s.id || idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Student row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors select-none"
                    onClick={() => toggleStudentExpand(s.id || idx)}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(s.name || 'S').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-slate-900 dark:text-white truncate">{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.roll_number} · {s.program}</div>
                    </div>
                    <div className="hidden sm:block text-center px-3">
                      <div className="text-xs font-black text-emerald-600">{s.cgpa}</div>
                      <div className="text-[9px] text-slate-400 uppercase">CGPA</div>
                    </div>
                    <div className="hidden sm:block text-center px-3">
                      <div className={`text-xs font-black ${s.applications_count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{s.applications_count || 0}</div>
                      <div className="text-[9px] text-slate-400 uppercase">Drives Applied</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                      s.placement_status === 'Placed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : s.placement_status === 'In-Process' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>{s.placement_status}</span>
                    <div className="shrink-0 text-slate-400">
                      {expandedStudents[s.id || idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded applications list */}
                  {expandedStudents[s.id || idx] && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      {(!s.applications || s.applications.length === 0) ? (
                        <div className="px-5 py-4 text-xs text-slate-400 italic flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" />
                          This student has not applied to any placement drives yet.
                        </div>
                      ) : (
                        <>
                          {/* Sub-table header */}
                          <div className="grid grid-cols-12 px-5 py-2 text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800/80">
                            <div className="col-span-4">Drive / Role</div>
                            <div className="col-span-3">Company</div>
                            <div className="col-span-2 text-center">CTC</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-1 text-right">Date</div>
                          </div>
                          {s.applications.map((app, aIdx) => (
                            <div key={aIdx} className="grid grid-cols-12 px-5 py-2.5 items-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-xs border-t border-slate-100 dark:border-slate-800">
                              <div className="col-span-4 font-bold text-slate-900 dark:text-white truncate pr-2">
                                {app.requirement_title || 'Software Engineer'}
                              </div>
                              <div className="col-span-3 flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{app.company_name || 'GSFC Limited'}</span>
                              </div>
                              <div className="col-span-2 text-center font-bold text-emerald-700 dark:text-emerald-400 text-[10px]">
                                {app.ctc_range || '—'}
                              </div>
                              <div className="col-span-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusColor(app.status)}`}>
                                  {app.status || 'Applied'}
                                </span>
                              </div>
                              <div className="col-span-1 text-right text-[9px] text-slate-400 font-mono">
                                {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {/* Quick actions footer */}
                      <div className="px-5 py-2.5 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={() => handleOpenStudentActivity(s)}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors">
                          <Eye className="w-3 h-3" /> Full Activity Dossier
                        </button>
                        {s.placement_status !== 'Placed' && (
                          <button onClick={() => handleAssignTraining(s)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] cursor-pointer transition-colors">
                            Assign Training Sprint
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: STUDENT FILTER & ACTIVITY                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                <Filter className="w-4 h-4 text-blue-600" /> Candidate Filter & Skill Search Suite
              </div>
              {(department !== 'ALL' || minCgpa !== '0' || minAts !== '0' || selectedSkill || placementStatus !== 'ALL' || searchQuery) && (
                <button onClick={clearFilters} className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer">Reset Filters</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Department</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                  <option value="ALL">All Departments</option>
                  <option value="CSE">BTech CSE & IT</option>
                  <option value="Chemical">BTech Chemical</option>
                  <option value="Mechanical">BTech Mechanical</option>
                  <option value="Fire">BTech Fire & Safety</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Min CGPA</label>
                <select value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                  <option value="0">All CGPA</option>
                  <option value="6.5">≥ 6.5</option>
                  <option value="7.0">≥ 7.0</option>
                  <option value="7.5">≥ 7.5</option>
                  <option value="8.0">≥ 8.0</option>
                  <option value="8.5">≥ 8.5</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Min ATS</label>
                <select value={minAts} onChange={(e) => setMinAts(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                  <option value="0">All Scores</option>
                  <option value="70">≥ 70%</option>
                  <option value="80">≥ 80%</option>
                  <option value="90">≥ 90%</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Status</label>
                <select value={placementStatus} onChange={(e) => setPlacementStatus(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                  <option value="ALL">All</option>
                  <option value="Placed">Placed</option>
                  <option value="In-Process">In-Process</option>
                  <option value="Unplaced">Unplaced</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Required Skill</label>
                <input type="text" value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} placeholder="Python, SQL, DSA..." className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Name / Roll No</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-8 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Student table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Student Candidates List & Activity Verification
              </h3>
              <span className="text-xs font-bold text-slate-400 font-mono">Showing {data?.students?.length || 0} students</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Program</th>
                    <th className="p-3 text-center">CGPA</th>
                    <th className="p-3 text-center">ATS</th>
                    <th className="p-3 text-center">Applied</th>
                    <th className="p-3">Skills</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.students || []).map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold">{s.roll_number || '21BCE045'}</td>
                      <td className="p-3">
                        <div className="font-black text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.email}</div>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{s.program}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{s.cgpa}</td>
                      <td className="p-3 text-center font-black text-blue-600">{s.ats_score || 88}%</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${s.applications_count > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                          {s.applications_count || 0} drives
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.skills?.slice(0, 3).map((sk, i) => <span key={i} className="px-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[9px] font-mono font-bold">{sk}</span>)}
                          {s.skills?.length > 3 && <span className="text-[9px] text-slate-400">+{s.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          s.placement_status === 'Placed' ? 'bg-emerald-100 text-emerald-800'
                          : s.placement_status === 'In-Process' ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                        }`}>{s.placement_status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end flex-wrap gap-1">
                          <button onClick={() => handleOpenStudentActivity(s)}
                            title="View full activity dossier"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors text-slate-600 dark:text-slate-300">
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button onClick={() => openWaModal(s)}
                            title="Send WhatsApp interview notification"
                            className="p-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg cursor-pointer transition-colors border border-green-200 dark:border-green-800">
                            <Phone className="w-3.5 h-3.5 text-green-600" />
                          </button>
                          <button onClick={() => openEmailModal(s)}
                            title="Send email invitation"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer transition-colors border border-blue-200 dark:border-blue-800">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button onClick={() => openDocsModal(s)}
                            title="Verify uploaded documents"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-lg cursor-pointer transition-colors border border-amber-200 dark:border-amber-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button onClick={() => handleAssignTraining(s)}
                            title="Assign training sprint"
                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] cursor-pointer transition-colors">
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: ANSWER STUDENT DOUBTS                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'doubts' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs">
            <Award className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-black text-emerald-950 dark:text-emerald-200">Official Faculty Placement Advisory Desk</span>
              <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                All your answers will be badged with <strong>🎓 VERIFIED FACULTY ADVISOR</strong> to guide students through recruitment doubts.
              </p>
            </div>
          </div>
          <QABoard currentUser={currentUser} onOpenAuth={onOpenAuth} />
        </div>
      )}

      {/* Activity Modal */}
      {selectedStudentActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedStudentActivity(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-950 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">{selectedStudentActivity.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">{selectedStudentActivity.roll_number} · {selectedStudentActivity.program} · CGPA: {selectedStudentActivity.cgpa}/10</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentActivity(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'ATS Compliance', value: `${selectedStudentActivity.ats_score}%`, color: 'text-blue-900 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
                  { label: 'Mock Interview', value: '91/100', color: 'text-purple-900 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
                  { label: 'Coding Sandbox', value: '95/100', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
                ].map((m, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${m.bg}`}>
                    <div className="text-[10px] font-black uppercase text-slate-400">{m.label}</div>
                    <div className={`text-lg font-black ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-black flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Applications & Recruitment History ({selectedStudentActivity.applications?.length || 0})
                </h4>
                {selectedStudentActivity.applications?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentActivity.applications.map((app, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="font-black">{app.requirement_title || 'Software Engineer'}</div>
                          <div className="text-[10px] text-slate-500">{app.company_name} · {app.ctc_range}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusColor(app.status)}`}>{app.status || 'Applied'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">No applications submitted yet.</div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-black flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" /> AI Mock Interviews & Assessments
                </h4>
                <div className="space-y-1.5">
                  {[
                    { title: 'Technical STAR Rubric Round (91%)', note: 'Strong communication and explanation of distributed systems.' },
                    { title: 'Proctored Kadane Algorithm Coding Sandbox (95%)', note: 'Integrity: 99.2% • 0 tab switches.' },
                  ].map((item, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-bold">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.note}</div>
                      </div>
                      <span className="text-emerald-600 font-black">Passed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════ */}
      {/* WHATSAPP INTERVIEW NOTIFICATION MODAL     */}
      {/* ══════════════════════════════════════════ */}
      {waModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setWaModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">📱 WhatsApp Interview Notification</h3>
                  <p className="text-[11px] text-green-100">{waModal.student.name} · {waModal.student.email}</p>
                </div>
              </div>
              <button onClick={() => setWaModal(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Student WhatsApp Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 font-mono text-xs">+</span>
                  <input type="tel" value={waPhone} onChange={e => setWaPhone(e.target.value)}
                    placeholder="919876543210 (country code + number, no spaces)"
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Enter full number with country code (91 for India)</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Message Template (editable)</label>
                <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} rows={11}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-[11px] text-green-800 dark:text-green-300">Clicking <strong>Send on WhatsApp</strong> will open WhatsApp Web / app with this pre-filled message ready to send.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setWaModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer">Cancel</button>
              <button onClick={sendWhatsApp} disabled={waSending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs cursor-pointer transition-colors disabled:opacity-60">
                <Phone className="w-3.5 h-3.5" />
                {waSending ? 'Opening WhatsApp...' : 'Send on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* EMAIL INTERVIEW INVITATION MODAL          */}
      {/* ══════════════════════════════════════════ */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setEmailModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-800 to-indigo-700 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">✉️ Email Interview Invitation</h3>
                  <p className="text-[11px] text-blue-100">To: {emailModal.student.email}</p>
                </div>
              </div>
              <button onClick={() => setEmailModal(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">To</label>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-600 dark:text-slate-300">{emailModal.student.email}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Subject</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Body (editable)</label>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={11}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-[11px] text-blue-800 dark:text-blue-300">Clicking <strong>Open in Mail App</strong> will launch your default mail client with this pre-filled email ready to send.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setEmailModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer">Cancel</button>
              <button onClick={() => sendEmail(emailModal.student)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-black text-xs cursor-pointer transition-colors">
                <Mail className="w-3.5 h-3.5" /> Open in Mail App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* DOCUMENT VERIFICATION MODAL              */}
      {/* ══════════════════════════════════════════ */}
      {docsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDocsModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">🛡️ Document Verification</h3>
                  <p className="text-[11px] text-amber-100">{docsModal.student.name} · {docsModal.student.roll_number} · {docsModal.student.program}</p>
                </div>
              </div>
              <button onClick={() => setDocsModal(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Review each document and mark as <strong className="text-emerald-600">✓ Verified</strong>, <strong className="text-red-500">✗ Rejected</strong>, or <strong className="text-amber-600">⚠ Pending</strong>. Status is saved in the student's placement dossier.
              </p>
              <div className="space-y-2">
                {docsModal.docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white">{doc.label}</div>
                      {doc.status === 'missing'
                        ? <div className="text-[10px] text-rose-500 font-bold mt-0.5">⚠️ Not uploaded by student</div>
                        : <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            {docStatuses[doc.id] === 'verified' ? '✅ Verified by Faculty'
                             : docStatuses[doc.id] === 'rejected' ? '❌ Rejected — request resubmit'
                             : '⏳ Awaiting verification'}
                          </div>
                      }
                    </div>
                    {doc.status !== 'missing' ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setDocStatuses(p => ({ ...p, [doc.id]: 'verified' }))}
                          title="Mark Verified"
                          className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                            docStatuses[doc.id] === 'verified'
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-emerald-300'
                          }`}>
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDocStatuses(p => ({ ...p, [doc.id]: 'rejected' }))}
                          title="Reject / Request resubmit"
                          className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                            docStatuses[doc.id] === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/50 border-red-400 text-red-700 dark:text-red-300'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-red-300'
                          }`}>
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDocStatuses(p => ({ ...p, [doc.id]: 'pending' }))}
                          title="Mark Pending"
                          className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                            docStatuses[doc.id] === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-700 dark:text-amber-300'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-amber-300'
                          }`}>
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 shrink-0">Missing</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-5 pt-1 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1 pt-2"><CheckCircle className="w-3 h-3 text-emerald-600" /> Verified</span>
                <span className="flex items-center gap-1 pt-2"><XCircle className="w-3 h-3 text-red-500" /> Rejected</span>
                <span className="flex items-center gap-1 pt-2"><AlertCircle className="w-3 h-3 text-amber-500" /> Pending</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setDocsModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer">Cancel</button>
              <button onClick={saveDocVerification}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs cursor-pointer transition-colors ${
                  docsSaved ? 'bg-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {docsSaved ? '✅ Verification Saved!' : 'Save Verification Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
