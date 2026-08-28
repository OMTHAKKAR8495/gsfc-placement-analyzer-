import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail, Inbox, Send, Search, Filter, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, ArrowUpRight, User, Phone, Video, Calendar, 
  Trash2, Eye, Reply, Check, RefreshCw, Download, FileText, 
  ChevronDown, ChevronUp, Sparkles, Building2, ExternalLink
} from 'lucide-react';
import { 
  getStudentMails, 
  getMailsForCompany, 
  markMailStatus, 
  replyToStudentMail, 
  deleteStudentMail 
} from '../../utils/studentMailStorage';
import { studentInboxStorage } from '../../utils/studentInboxStorage';
import { useToast } from '../../context/ToastContext';

export default function CompanyStudentMailReceiver({
  currentCompanyName = '',
  currentCompanyId = '',
  isGsfcPartner = false,
  currentUser = null
}) {
  const { showToast } = useToast();
  const [mails, setMails] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'meeting_absence' | 'leave_company' | 'general'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read' | 'replied'
  const [companyScope, setCompanyScope] = useState('current'); // 'current' | 'all'
  
  // Modals & Expanded views
  const [selectedMail, setSelectedMail] = useState(null);
  const [replyingMail, setReplyingMail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedMailId, setExpandedMailId] = useState(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    student_name: 'Om Thakkar',
    student_email: '24bt04171@gsfcuniversity.ac.in',
    subject: '🎉 Invitation for Technical Interview & System Design Round',
    event_stage: 'Technical Interview Round 1',
    scheduled_date: '2026-09-04',
    scheduled_time: '10:00 AM IST',
    meeting_link: 'https://meet.google.com/goo-gsfc-int',
    body: 'Dear Candidate,\n\nWe have reviewed your profile and ATS Resume. We are pleased to invite you to our upcoming placement round.\n\nPlease be available at the scheduled time.\n\nBest regards,\nRecruitment Team'
  });

  const resolvedCompanyName = useMemo(() => {
    if (isGsfcPartner) return 'GSFC Limited';
    const email = (currentUser?.email || '').toLowerCase();
    if (email.includes('google')) return 'Google Cloud India';
    if (email.includes('microsoft')) return 'Microsoft Azure Systems';
    if (email.includes('tcs') || email.includes('tata')) return 'Tata Consultancy Services (TCS)';
    if (email.includes('gsfc')) return 'GSFC Limited';

    if (currentCompanyName && currentCompanyName !== 'Recruiting Partner') return currentCompanyName;
    if (currentUser?.company_name && currentUser?.company_name !== 'Corporate Partner' && currentUser?.company_name !== 'GSFC Recruiter') return currentUser.company_name;
    if (currentUser?.name && currentUser?.name !== 'GSFC Recruiter') return currentUser.name;
    return 'Google Cloud India';
  }, [currentCompanyName, isGsfcPartner, currentUser]);

  const loadMails = async () => {
    const local = getStudentMails();
    setMails(local);

    try {
      const res = await fetch('/api/company/student-mails');
      if (res.ok) {
        const serverMails = await res.json();
        if (Array.isArray(serverMails) && serverMails.length > 0) {
          const idMap = new Map();
          serverMails.forEach(m => idMap.set(m.id, m));
          local.forEach(m => idMap.set(m.id, { ...idMap.get(m.id), ...m }));
          const merged = Array.from(idMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          setMails(merged);
          localStorage.setItem('gsfc_student_company_mails', JSON.stringify(merged));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadMails();

    const handleUpdate = () => {
      loadMails();
    };

    window.addEventListener('gsfc_student_mail_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gsfc_student_mail_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filtered Mails based on company scope, search, and tab filters
  const filteredMails = useMemo(() => {
    return mails.filter((mail) => {
      // 1. Company scope filter
      if (companyScope === 'current') {
        const mailComp = (mail.company_name || '').toLowerCase();
        const mailId = (mail.company_id || '').toLowerCase();
        const targetComp = resolvedCompanyName.toLowerCase();

        if (isGsfcPartner) {
          const isGsfc = mailComp.includes('gsfc') || mailId.includes('gsfc');
          if (!isGsfc) return false;
        } else {
          // Check intelligent match
          const matchesComp = 
            mailComp.includes(targetComp) || 
            targetComp.includes(mailComp) || 
            (targetComp.includes('google') && (mailComp.includes('google') || mailId.includes('google'))) ||
            (targetComp.includes('microsoft') && (mailComp.includes('microsoft') || mailId.includes('microsoft'))) ||
            (targetComp.includes('tcs') && (mailComp.includes('tcs') || mailId.includes('tcs') || mailComp.includes('tata'))) ||
            (currentCompanyId && mailId === currentCompanyId.toLowerCase());
            
          if (!matchesComp) return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'meeting_absence' && mail.type !== 'meeting_absence' && mail.type !== 'other_reason') return false;
        if (typeFilter === 'leave_company' && mail.type !== 'leave_company') return false;
        if (typeFilter === 'general' && (mail.type === 'meeting_absence' || mail.type === 'leave_company')) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'unread' && mail.status !== 'unread') return false;
        if (statusFilter === 'read' && mail.status !== 'read') return false;
        if (statusFilter === 'replied' && mail.status !== 'replied') return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (mail.sender_name || '').toLowerCase().includes(q);
        const matchEmail = (mail.sender_email || '').toLowerCase().includes(q);
        const matchRoll = (mail.roll_number || '').toLowerCase().includes(q);
        const matchRoom = (mail.room_id || '').toLowerCase().includes(q);
        const matchSubject = (mail.subject || '').toLowerCase().includes(q);
        const matchMessage = (mail.message || '').toLowerCase().includes(q);
        const matchComp = (mail.company_name || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRoll && !matchRoom && !matchSubject && !matchMessage && !matchComp) {
          return false;
        }
      }

      return true;
    });
  }, [mails, companyScope, resolvedCompanyName, currentCompanyId, isGsfcPartner, typeFilter, statusFilter, searchQuery]);

  // Overall Statistics for current scope
  const stats = useMemo(() => {
    const scopeMails = mails.filter((mail) => {
      if (companyScope === 'all') return true;
      const mailComp = (mail.company_name || '').toLowerCase();
      const mailId = (mail.company_id || '').toLowerCase();
      const targetComp = resolvedCompanyName.toLowerCase();
      if (isGsfcPartner) {
        return mailComp.includes('gsfc') || mailId.includes('gsfc');
      }
      return (
        mailComp.includes(targetComp) || 
        targetComp.includes(mailComp) || 
        (targetComp.includes('google') && (mailComp.includes('google') || mailId.includes('google'))) ||
        (targetComp.includes('microsoft') && (mailComp.includes('microsoft') || mailId.includes('microsoft'))) ||
        (targetComp.includes('tcs') && (mailComp.includes('tcs') || mailId.includes('tcs') || mailComp.includes('tata'))) ||
        (currentCompanyId && mailId === currentCompanyId.toLowerCase())
      );
    });

    const total = scopeMails.length;
    const unread = scopeMails.filter(m => m.status === 'unread').length;
    const absences = scopeMails.filter(m => m.type === 'meeting_absence' || m.type === 'other_reason').length;
    const withdrawals = scopeMails.filter(m => m.type === 'leave_company').length;
    const replied = scopeMails.filter(m => m.status === 'replied').length;

    return { total, unread, absences, withdrawals, replied };
  }, [mails, companyScope, resolvedCompanyName, currentCompanyId, isGsfcPartner]);

  // Handle Mark Status
  const handleToggleReadStatus = (mail, e) => {
    if (e) e.stopPropagation();
    const newStatus = mail.status === 'unread' ? 'read' : 'unread';
    markMailStatus(mail.id, newStatus);
    showToast({
      type: 'info',
      title: newStatus === 'unread' ? 'Marked as Unread' : 'Marked as Read',
      message: `Mail from ${mail.sender_name} updated.`
    });
  };

  // Handle Delete
  const handleDelete = (mailId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this received student mail?')) return;
    deleteStudentMail(mailId);
    if (selectedMail?.id === mailId) setSelectedMail(null);
    if (replyingMail?.id === mailId) setReplyingMail(null);
    showToast({
      type: 'success',
      title: 'Mail Deleted',
      message: 'Student mail record removed from inbox.'
    });
  };

  // Handle Send Reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyingMail || !replyText.trim()) return;

    setSubmittingReply(true);
    const recruiterName = `${resolvedCompanyName} Talent Acquisition`;
    replyToStudentMail(replyingMail.id, replyText.trim(), recruiterName);

    // Also dispatch directly into the student's personal mailbox
    studentInboxStorage.sendMessage({
      student_email: replyingMail.sender_email || '24bt04171@gsfcuniversity.ac.in',
      student_name: replyingMail.sender_name || 'Om Thakkar',
      sender_type: 'company',
      sender_name: recruiterName,
      sender_email: currentUser?.email || 'campus.hiring@company.com',
      company_name: resolvedCompanyName,
      subject: `Response from ${resolvedCompanyName}: ${replyingMail.subject || 'Regarding your placement query'}`,
      body: replyText.trim(),
      event_stage: replyingMail.type === 'meeting_absence' ? 'Interview Reschedule Update' : 'Recruiter Communication'
    }, currentUser);

    setTimeout(() => {
      setSubmittingReply(false);
      setReplyingMail(null);
      setReplyText('');
      showToast({
        type: 'success',
        title: '✉️ Official Reply Dispatched!',
        message: `Your response has been sent to ${replyingMail.sender_name} (${replyingMail.sender_email}).`
      });
    }, 400);
  };

  const handleSendCompose = (e) => {
    e.preventDefault();
    if (!composeForm.student_email || !composeForm.subject || !composeForm.body) {
      showToast({ type: 'warning', title: 'Missing Information', message: 'Please fill in student email, subject, and message.' });
      return;
    }

    studentInboxStorage.sendMessage({
      student_name: composeForm.student_name,
      student_email: composeForm.student_email,
      sender_type: 'company',
      sender_name: `${resolvedCompanyName} Talent Acquisition`,
      sender_email: currentUser?.email || 'campus.hiring@company.com',
      company_name: resolvedCompanyName,
      subject: composeForm.subject,
      body: composeForm.body,
      event_stage: composeForm.event_stage,
      scheduled_date: composeForm.scheduled_date,
      scheduled_time: composeForm.scheduled_time,
      meeting_link: composeForm.meeting_link
    }, currentUser);

    setComposeModalOpen(false);
    showToast({
      type: 'success',
      title: '✉️ Interview Email Sent to Student!',
      message: `Delivered directly to ${composeForm.student_name} (${composeForm.student_email})'s Mailbox!`,
      triggerCrackles: true
    });
  };

  // Quick Reply Template Insertion
  const insertTemplate = (templateType) => {
    if (!replyingMail) return;
    if (templateType === 'reschedule_absence') {
      setReplyText(`Dear ${replyingMail.sender_name},\n\nWe have reviewed your explanation regarding your absence in interview session (${replyingMail.room_id || 'scheduled round'}). We understand the circumstances and have approved your reschedule request. Our recruitment panel will connect with you with an updated time slot.\n\nBest regards,\n${resolvedCompanyName} Hiring Team`);
    } else if (templateType === 'ack_withdrawal') {
      setReplyText(`Dear ${replyingMail.sender_name},\n\nWe have received and acknowledged your formal withdrawal request from our placement drive. Your candidacy status has been archived accordingly. We wish you great success in your career journey.\n\nWarm regards,\n${resolvedCompanyName} Talent Team`);
    } else if (templateType === 'request_info') {
      setReplyText(`Dear ${replyingMail.sender_name},\n\nThank you for reaching out to us. Could you please share your updated resume and available time slots for the upcoming 48 hours so our team can coordinate with the technical interviewers?\n\nRegards,\n${resolvedCompanyName} HR`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMails.length === 0) {
      alert('No mails to export in current filter.');
      return;
    }
    const headers = ['Mail ID', 'Date', 'Student Name', 'Email', 'Phone', 'Roll No', 'Program', 'CGPA', 'Category', 'Meeting Room', 'Company', 'Status', 'Message', 'Recruiter Reply'];
    const rows = filteredMails.map(m => [
      `"${m.id}"`,
      `"${new Date(m.created_at).toLocaleString()}"`,
      `"${m.sender_name || ''}"`,
      `"${m.sender_email || ''}"`,
      `"${m.sender_phone || ''}"`,
      `"${m.roll_number || ''}"`,
      `"${m.program || ''}"`,
      `"${m.cgpa || ''}"`,
      `"${m.type === 'leave_company' ? 'Withdrawal Request' : (m.type === 'meeting_absence' || m.type === 'other_reason') ? 'Meeting Absence' : 'General Inquiry'}"`,
      `"${m.room_id || ''}"`,
      `"${m.company_name || ''}"`,
      `"${m.status || ''}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${(m.recruiter_reply || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Mails_${resolvedCompanyName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black uppercase tracking-wider">
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbound Student Mail Receiver & Communication Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span>Student Inquiries & Absence Explanations</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Real-time inbox receiving official student absence notices for proctored interview rooms, process withdrawal requests, and candidate queries for <strong className="text-amber-300">{resolvedCompanyName}</strong>.
            </p>
          </div>

          {/* Quick Actions & Scope Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center text-xs font-black">
              <button
                type="button"
                onClick={() => setCompanyScope('current')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  companyScope === 'current'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏢 {resolvedCompanyName}
              </button>
              <button
                type="button"
                onClick={() => setCompanyScope('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  companyScope === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 All Demo Companies ({mails.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setComposeModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md hover:scale-105"
              title="Compose and send official interview email or call letter to a student"
            >
              <Send className="w-3.5 h-3.5" />
              <span>✉️ Send Interview Call</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="Export filtered student emails to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => { loadMails(); showToast({ type: 'info', title: 'Inbox Refreshed', message: 'Loaded latest student communications.' }); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs cursor-pointer transition"
              title="Refresh Mail Feed"
            >
              <RefreshCw className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inbound */}
        <div 
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            typeFilter === 'all' && statusFilter === 'all'
              ? 'bg-blue-900/20 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
            <span>Total Inbound Mails</span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Student submissions</div>
        </div>

        {/* Unread Action Required */}
        <div 
          onClick={() => { setStatusFilter('unread'); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'unread'
              ? 'bg-amber-900/20 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
            <span>Unread / Pending</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.unread}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-1">Require review</div>
        </div>

        {/* Meeting Absence Explanations */}
        <div 
          onClick={() => { setTypeFilter('meeting_absence'); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            typeFilter === 'meeting_absence'
              ? 'bg-orange-900/20 border-orange-500 shadow-md ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
            <span>Meeting Absence</span>
            <Video className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.absences}</div>
          <div className="text-[11px] text-orange-600 font-bold mt-1">Proctoring / delay notes</div>
        </div>

        {/* Process Withdrawals */}
        <div 
          onClick={() => { setTypeFilter('leave_company'); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            typeFilter === 'leave_company'
              ? 'bg-rose-900/20 border-rose-500 shadow-md ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
            <span>Process Withdrawals</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.withdrawals}</div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">Formal candidate leaves</div>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll no, email, room ID, or keyword..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
              typeFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('meeting_absence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
              typeFilter === 'meeting_absence'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            ⚠️ Meeting Absence
          </button>
          <button
            onClick={() => setTypeFilter('leave_company')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
              typeFilter === 'leave_company'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            🚪 Withdrawals
          </button>

          {/* Status Dropdown Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Status: All Mails</option>
            <option value="unread">Status: Unread Only</option>
            <option value="read">Status: Read Only</option>
            <option value="replied">Status: Replied</option>
          </select>
        </div>
      </div>

      {/* 4. Mails List */}
      <div className="space-y-3">
        {filteredMails.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto text-blue-600">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No Student Mails Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter tags to see other student communications.'
                : `There are currently no inbound student absence notices or emails for ${resolvedCompanyName}. When students submit an explanation from their portal, it will appear here instantly.`}
            </p>
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredMails.map((mail) => {
            const isUnread = mail.status === 'unread';
            const isAbsence = mail.type === 'meeting_absence' || mail.type === 'other_reason';
            const isWithdrawal = mail.type === 'leave_company';
            const isExpanded = expandedMailId === mail.id;

            return (
              <div
                key={mail.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  isUnread
                    ? 'border-amber-300 dark:border-amber-600/60 shadow-md ring-1 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Avatar Badge */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-inner ${
                      isWithdrawal
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                        : isAbsence
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {(mail.sender_name || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {mail.sender_name}
                        </h4>
                        
                        {/* Roll number & branch */}
                        {mail.roll_number && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-mono font-bold">
                            {mail.roll_number}
                          </span>
                        )}
                        {mail.program && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-bold">
                            {mail.program}
                          </span>
                        )}
                        {mail.cgpa && (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-black">
                            CGPA {mail.cgpa}
                          </span>
                        )}

                        {/* Category Tag */}
                        {isWithdrawal ? (
                          <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Process Withdrawal
                          </span>
                        ) : isAbsence ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-black flex items-center gap-1">
                            <Video className="w-3 h-3" /> Meeting Absence Explanation
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black">
                            General Mail
                          </span>
                        )}

                        {/* Status Badge */}
                        {mail.status === 'unread' && (
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[9px] uppercase tracking-wider animate-pulse">
                            New / Unread
                          </span>
                        )}
                        {mail.status === 'replied' && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Replied
                          </span>
                        )}
                      </div>

                      {/* Subject Line */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {mail.subject}
                      </p>

                      {/* Associated Meeting Room & Drive Context */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {mail.room_id && (
                          <span className="flex items-center gap-1 font-mono font-bold text-blue-600 dark:text-blue-400">
                            <Video className="w-3 h-3" /> Room: {mail.room_id}
                          </span>
                        )}
                        {mail.company_name && companyScope === 'all' && (
                          <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                            <Building2 className="w-3 h-3" /> {mail.company_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(mail.created_at).toLocaleDateString()} at {new Date(mail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedMailId(isExpanded ? null : mail.id)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isExpanded ? 'Collapse' : 'Read Note'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyingMail(mail);
                        setReplyText('');
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleReadStatus(mail, e)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title={isUnread ? 'Mark as Read' : 'Mark as Unread'}
                    >
                      {isUnread ? <Eye className="w-4 h-4 text-amber-500" /> : <Mail className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(mail.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                      title="Delete Student Mail"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Mail Content Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                    {/* Candidate Quick Profile Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                        <a href={`mailto:${mail.sender_email}`} className="text-blue-700 dark:text-blue-400 hover:underline truncate block">
                          {mail.sender_email}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                        <span className="text-slate-800 dark:text-slate-200">{mail.sender_phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Program / Branch</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate block">{mail.program} ({mail.branch || 'General'})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Target Room</span>
                        <span className="font-mono text-indigo-700 dark:text-indigo-400 truncate block">{mail.room_id || 'Campus Drive'}</span>
                      </div>
                    </div>

                    {/* Full Message Text */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Student Explanation / Message Body:
                      </div>
                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {mail.message}
                      </div>
                    </div>

                    {/* If Recruiter Replied */}
                    {mail.recruiter_reply && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Official Recruiter Response ({mail.replied_by || 'Talent Acquisition Team'})
                          </span>
                          {mail.replied_at && (
                            <span className="text-[10px] opacity-80 font-normal">
                              {new Date(mail.replied_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium whitespace-pre-wrap">
                          {mail.recruiter_reply}
                        </p>
                      </div>
                    )}

                    {/* Quick Response Bar in expanded view */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedMail(mail)}
                        className="text-xs font-black text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Full Screen Modal View
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingMail(mail);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>{mail.recruiter_reply ? 'Update Reply' : 'Send Official Response'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. REPLY TO STUDENT MODAL */}
      {replyingMail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-300">
                    <Send className="w-4 h-4" />
                    <span>Official Recruiter Reply</span>
                  </div>
                  <h3 className="text-base font-black">
                    Respond to {replyingMail.sender_name}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Candidate: {replyingMail.sender_email} &nbsp;•&nbsp; Roll: {replyingMail.roll_number || 'N/A'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingMail(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendReply} className="p-5 sm:p-6 space-y-4">
              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ⚡ Quick Auto-Templates:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertTemplate('reschedule_absence')}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition cursor-pointer"
                  >
                    ✓ Approve Reschedule Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTemplate('ack_withdrawal')}
                    className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition cursor-pointer"
                  >
                    ✓ Acknowledge Withdrawal
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTemplate('request_info')}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                  >
                    ✓ Request Alternate Time
                  </button>
                </div>
              </div>

              {/* Student's Original Note */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Candidate Subject & Note:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{replyingMail.subject}</p>
                <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2">{replyingMail.message}</p>
              </div>

              {/* Reply Body */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Recruiter Response Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official response, rescheduling instructions, or decision here..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* From Recruiter Badge */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Sender: {resolvedCompanyName} Corporate Recruitment Cell</span>
                </div>
                <span className="text-[10px] bg-blue-200/60 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-950 dark:text-blue-100">Official</span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingMail(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReply ? 'Dispatching...' : 'Dispatch Reply to Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. FULL SCREEN DETAIL MODAL */}
      {selectedMail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className={`p-5 sm:p-6 text-white ${
              selectedMail.type === 'leave_company'
                ? 'bg-gradient-to-r from-rose-800 to-red-900'
                : 'bg-gradient-to-r from-amber-700 to-orange-800'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider opacity-90">
                    <Mail className="w-4 h-4" />
                    <span>
                      {selectedMail.type === 'leave_company'
                        ? 'Process Withdrawal Request'
                        : 'Interview Session Absence Explanation'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black">{selectedMail.subject}</h3>
                  <p className="text-xs opacity-80 font-medium">
                    Received: {new Date(selectedMail.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMail(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Student Metadata Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Candidate Name</span>
                  <span className="text-slate-900 dark:text-slate-100 font-black">{selectedMail.sender_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Roll Number</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{selectedMail.roll_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Academic Program</span>
                  <span className="text-slate-900 dark:text-slate-100">{selectedMail.program} ({selectedMail.cgpa ? `CGPA: ${selectedMail.cgpa}` : 'Enrolled'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Candidate Email</span>
                  <a href={`mailto:${selectedMail.sender_email}`} className="text-blue-700 dark:text-blue-400 hover:underline truncate block">
                    {selectedMail.sender_email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Contact Phone</span>
                  <span className="text-slate-900 dark:text-slate-100">{selectedMail.sender_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Meeting Room ID</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedMail.room_id || 'N/A'}</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Message from Student:
                </div>
                <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMail.message}
                </div>
              </div>

              {/* If Recruiter Replied */}
              {selectedMail.recruiter_reply && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Dispatched Response ({selectedMail.replied_by})
                    </span>
                    {selectedMail.replied_at && (
                      <span className="text-[10px] opacity-80 font-normal">
                        {new Date(selectedMail.replied_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium whitespace-pre-wrap">
                    {selectedMail.recruiter_reply}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggleReadStatus(selectedMail)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl cursor-pointer transition"
              >
                {selectedMail.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMail(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl cursor-pointer transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingMail(selectedMail);
                    setSelectedMail(null);
                  }}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-black text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-md"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply to Candidate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL 3: COMPOSE DIRECT INTERVIEW EMAIL / CALL             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {composeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-black text-sm">Compose Direct Interview Email</h3>
                  <p className="text-[11px] text-blue-200 font-medium">Deliver official call letters directly to student mailbox</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComposeModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Student Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={composeForm.student_name}
                    onChange={(e) => setComposeForm({ ...composeForm, student_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Student GSFC Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={composeForm.student_email}
                    onChange={(e) => setComposeForm({ ...composeForm, student_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject / Call Title *
                </label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Round / Stage
                  </label>
                  <select
                    value={composeForm.event_stage}
                    onChange={(e) => setComposeForm({ ...composeForm, event_stage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Online Assessment">Online Assessment</option>
                    <option value="Technical Interview Round 1">Technical Interview 1</option>
                    <option value="System Design Round">System Design Round</option>
                    <option value="HR / Leadership Bar Raiser">HR / Leadership Panel</option>
                    <option value="Final Selection Offer">Final Selection Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={composeForm.scheduled_date}
                    onChange={(e) => setComposeForm({ ...composeForm, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={composeForm.scheduled_time}
                    onChange={(e) => setComposeForm({ ...composeForm, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Link / Venue
                </label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/... or GSFC Innovation Lab"
                  value={composeForm.meeting_link}
                  onChange={(e) => setComposeForm({ ...composeForm, meeting_link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Official Message & Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setComposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
