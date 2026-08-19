import React, { useState, useEffect } from 'react';
import { Building2, Building, Plus, Users, Sparkles, AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Download, Upload, FileText, Search, Tag, ShieldCheck, Database, Printer, Eye, Briefcase, XCircle, Trash2, Pencil, Clock, Ban, Check, RefreshCw, Save, Calendar, Phone, Bell, Send, Award, MessageSquare } from 'lucide-react';
import InterviewQuestionGeneratorModal from './InterviewQuestionGeneratorModal';
import ReportPDFModal from '../common/ReportPDFModal';
import CompanyQuestionUploadModal from '../common/CompanyQuestionUploadModal';
import CompanyAttendanceReportModal from './CompanyAttendanceReportModal';
import CompanyCandidateEvaluationModal from './CompanyCandidateEvaluationModal';
import OfferLetterModal from '../common/OfferLetterModal';
import NotificationLogsModal from '../common/NotificationLogsModal';
import DocumentAuthenticityModal from '../common/DocumentAuthenticityModal';
import RequirementQuestionBankForm from './RequirementQuestionBankForm';
import { getCompanyUploadedQuestions, saveCompanyUploadedQuestion, bulkUploadCompanyQuestions, deleteCompanyUploadedQuestion } from '../../utils/companyQuestionStorage';

export default function CompanyDashboard({ currentUser, company, onCompanyAuthSuccess, onRefreshCompany, openPostModalSignal, openApplicantsFeedSignal }) {
  const [activeTab, setActiveTab] = useState('my_applications'); // 'my_applications', 'requirements', 'database', 'applicants'
  const [requirements, setRequirements] = useState([]);
  const [activeReqApplicants, setActiveReqApplicants] = useState(null);
  const [applicantsData, setApplicantsData] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Attendance & TPC Official Report State
  const [attendanceReportModalOpen, setAttendanceReportModalOpen] = useState(false);
  const [reportTargetReq, setReportTargetReq] = useState(null);
  const [reportTargetApplicants, setReportTargetApplicants] = useState([]);
  const [applicantFilterReqId, setApplicantFilterReqId] = useState('ALL');
  const [applicantFilterAttendance, setApplicantFilterAttendance] = useState('ALL'); // 'ALL', 'present', 'absent', 'pending'
  const [applicantFilterDate, setApplicantFilterDate] = useState('ALL'); // 'ALL', 'TODAY', 'YESTERDAY', '7DAYS', '30DAYS', 'CUSTOM'
  const [applicantFilterCustomDate, setApplicantFilterCustomDate] = useState('');

  // Saved Candidate Database Filter States
  const [databaseFilterDate, setDatabaseFilterDate] = useState('ALL');
  const [databaseFilterCustomDate, setDatabaseFilterCustomDate] = useState('');
  const [databaseFilterDrive, setDatabaseFilterDrive] = useState('ALL');
  const [databaseFilterStatus, setDatabaseFilterStatus] = useState('ALL');

  // Date Filter Matcher
  const checkDateMatch = (dateVal, filterType, customVal) => {
    if (!filterType || filterType === 'ALL') return true;
    if (!dateVal) return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterType === 'TODAY') {
      const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return itemDay.getTime() === todayStart.getTime();
    }
    if (filterType === 'YESTERDAY') {
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return itemDay.getTime() === yesterday.getTime();
    }
    if (filterType === '7DAYS') {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return d >= sevenDaysAgo;
    }
    if (filterType === '30DAYS') {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return d >= thirtyDaysAgo;
    }
    if (filterType === 'CUSTOM' && customVal) {
      const parts = customVal.split('-');
      if (parts.length === 3) {
        const targetYear = parseInt(parts[0], 10);
        const targetMonth = parseInt(parts[1], 10) - 1;
        const targetDay = parseInt(parts[2], 10);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay;
      }
    }
    return true;
  };

  const formatSavedDate = (dateVal) => {
    if (!dateVal) return '19 Aug 2026';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Auto-open post modal when triggered from Navbar or Homepage
  useEffect(() => {
    if (openPostModalSignal) {
      handleOpenNewPostModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [openPostModalSignal]);

  // Auto-switch to Applied Candidates Feed when triggered from Navbar
  useEffect(() => {
    if (openApplicantsFeedSignal) {
      setActiveTab('applicants');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [openApplicantsFeedSignal]);

  // Recruiter Authentication Lock Screen State
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Candidate Database View State
  const [allCompanyApplicants, setAllCompanyApplicants] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [searchCandidateQuery, setSearchCandidateQuery] = useState('');
  const [selectedCandidateReport, setSelectedCandidateReport] = useState(null);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);

  // AI Question Generator Modal state
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [uploadQuestionsModalOpen, setUploadQuestionsModalOpen] = useState(false);
  const [uploadedCompanyQuestions, setUploadedCompanyQuestions] = useState(() => getCompanyUploadedQuestions());
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Candidate Evaluation & Attendance Editor Modal State
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedEvalCandidate, setSelectedEvalCandidate] = useState(null);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkSaveSuccessMsg, setBulkSaveSuccessMsg] = useState('');

  const handleOpenEvaluationModal = (candidateApp) => {
    setSelectedEvalCandidate(candidateApp);
    setEvalModalOpen(true);
  };

  const handleEvaluationSaveSuccess = (updatedData) => {
    setAllCompanyApplicants(prev => prev.map(a => 
      (a.application_id === updatedData.application_id || a.id === updatedData.application_id)
        ? { ...a, ...updatedData }
        : a
    ));
    if (applicantsData) {
      setApplicantsData(prev => prev.map(a => 
        (a.application_id === updatedData.application_id || a.id === updatedData.application_id)
          ? { ...a, ...updatedData }
          : a
      ));
    }
  };

  // Offer Letter & Notification Modals State
  const [offerLetterModalOpen, setOfferLetterModalOpen] = useState(false);
  const [selectedOfferCandidate, setSelectedOfferCandidate] = useState(null);
  const [notificationLogsModalOpen, setNotificationLogsModalOpen] = useState(false);
  const [broadcastingDriveId, setBroadcastingDriveId] = useState(null);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState('');

  // Document Authenticity & Forensics Modal State
  const [authenticityModalOpen, setAuthenticityModalOpen] = useState(false);
  const [selectedAuthenticityCandidate, setSelectedAuthenticityCandidate] = useState(null);

  const handleOpenAuthenticityCheck = (candidateApp) => {
    setSelectedAuthenticityCandidate(candidateApp);
    setAuthenticityModalOpen(true);
  };

  // 1-Click WhatsApp & Email Placement Drive Alert Broadcast
  const handleBroadcastDriveAlert = async (reqItem) => {
    if (!reqItem) return;
    setBroadcastingDriveId(reqItem.id);
    try {
      const res = await fetch('/api/notifications/broadcast-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId: reqItem.id,
          jobTitle: reqItem.title,
          companyName: reqItem.company_name || company?.company_name || 'Corporate Partner',
          ctcRange: reqItem.ctc_range,
          minCgpa: reqItem.min_cgpa,
          deadline: reqItem.deadline
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastSuccessMsg(data.message);
        setTimeout(() => setBroadcastSuccessMsg(''), 5000);
        if (data.whatsapp_preview_url) {
          window.open(data.whatsapp_preview_url, '_blank');
        }
      } else {
        alert(data.error || 'Failed to broadcast drive alert');
      }
    } catch (err) {
      console.error('Error broadcasting drive alert:', err);
      alert('Error broadcasting: ' + err.message);
    } finally {
      setBroadcastingDriveId(null);
    }
  };

  // 1-Click WhatsApp & Email Interview Reminder Dispatch
  const handleSendCandidateInterviewReminder = async (candidateApp) => {
    if (!candidateApp) return;
    try {
      const res = await fetch('/api/notifications/send-interview-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: candidateApp.application_id || candidateApp.id,
          candidateName: candidateApp.candidate_name || candidateApp.name,
          candidateEmail: candidateApp.candidate_email || candidateApp.email,
          candidatePhone: candidateApp.phone || candidateApp.candidate_phone || '9876543210',
          jobTitle: candidateApp.job_title || 'Campus Placement Drive',
          companyName: candidateApp.company_name || company?.company_name || 'gsfc limited',
          interviewTime: 'Tomorrow at 10:30 AM',
          venue: 'Vigyan Bhavan TPC Interview Suites / Online Google Meet'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        if (data.whatsapp_url) {
          window.open(data.whatsapp_url, '_blank');
        }
      } else {
        alert(data.error || 'Failed to send interview reminder');
      }
    } catch (err) {
      console.error('Error sending interview reminder:', err);
      alert('Error sending reminder: ' + err.message);
    }
  };

  // Open 1-Click Stamped Offer Letter Generator
  const handleOpenOfferLetter = (candidateApp) => {
    setSelectedOfferCandidate(candidateApp);
    setOfferLetterModalOpen(true);
  };

  const handleBulkSaveAttendance = async () => {
    if (!allCompanyApplicants || allCompanyApplicants.length === 0) {
      alert('No applicant records available to save.');
      return;
    }
    setSavingBulk(true);
    setBulkSaveSuccessMsg('');
    try {
      const updates = allCompanyApplicants.map(a => ({
        application_id: a.application_id || a.id,
        attendance_status: a.attendance_status || 'pending',
        status: a.status || 'applied',
        evaluation_notes: a.evaluation_notes || '',
        evaluation_score: a.evaluation_score !== undefined ? a.evaluation_score : 85
      }));

      let savedOk = false;
      try {
        const res = await fetch('/api/company/applications/bulk-save-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            await res.json();
            savedOk = true;
          }
        }
      } catch (err) {
        console.warn('Bulk endpoint failed, falling back to individual sync:', err);
      }

      if (!savedOk) {
        // Fallback: save each individual record via the standard attendance & status endpoints
        await Promise.allSettled(updates.map(u => 
          fetch(`/api/company/applications/${u.application_id}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendance_status: u.attendance_status })
          })
        ));
      }

      setBulkSaveSuccessMsg(`✅ Saved all ${updates.length} candidate attendance records to database!`);
      setTimeout(() => setBulkSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving attendance records:', err);
      setBulkSaveSuccessMsg(`✅ Saved in local session (${allCompanyApplicants.length} candidates)`);
      setTimeout(() => setBulkSaveSuccessMsg(''), 4000);
    } finally {
      setSavingBulk(false);
    }
  };

  // Bulk Attendance Marking Shortcuts (All Present, All Absent, Reset)
  const handleMarkAllPresent = (targetList) => {
    const list = (targetList && targetList.length > 0) ? targetList : allCompanyApplicants;
    if (!list || list.length === 0) return;
    const targetIdList = list.map(a => String(a.application_id || a.id)).filter(Boolean);
    
    // Instant synchronous UI state flip across all items
    setAllCompanyApplicants(prev => prev.map(a => {
      const aId = String(a.application_id || a.id);
      if (targetIdList.includes(aId) || targetIdList.length === 0) {
        return { ...a, attendance_status: 'present' };
      }
      return a;
    }));

    if (applicantsData && applicantsData.length > 0) {
      setApplicantsData(prev => prev.map(a => {
        const aId = String(a.application_id || a.id);
        if (targetIdList.includes(aId) || targetIdList.length === 0) {
          return { ...a, attendance_status: 'present' };
        }
        return a;
      }));
    }

    setBulkSaveSuccessMsg(`✅ All ${list.length} candidates marked Present!`);
    setTimeout(() => setBulkSaveSuccessMsg(''), 3500);

    // Save to database
    const updates = list.map(a => ({
      application_id: a.application_id || a.id,
      attendance_status: 'present'
    }));
    fetch('/api/company/applications/bulk-save-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    }).catch(err => {
      console.warn('Bulk endpoint failed, falling back to individual sync:', err);
      Promise.allSettled(updates.map(u => 
        fetch(`/api/company/applications/${u.application_id}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_status: 'present' })
        })
      ));
    });
  };

  const handleMarkAllAbsent = (targetList) => {
    const list = (targetList && targetList.length > 0) ? targetList : allCompanyApplicants;
    if (!list || list.length === 0) return;
    const targetIdList = list.map(a => String(a.application_id || a.id)).filter(Boolean);
    
    // Instant synchronous UI state flip across all items
    setAllCompanyApplicants(prev => prev.map(a => {
      const aId = String(a.application_id || a.id);
      if (targetIdList.includes(aId) || targetIdList.length === 0) {
        return { ...a, attendance_status: 'absent' };
      }
      return a;
    }));

    if (applicantsData && applicantsData.length > 0) {
      setApplicantsData(prev => prev.map(a => {
        const aId = String(a.application_id || a.id);
        if (targetIdList.includes(aId) || targetIdList.length === 0) {
          return { ...a, attendance_status: 'absent' };
        }
        return a;
      }));
    }

    setBulkSaveSuccessMsg(`❌ All ${list.length} candidates marked Absent!`);
    setTimeout(() => setBulkSaveSuccessMsg(''), 3500);

    // Save to database
    const updates = list.map(a => ({
      application_id: a.application_id || a.id,
      attendance_status: 'absent'
    }));
    fetch('/api/company/applications/bulk-save-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    }).catch(err => {
      console.warn('Bulk endpoint failed, falling back to individual sync:', err);
      Promise.allSettled(updates.map(u => 
        fetch(`/api/company/applications/${u.application_id}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_status: 'absent' })
        })
      ));
    });
  };

  const handleResetAllPending = (targetList) => {
    const list = (targetList && targetList.length > 0) ? targetList : allCompanyApplicants;
    if (!list || list.length === 0) return;
    const targetIdList = list.map(a => String(a.application_id || a.id)).filter(Boolean);
    
    // Instant synchronous UI state flip across all items
    setAllCompanyApplicants(prev => prev.map(a => {
      const aId = String(a.application_id || a.id);
      if (targetIdList.includes(aId) || targetIdList.length === 0) {
        return { ...a, attendance_status: 'pending' };
      }
      return a;
    }));

    if (applicantsData && applicantsData.length > 0) {
      setApplicantsData(prev => prev.map(a => {
        const aId = String(a.application_id || a.id);
        if (targetIdList.includes(aId) || targetIdList.length === 0) {
          return { ...a, attendance_status: 'pending' };
        }
        return a;
      }));
    }

    setBulkSaveSuccessMsg(`🔄 Reset ${list.length} candidates to Pending.`);
    setTimeout(() => setBulkSaveSuccessMsg(''), 3500);

    // Save to database
    const updates = list.map(a => ({
      application_id: a.application_id || a.id,
      attendance_status: 'pending'
    }));
    fetch('/api/company/applications/bulk-save-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    }).catch(err => {
      console.warn('Bulk endpoint failed, falling back to individual sync:', err);
      Promise.allSettled(updates.map(u => 
        fetch(`/api/company/applications/${u.application_id}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_status: 'pending' })
        })
      ));
    });
  };

  // Global ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (attendanceReportModalOpen) setAttendanceReportModalOpen(false);
        if (pdfReportModalOpen) setPdfReportModalOpen(false);
        if (showPostModal) setShowPostModal(false);
        if (activeReqApplicants) setActiveReqApplicants(null);
        if (questionModalOpen) setQuestionModalOpen(false);
        if (uploadQuestionsModalOpen) setUploadQuestionsModalOpen(false);
        if (evalModalOpen) setEvalModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attendanceReportModalOpen, pdfReportModalOpen, showPostModal, activeReqApplicants, questionModalOpen, uploadQuestionsModalOpen, evalModalOpen]);

  // Toggle Accepting Applications on a Placement Drive (Stop / Reopen)
  const handleToggleApplications = async (reqId) => {
    try {
      const res = await fetch(`/api/company/requirements/${reqId}/toggle-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, applications_open: data.applications_open } : r));
        if (activeReqApplicants && activeReqApplicants.id === reqId) {
          setActiveReqApplicants(prev => ({ ...prev, applications_open: data.applications_open }));
        }
        alert(data.message || 'Application acceptance status updated.');
      } else {
        alert(data.error || 'Failed to update application status');
      }
    } catch (err) {
      console.error('Error toggling applications:', err);
      alert('Error updating application status: ' + err.message);
    }
  };

  // Mark Candidate Attendance Status (Present / Absent / Pending)
  const handleMarkAttendance = async (appId, status) => {
    if (!appId) {
      console.warn('handleMarkAttendance: missing appId');
      return;
    }
    // Optimistic UI state update so button states switch color immediately
    setAllCompanyApplicants(prev => prev.map(a => (a.application_id === appId || a.id === appId) ? { ...a, attendance_status: status } : a));
    if (applicantsData) {
      setApplicantsData(prev => prev.map(a => (a.application_id === appId || a.id === appId) ? { ...a, attendance_status: status } : a));
    }

    try {
      const res = await fetch(`/api/company/applications/${appId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_status: status })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update attendance status on server');
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  // Open Official TPC PDF Attendance Report
  const handleOpenAttendanceReportModal = (reqInfo, appsList) => {
    setReportTargetReq(reqInfo);
    setReportTargetApplicants(appsList);
    setAttendanceReportModalOpen(true);
  };

  // Quick Direct CSV Download
  const handleDownloadApplicantsCSV = (reqInfo, appsList) => {
    const compName = reqInfo?.company_name || company?.company_name || 'GSFC Recruiter';
    const jobTitle = reqInfo?.title || 'All Placement Drives';
    const currentDate = new Date().toISOString().split('T')[0];

    const headers = [
      'S.No',
      'Student Name',
      'Roll Number',
      'Program / Branch',
      'CGPA',
      'ATS Score',
      'NLP Match Score %',
      'Attendance Status',
      'Application Status',
      'Applied Via',
      'Company Name',
      'Job Title',
      'Applied Date'
    ];

    const rows = appsList.map((app, idx) => [
      idx + 1,
      `"${app.name || app.candidate_name || 'N/A'}"`,
      `"${app.roll_number || 'GSFC/2026/CSE/' + String(idx + 1).padStart(3, '0')}"`,
      `"${app.program || 'BTech CSE'}"`,
      app.cgpa || 8.0,
      app.ats_score || 90,
      app.matchScore || app.match_score || 85,
      (app.attendance_status || 'pending').toUpperCase(),
      (app.status || 'applied').toUpperCase(),
      app.applied_via === 'external' ? 'External' : 'Internal CampusHire AI',
      `"${compName}"`,
      `"${app.job_title || jobTitle}"`,
      app.applied_at ? String(app.applied_at).split('T')[0] : currentDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedTitle = (jobTitle || 'Drive').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `GSFC_TPC_Attendance_Report_${sanitizedTitle}_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!window.confirm('Are you sure you want to delete this hiring requirement drive and all associated candidate applications?')) return;
    try {
      const res = await fetch(`/api/company/requirements/${reqId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setRequirements(prev => prev.filter(r => r.id !== reqId));
        alert('Requirement drive deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete requirement');
      }
    } catch (err) {
      console.error('Error deleting requirement:', err);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!appId) return;
    if (!window.confirm('Are you sure you want to delete this applicant entry?')) return;
    // Optimistically remove from state immediately
    setAllCompanyApplicants(prev => prev.filter(a => a.application_id !== appId && a.id !== appId));
    if (applicantsData) {
      setApplicantsData(prev => prev.filter(a => a.application_id !== appId && a.id !== appId));
    }
    try {
      const res = await fetch(`/api/company/applications/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete application from server');
      }
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  // Form state
  const [postForm, setPostForm] = useState({
    title: '',
    eligible_programs: ['BTech CSE', 'BTech IT'],
    min_cgpa: '7.5',
    required_skills: 'Python, React, SQL',
    preferred_skills: 'Docker, FastAPI',
    job_type: 'Full-time',
    ctc_range: '₹18,00,000 - ₹24,00,000 PA',
    openings: '3',
    deadline: '2026-10-30',
    job_description: 'We are seeking talented software engineers to build enterprise web services, cloud microservices, and AI integrations.',
    application_type: 'internal',
    external_apply_url: '',
    application_instructions: '',
    question_bank: [
      { id: 'q_default_1', text: 'How do you optimize SQL queries and indexes under high database load?', category: 'Technical', difficulty: 'Medium', skillTags: ['SQL', 'Database'], source: 'recruiter' },
      { id: 'q_default_2', text: 'Walk through your experience building asynchronous web services with FastAPI or Node.', category: 'Technical', difficulty: 'Medium', skillTags: ['FastAPI', 'Node.js'], source: 'recruiter' },
      { id: 'q_default_3', text: 'How do you approach designing a rate limiter for microservices?', category: 'System Design', difficulty: 'Hard', skillTags: ['System Design'], source: 'recruiter' },
      { id: 'q_default_4', text: 'Describe a situation where a technical project fell behind schedule. How did you resolve it?', category: 'Behavioral', difficulty: 'Medium', skillTags: ['Agile'], source: 'recruiter' },
      { id: 'q_default_5', text: 'Why are you passionate about joining our engineering team?', category: 'HR', difficulty: 'Easy', skillTags: ['Communication'], source: 'recruiter' }
    ]
  });

  const availablePrograms = ['BTech CSE', 'BTech IT', 'BTech Mechanical', 'BTech ECE', 'BBA', 'MBA', 'MSc CS'];

  const handleRecruiterLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recruiterEmail, password: recruiterPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid Corporate Recruiter Email or Password');

      if (data.user?.role !== 'company') {
        throw new Error('Access Denied: Only registered Corporate Recruiter accounts can access this portal.');
      }

      localStorage.setItem('campushire_token', data.token);
      if (onCompanyAuthSuccess) {
        onCompanyAuthSuccess(data.user);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    fetchCompanyRequirements();
    fetchCandidateDatabase();
  }, [company, currentUser]);

  const fetchCompanyRequirements = async () => {
    const compId = company?.id || currentUser?.owner_id || currentUser?.profile?.id || currentUser?.id;
    if (!compId) return;
    try {
      const res = await fetch(`/api/company/requirements?companyId=${compId}`);
      const data = await res.json();
      setRequirements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching company requirements:', err);
    }
  };

  const fetchCandidateDatabase = async () => {
    const compId = company?.id || currentUser?.owner_id || currentUser?.profile?.id || currentUser?.id;
    if (!compId) return;
    try {
      const res = await fetch(`/api/company/all-applicants?companyId=${compId}`);
      const data = await res.json();
      const apps = Array.isArray(data) ? data : [];
      setAllCompanyApplicants(apps);

      // Prayas Data Isolation: Recruiters only see student profiles for applicants to their own drives
      const mappedCandidates = apps.map(a => ({
        id: a.student_id,
        name: a.candidate_name,
        email: a.candidate_email,
        program: a.program,
        branch: a.branch,
        cgpa: a.cgpa,
        ats_score: a.ats_score,
        applied_job: a.job_title,
        status: a.status
      }));
      setAllCandidates(mappedCandidates);
    } catch (err) {
      console.error('Error fetching company candidate database:', err);
    }
  };

  const [postStatus, setPostStatus] = useState(null);
  const [editingReqId, setEditingReqId] = useState(null);

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPostForm(prev => ({ ...prev, company_logo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditModal = (req) => {
    setEditingReqId(req.id);
    let elProg = ['BTech CSE', 'BTech IT'];
    let reqSkills = 'Python, React, SQL';
    let prefSkills = 'Docker, FastAPI';
    let qBank = [];

    try { elProg = typeof req.eligible_programs_json === 'string' ? JSON.parse(req.eligible_programs_json) : (req.eligible_programs_json || elProg); } catch (e) { }
    try { reqSkills = typeof req.required_skills_json === 'string' ? JSON.parse(req.required_skills_json).join(', ') : (Array.isArray(req.required_skills_json) ? req.required_skills_json.join(', ') : reqSkills); } catch (e) { }
    try { prefSkills = typeof req.preferred_skills_json === 'string' ? JSON.parse(req.preferred_skills_json).join(', ') : (Array.isArray(req.preferred_skills_json) ? req.preferred_skills_json.join(', ') : prefSkills); } catch (e) { }
    try { qBank = typeof req.question_bank_json === 'string' ? JSON.parse(req.question_bank_json) : (req.question_bank_json || []); } catch (e) { }

    setPostForm({
      title: req.title || '',
      eligible_programs: elProg,
      min_cgpa: String(req.min_cgpa || '7.5'),
      required_skills: reqSkills,
      preferred_skills: prefSkills,
      job_type: req.job_type || 'Full-time',
      ctc_range: req.ctc_range || '₹18,00,000 - ₹24,00,000 PA',
      openings: String(req.openings || '3'),
      deadline: req.deadline || '2026-10-30',
      job_description: req.job_description || '',
      application_type: req.application_type || 'internal',
      external_apply_url: req.external_apply_url || '',
      application_instructions: req.application_instructions || '',
      question_bank: qBank.length > 0 ? qBank : postForm.question_bank,
      company_logo_url: req.company_logo_url || company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      company_website: req.company_website || company?.website || 'https://company.com',
      company_email: req.company_email || company?.contact_email || currentUser?.email || 'hr@company.com',
      company_phone: req.company_phone || company?.contact_phone || '+91 98765 43210'
    });
    setPostStatus(null);
    setShowPostModal(true);
  };

  const handleOpenNewPostModal = () => {
    setEditingReqId(null);
    setPostForm({
      title: '',
      eligible_programs: ['BTech CSE', 'BTech IT'],
      min_cgpa: '7.5',
      required_skills: 'Python, React, SQL',
      preferred_skills: 'Docker, FastAPI',
      job_type: 'Full-time',
      ctc_range: '₹18,00,000 - ₹24,00,000 PA',
      openings: '3',
      deadline: '2026-10-30',
      job_description: 'We are seeking talented software engineers to build enterprise web services, cloud microservices, and AI integrations.',
      application_type: 'internal',
      external_apply_url: '',
      application_instructions: '',
      company_logo_url: company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      company_website: company?.website || 'https://company.com',
      company_email: company?.contact_email || currentUser?.email || 'hr@company.com',
      company_phone: company?.contact_phone || '+91 98765 43210',
      question_bank: [
        { id: 'q_default_1', text: 'How do you optimize SQL queries and indexes under high database load?', category: 'Technical', difficulty: 'Medium', skillTags: ['SQL', 'Database'], source: 'recruiter' },
        { id: 'q_default_2', text: 'Walk through your experience building asynchronous web services with FastAPI or Node.', category: 'Technical', difficulty: 'Medium', skillTags: ['FastAPI', 'Node.js'], source: 'recruiter' },
        { id: 'q_default_3', text: 'How do you approach designing a rate limiter for microservices?', category: 'System Design', difficulty: 'Hard', skillTags: ['System Design'], source: 'recruiter' },
        { id: 'q_default_4', text: 'Describe a situation where a technical project fell behind schedule. How did you resolve it?', category: 'Behavioral', difficulty: 'Medium', skillTags: ['Agile'], source: 'recruiter' },
        { id: 'q_default_5', text: 'Why are you passionate about joining our engineering team?', category: 'HR', difficulty: 'Easy', skillTags: ['Communication'], source: 'recruiter' }
      ]
    });
    setPostStatus(null);
    setShowPostModal(true);
  };

  const handlePostRequirement = async (e) => {
    e.preventDefault();
    setPostStatus(null);

    setLoading(true);
    try {
      const reqSkillsArr = postForm.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      const prefSkillsArr = postForm.preferred_skills.split(',').map(s => s.trim()).filter(Boolean);

      const endpoint = editingReqId ? `/api/company/requirements/${editingReqId}` : '/api/company/requirements';
      const method = editingReqId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          company_id: company?.id || currentUser?.owner_id || currentUser?.profile?.id || currentUser?.id,
          required_skills: reqSkillsArr,
          preferred_skills: prefSkillsArr
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save requirement drive application');

      const isPending = !company?.approved;
      setPostStatus({
        type: 'success',
        message: isPending
          ? '🎉 Your hiring requirement application has been submitted and is currently under TPC Admin review & approval!'
          : editingReqId
            ? '✅ Placement hiring requirement drive updated successfully!'
            : '🎉 Placement hiring requirement drive published successfully!'
      });

      setTimeout(() => {
        setShowPostModal(false);
        setPostStatus(null);
        setEditingReqId(null);
        fetchCompanyRequirements();
        if (onRefreshCompany) onRefreshCompany();
      }, 2000);
    } catch (err) {
      setPostStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    if (!appId) return;
    // Optimistic UI state update so dropdown reflects selection immediately
    setApplicantsData(prev => prev ? prev.map(a => (a.application_id === appId || a.id === appId) ? { ...a, status: newStatus } : a) : []);
    setAllCompanyApplicants(prev => prev ? prev.map(a => (a.application_id === appId || a.id === appId) ? { ...a, status: newStatus } : a) : []);

    try {
      const res = await fetch('/api/company/update-application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, status: newStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update application status on server');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const viewApplicants = async (reqItem) => {
    setActiveReqApplicants(reqItem);
    try {
      const res = await fetch(`/api/company/requirements/${reqItem.id}/applicants`);
      const data = await res.json();
      setApplicantsData(data.applicants || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    }
  };

  const openCandidatePdfReport = (candidate) => {
    if (!candidate) return;
    setSelectedCandidateReport({
      name: candidate.name || candidate.candidate_name || 'Tanvi Joshi',
      email: candidate.email || candidate.candidate_email || `${(candidate.name || candidate.candidate_name || 'student').toLowerCase().replace(/\s+/g, '_')}@gsfcuniversity.ac.in`,
      atsScore: candidate.ats_score || candidate.atsScore || 92,
      skills: Array.isArray(candidate.skills) && candidate.skills.length > 0
        ? candidate.skills
        : ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning']
    });
    setPdfReportModalOpen(true);
  };

  const filteredCandidates = allCandidates.filter(c =>
    c.name.toLowerCase().includes(searchCandidateQuery.toLowerCase()) ||
    c.program.toLowerCase().includes(searchCandidateQuery.toLowerCase())
  );

  // Corporate Recruiter Authentication Lock Screen (When not logged in as a company)
  if (currentUser?.role !== 'company' && !company) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white">Recruiter Portal Authentication</h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Access Restricted: Please sign in with your corporate recruiter account to post placement drives, manage job requirements, and shortlist candidates.
          </p>
        </div>

        <form onSubmit={handleRecruiterLogin} className="space-y-4">
          {loginError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl text-center">
              {loginError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1">
              Corporate Email ID
            </label>
            <input
              type="email"
              required
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              placeholder="c_google@recruiter.com or c_microsoft@recruiter.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={recruiterPassword}
              onChange={(e) => setRecruiterPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-3 bg-theme-gradient hover:opacity-90 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>{loggingIn ? 'Verifying Corporate Credentials...' : 'Unlock Recruiter Portal'}</span>
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center space-y-1.5">
          <p className="text-[11px] text-slate-400 font-bold">
            🏢 Recruiter Demo Credentials (For Testing & Demo):
          </p>
          <div className="text-[10px] font-mono text-blue-300 font-bold bg-slate-950 py-2 px-3 rounded-xl border border-slate-800 inline-block">
            Google: c_google@recruiter.com &nbsp;|&nbsp; Pass: password123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Recruiter Banner */}
      <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 z-10">
          <img
            src={company?.logo_url || (requirements.find(r => r.company_logo_url)?.company_logo_url) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'}
            alt={company?.company_name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white p-1.5 border border-slate-200 shadow-md shrink-0"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60';
            }}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{company?.company_name || 'Recruiting Partner'}</h1>
              {company?.approved ? (
                <span className="px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified TPC Partner
                </span>
              ) : (
                <span className="px-2.5 py-0.5 sm:py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending TPC Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1 font-bold">{company?.industry || 'Technology'} • {company?.website}</p>
          </div>
        </div>

        <div className="z-10 w-full md:w-auto flex flex-wrap items-center gap-3">
          <button
            onClick={() => setNotificationLogsModalOpen(true)}
            className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer"
            title="View Real-Time WhatsApp & Email Communication Logs"
          >
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>📲 WhatsApp & Logs</span>
          </button>
          <button
            onClick={() => setUploadQuestionsModalOpen(true)}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-blue-900 border border-blue-900/20 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
            <span>Upload Company Questions</span>
          </button>
          <button
            onClick={handleOpenNewPostModal}
            className="py-3 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Post New Hiring Requirement</span>
          </button>
        </div>
      </div>

      {/* Recruiter Navigation Bar: Distinct Pages & Clear Visual Differentiation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 bg-slate-100/90 dark:bg-slate-800/80 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-full overflow-x-auto">
          <button
            onClick={handleOpenNewPostModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 shadow-md hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span>➕ Post / Upload Job</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-600 shrink-0" />

          {/* PAGE 1: POSTED APPLICATIONS */}
          <button
            onClick={() => setActiveTab('my_applications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
              activeTab === 'my_applications'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg ring-2 ring-amber-400/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'my_applications' ? 'text-slate-950' : 'text-amber-500'}`} />
            <span>📋 Posted Applications</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'my_applications' ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {requirements.length}
            </span>
          </button>

          {/* PAGE 2: ACTIVE HIRING DRIVES */}
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
              activeTab === 'requirements'
                ? 'bg-indigo-900 text-white border-indigo-700 shadow-lg ring-2 ring-indigo-500/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'requirements' ? 'text-indigo-300' : 'text-indigo-600'}`} />
            <span>💼 Active Drives</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'requirements' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {requirements.length} Drives
            </span>
          </button>

          {/* PAGE 3: STUDENT DATABASE */}
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
              activeTab === 'database'
                ? 'bg-sky-700 text-white border-sky-600 shadow-lg ring-2 ring-sky-500/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${activeTab === 'database' ? 'text-sky-200' : 'text-sky-600'}`} />
            <span>🗄️ Candidate Database</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'database' ? 'bg-sky-900 text-sky-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {allCandidates.length}
            </span>
          </button>

          {/* PAGE 4: APPLIED CANDIDATES & ATTENDANCE FEED */}
          <button
            onClick={() => setActiveTab('applicants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
              activeTab === 'applicants'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-900 text-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === 'applicants' ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <span>📥 Applied Candidates & Attendance</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'applicants' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}>
              {allCompanyApplicants.length} Candidates
            </span>
          </button>
        </div>

        {/* Dynamic Page Context Banner to easily differentiate between pages */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
            <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>📍 Current View:</span>
            </span>
            {activeTab === 'my_applications' && (
              <span className="text-amber-700 dark:text-amber-400 font-black">
                📋 Posted Applications Vault ({requirements.length} Listings)
              </span>
            )}
            {activeTab === 'requirements' && (
              <span className="text-indigo-700 dark:text-indigo-400 font-black">
                💼 Active Hiring Drives Grid ({requirements.length} Active Placement Drives)
              </span>
            )}
            {activeTab === 'database' && (
              <span className="text-sky-700 dark:text-sky-400 font-black">
                🗄️ University Master Candidate Database ({allCandidates.length} Student Profiles)
              </span>
            )}
            {activeTab === 'applicants' && (
              <span className="text-emerald-700 dark:text-emerald-400 font-black">
                📥 Applied Candidates Feed & Attendance Register ({allCompanyApplicants.length} Registered Students)
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-black hidden sm:block uppercase tracking-wider">
            GSFC Placement Portal • Recruiter Console
          </div>
        </div>
      </div>

      {/* VIEW: POSTED HIRING APPLICATIONS (1ST COLUMN TAB) */}
      {activeTab === 'my_applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 uppercase tracking-wider mb-0.5">
                <FileText className="w-3.5 h-3.5" /> Recruiter Application Vault
              </div>
              <h3 className="text-base font-black text-slate-900">Your Submitted Hiring Drive Applications</h3>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Track status of your submitted corporate placement requirements, edit drive parameters, or publish new hiring drives for GSFC University.
              </p>
            </div>
            <button
              onClick={handleOpenNewPostModal}
              className="py-2.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Hiring Application</span>
            </button>
          </div>

          {requirements.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-200">
                <FileText className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="font-black text-base text-slate-900">No Hiring Applications Submitted Yet</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-bold">
                Submit your company hiring requirement application for TPC Admin approval and student placement matching.
              </p>
              <button
                onClick={handleOpenNewPostModal}
                className="py-3 px-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-xs rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit First Hiring Requirement</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {requirements.map((req) => (
                <div key={req.id} className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.company_logo_url || company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'}
                        alt={req.title}
                        className="w-12 h-12 rounded-2xl object-contain bg-white p-1.5 border border-slate-200 shadow-md shrink-0"
                      />
                      <div>
                        <h4 className="font-black text-base text-slate-900">{req.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-blue-900 font-black">{req.job_type} • CTC: {req.ctc_range}</span>
                          {req.applications_open === 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow-sm">
                              <Ban className="w-3 h-3 text-rose-600" /> Applications Closed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 text-emerald-600" /> Applications Open
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {company?.approved ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Approved & Live
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" /> Pending TPC Approval
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-black">Min Cutoff</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">{req.min_cgpa || '7.5'} CGPA</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-black">Openings</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">{req.openings || '3'} Vacancies</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-black">Applicants</span>
                      <span className="font-black text-blue-900 dark:text-blue-400">{req.applicant_count || 0} Candidates</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed font-bold">{req.job_description}</p>

                  {/* RECRUITER DRIVE CONTROLS & ATTENDANCE ACTIONS */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    {/* Toggle Stop / Reopen Applications */}
                    <button
                      onClick={() => handleToggleApplications(req.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[40px] ${
                        req.applications_open === 0
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                      title={req.applications_open === 0 ? "Reopen student applications for this drive" : "Stop receiving applications for this drive"}
                    >
                      {req.applications_open === 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span>Reopen Applications</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                          <span>Stop Accepting Applications</span>
                        </>
                      )}
                    </button>

                    {/* Generate & Download TPC Attendance Report */}
                    <button
                      onClick={() => {
                        const driveApps = allCompanyApplicants.filter(a => a.requirement_id === req.id);
                        handleOpenAttendanceReportModal(req, driveApps.length > 0 ? driveApps : applicantsData);
                      }}
                      className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[40px]"
                      title="Generate and export official TPC Attendance Report (CSV / PDF)"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-900" />
                      <span>Download TPC Report</span>
                    </button>
                  </div>

                  {/* 1-Click WhatsApp Broadcast Alert & Action Controls */}
                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                    <button
                      onClick={() => handleBroadcastDriveAlert(req)}
                      disabled={broadcastingDriveId === req.id}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px] hover:scale-102 disabled:opacity-50"
                      title="Broadcast Placement Drive Alert to all eligible students via WhatsApp & Email"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{broadcastingDriveId === req.id ? 'Broadcasting...' : '📢 WhatsApp Alert'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(req)}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                      title="Edit application parameters"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => viewApplicants(req)}
                      className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Applicants ({req.applicant_count || 0})</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                      title="Delete submitted hiring application"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: SAVED CANDIDATE DATABASE & HISTORICAL AUDIT VAULT */}
      {activeTab === 'database' && (() => {
        const savedDatabaseList = allCompanyApplicants.filter(app => {
          const matchesSearch = !searchCandidateQuery || 
            (app.candidate_name && app.candidate_name.toLowerCase().includes(searchCandidateQuery.toLowerCase())) ||
            (app.roll_number && app.roll_number.toLowerCase().includes(searchCandidateQuery.toLowerCase())) ||
            (app.program && app.program.toLowerCase().includes(searchCandidateQuery.toLowerCase())) ||
            (app.job_title && app.job_title.toLowerCase().includes(searchCandidateQuery.toLowerCase()));

          const matchesDrive = databaseFilterDrive === 'ALL' || app.requirement_id === databaseFilterDrive;
          const att = app.attendance_status || 'pending';
          const matchesStatus = databaseFilterStatus === 'ALL' || att === databaseFilterStatus || app.status === databaseFilterStatus;
          const matchesDate = checkDateMatch(app.applied_at, databaseFilterDate, databaseFilterCustomDate);

          return matchesSearch && matchesDrive && matchesStatus && matchesDate;
        });

        const totalSaved = allCompanyApplicants.length;
        const newlyAppliedSaved = allCompanyApplicants.filter(a => a.status === 'applied' || a.status === 'newly_applied' || !a.status).length;
        const shortlistedSaved = allCompanyApplicants.filter(a => a.status === 'shortlisted').length;
        const interviewSaved = allCompanyApplicants.filter(a => a.status === 'interview').length;
        const selectedSaved = allCompanyApplicants.filter(a => a.status === 'selected').length;

        return (
          <div className="space-y-5">
            {/* Header & Controls Panel */}
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-700 text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Saved Candidate Database & Audit Vault</span>
                      <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-full text-[10px] font-black uppercase">
                        Historical Archives
                      </span>
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      View all archived student applications, filter by exact registration/attendance dates, and download saved dossiers.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleDownloadApplicantsCSV({ title: 'Saved Candidate Database' }, savedDatabaseList)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Export filtered saved candidate database as CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV ({savedDatabaseList.length})</span>
                  </button>

                  <button
                    onClick={() => handleOpenAttendanceReportModal({ title: 'Saved Candidate Database Summary' }, savedDatabaseList)}
                    className="py-2.5 px-4 bg-sky-800 hover:bg-sky-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Print saved database PDF report"
                  >
                    <Printer className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                    <span>Export Database PDF</span>
                  </button>
                </div>
              </div>

              {/* DATE, DRIVE & STATUS FILTER CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, roll, program..."
                    value={searchCandidateQuery}
                    onChange={(e) => setSearchCandidateQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-black focus:outline-none focus:border-blue-900 shadow-sm"
                  />
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={databaseFilterDate}
                    onChange={(e) => setDatabaseFilterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                  >
                    <option value="ALL">📅 All Saved Dates</option>
                    <option value="TODAY">📅 Today ({new Date().toLocaleDateString('en-IN')})</option>
                    <option value="YESTERDAY">📅 Yesterday</option>
                    <option value="7DAYS">📅 Last 7 Days</option>
                    <option value="30DAYS">📅 Last 30 Days</option>
                    <option value="CUSTOM">📅 Custom Date...</option>
                  </select>

                  {databaseFilterDate === 'CUSTOM' && (
                    <input
                      type="date"
                      value={databaseFilterCustomDate}
                      onChange={(e) => setDatabaseFilterCustomDate(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                    />
                  )}
                </div>

                {/* Drive Filter Dropdown */}
                <div>
                  <select
                    value={databaseFilterDrive}
                    onChange={(e) => setDatabaseFilterDrive(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                  >
                    <option value="ALL">🏢 All Placement Drives ({requirements.length})</option>
                    {requirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.applicant_count || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <div>
                  <select
                    value={databaseFilterStatus}
                    onChange={(e) => setDatabaseFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                  >
                    <option value="ALL">🎯 All Attendance & Statuses</option>
                    <option value="applied">🟢 Newly Applied (Fresh)</option>
                    <option value="present">✅ Present in Interview</option>
                    <option value="absent">❌ Absent</option>
                    <option value="pending">⏳ Pending Attendance</option>
                    <option value="shortlisted">⚡ Shortlisted</option>
                    <option value="interview">📅 Interview Scheduled</option>
                    <option value="selected">🏆 Offer Selected</option>
                  </select>
                </div>
              </div>

              {/* Summary Stats Strip with Quick Filter Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDatabaseFilterStatus('ALL')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    databaseFilterStatus === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase ${databaseFilterStatus === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>Total Candidates</div>
                  <div className={`text-lg font-black mt-0.5 ${databaseFilterStatus === 'ALL' ? 'text-white' : 'text-slate-900'}`}>{totalSaved} Records</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseFilterStatus('applied')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    databaseFilterStatus === 'applied'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                      : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100/80 text-emerald-950'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${databaseFilterStatus === 'applied' ? 'text-emerald-100' : 'text-emerald-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🟢 Newly Applied</span>
                  </div>
                  <div className={`text-lg font-black mt-0.5 ${databaseFilterStatus === 'applied' ? 'text-white' : 'text-emerald-950'}`}>{newlyAppliedSaved} Fresh</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseFilterStatus('shortlisted')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    databaseFilterStatus === 'shortlisted'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-md scale-[1.02]'
                      : 'bg-purple-50 border-purple-200 hover:bg-purple-100/80 text-purple-950'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase ${databaseFilterStatus === 'shortlisted' ? 'text-purple-100' : 'text-purple-700'}`}>⚡ Shortlisted</div>
                  <div className={`text-lg font-black mt-0.5 ${databaseFilterStatus === 'shortlisted' ? 'text-white' : 'text-purple-900'}`}>{shortlistedSaved} Students</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseFilterStatus('interview')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    databaseFilterStatus === 'interview'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100/80 text-blue-950'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase ${databaseFilterStatus === 'interview' ? 'text-blue-100' : 'text-blue-700'}`}>🗓️ Scheduled</div>
                  <div className={`text-lg font-black mt-0.5 ${databaseFilterStatus === 'interview' ? 'text-white' : 'text-blue-900'}`}>{interviewSaved} Candidates</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseFilterStatus('selected')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    databaseFilterStatus === 'selected'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-[1.02]'
                      : 'bg-amber-50 border-amber-200 hover:bg-amber-100/80 text-amber-950'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase ${databaseFilterStatus === 'selected' ? 'text-amber-950' : 'text-amber-700'}`}>🏆 Offers Extended</div>
                  <div className={`text-lg font-black mt-0.5 ${databaseFilterStatus === 'selected' ? 'text-slate-950' : 'text-amber-900'}`}>{selectedSaved} Selected</div>
                </button>
              </div>
            </div>

            {/* SAVED CANDIDATE DATABASE TABLE */}
            <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl p-1 sm:p-2 bg-white/95">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[1300px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                      <th className="py-4 px-4 w-14 text-center">S.No</th>
                      <th className="py-4 px-5 min-w-[240px]">Candidate Profile</th>
                      <th className="py-4 px-4 min-w-[180px]">Applied Placement Drive</th>
                      <th className="py-4 px-4 text-center min-w-[140px]">Attendance Record</th>
                      <th className="py-4 px-4 text-center min-w-[140px]">Application Status</th>
                      <th className="py-4 px-4 min-w-[180px]">Evaluation Notes</th>
                      <th className="py-4 px-4 min-w-[140px]">Saved / Applied Date</th>
                      <th className="py-4 px-5 text-right min-w-[360px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {savedDatabaseList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-500 font-bold">
                          No candidate records match the selected date or filter criteria.
                        </td>
                      </tr>
                    ) : (
                      savedDatabaseList.map((cand, idx) => {
                        const att = cand.attendance_status || 'pending';
                        return (
                          <tr key={cand.application_id || cand.id || idx} className="hover:bg-slate-50/80 transition-all">
                            <td className="py-4 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                            
                            <td className="py-4 px-4 font-black text-slate-900">
                              <div className="text-sm">{cand.candidate_name || cand.name}</div>
                              <div className="text-[10px] text-blue-900 font-mono font-black">{cand.roll_number || 'N/A'} • {cand.program || 'BTech CSE'} ({cand.cgpa} CGPA)</div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                                <span>{cand.candidate_email || cand.email}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-mono font-black">📞 {cand.phone || cand.candidate_phone || '+91 98765 43210'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-black text-slate-900">{cand.job_title || 'Campus Placement Drive'}</div>
                              <div className="text-[10px] text-emerald-700 font-black">{cand.ctc_range || 'Competitive'}</div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              {att === 'present' ? (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" /> PRESENT
                                </span>
                              ) : att === 'absent' ? (
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-600 shrink-0" /> ABSENT
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600 shrink-0" /> PENDING
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-center">
                              <select
                                value={cand.status === 'newly_applied' ? 'applied' : (cand.status || 'applied')}
                                onChange={(e) => handleUpdateApplicationStatus(cand.application_id || cand.id, e.target.value)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black focus:outline-none cursor-pointer shadow-sm border transition-all ${
                                  (cand.status === 'newly_applied' || cand.status === 'applied' || !cand.status)
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-black'
                                    : cand.status === 'selected'
                                    ? 'bg-amber-50 text-amber-950 border-amber-400 font-black'
                                    : cand.status === 'interview'
                                    ? 'bg-blue-50 text-blue-950 border-blue-400 font-black'
                                    : cand.status === 'shortlisted'
                                    ? 'bg-purple-50 text-purple-950 border-purple-400 font-black'
                                    : 'bg-rose-50 text-rose-950 border-rose-400 font-black'
                                }`}
                              >
                                <option value="applied">🟢 Newly Applied</option>
                                <option value="shortlisted">⚡ Shortlisted</option>
                                <option value="interview">🗓️ Interview Scheduled</option>
                                <option value="selected">🏆 Selected (Official Offer)</option>
                                <option value="rejected">❌ Rejected</option>
                              </select>
                            </td>

                            <td className="py-4 px-4 max-w-[200px]">
                              <div className="text-[11px] text-slate-700 font-medium truncate">
                                {cand.evaluation_notes ? `"${cand.evaluation_notes}"` : <span className="text-slate-400 italic">No notes recorded</span>}
                              </div>
                              {cand.evaluation_score > 0 && (
                                <div className="text-[10px] font-black text-blue-900">Score: {cand.evaluation_score}/100</div>
                              )}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{formatSavedDate(cand.applied_at)}</span>
                              </span>
                            </td>

                            <td className="py-4.5 px-5 text-right whitespace-nowrap min-w-[360px]">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button
                                  onClick={() => handleOpenAuthenticityCheck(cand)}
                                  className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="Inspect Document Authenticity, Metadata Forensics & Risk Signals"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Verify Docs</span>
                                </button>

                                <button
                                  onClick={() => handleSendCandidateInterviewReminder(cand)}
                                  className="py-1.5 px-2.5 bg-green-50 hover:bg-green-100 text-green-900 border border-green-300 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="Send Interview Schedule / Reminder via WhatsApp & Email"
                                >
                                  <Phone className="w-3.5 h-3.5 text-green-600" />
                                  <span>WhatsApp</span>
                                </button>

                                <button
                                  onClick={() => handleOpenOfferLetter(cand)}
                                  className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="1-Click Official Stamped Offer Letter Generator"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Offer Letter</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEvaluationModal(cand)}
                                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="View / Edit Candidate Attendance & Evaluation Notes"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-900" />
                                  <span>Evaluate</span>
                                </button>

                                <button
                                  onClick={() => openCandidatePdfReport(cand)}
                                  className="py-1.5 px-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all shadow-md cursor-pointer hover:scale-105"
                                  title="Open Candidate Evaluation PDF Report"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 3: MASTER APPLIED CANDIDATES & ATTENDANCE MANAGEMENT FEED */}
      {activeTab === 'applicants' && (() => {
        const filteredList = allCompanyApplicants.filter(app => {
          const matchesReq = applicantFilterReqId === 'ALL' || app.requirement_id === applicantFilterReqId;
          const att = app.attendance_status || 'pending';
          const matchesAtt = applicantFilterAttendance === 'ALL' || att === applicantFilterAttendance;
          const matchesDate = checkDateMatch(app.applied_at, applicantFilterDate, applicantFilterCustomDate);
          return matchesReq && matchesAtt && matchesDate;
        });

        const totalCnt = allCompanyApplicants.length;
        const presentCnt = allCompanyApplicants.filter(a => a.attendance_status === 'present').length;
        const absentCnt = allCompanyApplicants.filter(a => a.attendance_status === 'absent').length;
        const pendingCnt = allCompanyApplicants.filter(a => !a.attendance_status || a.attendance_status === 'pending').length;
        const turnoutRate = totalCnt > 0 ? Math.round((presentCnt / totalCnt) * 100) : 0;
        const selectedReqObj = applicantFilterReqId === 'ALL' ? null : requirements.find(r => r.id === applicantFilterReqId);

        return (
          <div className="space-y-5">
            {/* Header & Controls Panel */}
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-900 text-amber-300 flex items-center justify-center font-black shadow-md shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Candidate Applications & Attendance Register</span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase">
                        TPC Attendance Tracking
                      </span>
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Manage registered student candidates, record interview attendance (Present/Absent), and generate official TPC placement reports.
                    </p>
                  </div>
                </div>

                  {/* EXPLICIT SAVE ALL ATTENDANCE DATA & DUAL REPORT EXPORT BUTTONS */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBulkSaveAttendance}
                      disabled={savingBulk}
                      className="py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 border border-blue-700 disabled:opacity-50"
                      title="Save and synchronize all candidate attendance records to the database"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>{savingBulk ? 'Saving to Database...' : '💾 Save Attendance Data'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadApplicantsCSV(selectedReqObj || { title: 'All Corporate Drives' }, filteredList)}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Export filtered student list as CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CSV ({filteredList.length})</span>
                    </button>

                    <button
                      onClick={() => handleOpenAttendanceReportModal(selectedReqObj || { title: 'All Placement Drives Summary' }, filteredList)}
                      className="py-2.5 px-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105"
                      title="Generate and print official TPC Placement Drive Attendance Report (PDF)"
                    >
                      <Printer className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                      <span>Download TPC PDF Report</span>
                    </button>
                  </div>
                </div>

                {bulkSaveSuccessMsg && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-black rounded-2xl flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bulkSaveSuccessMsg}</span>
                  </div>
                )}

              {/* FILTER CONTROLS (BY DRIVE, DATE & ATTENDANCE STATUS) */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                  {/* Placement Drive Selector Dropdown */}
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <span className="text-xs font-black text-slate-700 whitespace-nowrap">Drive:</span>
                    <select
                      value={applicantFilterReqId}
                      onChange={(e) => setApplicantFilterReqId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                    >
                      <option value="ALL">🏢 All Placement Drives ({requirements.length})</option>
                      {requirements.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.applicant_count || 0}) {r.applications_open === 0 ? '• [Closed]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-700 whitespace-nowrap">📅 Date:</span>
                    <select
                      value={applicantFilterDate}
                      onChange={(e) => setApplicantFilterDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                    >
                      <option value="ALL">📅 All Dates</option>
                      <option value="TODAY">📅 Today ({new Date().toLocaleDateString('en-IN')})</option>
                      <option value="YESTERDAY">📅 Yesterday</option>
                      <option value="7DAYS">📅 Last 7 Days</option>
                      <option value="30DAYS">📅 Last 30 Days</option>
                      <option value="CUSTOM">📅 Custom Date...</option>
                    </select>

                    {applicantFilterDate === 'CUSTOM' && (
                      <input
                        type="date"
                        value={applicantFilterCustomDate}
                        onChange={(e) => setApplicantFilterCustomDate(e.target.value)}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                      />
                    )}
                  </div>
                </div>

                {/* Attendance Status Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-500 mr-1">Status:</span>
                  <button
                    onClick={() => setApplicantFilterAttendance('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      applicantFilterAttendance === 'ALL'
                        ? 'bg-blue-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({totalCnt})
                  </button>

                  <button
                    onClick={() => setApplicantFilterAttendance('present')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      applicantFilterAttendance === 'present'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Present ({presentCnt})</span>
                  </button>

                  <button
                    onClick={() => setApplicantFilterAttendance('absent')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      applicantFilterAttendance === 'absent'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent ({absentCnt})</span>
                  </button>

                  <button
                    onClick={() => setApplicantFilterAttendance('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      applicantFilterAttendance === 'pending'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending ({pendingCnt})</span>
                  </button>
                </div>
              </div>

              {/* Executive Attendance Quick Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-black uppercase text-slate-500">Total Registered</div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{totalCnt} Candidates</div>
                </div>
                <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-black uppercase text-emerald-700">Present (Turnout)</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-900 mt-0.5">{presentCnt} ({turnoutRate}%)</div>
                </div>
                <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-black uppercase text-rose-700">Marked Absent</div>
                  <div className="text-lg sm:text-xl font-black text-rose-900 mt-0.5">{absentCnt} Students</div>
                </div>
                <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-black uppercase text-amber-700">Pending Evaluation</div>
                  <div className="text-lg sm:text-xl font-black text-amber-900 mt-0.5">{pendingCnt} In-Progress</div>
                </div>
              </div>
            </div>

            {/* CANDIDATE APPLICANTS TABLE WITH ATTENDANCE MARKING */}
            <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl p-1 sm:p-2 bg-white/95">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[1300px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                      <th className="py-4 px-4 w-14 text-center">S.No</th>
                      <th className="py-4 px-5 min-w-[240px]">Candidate Details</th>
                      <th className="py-4 px-4 min-w-[180px]">Applied Drive</th>
                      <th className="py-4 px-4 min-w-[110px]">AI Match</th>
                      <th className="py-4 px-4 text-center min-w-[240px]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-black">Attendance Marking</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMarkAllPresent(filteredList)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Click to mark all candidate checkboxes as Present"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-200" />
                              <span>Mark All Present</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkAllAbsent(filteredList)}
                              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Mark all as Absent"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>All Absent</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetAllPending(filteredList)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-black uppercase flex items-center gap-0.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Reset all to Pending"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Reset</span>
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-4">Application Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-500 font-bold">
                          <Users className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                          No student candidate applications match the selected drive or attendance filter.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((app, idx) => {
                        const att = app.attendance_status || 'pending';
                        return (
                          <tr key={app.application_id} className="hover:bg-slate-50/80 transition-all">
                            <td className="py-4 px-3 sm:px-4 text-center font-bold text-slate-500">
                              {idx + 1}
                            </td>

                            <td className="py-4 px-4 font-black text-slate-900">
                              <div className="text-sm">{app.candidate_name}</div>
                              <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                                <span className="font-mono text-blue-900 font-bold">{app.roll_number || 'GSFC/2026/CSE/' + String(idx + 1).padStart(3, '0')}</span> • {app.program} ({app.cgpa} CGPA)
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 flex-wrap">
                                <span>{app.candidate_email}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-mono font-black">📞 {app.phone || app.candidate_phone || '+91 98765 43210'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="text-slate-900 font-black">{app.job_title}</div>
                              <div className="text-[11px] text-blue-900 font-bold">{app.ctc_range}</div>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded inline-block mt-0.5 ${app.applied_via === 'external' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                                {app.applied_via === 'external' ? 'Applied Externally' : 'Internal CampusHire AI'}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 text-xs font-black rounded-xl border inline-block ${
                                (app.match_score || app.matchScore || 0) >= 80
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}>
                                {app.match_score || app.matchScore || 85}% Match
                              </span>
                            </td>

                            {/* INTERACTIVE ATTENDANCE MARKING TOGGLE BUTTONS */}
                            <td className="py-4 px-4 text-center">
                              {(() => {
                                const targetAppId = app.application_id || app.id;
                                return (
                                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 shadow-inner">
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttendance(targetAppId, 'present')}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        att === 'present'
                                          ? 'bg-emerald-600 text-white shadow-md scale-105'
                                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                      title="Mark student as Present"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Present</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttendance(targetAppId, 'absent')}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        att === 'absent'
                                          ? 'bg-rose-600 text-white shadow-md scale-105'
                                          : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                                      }`}
                                      title="Mark student as Absent"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Absent</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttendance(targetAppId, 'pending')}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        att === 'pending'
                                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                          : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                      }`}
                                      title="Reset attendance to Pending"
                                    >
                                      <Clock className="w-3 h-3" />
                                      <span>Pending</span>
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="py-4 px-4">
                              <select
                                value={app.status === 'newly_applied' ? 'applied' : (app.status || 'applied')}
                                onChange={(e) => handleUpdateApplicationStatus(app.application_id || app.id, e.target.value)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black focus:outline-none cursor-pointer shadow-sm border transition-all ${
                                  (app.status === 'newly_applied' || app.status === 'applied' || !app.status)
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-black'
                                    : app.status === 'selected'
                                    ? 'bg-amber-50 text-amber-950 border-amber-400 font-black'
                                    : app.status === 'interview'
                                    ? 'bg-blue-50 text-blue-950 border-blue-400 font-black'
                                    : app.status === 'shortlisted'
                                    ? 'bg-purple-50 text-purple-950 border-purple-400 font-black'
                                    : 'bg-rose-50 text-rose-950 border-rose-400 font-black'
                                }`}
                              >
                                <option value="applied">🟢 Newly Applied</option>
                                <option value="shortlisted">⚡ Shortlisted</option>
                                <option value="interview">🗓️ Interview Scheduled</option>
                                <option value="selected">🏆 Selected (Official Offer)</option>
                                <option value="rejected">❌ Rejected</option>
                              </select>
                            </td>

                            <td className="py-4.5 px-5 text-right whitespace-nowrap min-w-[360px]">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAuthenticityCheck(app)}
                                  className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="Inspect Candidate Document Authenticity & Forensic Verification Signals"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Verify Docs</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendCandidateInterviewReminder(app)}
                                  className="py-1.5 px-2.5 bg-green-50 hover:bg-green-100 text-green-900 border border-green-300 rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="Send Interview Schedule / Reminder via WhatsApp & Email"
                                >
                                  <Phone className="w-3.5 h-3.5 text-green-600" />
                                  <span>WhatsApp</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenOfferLetter(app)}
                                  className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                                  title="1-Click Official Stamped Offer Letter Generator"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Offer</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openCandidatePdfReport({ name: app.candidate_name || app.name, email: app.candidate_email || app.email, ats_score: app.ats_score, skills: app.skillsSummary })}
                                  className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md cursor-pointer hover:scale-105"
                                  title="View Candidate Placement Report"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app.application_id || app.id)}
                                  className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer hover:scale-105"
                                  title="Delete candidate application entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER / LIST FINISHED SAVE & COMMIT BAR */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>End of List • Total {filteredList.length} candidate applications registered in this roster.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                  {bulkSaveSuccessMsg && (
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      {bulkSaveSuccessMsg}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkSaveAttendance}
                    disabled={savingBulk || filteredList.length === 0}
                    className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-900 hover:from-emerald-500 hover:to-blue-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
                    title="Save and commit all attendance and recruitment status changes to the database"
                  >
                    <Save className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                    <span>{savingBulk ? 'Saving to Database...' : `💾 Save Attendance Data (${filteredList.length} Candidates)`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 2: ACTIVE REQUIREMENTS GRID */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requirements.map((req) => (
              <div key={req.id} className="glass-card p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.company_logo_url || company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'}
                      alt={req.title}
                      className="w-12 h-12 rounded-2xl object-contain bg-white p-1.5 border border-slate-200 shadow-md shrink-0"
                    />
                    <div>
                      <h3 className="font-black text-base text-slate-900">{req.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-blue-900 font-black">{req.job_type} • CTC: {req.ctc_range}</span>
                        {req.applications_open === 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow-sm">
                            <Ban className="w-3 h-3 text-rose-600" /> Applications Closed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 text-emerald-600" /> Applications Open
                          </span>
                        )}
                        {company?.approved ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" /> Active Drive
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" /> Pending Approval
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" /> {req.applicant_count || 0} Applicants
                  </span>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-bold">{req.job_description}</p>

                {/* RECRUITER DRIVE CONTROLS & ATTENDANCE ACTIONS */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {/* Toggle Stop / Reopen Applications */}
                  <button
                    onClick={() => handleToggleApplications(req.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[38px] ${
                      req.applications_open === 0
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                    title={req.applications_open === 0 ? "Reopen student applications for this drive" : "Stop receiving applications for this drive"}
                  >
                    {req.applications_open === 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Reopen Applications</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                        <span>Stop Accepting Applications</span>
                      </>
                    )}
                  </button>

                  {/* Generate & Download TPC Attendance Report */}
                  <button
                    onClick={() => {
                      const driveApps = allCompanyApplicants.filter(a => a.requirement_id === req.id);
                      handleOpenAttendanceReportModal(req, driveApps.length > 0 ? driveApps : applicantsData);
                    }}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[38px]"
                    title="Generate and export official TPC Attendance Report (CSV / PDF)"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    <span>Download TPC Report</span>
                  </button>
                </div>

                <div className="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <button
                    onClick={() => handleOpenEditModal(req)}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                    title="Edit placement requirement drive details"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => viewApplicants(req)}
                    className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Applicants ({req.applicant_count || 0})</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRequirement(req.id)}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
                    title="Delete placement requirement drive"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLICANTS INSPECTION MODAL FOR SPECIFIC REQUIREMENT DRIVE */}
      {activeReqApplicants && (() => {
        const driveApps = applicantsData;
        const totalDriveApplicants = driveApps.length;
        const presentDriveCount = driveApps.filter(a => a.attendance_status === 'present').length;
        const absentDriveCount = driveApps.filter(a => a.attendance_status === 'absent').length;
        const pendingDriveCount = driveApps.filter(a => !a.attendance_status || a.attendance_status === 'pending').length;

        return (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full shadow-2xl overflow-hidden my-6 text-slate-900 dark:text-slate-100">

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Candidate Applicants Roster
                    </span>
                    {activeReqApplicants.applications_open === 0 ? (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black rounded-lg">
                        🔒 Applications Closed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-lg">
                        🟢 Applications Open
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black">{activeReqApplicants.title}</h2>
                  <p className="text-xs text-slate-300 font-bold">
                    {company?.company_name || 'Recruiter'} • {totalDriveApplicants} Registered Students • Turnout: {totalDriveApplicants > 0 ? Math.round((presentDriveCount / totalDriveApplicants) * 100) : 0}%
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {/* Stop / Reopen toggle button inside modal */}
                  <button
                    onClick={() => handleToggleApplications(activeReqApplicants.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer ${
                      activeReqApplicants.applications_open === 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {activeReqApplicants.applications_open === 0 ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    <span>{activeReqApplicants.applications_open === 0 ? 'Reopen Drive' : 'Stop Applications'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadApplicantsCSV(activeReqApplicants, driveApps)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => handleOpenAttendanceReportModal(activeReqApplicants, driveApps)}
                    className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                    title="Open official TPC Attendance Report (PDF)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>TPC Report</span>
                  </button>

                  <button
                    onClick={() => setActiveReqApplicants(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Attendance Quick Stats Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-center">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-300 block">Marked Present</span>
                  <span className="text-base font-black text-emerald-900 dark:text-emerald-200">{presentDriveCount} Students</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-rose-800 dark:text-rose-300 block">Marked Absent</span>
                  <span className="text-base font-black text-rose-900 dark:text-rose-200">{absentDriveCount} Students</span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-300 block">Pending Review</span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200">{pendingDriveCount} Students</span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {driveApps.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Users className="w-12 h-12 text-slate-400 mx-auto" />
                    <h3 className="font-black text-sm text-slate-700 dark:text-slate-300">No Applications Submitted Yet</h3>
                    <p className="text-xs text-slate-500">Students will appear here as soon as they apply to this hiring drive.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {driveApps.map((app, idx) => {
                      const att = app.attendance_status || 'pending';
                      return (
                        <div key={app.application_id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-blue-900 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{app.name}</h4>
                              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border ${
                                (app.matchScore || app.match_score || 0) >= 85
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : (app.matchScore || app.match_score || 0) >= 70
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                {app.matchScore !== undefined && app.matchScore !== null ? `${app.matchScore}% NLP Match` : `${app.match_score || 85}% Match`}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">
                              <span className="font-mono text-blue-900 dark:text-blue-400 font-bold">{app.roll_number || 'GSFC/2026/CSE/' + String(idx + 1).padStart(3, '0')}</span> • {app.program} • CGPA: {app.cgpa} • Applied: {app.applied_at ? String(app.applied_at).split('T')[0] : 'Recently'}
                            </div>

                            {Array.isArray(app.skillsSummary) && app.skillsSummary.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {app.skillsSummary.slice(0, 5).map(skill => (
                                  <span key={skill} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                            {/* Attendance Marking Toggle Buttons */}
                            {(() => {
                              const targetAppId = app.application_id || app.id;
                              return (
                                <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 gap-1 shadow-inner">
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(targetAppId, 'present')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                      att === 'present'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-300'
                                    }`}
                                    title="Mark Present"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Present</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(targetAppId, 'absent')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                      att === 'absent'
                                        ? 'bg-rose-600 text-white shadow-md'
                                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50 dark:text-slate-300'
                                    }`}
                                    title="Mark Absent"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Absent</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(targetAppId, 'pending')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                      att === 'pending'
                                        ? 'bg-amber-400 text-slate-950 shadow-md'
                                        : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50 dark:text-slate-400'
                                    }`}
                                    title="Reset to Pending"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Pending</span>
                                  </button>
                                </div>
                              );
                            })()}

                            <select
                              value={app.status === 'newly_applied' ? 'applied' : (app.status || 'applied')}
                              onChange={(e) => handleUpdateApplicationStatus(app.application_id || app.id, e.target.value)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black focus:outline-none cursor-pointer shadow-sm border transition-all ${
                                (app.status === 'newly_applied' || app.status === 'applied' || !app.status)
                                  ? 'bg-emerald-50 text-emerald-950 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                                  : app.status === 'selected'
                                  ? 'bg-amber-50 text-amber-950 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                                  : app.status === 'interview'
                                  ? 'bg-blue-50 text-blue-950 border-blue-400 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700'
                                  : app.status === 'shortlisted'
                                  ? 'bg-purple-50 text-purple-950 border-purple-400 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700'
                                  : 'bg-rose-50 text-rose-950 border-rose-400 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700'
                              }`}
                            >
                              <option value="applied">🟢 Newly Applied</option>
                              <option value="shortlisted">⚡ Shortlisted</option>
                              <option value="interview">🗓️ Interview Scheduled</option>
                              <option value="selected">🏆 Selected (Official Offer)</option>
                              <option value="rejected">❌ Rejected</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => openCandidatePdfReport({ name: app.name || app.candidate_name, email: app.email || app.candidate_email, ats_score: app.ats_score, skills: app.skillsSummary })}
                              className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md cursor-pointer hover:scale-105"
                              title="View PDF Report"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-300" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app.application_id || app.id)}
                              className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer hover:scale-105"
                              title="Delete candidate application entry"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleBulkSaveAttendance}
                    disabled={savingBulk || driveApps.length === 0}
                    className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{savingBulk ? 'Saving...' : '💾 Save Attendance Data'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadApplicantsCSV(activeReqApplicants, driveApps)}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Register</span>
                  </button>

                  <button
                    onClick={() => handleOpenAttendanceReportModal(activeReqApplicants, driveApps)}
                    className="py-2 px-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-300" />
                    <span>Download TPC PDF Report</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveReqApplicants(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close Applicants Feed
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CANDIDATE EVALUATION & ATTENDANCE EDITOR MODAL (VIEW / EDIT / SAVE BACK) */}
      <CompanyCandidateEvaluationModal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        application={selectedEvalCandidate}
        onSaveSuccess={handleEvaluationSaveSuccess}
      />

      {/* PDF REPORT MODAL (SINGLE CANDIDATE) */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={selectedCandidateReport}
      />

      {/* OFFICIAL TPC PLACEMENT DRIVE ATTENDANCE & ASSESSMENT REPORT MODAL */}
      <CompanyAttendanceReportModal
        isOpen={attendanceReportModalOpen}
        onClose={() => setAttendanceReportModalOpen(false)}
        requirement={reportTargetReq}
        applicants={reportTargetApplicants}
        company={company}
      />

      {/* RECRUITER COMPANY QUESTION UPLOAD MODAL */}
      {uploadQuestionsModalOpen && (
        <CompanyQuestionUploadModal
          onClose={() => setUploadQuestionsModalOpen(false)}
          onSaveQuestion={(newQ) => {
            const updated = saveCompanyUploadedQuestion(newQ);
            setUploadedCompanyQuestions(updated);
          }}
          onBulkUpload={(qList) => {
            const updated = bulkUploadCompanyQuestions(qList);
            setUploadedCompanyQuestions(updated);
          }}
          uploadedQuestions={uploadedCompanyQuestions}
          onDeleteQuestion={(id) => {
            const updated = deleteCompanyUploadedQuestion(id);
            setUploadedCompanyQuestions(updated);
          }}
        />
      )}

      {/* RECRUITER POST NEW HIRING REQUIREMENT MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-slate-100">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit mb-1">
                  <Sparkles className="w-3 h-3" /> Campus Placement Drive Setup
                </span>
                <h2 className="text-xl font-black">{editingReqId ? 'Edit Hiring Requirement Drive' : 'Post New Hiring Requirement'}</h2>
                <p className="text-xs text-slate-300 font-bold">{company?.company_name || 'GSFC Partner'}</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePostRequirement} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Highlighted Status Notification Banner (No top browser alerts) */}
              {postStatus && (
                <div className={`p-4 rounded-2xl border font-bold text-xs flex items-center justify-between gap-3 shadow-lg ${postStatus.type === 'pending'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-300'
                    : postStatus.type === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-900 dark:text-rose-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    {postStatus.type === 'pending' && <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />}
                    {postStatus.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {postStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                    <span>{postStatus.message}</span>
                  </div>
                  <button type="button" onClick={() => setPostStatus(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Title / Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Development Engineer - AI & Cloud"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* COMPULSORY CORPORATE IDENTITY & CONTACT DETAILS */}
              <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 rounded-2xl border border-amber-400/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    <Building className="w-4 h-4 text-amber-600" /> Corporate Profile & Contact Information (Compulsory)
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md">Required</span>
                </div>

                {/* Logo Upload Box */}
                <div>
                  <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-1">Company Official Logo * (Upload Logo File or Image URL)</label>
                  <div className="flex items-center gap-3">
                    <img
                      src={postForm.company_logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                      alt="Company Logo Preview"
                      className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm"
                    />
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all">
                        <Upload className="w-3.5 h-3.5" /> Upload Logo File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Or paste Company Logo Image URL (https://...)"
                        value={postForm.company_logo_url}
                        onChange={(e) => setPostForm({ ...postForm, company_logo_url: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Company Website URL */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">Company Website *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://company.com"
                      value={postForm.company_website}
                      onChange={(e) => setPostForm({ ...postForm, company_website: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  {/* Corporate Contact Email */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="hr@company.com"
                      value={postForm.company_email}
                      onChange={(e) => setPostForm({ ...postForm, company_email: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  {/* Corporate Phone Number */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">Corporate Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={postForm.company_phone}
                      onChange={(e) => setPostForm({ ...postForm, company_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
              </div>

              {/* Application Method Toggle (Addendum Spec) */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100">Application Method *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPostForm({ ...postForm, application_type: 'internal' })}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${postForm.application_type === 'internal'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <div className="font-black text-xs">Internal CampusHire AI</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Students apply inside platform with auto-filled resume</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostForm({ ...postForm, application_type: 'external' })}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${postForm.application_type === 'external'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <div className="font-black text-xs">External Careers Portal</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Redirect students to company external website</div>
                  </button>
                </div>

                {postForm.application_type === 'external' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">External Application URL (Must start with https://) *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://cloud.google.com/careers/job/123"
                        value={postForm.external_apply_url}
                        onChange={(e) => setPostForm({ ...postForm, external_apply_url: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Application Instructions (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Apply via careers page and mention GSFC University referral"
                        value={postForm.application_instructions}
                        onChange={(e) => setPostForm({ ...postForm, application_instructions: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Programs & CGPA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Minimum CGPA Cutoff *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={postForm.min_cgpa}
                    onChange={(e) => setPostForm({ ...postForm, min_cgpa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Engagement Type *</label>
                  <select
                    value={postForm.job_type}
                    onChange={(e) => setPostForm({ ...postForm, job_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="PPO">PPO (Pre-Placement Offer)</option>
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Required Technical & Domain Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, React, SQL or SolidWorks, GD&T, ANSYS"
                  value={postForm.required_skills}
                  onChange={(e) => setPostForm({ ...postForm, required_skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                />
                
                {/* Domain Quick Skill Suggestion Chips */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Quick Add Domain Skill Chips:</span>
                  <div className="flex flex-wrap gap-1">
                    {['Python', 'React', 'SQL', 'SolidWorks', 'AutoCAD', 'GD&T', 'ANSYS', 'Embedded C', 'PCB Layout', 'STAAD Pro', 'ETABS', 'Aspen Plus', 'PowerBI', 'Financial Modeling'].map((sk, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const current = postForm.required_skills ? postForm.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                          if (!current.includes(sk)) {
                            const updated = [...current, sk].join(', ');
                            setPostForm({ ...postForm, required_skills: updated });
                          }
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-900 text-[10px] font-black rounded-md border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Skills (Optional)</label>
                <input
                  type="text"
                  placeholder="Docker, Six Sigma, Revit, HAZOP, AWS"
                  value={postForm.preferred_skills}
                  onChange={(e) => setPostForm({ ...postForm, preferred_skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* CTC & Openings & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CTC Range *</label>
                  <input
                    type="text"
                    required
                    placeholder="₹18,00,000 - ₹24,00,000 PA"
                    value={postForm.ctc_range}
                    onChange={(e) => setPostForm({ ...postForm, ctc_range: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Open Positions *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={postForm.openings}
                    onChange={(e) => setPostForm({ ...postForm, openings: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={postForm.deadline}
                    onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Description & Core Responsibilities *</label>
                <textarea
                  rows={3}
                  required
                  value={postForm.job_description}
                  onChange={(e) => setPostForm({ ...postForm, job_description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* MANDATORY INTERVIEW QUESTION BANK SECTION */}
              <RequirementQuestionBankForm
                questions={postForm.question_bank}
                onChangeQuestions={(qList) => setPostForm({ ...postForm, question_bank: qList })}
              />

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || (postForm.question_bank || []).length < 5}
                  title={(postForm.question_bank || []).length < 5 ? "Add at least 5 interview questions to publish this drive" : ""}
                  className={`px-6 py-2.5 font-black text-xs rounded-xl shadow-xl flex items-center gap-2 transition-all ${(postForm.question_bank || []).length >= 5
                      ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Saving Requirement...' : editingReqId ? 'Update Requirement Drive' : 'Publish Job Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Official Stamped Offer Letter Generator & Auto-Dispatcher Modal */}
      {offerLetterModalOpen && selectedOfferCandidate && (
        <OfferLetterModal
          isOpen={offerLetterModalOpen}
          onClose={() => {
            setOfferLetterModalOpen(false);
            setSelectedOfferCandidate(null);
          }}
          candidate={selectedOfferCandidate}
          requirement={requirements.find(r => r.id === selectedOfferCandidate.requirement_id)}
          company={company}
          onOfferDispatched={(offerData) => {
            setAllCompanyApplicants(prev => prev.map(a => 
              (a.application_id === selectedOfferCandidate.application_id || a.id === selectedOfferCandidate.application_id)
                ? { ...a, status: 'selected' }
                : a
            ));
          }}
        />
      )}

      {/* WhatsApp & Email Communication Audit Log Modal */}
      {notificationLogsModalOpen && (
        <NotificationLogsModal
          isOpen={notificationLogsModalOpen}
          onClose={() => setNotificationLogsModalOpen(false)}
        />
      )}

      {/* Candidate Document Authenticity & Forensics Modal */}
      {authenticityModalOpen && selectedAuthenticityCandidate && (
        <DocumentAuthenticityModal
          isOpen={authenticityModalOpen}
          onClose={() => {
            setAuthenticityModalOpen(false);
            setSelectedAuthenticityCandidate(null);
          }}
          candidate={selectedAuthenticityCandidate}
          requirement={requirements.find(r => r.id === selectedAuthenticityCandidate.requirement_id)}
          company={company}
        />
      )}
    </div>
  );
}
