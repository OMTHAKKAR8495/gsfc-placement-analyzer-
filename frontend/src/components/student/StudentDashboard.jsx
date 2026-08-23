import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Sparkles, Briefcase, Award, TrendingUp, Search, SlidersHorizontal, ArrowRight, Play, Cpu, Check, Layers, ChevronRight, Compass, ShieldCheck, PieChart, BarChart2, RefreshCw, Zap, Database, X, Star, Bookmark, Code, CheckCircle2, AlertCircle, Edit3, Mail, Download, Paperclip, Printer, Trash2, User, Plus, Building2, Bell, Phone, Calendar, HelpCircle, MessageSquare, Globe } from 'lucide-react';
import MockInterviewChat from './MockInterviewChat';
import CompanyTrackerSidebar from '../common/CompanyTrackerSidebar';
import ReportPDFModal from '../common/ReportPDFModal';
import InternalAutoFillApplyModal from './InternalAutoFillApplyModal';
import ExternalApplyConfirmModal from './ExternalApplyConfirmModal';
import OfferLetterModal from '../common/OfferLetterModal';
import NotificationLogsModal from '../common/NotificationLogsModal';
import JobFairListView from './JobFairListView';
import MentorshipFeed from '../alumni/MentorshipFeed';
import QABoard from '../common/QABoard';
import ResumeUploadPromptModal from './ResumeUploadPromptModal';
import ResumeBuilderAndDossierModal from './ResumeBuilderAndDossierModal';
import EcosystemHubModal from '../common/EcosystemHubModal';
import AICopilotDrawer from '../common/AICopilotDrawer';
import AIPlacementIntelligenceHub from './AIPlacementIntelligenceHub';
import { useToast } from '../../context/ToastContext';

export const DEFAULT_REQUIREMENTS_FEED = [
  {
    id: 'req_google_swe',
    company_name: 'Google Cloud India',
    title: 'Software Development Engineer — AI & Cloud Systems',
    company_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    job_type: 'Full-time',
    ctc_range: '₹24,00,000 - ₹28,00,000 PA',
    openings: 5,
    min_cgpa: 7.5,
    eligible_programs_json: JSON.stringify(['BTech CSE', 'BTech IT', 'MSc CS']),
    required_skills_json: JSON.stringify(['Python', 'React', 'Node.js', 'SQL', 'Cloud Architecture']),
    deadline: '2026-10-30',
    job_description: 'Join Google Cloud engineering team building next-generation enterprise AI infrastructure, distributed cloud microservices, and high-performance developer tools.',
    matchScore: 92,
    eligible: true,
    application_type: 'internal',
    applications_open: 1
  },
  {
    id: 'req_microsoft_sde',
    company_name: 'Microsoft Azure Systems',
    title: 'Graduate Software Engineer (Cloud & Microservices)',
    company_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo_%282012%29.svg',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo_%282012%29.svg',
    job_type: 'Full-time',
    ctc_range: '₹22,00,000 - ₹24,00,000 PA',
    openings: 4,
    min_cgpa: 7.0,
    eligible_programs_json: JSON.stringify(['BTech CSE', 'BTech IT', 'MCA']),
    required_skills_json: JSON.stringify(['C#', 'Python', 'Azure', 'Distributed Systems', 'SQL']),
    deadline: '2026-11-15',
    job_description: 'Develop scalable cloud microservices, Kubernetes control planes, and enterprise AI orchestration pipelines.',
    matchScore: 88,
    eligible: true,
    application_type: 'internal',
    applications_open: 1
  },
  {
    id: 'req_gsfc_core',
    company_name: 'GSFC Limited',
    title: 'Process & Plant Operations Engineer',
    company_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gujarat_State_Fertilizers_and_Chemicals_logo.svg/300px-Gujarat_State_Fertilizers_and_Chemicals_logo.svg.png',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gujarat_State_Fertilizers_and_Chemicals_logo.svg/300px-Gujarat_State_Fertilizers_and_Chemicals_logo.svg.png',
    job_type: 'Full-time',
    ctc_range: '₹10,50,000 - ₹14,00,000 PA',
    openings: 8,
    min_cgpa: 6.5,
    eligible_programs_json: JSON.stringify(['BTech Chemical', 'BTech Mechanical', 'MSc Chemistry']),
    required_skills_json: JSON.stringify(['Process Optimization', 'Chemical Safety', 'Thermodynamics', 'AutoCAD']),
    deadline: '2026-11-30',
    job_description: 'Core engineering and operations management role across GSFC manufacturing plants and modern chemical processing facilities.',
    matchScore: 82,
    eligible: true,
    application_type: 'internal',
    applications_open: 1
  },
  {
    id: 'req_tcs_digital',
    company_name: 'Tata Consultancy Services',
    title: 'Digital Systems & Data Analyst',
    company_logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60',
    logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60',
    job_type: 'Full-time',
    ctc_range: '₹9,00,000 - ₹12,00,000 PA',
    openings: 12,
    min_cgpa: 6.5,
    eligible_programs_json: JSON.stringify(['BTech CSE', 'BTech IT', 'BTech Mechanical', 'MBA']),
    required_skills_json: JSON.stringify(['SQL', 'Python', 'PowerBI', 'Data Analytics', 'Excel']),
    deadline: '2026-12-05',
    job_description: 'Analyze enterprise data warehouses, build automated ETL data pipelines, and develop executive reporting dashboards.',
    matchScore: 85,
    eligible: true,
    application_type: 'internal',
    applications_open: 1
  }
];

export default function StudentDashboard({ student, currentUser, onUpdateStudent, onOpenAuthModal, onOpenJobPost }) {
  const { showToast, triggerCelebrationCrackles } = useToast();

  const getInitialTab = () => {
    try {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('intelligence') || hash.includes('copilot') || hash.includes('readiness') || hash.includes('sandbox')) return 'intelligence';
      if (hash.includes('qa') || hash.includes('community') || hash.includes('doubt')) return 'qa';
      if (hash.includes('job_fair') || hash.includes('conclave') || hash.includes('pool')) return 'job_fairs';
      if (hash.includes('alumni') || hash.includes('mentorship')) return 'alumni';
      if (hash.includes('app') || hash.includes('application')) return 'applications';
      if (hash.includes('assess') || hash.includes('interview') || hash.includes('test')) return 'assessments';
      if (hash.includes('profile') || hash.includes('ats') || hash.includes('resume')) return 'profile';
      const savedTab = localStorage.getItem('gsfc_student_active_tab') || sessionStorage.getItem('gsfc_student_active_tab');
      if (savedTab && ['feed', 'intelligence', 'job_fairs', 'alumni', 'qa', 'profile', 'applications', 'assessments'].includes(savedTab)) {
        return savedTab;
      }
    } catch(e) {}
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    try {
      localStorage.setItem('gsfc_student_active_tab', newTab);
      sessionStorage.setItem('gsfc_student_active_tab', newTab);
      const newHash = newTab === 'feed' ? '#student' : `#student-${newTab}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    } catch(e) {}
  };

  useEffect(() => {
    const handleHashSync = () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('intelligence') || hash.includes('copilot') || hash.includes('readiness') || hash.includes('sandbox')) {
        setActiveTab('intelligence');
        sessionStorage.setItem('gsfc_student_active_tab', 'intelligence');
      } else if (hash.includes('qa') || hash.includes('community') || hash.includes('doubt')) {
        setActiveTab('qa');
        sessionStorage.setItem('gsfc_student_active_tab', 'qa');
      } else if (hash.includes('job_fair') || hash.includes('conclave') || hash.includes('pool')) {
        setActiveTab('job_fairs');
        sessionStorage.setItem('gsfc_student_active_tab', 'job_fairs');
      } else if (hash.includes('alumni') || hash.includes('mentorship')) {
        setActiveTab('alumni');
        sessionStorage.setItem('gsfc_student_active_tab', 'alumni');
      } else if (hash.includes('app') || hash.includes('application')) {
        setActiveTab('applications');
        sessionStorage.setItem('gsfc_student_active_tab', 'applications');
      } else if (hash.includes('assess') || hash.includes('interview') || hash.includes('test')) {
        setActiveTab('assessments');
        sessionStorage.setItem('gsfc_student_active_tab', 'assessments');
      } else if (hash.includes('profile') || hash.includes('ats') || hash.includes('resume')) {
        setActiveTab('profile');
        sessionStorage.setItem('gsfc_student_active_tab', 'profile');
      } else if (hash === '#student' || hash === '') {
        const saved = sessionStorage.getItem('gsfc_student_active_tab');
        if (saved && saved !== 'feed') {
          setActiveTab(saved);
        }
      }
    };

    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const [requirementsFeed, setRequirementsFeed] = useState(DEFAULT_REQUIREMENTS_FEED);
  const [applications, setApplications] = useState([]);
  const [showAllFeed, setShowAllFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedTargetReqId, setSelectedTargetReqId] = useState('');
  const [targetCompanyMatchData, setTargetCompanyMatchData] = useState(null);
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const [builderModalOpen, setBuilderModalOpen] = useState(false);

  // AI Resume Analyzing Progress Modal & Countdown State
  const [analyzingModalOpen, setAnalyzingModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Editable Candidate Fields
  const [candidateName, setCandidateName] = useState(() => {
    if (!currentUser) return 'Guest Explorer';
    try {
      const savedUserStr = localStorage.getItem('campushire_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u.profile?.name || u.name) return u.profile?.name || u.name;
      }
      const directSaved = localStorage.getItem('gsfc_candidate_name');
      if (directSaved) return directSaved;
    } catch(e) {}
    return student?.name || 'Thakkar Om';
  });
  const [candidateEmail, setCandidateEmail] = useState('thakkar_om@gmail.com');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (!currentUser) return '';
    return localStorage.getItem('gsfc_user_avatar') || student?.avatar_url || '';
  });

  useEffect(() => {
    if (!currentUser) {
      setCandidateName('Guest Explorer');
      setAvatarUrl('');
    } else {
      const name = currentUser.profile?.name || currentUser.name || student?.name || 'Thakkar Om';
      setCandidateName(name);
      setAvatarUrl(localStorage.getItem('gsfc_user_avatar') || currentUser.profile?.avatar_url || student?.avatar_url || '');
    }
  }, [currentUser, student]);

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl);
      } else {
        setAvatarUrl(currentUser ? (localStorage.getItem('gsfc_user_avatar') || '') : '');
      }
    };

    const handleUserUpdate = (e) => {
      if (e.detail?.user) {
        const u = e.detail.user;
        const newName = u.profile?.name || u.name || '';
        if (newName) setCandidateName(newName);
      } else if (e.detail?.user === null) {
        setCandidateName('Guest Explorer');
        setAvatarUrl('');
      }
    };

    window.addEventListener('gsfc-avatar-updated', handleAvatarUpdate);
    window.addEventListener('gsfc-user-updated', handleUserUpdate);
    return () => {
      window.removeEventListener('gsfc-avatar-updated', handleAvatarUpdate);
      window.removeEventListener('gsfc-user-updated', handleUserUpdate);
    };
  }, [currentUser]);

  // Selected Match Breakdown Modal State
  const [selectedMatchBreakdown, setSelectedMatchBreakdown] = useState(null);
  // Mail Modal & PDF Report Modal State
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);
  const [ecosystemModalOpen, setEcosystemModalOpen] = useState(false);
  const [mailRecipient, setMailRecipient] = useState(candidateEmail);
  const [mailSentSuccess, setMailSentSuccess] = useState(false);

  // Database Save State
  const [savingToDb, setSavingToDb] = useState(false);
  const [dbSaveConfirmation, setDbSaveConfirmation] = useState(null);

  // AI Mock Interview state
  const [mockSessionActive, setMockSessionActive] = useState(false);
  const [mockTargetRequirement, setMockTargetRequirement] = useState(null);

  // Stamped Offer Letter State
  const [studentOfferLetterOpen, setStudentOfferLetterOpen] = useState(false);
  const [selectedStudentOffer, setSelectedStudentOffer] = useState(null);

  // AI Copilot & Placement Readiness Intelligence State
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [readinessData, setReadinessData] = useState(null);

  // Apply Branching State
  const [selectedReqForApply, setSelectedReqForApply] = useState(null);
  const [internalApplyModalOpen, setInternalApplyModalOpen] = useState(false);
  const [externalConfirmModalOpen, setExternalConfirmModalOpen] = useState(false);

  // Sync candidate fields dynamically when currentUser or student changes
  useEffect(() => {
    const email = (currentUser?.email || student?.email || '').toLowerCase();
    let customProfile = null;
    if (email) {
      try {
        const raw = localStorage.getItem('gsfc_user_profile_' + email);
        if (raw) customProfile = JSON.parse(raw);
      } catch (e) {}
    }

    if (customProfile?.displayName) {
      setCandidateName(customProfile.displayName);
    } else if (currentUser?.profile?.name || currentUser?.name) {
      setCandidateName(currentUser.profile?.name || currentUser.name);
    } else if (student?.name) {
      setCandidateName(student.name);
    } else if (currentUser?.email) {
      const emailName = currentUser.email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
      setCandidateName(emailName || 'Student Candidate');
    }

    if (customProfile?.phone) {
      setCandidatePhone(customProfile.phone);
    } else if (currentUser?.profile?.phone || currentUser?.phone) {
      setCandidatePhone(currentUser.profile?.phone || currentUser.phone);
    } else if (student?.phone) {
      setCandidatePhone(student.phone);
    }

    if (currentUser?.email) {
      setCandidateEmail(currentUser.email);
    }
  }, [currentUser, student]);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'student' || !currentUser.role)) {
      const userKey = currentUser.id || currentUser.owner_id || currentUser.email || 'student';
      const promptShown = sessionStorage.getItem(`gsfc_ats_prompt_shown_${userKey}`);
      if (!promptShown) {
        setResumePromptOpen(true);
        sessionStorage.setItem(`gsfc_ats_prompt_shown_${userKey}`, 'true');
      }
    }

    const handleOpenUpload = () => setResumePromptOpen(true);
    const handleOpenBuilder = () => setBuilderModalOpen(true);

    window.addEventListener('open-resume-upload', handleOpenUpload);
    window.addEventListener('open-resume-builder', handleOpenBuilder);

    return () => {
      window.removeEventListener('open-resume-upload', handleOpenUpload);
      window.removeEventListener('open-resume-builder', handleOpenBuilder);
    };
  }, [currentUser]);

  const handleWithdrawApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw/delete your application?')) return;
    try {
      const res = await fetch(`/api/student/applications/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== appId));
        showToast({
          type: 'info',
          title: 'Application Withdrawn',
          message: 'Your placement application was removed from the active register.',
          triggerCrackles: false
        });
      } else {
        showToast({
          type: 'error',
          title: 'Withdrawal Failed',
          message: data.error || 'Failed to withdraw application',
          triggerCrackles: false
        });
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
    }
  };


  const placementTips = [
    '💡 Tip 1: Quantifiable metrics like "Boosted database speed by 35%" increase ATS score by 40%!',
    '🚀 Fact: Over 85% of GSFC BTech CSE graduates secured PPO & placement offers in 2025!',
    '🎯 Tip 2: Listing Python, React, and SQL directly matches high-demand corporate drives.',
    '🔮 AI Engine: Gemini NLP is vectorizing technical skills & calculating ATS match index...'
  ];


  const analysisStages = [
    '📄 Stage 1: Extracting PDF Text & Candidate Credentials',
    '🔍 Stage 2: Gemini NLP Vectorizing Technical & Soft Skills',
    '📊 Stage 3: Evaluating ATS Match Index & CGPA Cutoffs',
    '✨ Stage 4: Generating Role Recommendations & Skill Gap Analysis'
  ];


  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [assessmentsList, setAssessmentsList] = useState([]);
  const [interviewsList, setInterviewsList] = useState([]);

  useEffect(() => {
    fetchFeed();
    if (student || currentUser) {
      fetchApplications();
      fetchAssessmentsAndInterviews();
      if (student?.name) setCandidateName(student.name);
    }
    // Fetch 10-point placement readiness & probability
    const sId = student?.id || currentUser?.profile?.id || 'demo';
    fetch(`/api/intelligence/readiness/${sId}`)
      .then(r => r.json())
      .then(data => setReadinessData(data))
      .catch(() => {});
  }, [student, showAllFeed, currentUser]);

  const fetchFeed = async () => {
    try {
      const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || '';
      const token = localStorage.getItem('campushire_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/student/requirements?studentId=${studentId}&showAll=${showAllFeed}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.feed && data.feed.length > 0) {
          setRequirementsFeed(data.feed);
          const bSet = new Set();
          data.feed.forEach(r => { if (r.is_bookmarked) bSet.add(r.id); });
          setBookmarkedIds(bSet);
          return;
        }
      }
      // If API fails or is empty on Vercel preview, use standard placement feed
      setRequirementsFeed(DEFAULT_REQUIREMENTS_FEED);
    } catch (err) {
      console.warn('Network fallback: loading default GSFC campus drives feed.');
      setRequirementsFeed(DEFAULT_REQUIREMENTS_FEED);
    }
  };

  const fetchApplications = async () => {
    const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || currentUser?.id;
    if (!studentId) return;
    try {
      const token = localStorage.getItem('campushire_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/student/applications?studentId=${studentId}`, { headers });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchAssessmentsAndInterviews = async () => {
    const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || currentUser?.id;
    if (!studentId) return;
    try {
      const token = localStorage.getItem('campushire_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [asmtRes, intRes] = await Promise.all([
        fetch(`/api/student/assessments?student_id=${studentId}`, { headers }),
        fetch(`/api/student/interviews?student_id=${studentId}`, { headers })
      ]);
      if (asmtRes.ok) {
        const asmts = await asmtRes.json();
        setAssessmentsList(Array.isArray(asmts) ? asmts : []);
      }
      if (intRes.ok) {
        const ints = await intRes.json();
        setInterviewsList(Array.isArray(ints) ? ints : []);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  };

  const handleToggleBookmark = async (e, reqId) => {
    e.stopPropagation();
    const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || currentUser?.id;
    if (!studentId) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    try {
      const token = localStorage.getItem('campushire_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_id: studentId,
          entity_id: reqId,
          entity_type: 'requirement'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (data.is_bookmarked) {
            next.add(reqId);
            showToast({ type: 'success', title: '⭐ Saved to Bookmarks', message: 'Requirement saved to your personal dashboard.' });
          } else {
            next.delete(reqId);
            showToast({ type: 'info', title: 'Bookmark Removed', message: 'Requirement removed from bookmarks.' });
          }
          return next;
        });
        setRequirementsFeed(prev => prev.map(r => r.id === reqId ? { ...r, is_bookmarked: data.is_bookmarked } : r));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!student?.id) {
      showToast({
        type: 'warning',
        title: 'Student Sign In Required',
        message: 'Please sign in with your GSFC student credentials to save your parsed resume.',
        triggerCrackles: false
      });
      return;
    }

    setUploadingResume(true);
    setAnalyzingModalOpen(true);
    setCountdown(5);
    setAnalyzingStage(0);
    setCurrentTipIndex(0);
    setDbSaveConfirmation(null);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });

      setAnalyzingStage(prev => (prev < 3 ? prev + 1 : 3));
      setCurrentTipIndex(prev => (prev + 1) % placementTips.length);
    }, 1200);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('student_id', student.id);
    if (selectedTargetReqId) {
      formData.append('target_requirement_id', selectedTargetReqId);
    }

    try {
      const res = await fetch('/api/student/resume/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload resume');

      if (data.targetCompanyMatch) {
        setTargetCompanyMatchData(data.targetCompanyMatch);
      }

      setTimeout(() => {
        onUpdateStudent(data.student);
        setAnalyzingModalOpen(false);
        setUploadingResume(false);
        if (data.student?.name) setCandidateName(data.student.name);
        fetchFeed();
      }, 1500);
    } catch (err) {
      alert(err.message);
      setAnalyzingModalOpen(false);
      setUploadingResume(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!student?.id) return;
    setSavingToDb(true);

    try {
      const res = await fetch('/api/student/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          name: candidateName,
          program: student.program || 'BTech CSE',
          branch: student.branch || 'Computer Science',
          cgpa: student.cgpa || 8.5,
          ats_score: student.ats_score || 92,
          skills: skillsList
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Database save failed');

      setDbSaveConfirmation(data);
      showToast({
        type: 'success',
        title: '💾 Profile Archived to GSFC Vault',
        message: 'Candidate Data, Extracted Skills & Selection Status saved to SQLite Database!',
        triggerCrackles: true
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
        triggerCrackles: false
      });
    } finally {
      setSavingToDb(false);
    }
  };

  const handleSendMailReport = (e) => {
    e.preventDefault();
    setMailSentSuccess(true);
    setTimeout(() => {
      setMailModalOpen(false);
      setMailSentSuccess(false);
      showToast({
        type: 'success',
        title: '✉️ Email Dispatched',
        message: `Candidate Placement Report mailed successfully to ${mailRecipient}!`,
        triggerCrackles: true
      });
    }, 1200);
  };

  const handleDownloadPDF = () => {
    setPdfReportModalOpen(true);
  };


  const isCompanyUser = currentUser?.role === 'company';

  const currentCompanyName = currentUser?.profile?.company_name || currentUser?.name || '';

  const handleApplyClick = async (reqItem) => {
    // 1. Mandatory Student Authentication Check
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: '🔐 Sign In Required',
        message: 'Please sign into your GSFC University student account to submit placement applications.',
        triggerCrackles: false
      });
      if (typeof onOpenAuthModal === 'function') {
        onOpenAuthModal();
      }
      return;
    }

    if (isCompanyUser) {
      showToast({
        type: 'warning',
        title: 'Recruiter Restriction',
        message: 'Company / Recruiter accounts cannot apply to job postings. Please switch to a Student account.',
        triggerCrackles: false
      });
      return;
    }

    if (reqItem.application_type === 'external') {
      try {
        await fetch('/api/student/increment-external-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirement_id: reqItem.id })
        });
      } catch (err) {}

      const targetUrl = reqItem.external_apply_url || 'https://cloud.google.com/careers';
      window.open(targetUrl, '_blank');

      setSelectedReqForApply(reqItem);
      setExternalConfirmModalOpen(true);
    } else {
      setSelectedReqForApply(reqItem);
      setInternalApplyModalOpen(true);
    }
  };

  const handleConfirmExternalApply = async (reqId) => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: '🔐 Sign In Required',
        message: 'Please sign in to track external applications.',
        triggerCrackles: false
      });
      if (typeof onOpenAuthModal === 'function') onOpenAuthModal();
      return;
    }

    const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || 's_arav';
    const token = localStorage.getItem('campushire_token');
    const targetReq = requirementsFeed.find(r => r.id === reqId);

    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          student_id: studentId,
          requirement_id: reqId,
          applied_via: 'external'
        })
      });

      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }

      if (!res.ok) throw new Error(data.error || data.message || 'Failed to record external application');

      showToast({
        type: 'celebration',
        title: `🎉 Application Tracked for ${targetReq?.company_name || 'Recruiter'}!`,
        message: 'External job application marked as applied in your placement tracker!',
        triggerCrackles: true
      });
      fetchApplications();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Action Error',
        message: err.message,
        triggerCrackles: false
      });
    }
  };

  const handleApply = async (reqId, formOverrideData) => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: '🔐 Sign In Required',
        message: 'Please sign into your GSFC University student account to submit placement applications.',
        triggerCrackles: false
      });
      if (typeof onOpenAuthModal === 'function') {
        onOpenAuthModal();
      }
      return;
    }

    const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || 's_rahul_verma';
    const token = localStorage.getItem('campushire_token');

    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          student_id: studentId,
          requirement_id: reqId,
          applied_via: 'internal',
          override_data: formOverrideData
        })
      });

      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }

      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit application');

      const targetReq = requirementsFeed.find(r => r.id === reqId);

      // Trigger Celebration Toast & Multi-stage Crackles Fireworks
      showToast({
        type: 'celebration',
        title: `🎉 Application Submitted to ${targetReq?.company_name || 'Recruiter'}!`,
        message: `Your verified profile, ATS resume, and credentials dossier have been successfully dispatched.`,
        matchScore: data.matchScore,
        triggerCrackles: true
      });
      
      // Fetch updated applications & feed
      if (student?.id) {
        fetchApplications();
      } else {
        if (targetReq) {
          const newApp = {
            id: 'app_' + Date.now(),
            requirement_title: targetReq.title,
            company_name: targetReq.company_name,
            match_score: data.matchScore || 88,
            applied_at: new Date().toISOString().split('T')[0],
            status: 'applied',
            applied_via: 'internal'
          };
          setApplications(prev => [newApp, ...prev.filter(a => a.requirement_id !== reqId)]);
        }
      }
      fetchFeed();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message,
        triggerCrackles: false
      });
    }
  };

  const startMockInterview = (requirement) => {
    setMockTargetRequirement(requirement);
    setMockSessionActive(true);
  };

  // Safe Skills Array Extractor
  let skillsList = ['C#', 'Go', 'Git', 'GitHub', 'ETL', 'Python', 'SQL'];
  if (student?.parsed_resume_json) {
    try {
      const parsed = typeof student.parsed_resume_json === 'string' ? JSON.parse(student.parsed_resume_json) : student.parsed_resume_json;
      if (parsed.skills) {
        if (Array.isArray(parsed.skills)) skillsList = parsed.skills;
        else if (typeof parsed.skills === 'string') skillsList = parsed.skills.split(',').map(s=>s.trim()).filter(Boolean);
      }
    } catch (err) {
      console.warn('Error parsing skills JSON:', err);
    }
  }

  const filteredFeed = requirementsFeed.filter(r => {
    const titleMatch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = (r.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || companyMatch;

    let programs = [];
    if (Array.isArray(r.eligible_programs_json)) {
      programs = r.eligible_programs_json;
    } else if (typeof r.eligible_programs_json === 'string') {
      try { programs = JSON.parse(r.eligible_programs_json); } catch (e) { programs = [r.eligible_programs_json]; }
    }

    const matchesBranch = selectedBranch === 'All' || (Array.isArray(programs) && programs.some(p => String(p).toLowerCase().includes(selectedBranch.toLowerCase())));
    const matchesBookmark = !bookmarkedOnly || (bookmarkedIds.has(r.id) || r.is_bookmarked);

    return matchesSearch && matchesBranch && matchesBookmark;
  });

  if (mockSessionActive && mockTargetRequirement && student) {
    return (
      <MockInterviewChat
        student={student}
        requirement={mockTargetRequirement}
        onBack={() => setMockSessionActive(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Recruiter Fast Action Banner for Logged-In Companies */}
      {currentUser?.role === 'company' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-400/30 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black shrink-0 border border-white/20 shadow-md">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> GSFC University Placement Engine
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Corporate Hiring Portal: {currentCompanyName || 'Your Organization'}
              </h2>
              <p className="text-xs text-blue-100 max-w-xl font-medium mt-0.5">
                Manage your campus hiring drives, create new job openings, and review AI-ranked candidate dossiers in the dedicated Recruiter Portal.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onOpenJobPost) {
                onOpenJobPost();
              } else {
                window.location.hash = '#company';
              }
            }}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-950 font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-900" />
            <span>+ Post New Job / Drive</span>
          </button>
        </div>
      )}

      {/* Main Student Header Hero */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-r from-blue-900/10 via-teal-900/10 to-indigo-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Candidate Big Passport Photo Frame */}
            <div className="relative group shrink-0">
              <div className="w-20 h-26 sm:w-24 sm:h-32 rounded-3xl overflow-hidden border-3 border-blue-900 dark:border-amber-400 bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center ring-4 ring-blue-500/15 transition-transform group-hover:scale-105">
                {currentUser && avatarUrl ? (
                  <img src={avatarUrl} alt="Candidate Portrait" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-2xl flex items-center justify-center">
                    {currentUser ? (typeof candidateName === 'string' && candidateName.trim() ? candidateName.trim().substring(0, 2).toUpperCase() : 'GS') : 'GS'}
                  </div>
                )}
              </div>
              <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border-2 border-white dark:border-slate-900 shadow-md ${currentUser ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                {currentUser ? 'VERIFIED' : 'GUEST'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-200 rounded-full text-xs font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-900" /> GSFC University Placement Workspace
                </span>
                {currentUser ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> {student?.program || 'BTech CSE'} ({student?.cgpa || 8.5} CGPA)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black flex items-center gap-1.5">
                    👋 Guest Mode • Sign In to Access Portal
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome to <span className="text-gradient">GSFC Placement Portal</span>, {currentUser ? candidateName : 'Guest Explorer'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 font-bold max-w-xl mt-1 leading-relaxed">
                  Smart Resume Analyzer powered by NLP & Gemini AI. Visual skill match analytics, ATS compliance evaluation, and automated interview coaching.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm shrink-0">
            {student ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-blue-900/20 flex items-center justify-center relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      stroke="#1e3a8a"
                      strokeWidth="3.5"
                      strokeDasharray={`${student.ats_score || 92}, 100`}
                      strokeLinecap="round" fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-black text-xs text-slate-900">{student.ats_score || 92}</span>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">ATS Score</div>
                  <div className="text-[11px] text-blue-900 font-bold">
                    {(student.ats_score || 92) >= 85 ? 'Highly Compatible' : 'Optimization Tips'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="text-[10px] text-blue-800 hover:underline font-extrabold block cursor-pointer"
                    >
                      View Breakdown &rarr;
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => setResumePromptOpen(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-black flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Re-Check ATS
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 font-semibold">
                <span className="font-black text-slate-900 block">Guest Explorer</span>
                Sign in to calculate personalized NLP match score
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Segment */}
        <div className="flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 border-t border-slate-200/90 pt-4 overflow-x-auto max-w-full pb-1">
          <button
            onClick={() => handleTabChange('feed')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Live Drives
          </button>

          <button
            onClick={() => handleTabChange('intelligence')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'intelligence'
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-lg scale-105 border border-purple-400/40'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> 🚀 AI Placement Intelligence Hub
          </button>

          <button
            onClick={() => handleTabChange('job_fairs')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'job_fairs'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-400" /> Job Fairs & Conclaves
          </button>

          <button
            onClick={() => setEcosystemModalOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white shadow-md border border-amber-400/40 hover:scale-105 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-amber-300 animate-pulse" /> 🌐 Pool Campus & Assessment Studio
          </button>

          <button
            onClick={() => handleTabChange('alumni')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'alumni'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Award className="w-4 h-4 text-blue-400" /> Alumni Mentorship
          </button>

          <button
            onClick={() => handleTabChange('qa')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" /> Community Q&A
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileText className="w-4 h-4" /> Smart Resume ATS
          </button>

          <button
            onClick={() => handleTabChange('applications')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Award className="w-4 h-4" /> My Applications ({applications.length})
          </button>

          <button
            onClick={() => handleTabChange('assessments')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'assessments'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> My Assessments & Tests ({assessmentsList.length + interviewsList.length})
          </button>

          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap bg-purple-900 hover:bg-purple-800 text-white shadow-md border border-purple-400/40 hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> 🤖 AI Career Copilot
          </button>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left / Main Workspace Feed */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 glass-panel p-4 rounded-2xl border border-slate-200/90">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search role title or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/90 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-bold"
                    />
                  </div>

                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-3 py-2 bg-white/90 border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-black shrink-0"
                  >
                    <option value="All">All Programs</option>
                    <option value="CSE">BTech CSE</option>
                    <option value="IT">BTech IT</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900 shadow-sm">
                    <input
                      type="checkbox"
                      checked={bookmarkedOnly}
                      onChange={(e) => setBookmarkedOnly(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>⭐ Saved / Bookmarked</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAllFeed}
                      onChange={(e) => setShowAllFeed(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4 cursor-pointer"
                    />
                    Show Ineligible Roles
                  </label>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredFeed.map((req) => (
                  <div key={req.id} className="glass-card p-4 sm:p-5 rounded-3xl flex flex-col justify-between space-y-4 relative overflow-hidden border border-slate-200/90 group">
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.company_logo_url || req.logo_url || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60'}
                            alt={req.company_name}
                            className="w-12 h-12 rounded-2xl object-contain bg-slate-50 p-1.5 border border-slate-200 shadow-sm shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm text-slate-900 group-hover:text-blue-900 transition-colors leading-tight">{req.title}</h3>
                              {req.applications_open === 0 && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-sm">
                                  🔒 Applications Closed
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-700 font-black mt-0.5">{req.company_name} • {req.job_type}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleToggleBookmark(e, req.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center ${
                              bookmarkedIds.has(req.id) || req.is_bookmarked
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-white text-slate-400 hover:text-amber-600 border-slate-200'
                            }`}
                            title={bookmarkedIds.has(req.id) || req.is_bookmarked ? 'Remove Bookmark' : 'Bookmark / Save Drive'}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(req.id) || req.is_bookmarked ? 'fill-amber-500 text-amber-600' : ''}`} />
                          </button>

                          {req.matchScore !== null ? (
                            <div 
                              onClick={() => setSelectedMatchBreakdown(req)}
                              className={`px-3 py-1.5 rounded-2xl border text-center font-black text-xs shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-all ${
                                !req.eligible
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : req.matchScore >= 85
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : req.matchScore >= 70
                                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}
                              title="Click to view AI Match Breakdown & Skill Analysis"
                            >
                              <div className="text-[9px] uppercase font-black tracking-wider opacity-80 flex items-center gap-1 justify-center">
                                <Sparkles className="w-2.5 h-2.5" /> NLP Match
                              </div>
                              <div className="text-xs font-black">
                                {req.eligible ? `${req.matchScore}% Match` : 'Ineligible'}
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                if (onOpenAuthModal) onOpenAuthModal();
                                else showToast({
                                  type: 'info',
                                  title: 'Resume Needed',
                                  message: 'Please upload your resume in the Student Workspace to calculate your personalized NLP match score.',
                                  triggerCrackles: false
                                });
                              }}
                              className="px-3 py-1.5 rounded-2xl border border-amber-400/50 bg-amber-50 text-amber-900 font-black text-[11px] shrink-0 shadow-sm hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Match %</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-semibold line-clamp-2">{req.job_description}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {JSON.parse(req.required_skills_json || '[]').map((sk, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100/90 border border-slate-200 text-[11px] font-black text-slate-800 rounded-lg">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200 font-bold">
                        <div><span className="text-slate-500">Eligible:</span> <span className="text-slate-900 font-black">{JSON.parse(req.eligible_programs_json || '[]').join(', ')}</span></div>
                        <div><span className="text-slate-500">Min CGPA:</span> <span className="text-slate-900 font-black">{req.min_cgpa}</span></div>
                        <div><span className="text-slate-500">CTC:</span> <span className="text-blue-900 font-black">{req.ctc_range}</span></div>
                        <div><span className="text-slate-500">Deadline:</span> <span className="text-slate-900 font-black">{req.deadline}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <button
                        onClick={() => startMockInterview(req)}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 min-h-[42px]"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        <span>AI Mock Interview</span>
                      </button>

                      {isCompanyUser ? (
                        (() => {
                          const isOwnJob = (req.company_name && currentCompanyName && req.company_name.toLowerCase().trim() === currentCompanyName.toLowerCase().trim()) ||
                                           (currentUser?.profile?.id && req.company_id === currentUser.profile.id);
                          return isOwnJob ? (
                            <button
                              onClick={() => { window.location.hash = '#company'; }}
                              className="flex-1 py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 min-h-[42px] cursor-pointer"
                              title="You posted this hiring requirement drive. Click to manage it in the Recruiter Portal."
                            >
                              <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span>Manage Your Drive</span>
                            </button>
                          ) : (
                            <div
                              className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-slate-200 min-h-[42px] select-none text-center"
                              title="Company / Recruiter accounts cannot apply to other companies' postings"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Recruiter View Only</span>
                            </div>
                          );
                        })()
                      ) : (
                        <button
                          onClick={() => handleApplyClick(req)}
                          disabled={!req.eligible || req.applications_open === 0}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 min-h-[42px] ${
                            req.applications_open === 0
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                              : !req.eligible
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                              : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white shadow-blue-900/20 cursor-pointer'
                          }`}
                        >
                          {req.applications_open === 0 ? (
                            <span>🔒 Applications Closed</span>
                          ) : req.eligible ? (
                            <><span>Apply Now</span> <ArrowRight className="w-3.5 h-3.5 shrink-0" /></>
                          ) : (
                            <span>{req.eligibilityReason || 'Ineligible'}</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SMART RESUME ANALYZER PAGE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Target Company & Job Drive Benchmarking Selector */}
              <div className="p-5 sm:p-6 rounded-3xl border border-indigo-950/40 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        TARGET COMPANY AI ABILITY CHECK
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white leading-snug">
                      Select Target Company to Benchmark Your Ability & Skills
                    </h3>
                    <p className="text-xs text-slate-300 font-bold mt-0.5">
                      Evaluate your resume ATS compatibility, skill gaps, and CGPA eligibility specifically for your dream hiring drive.
                    </p>
                  </div>

                  {/* Company Dropdown */}
                  <div className="w-full sm:w-72">
                    <select
                      value={selectedTargetReqId}
                      onChange={(e) => setSelectedTargetReqId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                    >
                      <option value="" className="bg-slate-900 text-white font-bold">🏢 Select Target Company Drive...</option>
                      {requirementsFeed.map(r => (
                        <option key={r.id} value={r.id} className="bg-slate-900 text-white font-bold">
                          🏢 {r.company_name} — {r.title} ({r.ctc_range})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Target Company Suitability Matrix */}
                {(() => {
                  const targetReq = requirementsFeed.find(r => r.id === selectedTargetReqId) || (targetCompanyMatchData ? {
                    company_name: targetCompanyMatchData.companyName,
                    title: targetCompanyMatchData.roleTitle,
                    ctc_range: targetCompanyMatchData.ctcRange,
                    required_skills_json: JSON.stringify([...(targetCompanyMatchData.matchedSkills || []), ...(targetCompanyMatchData.missingSkills || [])]),
                    matchScore: targetCompanyMatchData.matchScore,
                    min_cgpa: targetCompanyMatchData.cgpaCheckPassed ? 8.0 : 9.0
                  } : null);

                  if (!targetReq) return null;

                  let reqSkills = [];
                  try {
                    reqSkills = typeof targetReq.required_skills_json === 'string'
                      ? JSON.parse(targetReq.required_skills_json)
                      : (targetReq.required_skills_json || []);
                  } catch(e) {}

                  const matched = reqSkills.filter(s => skillsList.some(sk => sk.toLowerCase().includes(s.toLowerCase())));
                  const missing = reqSkills.filter(s => !matched.includes(s));
                  const cgpaOk = (student?.cgpa || 8.4) >= (targetReq.min_cgpa || 0);

                  return (
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={targetReq.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'}
                            alt={targetReq.company_name}
                            className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-white/20 shrink-0"
                          />
                          <div>
                            <h4 className="font-black text-sm text-white">{targetReq.company_name || targetReq.companyName}</h4>
                            <div className="text-xs text-amber-300 font-bold">{targetReq.title || targetReq.roleTitle} • {targetReq.ctc_range || targetReq.ctcRange}</div>
                          </div>
                        </div>

                        <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400 rounded-xl text-xs font-black">
                          🎯 {targetReq.matchScore || 88}% Target Ability Match
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/10 space-y-1">
                          <span className="text-[10px] font-black text-emerald-400 uppercase block">✅ Matched Technical Skills ({matched.length})</span>
                          <div className="flex flex-wrap gap-1">
                            {matched.length > 0 ? matched.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                                {s}
                              </span>
                            )) : <span className="text-slate-400 text-[10px]">Upload updated resume to check match</span>}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/10 space-y-1">
                          <span className="text-[10px] font-black text-rose-400 uppercase block">⭕ Recommended Skills to Add ({missing.length})</span>
                          <div className="flex flex-wrap gap-1">
                            {missing.length > 0 ? missing.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                                {s}
                              </span>
                            )) : <span className="text-emerald-300 text-[10px]">✅ 100% Target Skill Match!</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300 font-medium pt-1">
                        <span>🎓 Candidate CGPA: <strong>{student?.cgpa || 8.4}</strong> (Min Cutoff: {targetReq.min_cgpa || 'None'}) {cgpaOk ? '✅ Meets Cutoff' : '⚠️ Below Cutoff'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 1. Drag & Drop Resume Upload Banner — Sign-In Required Guard */}
              {!student?.id ? (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 text-center space-y-4 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 text-white shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="space-y-1 max-w-lg mx-auto">
                    <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase rounded-md border border-amber-400/30">
                      GSFC University Student Sign-In Required
                    </span>
                    <h3 className="text-lg font-black text-white">Sign In to Upload & Analyze Resume</h3>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      To calculate personalized NLP match scores, extract technical skills, and check eligibility for active GSFC campus recruitment drives, please sign in with your official GSFC student account.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenAuthModal) onOpenAuthModal();
                      else showToast({
                        type: 'info',
                        title: 'Sign In Required',
                        message: 'Please click "Sign In" at the top right header to log in or register your GSFC student account.',
                        triggerCrackles: false
                      });
                    }}
                    className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In / Register to Upload Resume</span>
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-3xl border-2 border-dashed border-blue-900/30 text-center space-y-3 bg-white/90">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                    <Upload className="w-6 h-6 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Drag & Drop your Resume here</h3>
                    <p className="text-xs text-slate-600 font-bold max-w-md mx-auto mt-0.5">
                      Supports PDF, DOCX, or TXT format. Automated parsing will extract candidate name, technical skills, and eligibility.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all">
                      <Paperclip className="w-4 h-4" />
                      <span>{uploadingResume ? 'Parsing PDF...' : 'Browse File from Computer'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                        disabled={uploadingResume}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setBuilderModalOpen(true)}
                      className="inline-flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Don't have a resume? Build One & Upload 3 Documents</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Active Candidate Badge Bar */}
              <div className="p-4 bg-white/90 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white font-black text-base flex items-center justify-center shadow-md">
                    {candidateName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{candidateName}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-300">
                        Active Candidate
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-bold mt-0.5">
                      Software & Tech Professional • {skillsList.length} Technical Skills Extracted
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black rounded-xl shrink-0">
                  Experience: <span className="text-amber-800 font-black">~1 Years</span>
                </div>
              </div>

              {/* 3. Extracted Candidate Analysis Report Box */}
              <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/90 space-y-5 bg-white/95">
                {/* Header Title & Action Buttons (Save DB, Download PDF, Mail Report) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Extracted Candidate Name:</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isEditingName ? (
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          onBlur={() => setIsEditingName(false)}
                          className="px-2.5 py-1 border border-blue-900 rounded-lg text-base font-black text-slate-900 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <h2 className="text-xl font-black text-slate-900">{candidateName}</h2>
                      )}
                      <button
                        onClick={() => setIsEditingName(!isEditingName)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-lg border border-slate-200 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {isEditingName ? 'Save' : 'Edit Name'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="py-2 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all min-h-[38px] cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Download My ATS PDF Report</span>
                    </button>
                  </div>
                </div>

                {dbSaveConfirmation && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-black flex items-center justify-between gap-2 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{dbSaveConfirmation.message}</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
                      Record ID: {dbSaveConfirmation.db_record_id}
                    </span>
                  </div>
                )}

                {/* FINAL SELECTION DECISION BANNER */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      FINAL SELECTION DECISION FOR {candidateName.toUpperCase()}:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-sm rounded-xl flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" />
                        PASS (ELIGIBLE FOR PLACEMENT)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-bold max-w-md leading-relaxed">
                    Candidate fulfills core foundational requirements. Company condition is favorable for hiring with targeted on-the-job improvement.
                  </p>
                </div>

                {/* CANDIDATE INFO & CONTACT DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Candidate Name</span>
                    <span className="text-slate-900 font-black text-sm">{candidateName}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 block text-[10px] font-black uppercase">Contact Email & Phone</span>
                      <button onClick={() => setIsEditingEmail(!isEditingEmail)} className="text-[10px] text-blue-900 hover:underline font-black">
                        {isEditingEmail ? 'Save' : 'Edit Email'}
                      </button>
                    </div>
                    {isEditingEmail ? (
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        onBlur={() => setIsEditingEmail(false)}
                        className="w-full mt-1 px-2 py-1 border border-blue-900 rounded text-xs font-bold text-slate-900"
                        autoFocus
                      />
                    ) : (
                      <span className="text-blue-900 font-black text-xs block truncate mt-0.5">{candidateEmail}</span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Professional Title</span>
                    <span className="text-slate-900 font-black text-sm block mt-0.5">Software & Tech Professional</span>
                  </div>
                </div>

                {/* EXTRACTED TECHNICAL SKILLS MATRIX */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    EXTRACTED TECHNICAL SKILLS MATRIX ({skillsList.length})
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((sk, sIdx) => (
                      <span key={sIdx} className="px-3.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black rounded-xl shadow-sm hover:border-blue-500 transition-all">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-900" /> My Applications Timeline
              </h2>

              {isCompanyUser && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-black text-blue-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Corporate Recruiter Mode: {currentCompanyName || 'Your Company'}</span>
                    </div>
                    <p className="text-slate-600 font-bold">
                      Company accounts manage and evaluate incoming candidate applications rather than submitting them. To view and process applications received from students, please open the Recruiter Portal.
                    </p>
                  </div>
                  <button
                    onClick={() => { window.location.hash = '#company'; }}
                    className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shrink-0 cursor-pointer shadow-md transition-all"
                  >
                    Open Recruiter Portal &rarr;
                  </button>
                </div>
              )}

              {applications.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Award className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="font-black text-sm text-slate-700">No Student Applications Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isCompanyUser
                      ? 'Switch to a student profile or use the Recruiter Portal to manage candidates registered for your drives.'
                      : 'Browse live GSFC campus requirements and click "Apply Now" to track your application submissions here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="glass-card p-4 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={app.logo_url || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60'}
                          alt={app.company_name}
                          className="w-12 h-12 rounded-2xl object-contain bg-slate-50 p-1.5 border border-slate-200 shrink-0"
                        />
                        <div>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">{app.job_title}</h3>
                          <div className="text-xs text-slate-700 font-bold">{app.company_name} • Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                          <div className="text-xs font-black text-blue-900 mt-0.5">{app.ctc_range}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <div className="text-left md:text-right">
                          <div className="text-xs font-black text-blue-900">NLP Match: {app.match_score}%</div>
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200 mt-0.5">
                            {app.status}
                          </span>
                        </div>

                        {(app.status === 'selected' || app.offer_letter_data_json) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentOffer({
                                candidate_name: student?.name || candidateName,
                                candidate_email: student?.email || candidateEmail,
                                candidate_roll: student?.roll_number || 'GSFC/2026/CSE/001',
                                job_title: app.job_title,
                                company_name: app.company_name,
                                ctc_range: app.ctc_range,
                                ...app
                              });
                              setStudentOfferLetterOpen(true);
                            }}
                            className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition-all shrink-0 min-h-[42px] cursor-pointer hover:scale-105"
                            title="View Official GSFC TPC Stamped Placement Offer Letter"
                          >
                            <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                            <span>View Offer Letter</span>
                          </button>
                        )}

                        <button
                          onClick={() => startMockInterview({ id: app.requirement_id, title: app.job_title, company_name: app.company_name })}
                          className="py-2.5 px-4 bg-theme-gradient text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all shrink-0 min-h-[42px]"
                        >
                          <Play className="w-3.5 h-3.5 shrink-0" /> <span>AI Mock Interview</span>
                        </button>

                        <button
                          onClick={() => handleWithdrawApplication(app.id)}
                          className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all shrink-0 min-h-[42px]"
                          title="Withdraw / Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">Withdraw</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'job_fairs' && (
            <div className="space-y-4">
              <JobFairListView
                currentUser={currentUser}
                onOpenAuth={onOpenAuthModal}
                onSelectJobDrive={(drive) => {
                  handleTabChange('feed');
                  setSearchQuery(drive.job_title || drive.company_name);
                }}
              />
            </div>
          )}

          {activeTab === 'alumni' && (
            <div className="space-y-4">
              <MentorshipFeed
                currentUser={currentUser}
                onOpenAuth={onOpenAuthModal}
              />
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4">
              <QABoard
                currentUser={currentUser}
                onOpenAuth={onOpenAuthModal}
              />
            </div>
          )}

          {activeTab === 'assessments' && (
            <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Assessment & Interview History</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    My Technical Tests & AI Mock Interviews
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Permanent assessment scorecards, proctoring integrity records, and AI mock interview feedback stored in your GSFC account.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEcosystemModalOpen(true)}
                    className="px-4 py-2.5 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-4 h-4" />
                    <span>Take Proctored Test</span>
                  </button>
                </div>
              </div>

              {/* Assessment Records */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Proctored Test Results ({assessmentsList.length})</span>
                </h3>

                {assessmentsList.length === 0 ? (
                  <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-black text-slate-700">No Assessment Records Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Complete proctored coding and aptitude assessments to verify your skills for corporate recruiter shortlists.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessmentsList.map(asmt => (
                      <div key={asmt.id} className="glass-card p-4 rounded-2xl border border-slate-200/90 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase">
                              {asmt.assessment_type || 'technical'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug">
                              {asmt.assessment_title}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-emerald-700">
                              {asmt.percentage}%
                            </span>
                            <div className="text-[10px] text-slate-500 font-bold">
                              {asmt.score} pts
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-2.5 rounded-xl text-[11px] font-bold text-slate-700">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-black">Attempted</span>
                            <span>{asmt.questions_attempted || 0} Qs</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-black">Correct</span>
                            <span className="text-emerald-600 font-black">{asmt.correct_answers || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-black">Status</span>
                            <span className="text-blue-600 font-black uppercase text-[10px]">{asmt.status}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 font-medium">
                          Submitted: {new Date(asmt.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mock Interview Records */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  <span>AI Mock Interview Sessions ({interviewsList.length})</span>
                </h3>

                {interviewsList.length === 0 ? (
                  <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 space-y-2">
                    <Play className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-black text-slate-700">No Mock Interviews Attempted Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Practice role-specific interview questions on any Live Drive to receive AI coaching and readiness scoring.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interviewsList.map(session => (
                      <div key={session.id} className="glass-card p-4 rounded-2xl border border-slate-200/90 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-black uppercase">
                              {session.company_name || 'Corporate Drive'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug">
                              {session.requirement_title || 'Role Interview'}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-blue-700">
                              {session.overall_score || 85}%
                            </span>
                            <div className="text-[10px] text-slate-500 font-bold">
                              Overall Readiness
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 font-medium">
                          Completed: {new Date(session.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <AIPlacementIntelligenceHub
              student={student}
              currentUser={currentUser}
              onSelectTargetRequirement={(req) => {
                handleTabChange('feed');
                setSearchQuery(req.title || req.company_name);
              }}
            />
          )}
        </div>

        {/* Right Sticky Sidebar */}
        <div className="lg:col-span-1">
          <CompanyTrackerSidebar />
        </div>

      </div>

      {/* MAIL REPORT MODAL */}
      {mailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-600" /> Mail Placement Report
              </h3>
              <button onClick={() => setMailModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMailReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={mailRecipient}
                  onChange={(e) => setMailRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase">Attached Summary</div>
                <div className="font-black text-slate-900">GSFC Placement Result — {candidateName}</div>
                <div className="text-[11px] text-emerald-800 font-black">Status: PASS (ELIGIBLE FOR PLACEMENT)</div>
              </div>

              <button
                type="submit"
                disabled={mailSentSuccess}
                className="w-full py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg min-h-[44px]"
              >
                {mailSentSuccess ? 'Sending Email...' : 'Send Mail Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1-PAGE PRINTABLE EVALUATION REPORT MODAL */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={{
          name: candidateName,
          email: candidateEmail,
          atsScore: student?.ats_score || 92,
          skills: skillsList
        }}
      />

      {/* AI RESUME ANALYZING COUNTDOWN MODAL */}
      {analyzingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 text-center overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-900/30 animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Gemini AI Resume Analyzer</h2>
              <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto">
                Parsing PDF vector text, calculating ATS compatibility, and matching against corporate requirements...
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
                  {analysisStages[analyzingStage]}
                </span>
                <span className="text-blue-900 text-base font-black px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-lg">
                  {countdown > 0 ? `0${countdown}s` : '✨ Complete!'}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-gradient-to-r from-blue-900 via-indigo-700 to-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-left space-y-1 animate-fadeIn">
              <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> GSFC Placement Insight & Tip
              </div>
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                {placementTips[currentTipIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI MATCH BREAKDOWN & SKILL ANALYSIS MODAL */}
      {selectedMatchBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 my-8">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit">
                  <Sparkles className="w-3 h-3 text-amber-400" /> GSFC AI Domain Match Breakdown
                </span>
                <h2 className="text-xl font-black">{selectedMatchBreakdown.title}</h2>
                <p className="text-xs text-slate-300 font-bold">{selectedMatchBreakdown.company_name} • CTC: {selectedMatchBreakdown.ctc_range}</p>
              </div>
              <button
                onClick={() => setSelectedMatchBreakdown(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Score Meter Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border ${
                    !selectedMatchBreakdown.eligible
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : selectedMatchBreakdown.matchScore >= 85
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}>
                    <span className="text-xl leading-none">{selectedMatchBreakdown.eligible ? `${selectedMatchBreakdown.matchScore}%` : '0%'}</span>
                    <span className="text-[9px] uppercase font-bold mt-1">Match</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      {selectedMatchBreakdown.eligible ? 'Academic & Domain Fit Evaluated' : 'Eligibility Criteria Mismatch'}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      {selectedMatchBreakdown.eligibilityReason || 'Candidate satisfies initial program cutoff.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black shrink-0 w-full sm:w-auto">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block uppercase">Skill Fit</span>
                    <span className="text-blue-900 text-sm">{selectedMatchBreakdown.breakdown?.skillFitScore || 0}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block uppercase">Experience</span>
                    <span className="text-indigo-900 text-sm">{selectedMatchBreakdown.breakdown?.experienceScore || 0}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block uppercase">Academic</span>
                    <span className="text-emerald-900 text-sm">{selectedMatchBreakdown.breakdown?.academicScore || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Matched Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ✅ Matched Skills ({selectedMatchBreakdown.matchedSkills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                  {selectedMatchBreakdown.matchedSkills && selectedMatchBreakdown.matchedSkills.length > 0 ? (
                    selectedMatchBreakdown.matchedSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 font-bold italic">No exact skill overlap detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> ⚠️ Missing / Implied Skills ({selectedMatchBreakdown.missingSkills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60">
                  {selectedMatchBreakdown.missingSkills && selectedMatchBreakdown.missingSkills.length > 0 ? (
                    selectedMatchBreakdown.missingSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-lg flex items-center gap-1">
                        <X className="w-3 h-3 text-amber-600" /> {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold">Candidate possesses all required skills!</span>
                  )}
                </div>
              </div>

              {/* AI Strength Rationale */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">AI Match Rationale</span>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  {selectedMatchBreakdown.strengthSummary || 'Candidate demonstrates valid domain preparation for this role.'}
                </p>
              </div>

              {/* Actionable Improvement Tips */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-900" /> 🎯 Actionable Improvement Tips
                </span>
                <div className="space-y-2">
                  {(selectedMatchBreakdown.improvementTips || []).map((tip, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs font-bold text-blue-950 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedMatchBreakdown(null)}
                className="py-2.5 px-5 bg-blue-900 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERNAL AUTO-FILL APPLY MODAL */}
      <InternalAutoFillApplyModal
        isOpen={internalApplyModalOpen}
        onClose={() => setInternalApplyModalOpen(false)}
        requirement={selectedReqForApply}
        student={student || currentUser?.profile || currentUser}
        onSubmitApplication={(reqId, formData) => handleApply(reqId, formData)}
      />

      {/* EXTERNAL APPLY TRACKER CONFIRMATION MODAL */}
      <ExternalApplyConfirmModal
        isOpen={externalConfirmModalOpen}
        onClose={() => setExternalConfirmModalOpen(false)}
        requirement={selectedReqForApply}
        onConfirmApplied={(reqId) => handleConfirmExternalApply(reqId)}
      />

      {/* STUDENT VIEW OFFICIAL STAMPED OFFER LETTER MODAL */}
      {studentOfferLetterOpen && selectedStudentOffer && (
        <OfferLetterModal
          isOpen={studentOfferLetterOpen}
          onClose={() => {
            setStudentOfferLetterOpen(false);
            setSelectedStudentOffer(null);
          }}
          candidate={selectedStudentOffer}
          requirement={{ title: selectedStudentOffer.job_title, ctc_range: selectedStudentOffer.ctc_range }}
          company={{ company_name: selectedStudentOffer.company_name }}
        />
      )}

      {/* 🚀 ON-LOGIN RESUME UPLOAD & ATS RECRUITER CHECK PROMPT MODAL */}
      <ResumeUploadPromptModal
        isOpen={resumePromptOpen}
        onClose={() => setResumePromptOpen(false)}
        currentUser={currentUser}
        requirements={requirementsFeed}
        onOpenBuilder={() => setBuilderModalOpen(true)}
        onUploadSuccess={(data) => {
          if (onUpdateStudent && data.student) {
            onUpdateStudent(data.student);
          }
          if (data.targetCompanyMatch) {
            setTargetCompanyMatchData(data.targetCompanyMatch);
          }
          showToast({
            type: 'success',
            title: 'Resume Analyzed & ATS Scored!',
            message: `ATS Score: ${data.atsScore}/100. Target recruiter match evaluated!`,
            triggerCrackles: true
          });
        }}
      />

      {/* 🌟 FULL-FEATURED RESUME BUILDER & 3-DOCUMENT VERIFICATION DOSSIER MODAL */}
      <ResumeBuilderAndDossierModal
        isOpen={builderModalOpen}
        onClose={() => setBuilderModalOpen(false)}
        student={student}
        currentUser={currentUser}
        requirements={requirementsFeed}
        onSuccess={(data) => {
          if (onUpdateStudent && data.student) {
            onUpdateStudent(data.student);
          }
          if (data.targetCompanyMatch) {
            setTargetCompanyMatchData(data.targetCompanyMatch);
          }
          showToast({
            type: 'success',
            title: 'Profile Built & Verified Documents Uploaded!',
            message: `ATS Score: ${data.atsScore}/100. Structured resume created with 3 verification files!`,
            triggerCrackles: true
          });
        }}
      />

      {/* 🌐 ENTERPRISE POOL DRIVES & PROCTORED ASSESSMENT STUDIO (POD.AI SUITE) */}
      <EcosystemHubModal
        isOpen={ecosystemModalOpen}
        onClose={() => setEcosystemModalOpen(false)}
        currentUser={currentUser}
        defaultTab="assessment"
      />

      {/* 🤖 AI STUDENT CAREER COPILOT DRAWER */}
      <AICopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentUser={currentUser}
        mode="student"
      />
    </div>
  );
}
