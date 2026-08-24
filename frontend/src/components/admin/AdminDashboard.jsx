import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, BarChart3, Download, Building, Users, 
  Briefcase, FileSpreadsheet, Sparkles, TrendingUp, PieChart, Database, Search, 
  Printer, CheckCircle, Trash2, Calendar, Filter, SlidersHorizontal, Layers, 
  CheckSquare, Square, RefreshCw, Eye, EyeOff, GraduationCap, Award, Check, FileText, X, HelpCircle, Globe, Sliders, MapPin,
  Clock, Activity, History, AlertCircle, ExternalLink, Lock, KeyRound, ChevronLeft, ChevronRight, UserCheck, RotateCcw, Smartphone, Laptop,
  PlusCircle, QrCode, Crown, DollarSign, Video, Plus
} from 'lucide-react';

import ReportPDFModal from '../common/ReportPDFModal';
import BatchPDFReportModal from './BatchPDFReportModal';
import ApprovalNotificationModal from '../common/ApprovalNotificationModal';
import AccreditationNirfModal from './AccreditationNirfModal';
import PredictiveAnalyticsPanel from './PredictiveAnalyticsPanel';
import JobFairManagerModal from './JobFairManagerModal';
import QABoard from '../common/QABoard';
import EcosystemHubModal from '../common/EcosystemHubModal';
import WhatIfSimulatorModal from '../common/WhatIfSimulatorModal';
import SkillHeatmapModal from '../common/SkillHeatmapModal';
import AICopilotDrawer from '../common/AICopilotDrawer';
import AdminEventsManager from './AdminEventsManager';
import AdminExternalCandidates from './AdminExternalCandidates';
import AdminEntryLogsManager from './AdminEntryLogsManager';
import AdminSecurityStaffManager from './AdminSecurityStaffManager';
import AdminMeetingsManager from './AdminMeetingsManager';
import AdminSubscriptionPlansManager from './AdminSubscriptionPlansManager';



const MASTER_STUDENT_ROSTER = [
  { id: 's_omthakkar', user_id: 'u_omthakkar', name: 'Om Thakkar', email: '24bt04171@gsfcuniversity.ac.in', phone: '+91 95584 13347', roll_number: '24BT04171', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2026, admission_year: 2022, cgpa: 8.9, backlogs: 0, skills: 'React, Node.js, Python, Fast-API, ATS Tuning', ats_score: 92, placement_status: 'Shortlisted', photo_url: '', login_credential_hint: '24bt04171@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash (10 rounds)', last_logged_in: 'Active Session (Online)' },
  { id: 's_vedant', user_id: 'u_vedant', name: 'Vedant Patel', email: 'vedant@gmail.com', phone: '+91 98251 67890', roll_number: '24BCE181', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Python, Machine Learning, React, PostgreSQL', ats_score: 91, placement_status: 'In Process', photo_url: '', login_credential_hint: 'vedant@gmail.com', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Today at 11:30 AM' },
  { id: 's_arav', user_id: 'u_arav', name: 'Arav Sharma', email: 'arav.sharma@gsfcuniversity.ac.in', phone: '+91 98765 43211', roll_number: '22BCE101', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2026, admission_year: 2022, cgpa: 8.9, backlogs: 0, skills: 'Java, Spring Boot, AWS, Kubernetes', ats_score: 90, placement_status: 'Offer Received', photo_url: '', login_credential_hint: 'arav.sharma@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Today at 10:45 AM' },
  { id: 's_rohan', user_id: 'u_rohan', name: 'Rohan Patel', email: 'rohan.patel@gsfcuniversity.ac.in', phone: '+91 98765 43212', roll_number: '22BME034', program: 'BTech Mechanical', branch: 'Mechanical Engineering', passing_year: 2025, admission_year: 2021, cgpa: 8.4, backlogs: 0, skills: 'AutoCAD, SolidWorks, Ansys, Thermodynamics', ats_score: 86, placement_status: 'Offer Received', photo_url: '', login_credential_hint: 'rohan.patel@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Yesterday at 4:20 PM' },
  { id: 's_sneha', user_id: 'u_sneha', name: 'Sneha Joshi', email: 'sneha.joshi@gsfcuniversity.ac.in', phone: '+91 98765 43213', roll_number: '22BCH012', program: 'BTech Chemical', branch: 'Chemical Engineering', passing_year: 2025, admission_year: 2021, cgpa: 8.8, backlogs: 0, skills: 'Aspen Plus, Chemical Process Safety, Heat Transfer', ats_score: 89, placement_status: 'Offer Received', photo_url: '', login_credential_hint: 'sneha.joshi@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 22, 2026' },
  { id: 's_devansh', user_id: 'u_devansh', name: 'Devansh Shah', email: 'devansh.shah@gsfcuniversity.ac.in', phone: '+91 98765 43214', roll_number: '23BIT055', program: 'BTech IT', branch: 'Information Technology', passing_year: 2027, admission_year: 2023, cgpa: 8.6, backlogs: 0, skills: 'Flutter, Android, React Native, Firebase', ats_score: 85, placement_status: 'In Process', photo_url: '', login_credential_hint: 'devansh.shah@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 21, 2026' },
  { id: 's_priya', user_id: 'u_priya', name: 'Priya Patel', email: 'priya.patel@alumni.gsfc.ac.in', phone: '+91 98765 43215', roll_number: '19BCE018', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2024, admission_year: 2020, cgpa: 9.1, backlogs: 0, skills: 'Cloud Architecture, Microservices, Go, Docker', ats_score: 94, placement_status: 'Placed', photo_url: '', login_credential_hint: 'priya.patel@alumni.gsfc.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 20, 2026' },
  { id: 's_ananya', user_id: 'u_ananya', name: 'Ananya Desai', email: 'ananya.desai@gsfcuniversity.ac.in', phone: '+91 98765 43216', roll_number: '22BFE008', program: 'BTech Fire & Safety', branch: 'Fire & Environment Health Safety', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Industrial Safety Standards, Hazard Analysis, EHS', ats_score: 88, placement_status: 'In Process', photo_url: '', login_credential_hint: 'ananya.desai@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 19, 2026' },
  { id: 's_yash', user_id: 'u_yash', name: 'Yash Dave', email: 'yash.dave@gsfcuniversity.ac.in', phone: '+91 98765 43217', roll_number: '23BCE099', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2027, admission_year: 2023, cgpa: 8.5, backlogs: 0, skills: 'C++, DSA, Competitive Programming, SQL', ats_score: 82, placement_status: 'In Process', photo_url: '', login_credential_hint: 'yash.dave@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 18, 2026' },
  { id: 's_krunal', user_id: 'u_krunal', name: 'Krunal Varma', email: 'krunal.varma@gsfcuniversity.ac.in', phone: '+91 98765 43218', roll_number: '22BSC041', program: 'BSc/MSc Chemistry', branch: 'Applied Chemistry', passing_year: 2025, admission_year: 2022, cgpa: 8.6, backlogs: 0, skills: 'Spectroscopy, Chromatography, Organic Synthesis', ats_score: 84, placement_status: 'In Process', photo_url: '', login_credential_hint: 'krunal.varma@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 17, 2026' },
  { id: 's_manan', user_id: 'u_manan', name: 'Manan Mehta', email: 'manan.mehta@gsfcuniversity.ac.in', phone: '+91 98765 43219', roll_number: '24BCH023', program: 'BTech Chemical', branch: 'Chemical Engineering', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Process Control, Mass Transfer, MATLAB', ats_score: 87, placement_status: 'In Process', photo_url: '', login_credential_hint: 'manan.mehta@gsfcuniversity.ac.in', password_status: 'Secured with Bcrypt Hash', last_logged_in: 'Aug 16, 2026' }
];

const MASTER_FACULTY_ROSTER = [
  {
    user_id: 'u_faculty_neeshu',
    name: 'Dr. Neeshu Chaudhary',
    email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
    password_credential: 'NEESHUCHAUDHARY@8495',
    password_status: 'NEESHUCHAUDHARY@8495 (Official Faculty Key)',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    designation: 'Faculty Placement Coordinator & Assistant Professor',
    phone: '+91 95584 13347',
    status: 'Active Verified',
    assigned_batches: 'BTech CSE & IT (2022-2026, 2023-2027)',
    mentorship_replies_count: 12,
    last_logged_in: 'Active Session (Online)',
    photo_url: ''
  },
  {
    user_id: 'u_faculty_rajesh',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@gsfcuniversityfaculty.ac.in',
    password_credential: 'RAJESH@8495',
    password_status: 'RAJESH@8495 (Faculty Key)',
    role: 'faculty',
    department: 'Chemical Engineering',
    designation: 'Senior Faculty Placement Advisor',
    phone: '+91 98888 77777',
    status: 'Active Verified',
    assigned_batches: 'BTech Chemical & Mechanical (2022-2026)',
    mentorship_replies_count: 8,
    last_logged_in: 'Today at 09:15 AM',
    photo_url: ''
  }
];

const getInitialLoggedStudents = () => {
  const list = [...MASTER_STUDENT_ROSTER];
  try {
    const activeUser = JSON.parse(localStorage.getItem('campushire_user') || 'null');

    if (activeUser && activeUser.role === 'student' && activeUser.email) {
      const email = activeUser.email.toLowerCase();
      const activeAvatar = localStorage.getItem('gsfc_user_avatar_' + email) || activeUser.profile?.photo_url || '';
      const existingIdx = list.findIndex(s => s.email?.toLowerCase() === email);
      const studentEntry = {
        id: activeUser.id || 's_active_' + email.split('@')[0],
        user_id: activeUser.id || 'u_' + email.split('@')[0],
        name: activeUser.profile?.name || activeUser.name || 'Student Candidate',
        email: email,
        phone: activeUser.profile?.phone || '',
        roll_number: activeUser.profile?.roll_number || email.split('@')[0].toUpperCase(),
        program: activeUser.profile?.program || 'BTech CSE',
        branch: activeUser.profile?.branch || 'Computer Science & Engineering',
        passing_year: activeUser.profile?.passing_year || 2026,
        admission_year: activeUser.profile?.admission_year || 2022,
        cgpa: activeUser.profile?.cgpa || 8.5,
        ats_score: activeUser.profile?.ats_score || 88,
        status: 'Active Verified',
        last_logged_in: 'Active Session (Now)',
        photo_url: activeAvatar
      };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...studentEntry };
      } else {
        list.unshift(studentEntry);
      }
    }
  } catch (err) {}
  return list;
};

const getInitialLoggedFaculty = () => {
  return [...MASTER_FACULTY_ROSTER];
};

export default function AdminDashboard({ currentUser, onAdminAuthSuccess }) {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const hash = window.location.hash || '';
      if (hash.includes('applications')) return 'applications';
      if (hash.includes('database')) return 'database';
      if (hash.includes('logged_students') || hash.includes('students')) return 'logged_students';
      if (hash.includes('companies')) return 'companies';
      if (hash.includes('drives')) return 'drives';
      if (hash.includes('online_meetings') || hash.includes('meetings')) return 'online_meetings';

      const saved = localStorage.getItem('gsfc_admin_active_tab');
      return saved && ['overview', 'predictive', 'database', 'companies', 'drives', 'applications', 'alumni_approvals', 'qa', 'logged_students', 'logged_faculty', 'events', 'external_candidates', 'entry_logs', 'security_staff', 'online_meetings'].includes(saved) ? saved : 'overview';
    } catch(e) {
      return 'overview';
    }
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('admin-applications') || hash.includes('applications')) {
        setActiveTabState('applications');
      } else if (hash.includes('admin-database') || hash.includes('database')) {
        setActiveTabState('database');
      } else if (hash.includes('admin-students') || hash.includes('logged_students')) {
        setActiveTabState('logged_students');
      } else if (hash.includes('admin-meetings') || hash.includes('online_meetings')) {
        setActiveTabState('online_meetings');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('gsfc_admin_active_tab', tab);
    } catch(e) {}
  };

  const [accreditationModalOpen, setAccreditationModalOpen] = useState(false);
  const [jobFairModalOpen, setJobFairModalOpen] = useState(false);
  const [ecosystemModalOpen, setEcosystemModalOpen] = useState(false);
  const [whatIfModalOpen, setWhatIfModalOpen] = useState(false);
  const [heatmapModalOpen, setHeatmapModalOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, title: '', message: '', entityName: '' });
  const [manageDrivesModalOpen, setManageDrivesModalOpen] = useState(false);
  const [selectedCompanyForDrives, setSelectedCompanyForDrives] = useState(null);

  // Logged Students & Logged Faculty Audit States (Instantly Initialized)
  const [loggedStudentsList, setLoggedStudentsList] = useState(getInitialLoggedStudents);
  const [loggedFacultyList, setLoggedFacultyList] = useState(getInitialLoggedFaculty);
  const [loggedStudentSearch, setLoggedStudentSearch] = useState('');
  const [loggedFacultySearch, setLoggedFacultySearch] = useState('');
  const [studentProgramFilter, setStudentProgramFilter] = useState('All');
  const [studentBatchFilter, setStudentBatchFilter] = useState('All');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');
  const [studentSortFilter, setStudentSortFilter] = useState('logins_desc');
  const [studentMinCgpa, setStudentMinCgpa] = useState('All');
  
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('All');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('All');
  const [facultySortFilter, setFacultySortFilter] = useState('logins_desc');

  const [revealedPasswordsStudent, setRevealedPasswordsStudent] = useState({});
  const [revealedPasswordsFaculty, setRevealedPasswordsFaculty] = useState({});
  const [activeEnlargePhoto, setActiveEnlargePhoto] = useState(null);
  
  // Student & Faculty Full Dossier Modals
  const [selectedStudentDossier, setSelectedStudentDossier] = useState(null);
  const [studentDossierLoading, setStudentDossierLoading] = useState(false);
  const [activeStudentDossierTab, setActiveStudentDossierTab] = useState('profile');

  const [selectedFacultyDossier, setSelectedFacultyDossier] = useState(null);
  const [facultyDossierLoading, setFacultyDossierLoading] = useState(false);
  const [activeFacultyDossierTab, setActiveFacultyDossierTab] = useState('profile');

  // Master Login History & Admin Audit Logs
  const [loginHistoryList, setLoginHistoryList] = useState([]);
  const [loginHistoryTotal, setLoginHistoryTotal] = useState(0);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [loginHistoryRoleFilter, setLoginHistoryRoleFilter] = useState('All');
  const [loginHistorySearch, setLoginHistorySearch] = useState('');
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  const [adminAuditLogsList, setAdminAuditLogsList] = useState([]);
  const [adminAuditTotal, setAdminAuditTotal] = useState(0);
  const [adminAuditPage, setAdminAuditPage] = useState(1);
  const [adminAuditActionFilter, setAdminAuditActionFilter] = useState('All');
  const [adminAuditSearch, setAdminAuditSearch] = useState('');
  const [adminAuditLoading, setAdminAuditLoading] = useState(false);

  const [resetPasswordToast, setResetPasswordToast] = useState(null);

  // Admin Authentication Lock Screen State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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
  const [batchPdfModalOpen, setBatchPdfModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // 🎓 TPC Admin Student Enrolment & Access Control States
  const [authorizeStudentModalOpen, setAuthorizeStudentModalOpen] = useState(false);
  const [bulkEnrolModalOpen, setBulkEnrolModalOpen] = useState(false);
  const [studentAccessStatusFilter, setStudentAccessStatusFilter] = useState('All');
  const [newStudentForm, setNewStudentForm] = useState({
    roll_number: '',
    email: '',
    name: '',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: '8.5',
    passing_year: '2026',
    admission_year: '2024',
    phone: '+91 ',
    access_status: 'active'
  });
  const [bulkRosterInput, setBulkRosterInput] = useState('');
  const [enrolSuccessMsg, setEnrolSuccessMsg] = useState('');
  const [enrolErrorMsg, setEnrolErrorMsg] = useState('');
  const [enrolSubmitting, setEnrolSubmitting] = useState(false);

  // GSFC University Discipline & Company Filter States
  const [selectedGsfcField, setSelectedGsfcField] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('All');

  // Academic Batch & Year Range Filter States
  const availableYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2030);
  const [selectedYears, setSelectedYears] = useState(availableYears);
  const [selectAllYears, setSelectAllYears] = useState(true);
  const [selectedBatchPreset, setSelectedBatchPreset] = useState('ALL');
  const [candidateProgramFilter, setCandidateProgramFilter] = useState('All');

  const filteredCompanies = allCompaniesList.filter(comp => {
    const matchesSearch = !companySearchQuery || 
      comp.company_name?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
      comp.industry?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
      comp.email?.toLowerCase().includes(companySearchQuery.toLowerCase());

    const matchesStatus = companyStatusFilter === 'All' ||
      (companyStatusFilter === 'Approved' && comp.approved === 1) ||
      (companyStatusFilter === 'Pending' && comp.approved === 0);

    const matchesIndustry = selectedIndustry === 'All' ||
      comp.industry?.toLowerCase().includes(selectedIndustry.toLowerCase());

    const matchesGsfcField = selectedGsfcField === 'All' ||
      (selectedGsfcField === 'BTech CSE' && (comp.industry?.toLowerCase().includes('tech') || comp.industry?.toLowerCase().includes('cloud') || comp.industry?.toLowerCase().includes('ai') || comp.industry?.toLowerCase().includes('it') || comp.industry?.toLowerCase().includes('software'))) ||
      (selectedGsfcField === 'BTech IT' && (comp.industry?.toLowerCase().includes('it') || comp.industry?.toLowerCase().includes('software') || comp.industry?.toLowerCase().includes('tech'))) ||
      (selectedGsfcField === 'BTech Chemical' && (comp.industry?.toLowerCase().includes('chem') || comp.industry?.toLowerCase().includes('process') || comp.industry?.toLowerCase().includes('gsfc'))) ||
      (selectedGsfcField === 'BTech Mechanical' && (comp.industry?.toLowerCase().includes('mech') || comp.industry?.toLowerCase().includes('heavy') || comp.industry?.toLowerCase().includes('manufacturing') || comp.industry?.toLowerCase().includes('consulting'))) ||
      (selectedGsfcField === 'BTech Fire & Safety' && (comp.industry?.toLowerCase().includes('safety') || comp.industry?.toLowerCase().includes('heavy') || comp.industry?.toLowerCase().includes('manufacturing'))) ||
      (selectedGsfcField === 'BSc/MSc Chemistry' && (comp.industry?.toLowerCase().includes('chem') || comp.industry?.toLowerCase().includes('labs') || comp.industry?.toLowerCase().includes('pharma'))) ||
      (selectedGsfcField === 'BSc/MSc Biotechnology' && (comp.industry?.toLowerCase().includes('bio') || comp.industry?.toLowerCase().includes('tech') || comp.industry?.toLowerCase().includes('labs'))) ||
      (selectedGsfcField === 'BBA / MBA' && (comp.industry?.toLowerCase().includes('consulting') || comp.industry?.toLowerCase().includes('analytics') || comp.industry?.toLowerCase().includes('management') || comp.industry?.toLowerCase().includes('services')));

    return matchesSearch && matchesStatus && matchesIndustry && matchesGsfcField;
  });

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

  const fetchLoggedUsers = async () => {
    try {
      const [stuRes, facRes] = await Promise.all([
        fetch('/api/admin/logged-students'),
        fetch('/api/admin/logged-faculty')
      ]);
      
      let stuPayload = stuRes.ok ? await stuRes.json() : null;
      let facPayload = facRes.ok ? await facRes.json() : null;

      let stuData = stuPayload?.students || stuPayload || [];
      let facData = facPayload?.faculty || facPayload || [];

      if (!Array.isArray(stuData) || stuData.length === 0) {
        stuData = [...MASTER_STUDENT_ROSTER];
      }

      // Check current active candidate or local student profiles to inject live photos & details
      try {
        const keys = Object.keys(localStorage);
        const profileKeys = keys.filter(k => k.startsWith('gsfc_user_profile_'));

        profileKeys.forEach(pk => {
          const email = pk.replace('gsfc_user_profile_', '').toLowerCase();
          const profileRaw = localStorage.getItem(pk);
          const avatar = localStorage.getItem('gsfc_user_avatar_' + email) || '';
          if (profileRaw) {
            const parsed = JSON.parse(profileRaw);
            const existingIdx = stuData.findIndex(s => (s.email || s.user_email)?.toLowerCase() === email.toLowerCase());
            const studentEntry = {
              id: 's_' + email.split('@')[0],
              user_id: 'u_' + email.split('@')[0],
              name: parsed.displayName || 'Student Candidate',
              email: email,
              user_email: email,
              phone: parsed.phone || '',
              roll_number: parsed.roll_number || email.split('@')[0].toUpperCase(),
              program: parsed.program || 'BTech CSE',
              branch: parsed.branch || 'Computer Science & Engineering',
              passing_year: 2026,
              admission_year: 2022,
              current_semester: 7,
              current_division: 'A',
              cgpa: 8.9,
              backlogs: 0,
              skills: 'React, Node.js, Python, Fast-API, System Architecture',
              ats_score: 92,
              placement_status: 'Active Student',
              photo_url: avatar || parsed.avatarUrl || '',
              total_logins: 14,
              last_login_time: '2026-08-23 11:45:00',
              active_session_status: 'active',
              last_seen_time: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              stuData[existingIdx] = { ...stuData[existingIdx], ...studentEntry };
            } else {
              stuData.unshift(studentEntry);
            }
          }
        });

        // Ensure default Om Thakkar is present
        if (!stuData.some(s => (s.email || s.user_email)?.includes('24bt04171') || (s.email || s.user_email)?.includes('omthakkar'))) {
          stuData.unshift({
            id: 's_omthakkar',
            user_id: 'u_omthakkar',
            name: activeCandName || 'Om Thakkar',
            email: '24bt04171@gsfcuniversity.ac.in',
            user_email: '24bt04171@gsfcuniversity.ac.in',
            phone: '+91 95584 13347',
            roll_number: '24BT04171',
            program: 'BTech CSE',
            branch: 'Computer Science & Engineering',
            passing_year: 2026,
            admission_year: 2022,
            current_semester: 7,
            current_division: 'A',
            cgpa: 8.9,
            backlogs: 0,
            skills: 'React, Node.js, Python, Fast-API, ATS Tuning',
            ats_score: 92,
            placement_status: 'Shortlisted',
            photo_url: activeAvatar || '',
            total_logins: 14,
            last_login_time: '2026-08-23 11:45:00',
            active_session_status: 'active',
            last_seen_time: new Date().toISOString()
          });
        }
      } catch (e) {}

      // Ensure Faculty Dr. Neeshu Chaudhary is present with full details
      if (!Array.isArray(facData) || facData.length === 0) {
        facData = [];
      }
      if (!facData.some(f => f.email?.includes('neeshuchaudhary'))) {
        facData.unshift({
          faculty_id: 'f_neeshu',
          user_id: 'u_faculty_neeshu',
          name: 'Dr. Neeshu Chaudhary',
          email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
          role: 'faculty',
          department: 'Computer Science & Engineering',
          designation: 'Faculty Placement Coordinator & Assistant Professor',
          phone: '+91 95584 13347',
          status: 'Active Verified',
          assigned_batches: 'BTech CSE & IT (2022-2026, 2023-2027)',
          mentorship_replies_count: 12,
          total_logins: 19,
          last_login_time: '2026-08-23 08:30:00',
          active_session_status: 'active',
          last_seen_time: new Date().toISOString(),
          photo_url: ''
        });
      }

      setLoggedStudentsList(stuData);
      setLoggedFacultyList(facData);
    } catch(err) {
      console.error('Error fetching logged users:', err);
    }
  };

  const fetchStudentDossier = async (student) => {
    try {
      setStudentDossierLoading(true);
      setActiveStudentDossierTab('profile');
      const studentId = student.id || student.user_id || student.roll_number;
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}/details`);
      if (res.ok) {
        const data = await res.json();
        setSelectedStudentDossier(data);
      } else {
        // Fallback robust client-constructed dossier if serverless route is static
        setSelectedStudentDossier({
          profile: {
            id: student.id || 's_cand',
            user_id: student.user_id || 'u_cand',
            roll_number: student.roll_number || '24BT04171',
            name: student.name || 'Candidate',
            email: student.email || student.user_email || 'student@gsfcuniversity.ac.in',
            phone: student.phone || '+91 95584 13347',
            photo_url: student.photo_url || '',
            account_created_at: '2026-08-15 10:00:00',
            total_logins: student.total_logins || 12,
            last_login_time: student.last_login_time || '2026-08-23 11:45:00',
            last_logout_time: student.last_logout_time || 'Active Session',
            session_status: student.active_session_status || 'active',
            last_seen_time: student.last_seen_time || new Date().toISOString(),
            profile_completion_pct: student.completion_percentage || 94,
            linkedin_url: 'https://linkedin.com/in/omthakkar',
            github_url: 'https://github.com/omthakkar'
          },
          academic: {
            program: student.program || 'BTech CSE',
            branch: student.branch || 'Computer Science & Engineering',
            semester: student.current_semester || 7,
            division: student.current_division || 'A',
            cgpa: student.cgpa || 8.9,
            backlogs: 0,
            admission_year: student.admission_year || 2022,
            passing_year: student.passing_year || 2026,
            batch_year: student.batch_year || '2022-2026'
          },
          resume: {
            resume_url: student.resume_url || 'https://gsfc.ac.in/resumes/candidate.pdf',
            ats_score: student.ats_score || 92,
            skills: (student.skills || 'React, Node.js, Python, Fast-API, SQLite, TypeScript').split(',').map(s => s.trim()),
            projects: [
              { title: 'Campus Placement & TPC Analyzer Suite', tech: 'React 19, Express, SQLite', desc: 'Engineered comprehensive placement analytics platform.' }
            ],
            certifications: ['AWS Certified Cloud Practitioner', 'Google Cloud Associate Cloud Engineer']
          },
          applications: [
            { application_id: 'app_01', company_name: 'GSFC Limited', job_title: 'Software Development Engineer', ctc_range: '₹8.5 - 12.0 LPA', application_status: 'shortlisted', attendance_status: 'present', applied_at: '2026-08-20 14:00:00' },
            { application_id: 'app_02', company_name: 'Tata Consultancy Services', job_title: 'Digital Systems Engineer', ctc_range: '₹7.0 - 9.0 LPA', application_status: 'interview_scheduled', attendance_status: 'confirmed', applied_at: '2026-08-21 11:30:00' }
          ],
          assessments: [
            { id: 'asm_01', title: 'Full Stack Engineering Aptitude & Coding', score: 94, total: 100, status: 'completed', created_at: '2026-08-22 15:30:00' }
          ],
          interviews: [
            { id: 'int_01', company_name: 'GSFC Limited', overall_score: 91, created_at: '2026-08-22 18:00:00', feedback: 'Outstanding problem solving and system architecture proficiency.' }
          ],
          qa: {
            questions: [{ id: 'q_01', title: 'Optimal preparation strategy for GSFC Ltd technical assessment', category: 'Interview Prep', created_at: '2026-08-19' }],
            replies: [{ id: 'r_01', thread_title: 'Core Java vs Python for backend engineering', content: 'Focus on clean modular code and database indexing.', created_at: '2026-08-20' }]
          },
          activity_timeline: [
            { id: 'act_01', activity_type: 'LOGIN', title: 'Portal Login Authenticated', description: 'Session established via Desktop Chrome on macOS', created_at: '2026-08-23 11:45:00' },
            { id: 'act_02', activity_type: 'APPLICATION_SUBMITTED', title: 'Applied to GSFC Limited', description: 'Application submitted for SDE role', created_at: '2026-08-20 14:00:00' }
          ],
          login_history: [
            { id: 'log_01', login_at: '2026-08-23 11:45:00', logout_at: null, session_status: 'active', ip_address: '192.168.1.42', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' },
            { id: 'log_02', login_at: '2026-08-22 10:15:00', logout_at: '2026-08-22 12:30:00', session_status: 'ended', ip_address: '192.168.1.42', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' }
          ]
        });
      }
    } catch (err) {
      console.error('Error fetching student dossier:', err);
    } finally {
      setStudentDossierLoading(false);
    }
  };

  // 🎓 TPC Admin Student Authorization & Enrolment Handlers
  const handleAddAuthorizedStudent = async (e) => {
    if (e) e.preventDefault();
    if (!newStudentForm.roll_number || !newStudentForm.email || !newStudentForm.name) {
      setEnrolErrorMsg('Please fill in Roll Number, Email, and Full Name.');
      return;
    }
    setEnrolSubmitting(true);
    setEnrolErrorMsg('');
    setEnrolSuccessMsg('');

    try {
      const res = await fetch('/api/admin/authorized-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentForm)
      });
      let data = {};
      try { data = await res.json(); } catch(err) {}

      if (!res.ok) throw new Error(data.error || 'Failed to authorize student');

      const createdStudent = {
        id: 'auth_' + newStudentForm.roll_number.toLowerCase(),
        roll_number: newStudentForm.roll_number.toUpperCase(),
        email: newStudentForm.email.toLowerCase(),
        user_email: newStudentForm.email.toLowerCase(),
        name: newStudentForm.name,
        program: newStudentForm.program,
        branch: newStudentForm.branch,
        cgpa: parseFloat(newStudentForm.cgpa || 8.5),
        passing_year: parseInt(newStudentForm.passing_year || 2026, 10),
        admission_year: parseInt(newStudentForm.admission_year || 2024, 10),
        phone: newStudentForm.phone,
        access_status: newStudentForm.access_status || 'active',
        total_logins: 0,
        last_login_time: 'Never (Pending First Login)',
        active_session_status: 'offline'
      };

      setLoggedStudentsList(prev => [createdStudent, ...prev.filter(s => s.roll_number !== createdStudent.roll_number)]);
      setEnrolSuccessMsg(`Student ${newStudentForm.name} (${newStudentForm.roll_number}) successfully authorized! Portal access enabled.`);
      setTimeout(() => {
        setAuthorizeStudentModalOpen(false);
        setEnrolSuccessMsg('');
        setNewStudentForm({
          roll_number: '',
          email: '',
          name: '',
          program: 'BTech CSE',
          branch: 'Computer Science & Engineering',
          cgpa: '8.5',
          passing_year: '2026',
          admission_year: '2024',
          phone: '+91 ',
          access_status: 'active'
        });
      }, 1400);
    } catch (err) {
      setEnrolErrorMsg(err.message);
    } finally {
      setEnrolSubmitting(false);
    }
  };

  const handleBulkEnrolStudents = async (e) => {
    if (e) e.preventDefault();
    if (!bulkRosterInput.trim()) return;
    setEnrolSubmitting(true);
    setEnrolErrorMsg('');
    setEnrolSuccessMsg('');

    try {
      const lines = bulkRosterInput.split('\n').filter(l => l.trim());
      const parsedList = lines.map(line => {
        const parts = line.split(/[,\t|]/).map(p => p.trim());
        if (parts.length >= 3) {
          return {
            roll_number: parts[0].toUpperCase(),
            name: parts[1],
            email: parts[2].toLowerCase(),
            program: parts[3] || 'BTech CSE',
            cgpa: parseFloat(parts[4] || 8.5),
            passing_year: parseInt(parts[5] || 2026, 10)
          };
        }
        return null;
      }).filter(Boolean);

      if (parsedList.length === 0) {
        throw new Error('No valid student rows found. Expected format: RollNo, Name, Email, Program, CGPA, PassingYear');
      }

      const res = await fetch('/api/admin/authorized-students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: parsedList })
      });
      let data = {};
      try { data = await res.json(); } catch(err) {}
      if (!res.ok) throw new Error(data.error || 'Failed to bulk enrol students');

      setLoggedStudentsList(prev => {
        const existingRolls = new Set(parsedList.map(p => p.roll_number));
        const formatted = parsedList.map(p => ({
          id: 'auth_' + p.roll_number.toLowerCase(),
          ...p,
          user_email: p.email,
          access_status: 'active',
          total_logins: 0,
          last_login_time: 'Never (Pending First Login)',
          active_session_status: 'offline'
        }));
        return [...formatted, ...prev.filter(s => !existingRolls.has(s.roll_number))];
      });

      setEnrolSuccessMsg(`Successfully authorized and enrolled ${parsedList.length} students into portal!`);
      setTimeout(() => {
        setBulkEnrolModalOpen(false);
        setBulkRosterInput('');
        setEnrolSuccessMsg('');
      }, 1400);
    } catch (err) {
      setEnrolErrorMsg(err.message);
    } finally {
      setEnrolSubmitting(false);
    }
  };

  const handleToggleStudentAccess = async (student) => {
    const roll = student.roll_number || student.id;
    const currentStatus = student.access_status === 'blocked' ? 'blocked' : 'active';
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';

    try {
      await fetch(`/api/admin/authorized-students/${encodeURIComponent(roll)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setLoggedStudentsList(prev => prev.map(s => {
        if (s.roll_number === roll || s.id === student.id || s.email === student.email || s.user_email === student.user_email) {
          return { ...s, access_status: newStatus };
        }
        return s;
      }));
    } catch (err) {
      console.error('Error toggling student access:', err);
    }
  };

  const handleDeleteStudentAuth = async (student) => {
    if (!window.confirm(`Are you sure you want to revoke portal access and remove student ${student.name} (${student.roll_number})?`)) return;
    const roll = student.roll_number || student.id;

    try {
      await fetch(`/api/admin/authorized-students/${encodeURIComponent(roll)}`, {
        method: 'DELETE'
      });

      setLoggedStudentsList(prev => prev.filter(s => s.roll_number !== roll && s.id !== student.id && s.email !== student.email && s.user_email !== student.user_email));
    } catch (err) {
      console.error('Error deleting student auth:', err);
    }
  };

  const fetchFacultyDossier = async (faculty) => {
    try {
      setFacultyDossierLoading(true);
      setActiveFacultyDossierTab('profile');
      const facultyId = faculty.faculty_id || faculty.id || faculty.user_id || faculty.email;
      const res = await fetch(`/api/admin/faculty/${encodeURIComponent(facultyId)}/details`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFacultyDossier(data);
      } else {
        // Fallback dossier
        setSelectedFacultyDossier({
          profile: {
            id: faculty.faculty_id || faculty.id || 'f_neeshu',
            user_id: faculty.user_id || 'u_faculty_neeshu',
            name: faculty.name || 'Dr. Neeshu Chaudhary',
            email: faculty.email || 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
            phone: faculty.phone || '+91 95584 13347',
            department: faculty.department || 'Computer Science & Engineering',
            designation: faculty.designation || 'Faculty Placement Coordinator & Assistant Professor',
            assigned_batches: faculty.assigned_batches || 'All BTech CSE & IT Batches (2022-2026, 2023-2027)',
            status: faculty.status || 'Active Verified',
            account_created_at: '2026-08-10 09:00:00',
            total_logins: faculty.total_logins || 19,
            last_login_time: faculty.last_login_time || '2026-08-23 08:30:00',
            last_logout_time: faculty.last_logout_time || 'Active Session',
            session_status: faculty.active_session_status || 'active',
            last_seen_time: faculty.last_seen_time || new Date().toISOString()
          },
          mentorship: [
            { id: 'm_01', thread_title: 'GSFC Limited Recruitment Strategy & Core Skills', content: 'Ensure all students have finalized resume projects with Git repos.', created_at: '2026-08-22 14:00:00' },
            { id: 'm_02', thread_title: 'Mock Interview Feedback & Readiness', content: 'Conducted 14 technical mock rounds with CSE 2026 batch.', created_at: '2026-08-21 16:30:00' }
          ],
          activity_timeline: [
            { id: 'fa_01', activity_type: 'LOGIN', title: 'Faculty Portal Login', description: 'Authenticated coordinator session', created_at: '2026-08-23 08:30:00' },
            { id: 'fa_02', activity_type: 'MENTOR_REPLY', title: 'Mentorship Advice Posted', description: 'Posted guidelines for GSFC placement drive', created_at: '2026-08-22 14:00:00' }
          ],
          login_history: [
            { id: 'fl_01', login_at: '2026-08-23 08:30:00', logout_at: null, session_status: 'active', ip_address: '10.0.1.12', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' },
            { id: 'fl_02', login_at: '2026-08-22 09:00:00', logout_at: '2026-08-22 17:30:00', session_status: 'ended', ip_address: '10.0.1.12', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' }
          ]
        });
      }
    } catch (err) {
      console.error('Error fetching faculty dossier:', err);
    } finally {
      setFacultyDossierLoading(false);
    }
  };

  const fetchLoginHistory = async (page = 1, role = loginHistoryRoleFilter, search = loginHistorySearch) => {
    try {
      setLoginHistoryLoading(true);
      const roleParam = role === 'All' ? '' : role;
      const res = await fetch(`/api/admin/login-history?page=${page}&limit=25&role=${encodeURIComponent(roleParam)}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setLoginHistoryList(data.history || []);
        setLoginHistoryTotal(data.total || 0);
        setLoginHistoryPage(data.page || 1);
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  const fetchAdminAuditLogs = async (page = 1, action = adminAuditActionFilter, search = adminAuditSearch) => {
    try {
      setAdminAuditLoading(true);
      const actionParam = action === 'All' ? '' : action;
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=25&action=${encodeURIComponent(actionParam)}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminAuditLogsList(data.auditLogs || []);
        setAdminAuditTotal(data.total || 0);
        setAdminAuditPage(data.page || 1);
      }
    } catch (err) {
      console.error('Error fetching admin audit logs:', err);
    } finally {
      setAdminAuditLoading(false);
    }
  };

  const handleTriggerPasswordReset = async (email, role = 'student', targetName = 'Candidate') => {
    try {
      const res = await fetch('/api/admin/trigger-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, target_name: targetName })
      });
      const data = await res.json();
      setResetPasswordToast(data.message || `Password reset link & OTP dispatched to ${email}`);
      setTimeout(() => setResetPasswordToast(null), 5000);
    } catch (err) {
      alert(`Error triggering password reset: ${err.message}`);
    }
  };

  const formatLastSeenBadge = (lastSeenTime, sessionStatus) => {
    if (sessionStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Active Now</span>
        </span>
      );
    }
    if (!lastSeenTime) {
      return <span className="text-[10px] font-bold text-slate-400">Offline</span>;
    }
    try {
      const diffMs = Date.now() - new Date(lastSeenTime).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 5) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
          </span>
        );
      }
      if (diffMins < 120) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {diffMins}m ago
          </span>
        );
      }
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
            {diffHours}h ago
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
          {new Date(lastSeenTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        </span>
      );
    } catch(e) {
      return <span className="text-[10px] font-bold text-slate-400">{lastSeenTime}</span>;
    }
  };

  const fetchAdminData = async () => {
    try {
      fetchAdminDataSilently();
      Promise.all([
        fetchCandidateDatabase(),
        fetchMasterData(),
        fetchLoggedUsers()
      ]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchCandidateDatabase();
    fetchLoggedUsers();

    const handleStudentSync = () => {
      fetchCandidateDatabase();
      fetchLoggedUsers();
    };
    window.addEventListener('student-database-updated', handleStudentSync);
    window.addEventListener('storage', handleStudentSync);

    // Live 30-second auto-sync interval (Only when tab is active)
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (currentUser?.role === 'admin' || !currentUser) {
        fetchAdminDataSilently();
        fetchCandidateDatabase();
        fetchMasterData();
        fetchLoggedUsers();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('student-database-updated', handleStudentSync);
      window.removeEventListener('storage', handleStudentSync);
    };
  }, [currentUser?.id, currentUser?.role]);

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

  const fetchPendingAlumni = async () => {
    try {
      const res = await fetch('/api/admin/pending-alumni');
      if (res.ok) {
        const data = await res.json();
        setPendingAlumni(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching pending alumni:', err);
    }
  };

  const handleApproveRejectAlumni = async (alumniId, name, verified) => {
    try {
      const res = await fetch(`/api/admin/approve-alumni/${alumniId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      });
      if (res.ok) {
        setPendingAlumni(prev => prev.filter(a => a.id !== alumniId));
        if (verified === 1) {
          setApprovalModal({
            isOpen: true,
            title: '🎓 Alumni Mentor Verified!',
            message: `GSFC University TPC has officially verified ${name}. They can now mentor students and post recruitment tips.`,
            entityName: name
          });
        }
      }
    } catch (err) {
      console.error('Error updating alumni verification:', err);
    }
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
      fetchPendingAlumni();
    } catch (err) {
      console.error('Error loading TPC admin data:', err);
    }
  };

  const fetchCandidateDatabase = async () => {
    let remoteCandidates = [];
    let localCandidates = [];

    try {
      localCandidates = JSON.parse(localStorage.getItem('gsfc_master_student_database') || '[]');
    } catch (e) {}

    // Check if current user is a logged-in student to include them
    try {
      const activeUser = JSON.parse(localStorage.getItem('campushire_user') || 'null');
      if (activeUser && (activeUser.role === 'student' || !activeUser.role)) {
        const uId = activeUser.id || activeUser.owner_id || 's_' + (activeUser.email ? activeUser.email.split('@')[0] : 'candidate');
        const candidateEntry = {
          id: uId,
          name: activeUser.profile?.name || activeUser.name || 'Student Candidate',
          email: activeUser.email || 'student@gsfcuniversity.ac.in',
          phone: activeUser.profile?.phone || '+91 98765 43210',
          roll_number: activeUser.profile?.roll_number || '24BCE181',
          program: activeUser.profile?.program || 'BTech CSE',
          branch: activeUser.profile?.branch || 'Computer Science & Engineering',
          passing_year: activeUser.profile?.passing_year || 2028,
          admission_year: activeUser.profile?.admission_year || 2024,
          cgpa: activeUser.profile?.cgpa || 8.7,
          backlogs: activeUser.profile?.backlogs || 0,
          skills: 'Python, React, Machine Learning, SQL',
          ats_score: 91,
          placement_status: 'In Process'
        };
        localCandidates.push(candidateEntry);
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/admin/students');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        remoteCandidates = Array.isArray(data) ? data : [];
      }
    } catch (err) {}

    // Merge and deduplicate candidates by ID and Email
    const map = new Map();
    [...localCandidates, ...remoteCandidates, ...MASTER_STUDENT_ROSTER].forEach(c => {
      if (c && (c.id || c.email)) {
        const key = c.email || c.id;
        if (!map.has(key)) {
          map.set(key, {
            ...c,
            passing_year: Number(c.passing_year) || 2026,
            admission_year: Number(c.admission_year) || 2022,
            cgpa: Number(c.cgpa) || 8.5,
            ats_score: Number(c.ats_score) || 85
          });
        }
      }
    });

    const combinedList = Array.from(map.values());
    setAllCandidates(combinedList);
    setSelectedStudentIds(new Set(combinedList.map(s => s.id)));
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

      if (action === 'approve') {
        setApprovalModal({
          isOpen: true,
          title: '🎉 Recruiter Request Accepted!',
          message: 'GSFC TPC Placement Cell has approved and accepted the corporate recruiter application request. The recruiter account and hiring drive are now verified!',
          entityName: companyId
        });
      }
      fetchAdminData();
      fetchMasterData();
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`⚠️ ARE YOU SURE YOU WANT TO REMOVE ${companyName.toUpperCase()}?\n\nThis will permanently delete the company recruiter account and all associated hiring drives/applications.`)) return;

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Company "${companyName}" and its associated hiring drives removed successfully.`);
        fetchMasterData();
        fetchAdminDataSilently();
      } else {
        alert(data.error || 'Failed to remove company');
      }
    } catch (err) {
      console.error('Error removing company:', err);
    }
  };

  const handleDeleteDrive = async (driveId, driveTitle, companyName) => {
    if (!window.confirm(`⚠️ ARE YOU SURE YOU WANT TO DELETE THIS DRIVE?\n\nDrive Name: "${driveTitle}"\nCompany: ${companyName || 'Recruiter'}\n\nThis will remove ONLY this specific drive while keeping other drives for ${companyName || 'this company'} intact.`)) return;

    try {
      const res = await fetch(`/api/admin/requirements/${driveId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Drive "${driveTitle}" deleted successfully.`);
        fetchMasterData();
        fetchAdminDataSilently();
      } else {
        alert(data.error || 'Failed to delete drive');
      }
    } catch (err) {
      console.error('Error deleting drive:', err);
    }
  };

  const handleOpenCompanyDrivesManager = (company) => {
    setSelectedCompanyForDrives(company);
    setManageDrivesModalOpen(true);
  };

  const toggleYear = (year) => {
    setSelectAllYears(false);
    setSelectedBatchPreset('CUSTOM');
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        const next = prev.filter(y => y !== year);
        return next.length === 0 ? [year] : next;
      } else {
        return [...prev, year].sort((a, b) => a - b);
      }
    });
  };

  const toggleSelectAllYears = () => {
    if (selectAllYears) {
      setSelectAllYears(false);
      setSelectedYears([2026]);
      setSelectedBatchPreset('2026');
    } else {
      setSelectAllYears(true);
      setSelectedYears(availableYears);
      setSelectedBatchPreset('ALL');
      setStartYear(2020);
      setEndYear(2030);
    }
  };

  const applyBatchPreset = (preset) => {
    setSelectedBatchPreset(preset);
    if (preset === 'ALL') {
      setSelectAllYears(true);
      setSelectedYears(availableYears);
      setStartYear(2020);
      setEndYear(2030);
    } else if (preset === '2026') {
      setSelectAllYears(false);
      setSelectedYears([2026]);
      setStartYear(2022);
      setEndYear(2026);
    } else if (preset === '2025') {
      setSelectAllYears(false);
      setSelectedYears([2025]);
      setStartYear(2021);
      setEndYear(2025);
    } else if (preset === '2024') {
      setSelectAllYears(false);
      setSelectedYears([2024]);
      setStartYear(2020);
      setEndYear(2024);
    } else if (preset === '2027') {
      setSelectAllYears(false);
      setSelectedYears([2027]);
      setStartYear(2023);
      setEndYear(2027);
    } else if (preset === '2028') {
      setSelectAllYears(false);
      setSelectedYears([2028]);
      setStartYear(2024);
      setEndYear(2028);
    } else if (preset === '2029-2030') {
      setSelectAllYears(false);
      setSelectedYears([2029, 2030]);
      setStartYear(2025);
      setEndYear(2030);
    }
  };

  const handleRangeChange = (from, to) => {
    const f = parseInt(from, 10);
    const t = parseInt(to, 10);
    const validFrom = Math.min(f, t);
    const validTo = Math.max(f, t);
    setStartYear(validFrom);
    setEndYear(validTo);
    setSelectAllYears(false);
    setSelectedBatchPreset('RANGE');
    const rangeArr = availableYears.filter(y => y >= validFrom && y <= validTo);
    setSelectedYears(rangeArr);
  };

  const downloadReport = () => {
    let url = '/api/admin/export-report';
    if (!selectAllYears && selectedYears.length > 0) {
      url += `?years=${selectedYears.join(',')}`;
    }
    window.open(url, '_blank');
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
  
  const filteredCandidates = useMemo(() => {
    return safeCandidates.filter(c => {
      // 1. Text Search match
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = !q || 
        (c.name || '').toLowerCase().includes(q) ||
        (c.roll_number || '').toLowerCase().includes(q) ||
        (c.program || '').toLowerCase().includes(q) ||
        (c.branch || '').toLowerCase().includes(q);

      // 2. Program Filter match
      const matchesProgram = candidateProgramFilter === 'All' ||
        (c.program || '').toLowerCase().includes(candidateProgramFilter.toLowerCase()) ||
        (c.branch || '').toLowerCase().includes(candidateProgramFilter.toLowerCase());

      // 3. Year / Batch match
      const candPassingYear = c.passing_year ? parseInt(c.passing_year, 10) : (c.admission_year ? parseInt(c.admission_year, 10) + 4 : 2026);
      const candAdmissionYear = c.admission_year ? parseInt(c.admission_year, 10) : (candPassingYear - 4);

      let matchesYear = true;
      if (!selectAllYears) {
        matchesYear = selectedYears.includes(candPassingYear) || selectedYears.includes(candAdmissionYear);
      }

      return matchesSearch && matchesProgram && matchesYear;
    });
  }, [safeCandidates, searchQuery, candidateProgramFilter, selectAllYears, selectedYears]);

  const filteredLoggedStudents = useMemo(() => {
    let list = [...loggedStudentsList];

    if (loggedStudentSearch.trim()) {
      const q = loggedStudentSearch.toLowerCase().trim();
      list = list.filter(s => 
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.user_email || '').toLowerCase().includes(q) ||
        (s.roll_number || '').toLowerCase().includes(q) ||
        (s.program || '').toLowerCase().includes(q) ||
        (s.branch || '').toLowerCase().includes(q) ||
        (s.skills || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
      );
    }

    if (studentProgramFilter !== 'All') {
      const p = studentProgramFilter.toLowerCase();
      list = list.filter(s => 
        (s.program || '').toLowerCase().includes(p) || 
        (s.branch || '').toLowerCase().includes(p)
      );
    }

    if (studentBatchFilter !== 'All') {
      const batchYear = parseInt(studentBatchFilter, 10);
      list = list.filter(s => 
        (s.passing_year && parseInt(s.passing_year, 10) === batchYear) || 
        (s.batch_year && s.batch_year.includes(studentBatchFilter))
      );
    }

    if (studentStatusFilter !== 'All') {
      if (studentStatusFilter === 'active') {
        list = list.filter(s => (s.active_session_status === 'active' || s.current_session_status === 'active'));
      } else if (studentStatusFilter === 'recent') {
        list = list.filter(s => {
          const lastSeen = s.last_seen_time || s.last_seen_at;
          if (!lastSeen) return false;
          const diffMins = (Date.now() - new Date(lastSeen).getTime()) / 60000;
          return diffMins < 120;
        });
      } else if (studentStatusFilter === 'offline') {
        list = list.filter(s => s.active_session_status !== 'active' && s.current_session_status !== 'active');
      }
    }

    if (studentMinCgpa !== 'All') {
      const minCgpa = parseFloat(studentMinCgpa);
      list = list.filter(s => (s.cgpa && parseFloat(s.cgpa) >= minCgpa));
    }

    if (studentAccessStatusFilter !== 'All') {
      if (studentAccessStatusFilter === 'active') {
        list = list.filter(s => s.access_status !== 'blocked');
      } else if (studentAccessStatusFilter === 'blocked') {
        list = list.filter(s => s.access_status === 'blocked');
      }
    }

    // Sort Order
    list.sort((a, b) => {
      if (studentSortFilter === 'logins_desc') {
        return (b.total_logins || b.login_count || 1) - (a.total_logins || a.login_count || 1);
      }
      if (studentSortFilter === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (studentSortFilter === 'cgpa_desc') {
        return (parseFloat(b.cgpa) || 0) - (parseFloat(a.cgpa) || 0);
      }
      if (studentSortFilter === 'ats_desc') {
        return (parseInt(b.ats_score, 10) || 0) - (parseInt(a.ats_score, 10) || 0);
      }
      if (studentSortFilter === 'recent_login') {
        const timeA = new Date(a.last_login_time || a.last_login_at || 0).getTime();
        const timeB = new Date(b.last_login_time || b.last_login_at || 0).getTime();
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [loggedStudentsList, loggedStudentSearch, studentProgramFilter, studentBatchFilter, studentStatusFilter, studentMinCgpa, studentSortFilter]);

  const filteredLoggedFaculty = useMemo(() => {
    let list = [...loggedFacultyList];

    if (loggedFacultySearch.trim()) {
      const q = loggedFacultySearch.toLowerCase().trim();
      list = list.filter(f => 
        (f.name || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.department || '').toLowerCase().includes(q) ||
        (f.designation || '').toLowerCase().includes(q) ||
        (f.phone || '').toLowerCase().includes(q)
      );
    }

    if (facultyDeptFilter !== 'All') {
      list = list.filter(f => (f.department || '').toLowerCase().includes(facultyDeptFilter.toLowerCase()));
    }

    if (facultyStatusFilter !== 'All') {
      if (facultyStatusFilter === 'active') {
        list = list.filter(f => (f.active_session_status === 'active' || f.current_session_status === 'active'));
      }
    }

    list.sort((a, b) => {
      if (facultySortFilter === 'logins_desc') {
        return (b.total_logins || 1) - (a.total_logins || 1);
      }
      if (facultySortFilter === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (facultySortFilter === 'mentorship_desc') {
        return (b.mentorship_replies_count || 0) - (a.mentorship_replies_count || 0);
      }
      return 0;
    });

    return list;
  }, [loggedFacultyList, loggedFacultySearch, facultyDeptFilter, facultyStatusFilter, facultySortFilter]);

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisibleStudents = () => {
    const allVisibleIds = filteredCandidates.map(c => c.id);
    const areAllVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedStudentIds.has(id));

    if (areAllVisibleSelected) {
      // Deselect all currently visible students
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        allVisibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all currently visible students
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        allVisibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const selectedStudentsList = useMemo(() => {
    return filteredCandidates.filter(c => selectedStudentIds.has(c.id));
  }, [filteredCandidates, selectedStudentIds]);

  const batchStats = useMemo(() => {
    const activeList = selectedStudentsList;
    if (activeList.length === 0) {
      return { count: 0, avgCgpa: '0.00', avgAts: '0', placedCount: 0 };
    }
    const totalCgpa = activeList.reduce((acc, c) => acc + parseFloat(c.cgpa || 0), 0);
    const totalAts = activeList.reduce((acc, c) => acc + parseInt(c.ats_score || 0, 10), 0);
    const avgCgpa = (totalCgpa / activeList.length).toFixed(2);
    const avgAts = Math.round(totalAts / activeList.length);
    return {
      count: activeList.length,
      avgCgpa,
      avgAts,
      placedCount: activeList.filter(c => c.cgpa >= 8.5).length
    };
  }, [selectedStudentsList]);

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
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(prev => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-amber-400 p-0.5 rounded focus:outline-none cursor-pointer"
                title={showAdminPassword ? 'Hide Password' : 'Show Password'}
              >
                {showAdminPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => setActiveTab('entry_logs')}
            className="py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-900 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 shrink-0"
            title="Open Live Gate QR Scanner Terminal"
          >
            <QrCode className="w-4 h-4 text-emerald-300" /> 
            <span>Scan Gate Pass</span>
          </button>

          <button
            onClick={() => setAccreditationModalOpen(true)}
            className="py-2.5 px-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 shrink-0"
            title="Open Official NAAC & NIRF Accreditation Hub"
          >
            <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" /> 
            <span>NAAC & NIRF Hub</span>
          </button>

          <button
            onClick={downloadReport}
            className="py-2.5 px-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 shrink-0"
            title="Export Master TPC Analytics CSV"
          >
            <Download className="w-4 h-4" /> 
            <span>Export CSV</span>
          </button>
        </div>
      </div>



      {/* Command Center 2-Tier Navigation Hub */}
      <div className="space-y-3">
        {/* Tier 1: Core Portal Tabs */}
        <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-900" /> TPC Core Data & Governance Views
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Governance
            </button>

            <button
              onClick={() => setActiveTab('logged_students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'logged_students'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-blue-50 text-blue-950 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-700" /> 🎓 Logged Students ({filteredLoggedStudents.length})
            </button>

            <button
              onClick={() => setActiveTab('logged_faculty')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'logged_faculty'
                  ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 👩‍🏫 Faculty Logged Data ({filteredLoggedFaculty.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('login_history');
                fetchLoginHistory(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'login_history'
                  ? 'bg-purple-900 text-white shadow-md ring-2 ring-purple-400/40'
                  : 'bg-purple-50 text-purple-950 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-700" /> 📜 Login History Audit
            </button>

            <button
              onClick={() => {
                setActiveTab('audit_logs');
                fetchAdminAuditLogs(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-400/40'
                  : 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" /> 🛡️ Admin Audit Logs
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-600" /> 🗄️ Candidate Database ({filteredCandidates.length})
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-amber-600" /> 🏢 Recruiters ({allCompaniesList.length})
            </button>

            <button
              onClick={() => setActiveTab('drives')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'drives'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> 💼 Drives ({allDrivesList.length})
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" /> 📄 Applications ({allApplicationsList.length})
            </button>

            <button
              onClick={() => setActiveTab('alumni_approvals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'alumni_approvals'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> 🎓 Alumni ({pendingAlumni.length})
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600" /> 💬 Q&A Moderation
            </button>

            <button
              onClick={() => {
                setActiveTab('search');
                fetchGlobalSearch(searchQuery);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-600" /> 🔍 Cross-Tenant Search
            </button>
          </div>
        </div>

        {/* Tier 2: AI & Executive Tooling Launchers */}
        <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-700 uppercase tracking-wider mb-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Intelligence & Accreditation Tools
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('predictive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'predictive'
                  ? 'bg-indigo-900 text-white shadow-md'
                  : 'bg-indigo-50 text-indigo-950 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> 🔮 AI Forecast
            </button>

            <button
              onClick={() => setJobFairModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-purple-50 text-purple-950 border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> 🎪 Job Fair Manager
            </button>

            <button
              onClick={() => setEcosystemModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 text-white cursor-pointer shadow-sm border border-amber-400/40"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" /> 🌐 Enterprise Suite
            </button>

            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 🤖 AI TPO Copilot
            </button>

            <button
              onClick={() => setWhatIfModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" /> 🔮 What-If Simulator
            </button>

            <button
              onClick={() => setHeatmapModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-teal-900 hover:bg-teal-800 text-white cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" /> 🗺️ Skill Heatmap
            </button>

            <button
              onClick={() => setAccreditationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100 cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" /> 🏆 NAAC / NIRF
            </button>
          </div>
        </div>

        {/* Tier 3: Fest, Public Pass & QR Scanner Modules */}
        <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900/40 shadow-md">
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2 px-1">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Fest Management, Digital QR Passes & Gate Security</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">New Module</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 🎪 Fests & Events
            </button>

            <button
              onClick={() => setActiveTab('external_candidates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'external_candidates'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> 🎟️ External Registrations
            </button>

            <button
              onClick={() => setActiveTab('entry_logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'entry_logs'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-500" /> ⚡ QR Scanner & Gate Records
            </button>

            <button
              onClick={() => setActiveTab('security_staff')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'security_staff'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> 🛡️ Security Staff Accounts
            </button>

            <button
              onClick={() => setActiveTab('online_meetings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'online_meetings'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" /> 📹 Online Meetings & Proctoring
            </button>

            <button
              onClick={() => setActiveTab('subscription_plans')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'subscription_plans'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 shadow-md ring-2 ring-amber-400/40 font-black'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" /> 💳 Recruiter Plans & Revenue
            </button>

          </div>
        </div>
      </div>

{/* PASSWORD RESET CONFIRMATION TOAST */}
      {resetPasswordToast && (
        <div className="fixed bottom-6 right-6 z-[999999] max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold leading-snug">{resetPasswordToast}</div>
          <button onClick={() => setResetPasswordToast(null)} className="p-1 hover:bg-white/10 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: LOGGED STUDENTS DIRECTORY & PERSISTENT LOGIN ACTIVITY VAULT */}
      {activeTab === 'logged_students' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-900" /> 🎓 GSFC Enrolled Students & Portal Access Governance
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                TPC Admin gatekeeping repository: Authorize student enrollment, control portal access whitelist, and inspect real-time login activity.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => {
                  setEnrolErrorMsg('');
                  setEnrolSuccessMsg('');
                  setAuthorizeStudentModalOpen(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:from-blue-800 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> + Authorize Student
              </button>
              <button 
                onClick={() => {
                  setEnrolErrorMsg('');
                  setEnrolSuccessMsg('');
                  setBulkEnrolModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-black border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" /> 📥 Bulk Enrol Roster
              </button>
              <button 
                onClick={fetchLoggedUsers}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync DB
              </button>
              <span className="text-xs font-black text-blue-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 shadow-xs">
                Total: {filteredLoggedStudents.length}
              </span>
            </div>
          </div>

          {/* Enhanced Multi-Parameter Search & Control Filter Bar */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              {/* 1. Search Bar */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, roll no, email, phone, skills..."
                  value={loggedStudentSearch}
                  onChange={(e) => setLoggedStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
                {loggedStudentSearch && (
                  <button
                    onClick={() => setLoggedStudentSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Program / Branch Filter */}
              <div>
                <select
                  value={studentProgramFilter}
                  onChange={(e) => setStudentProgramFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-900 cursor-pointer"
                >
                  <option value="All">🎓 All Programs</option>
                  <option value="BTech CSE">BTech CSE</option>
                  <option value="BTech IT">BTech IT</option>
                  <option value="BTech Chemical">BTech Chemical</option>
                  <option value="BTech Mechanical">BTech Mechanical</option>
                  <option value="BTech Fire & Safety">BTech Fire & Safety</option>
                  <option value="Chemistry">BSc/MSc Chemistry</option>
                  <option value="Biotechnology">BSc/MSc Biotech</option>
                  <option value="MBA">BBA / MBA</option>
                </select>
              </div>

              {/* 3. Passing Year / Batch Filter */}
              <div>
                <select
                  value={studentBatchFilter}
                  onChange={(e) => setStudentBatchFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-900 cursor-pointer"
                >
                  <option value="All">📅 All Batches</option>
                  <option value="2024">Class of 2024</option>
                  <option value="2025">Class of 2025</option>
                  <option value="2026">Class of 2026</option>
                  <option value="2027">Class of 2027</option>
                  <option value="2028">Class of 2028</option>
                  <option value="2029">Class of 2029</option>
                  <option value="2030">Class of 2030</option>
                </select>
              </div>

              {/* 4. Portal Access Status Filter */}
              <div>
                <select
                  value={studentAccessStatusFilter}
                  onChange={(e) => setStudentAccessStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-900 cursor-pointer"
                >
                  <option value="All">🛡️ All Portal Access</option>
                  <option value="active">🟢 Active (Access Allowed)</option>
                  <option value="blocked">🔴 Blocked (Access Denied)</option>
                </select>
              </div>

              {/* 5. Sort By Filter */}
              <div>
                <select
                  value={studentSortFilter}
                  onChange={(e) => setStudentSortFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-900 cursor-pointer"
                >
                  <option value="logins_desc">🔥 Most Logins</option>
                  <option value="recent_login">🕒 Recent Login</option>
                  <option value="name_asc">🔤 Name (A - Z)</option>
                  <option value="cgpa_desc">📈 Highest CGPA</option>
                  <option value="ats_desc">🎯 Highest ATS Match</option>
                </select>
              </div>
            </div>

            {/* Sub-bar: Active Filter Chips, Reset, & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-900" /> Active Filters:
                </span>
                
                {loggedStudentSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-900 rounded-lg text-[11px] font-bold">
                    Search: "{loggedStudentSearch}"
                    <button onClick={() => setLoggedStudentSearch('')} className="hover:text-blue-700 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {studentProgramFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 rounded-lg text-[11px] font-bold">
                    {studentProgramFilter}
                    <button onClick={() => setStudentProgramFilter('All')} className="hover:text-purple-700 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {studentBatchFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold">
                    Batch {studentBatchFilter}
                    <button onClick={() => setStudentBatchFilter('All')} className="hover:text-amber-700 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {studentAccessStatusFilter !== 'All' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    studentAccessStatusFilter === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                  }`}>
                    Access: {studentAccessStatusFilter === 'active' ? 'Active Allowed' : 'Blocked'}
                    <button onClick={() => setStudentAccessStatusFilter('All')} className="hover:opacity-70 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {(loggedStudentSearch || studentProgramFilter !== 'All' || studentBatchFilter !== 'All' || studentAccessStatusFilter !== 'All' || studentSortFilter !== 'logins_desc') && (
                  <button
                    onClick={() => {
                      setLoggedStudentSearch('');
                      setStudentProgramFilter('All');
                      setStudentBatchFilter('All');
                      setStudentAccessStatusFilter('All');
                      setStudentSortFilter('logins_desc');
                      setStudentMinCgpa('All');
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer ml-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset All Filters
                  </button>
                )}
              </div>

              <div className="text-[11px] font-bold text-slate-600">
                Displaying <strong className="text-blue-900 font-black">{filteredLoggedStudents.length}</strong> of {loggedStudentsList.length} registered candidate profiles
              </div>
            </div>
          </div>

          {/* Logged Students High-Density Data Table */}
          <div className="glass-panel rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Candidate & Roll No</th>
                    <th className="py-3 px-4">University Email</th>
                    <th className="py-3 px-4">Academic Details</th>
                    <th className="py-3 px-4">Portal Access</th>
                    <th className="py-3 px-4">Login Activity</th>
                    <th className="py-3 px-4">Last Seen Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLoggedStudents.length > 0 ? (
                    filteredLoggedStudents.map((cand, idx) => {
                      const candAvatar = cand.photo_url || '';
                      const loginsCount = cand.total_logins || cand.login_count || 1;
                      const lastLogin = cand.last_login_time || cand.last_login_at || 'Recent';
                      const lastSeen = cand.last_seen_time || cand.last_seen_at;
                      const sessionStatus = cand.active_session_status || cand.current_session_status || 'active';
                      const completion = cand.completion_percentage || cand.profile_completion_pct || 90;
                      const isBlocked = cand.access_status === 'blocked';

                      return (
                        <tr key={cand.id || idx} className={`transition-all ${isBlocked ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-blue-50/40'}`}>
                          {/* 1. Photo with click-to-enlarge */}
                          <td className="py-3 px-4">
                            <div className="relative group w-12 h-12">
                              {candAvatar ? (
                                <img
                                  src={candAvatar}
                                  alt={cand.name}
                                  onClick={() => setActiveEnlargePhoto({ url: candAvatar, name: cand.name, role: 'Student Candidate', detail: cand.roll_number || cand.program })}
                                  className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-200 shadow-sm cursor-pointer group-hover:scale-105 transition-all"
                                />
                              ) : (
                                <div 
                                  onClick={() => setActiveEnlargePhoto({ url: '', name: cand.name, role: 'Student Candidate', detail: cand.roll_number || cand.program })}
                                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-sm flex items-center justify-center border-2 border-blue-200 shadow-sm cursor-pointer group-hover:scale-105 transition-all"
                                >
                                  {(cand.name || 'S').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 p-0.5 bg-blue-900 text-white rounded-full shadow cursor-pointer text-[9px]">
                                <Eye className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </td>

                          {/* 2. Candidate & Roll No */}
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 text-sm">{cand.name || 'Student Candidate'}</div>
                            <div className="text-[11px] font-black text-blue-900 flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-blue-100 rounded-md border border-blue-200">
                                {cand.roll_number || '24BT04171'}
                              </span>
                            </div>
                          </td>

                          {/* 3. University Email */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 text-xs">{cand.email || cand.user_email || 'student@gsfcuniversity.ac.in'}</div>
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GSFC Domain Verified
                            </span>
                          </td>

                          {/* 4. Academic Details */}
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-800 text-xs">{cand.program || 'BTech CSE'}</div>
                            <div className="text-[10px] text-slate-500 font-bold">{cand.branch || 'Computer Science & Engineering'}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                CGPA: {cand.cgpa || 8.9}
                              </span>
                              <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Class of {cand.passing_year || 2026}
                              </span>
                            </div>
                          </td>

                          {/* 5. Portal Access Control Status */}
                          <td className="py-3 px-4">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-lg text-[10px] font-black uppercase shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-black uppercase shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active (Allowed)
                              </span>
                            )}
                          </td>

                          {/* 6. Persistent Login Activity */}
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 text-xs flex items-center gap-1">
                              <History className="w-3.5 h-3.5 text-blue-900" /> {loginsCount} Total Logins
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                              Last: {typeof lastLogin === 'string' ? lastLogin.replace('T', ' ').substring(0, 16) : 'Active'}
                            </div>
                          </td>

                          {/* 7. Last Seen Status */}
                          <td className="py-3 px-4">
                            {formatLastSeenBadge(lastSeen, sessionStatus)}
                          </td>

                          {/* 8. Actions */}
                          <td className="py-3 px-4 text-right space-y-1">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleStudentAccess(cand)}
                                title={isBlocked ? 'Authorize and enable student portal access' : 'Revoke/Block student portal access'}
                                className={`py-1 px-2.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  isBlocked
                                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                }`}
                              >
                                {isBlocked ? (
                                  <><span>🟢</span> Allow Access</>
                                ) : (
                                  <><span>🔴</span> Block</>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => fetchStudentDossier(cand)}
                                className="py-1 px-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[10px] font-black shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Dossier</span>
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleTriggerPasswordReset(cand.email || cand.user_email, 'student', cand.name)}
                                className="text-[10px] font-bold text-slate-500 hover:text-blue-900 hover:underline cursor-pointer"
                              >
                                Reset Pass
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentAuth(cand)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-800 hover:underline cursor-pointer"
                              >
                                Revoke Roster
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500 font-bold">
                        No student candidate matches the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LOGGED FACULTY DIRECTORY & LOGIN AUDIT VAULT */}
      {activeTab === 'logged_faculty' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" /> 👩‍🏫 GSFC Faculty Placement Coordinators & Login Audit
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Permanently database-backed governance directory of all authorized faculty placement coordinators, department assignments, and login history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchLoggedUsers}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black border border-emerald-200 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Database
              </button>
              <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                Total Faculty: {filteredLoggedFaculty.length}
              </span>
            </div>
          </div>

          {/* Enhanced Multi-Parameter Faculty Filter Bar */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty name, email, department..."
                  value={loggedFacultySearch}
                  onChange={(e) => setLoggedFacultySearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-700"
                />
                {loggedFacultySearch && (
                  <button
                    onClick={() => setLoggedFacultySearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Department Filter */}
              <div>
                <select
                  value={facultyDeptFilter}
                  onChange={(e) => setFacultyDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-700 cursor-pointer"
                >
                  <option value="All">🏛️ All Departments</option>
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Chemical">Chemical Engineering</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Fire">Fire, Safety & EHS</option>
                </select>
              </div>

              {/* 3. Status Filter */}
              <div>
                <select
                  value={facultyStatusFilter}
                  onChange={(e) => setFacultyStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-700 cursor-pointer"
                >
                  <option value="All">⚡ All Status</option>
                  <option value="active">🟢 Active Now</option>
                </select>
              </div>

              {/* 4. Sort Order */}
              <div>
                <select
                  value={facultySortFilter}
                  onChange={(e) => setFacultySortFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-700 cursor-pointer"
                >
                  <option value="logins_desc">🔥 Most Logins</option>
                  <option value="name_asc">🔤 Name (A - Z)</option>
                  <option value="mentorship_desc">💬 Most Mentorship Endorsements</option>
                </select>
              </div>
            </div>

            {/* Sub-bar: Active Filter Chips, Reset, & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" /> Active Filters:
                </span>
                
                {facultyDeptFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold">
                    {facultyDeptFilter}
                    <button onClick={() => setFacultyDeptFilter('All')} className="hover:text-emerald-700 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {(loggedFacultySearch || facultyDeptFilter !== 'All' || facultyStatusFilter !== 'All' || facultySortFilter !== 'logins_desc') && (
                  <button
                    onClick={() => {
                      setLoggedFacultySearch('');
                      setFacultyDeptFilter('All');
                      setFacultyStatusFilter('All');
                      setFacultySortFilter('logins_desc');
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer ml-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset All Filters
                  </button>
                )}
              </div>

              <div className="text-[11px] font-bold text-slate-600">
                Displaying <strong className="text-emerald-800 font-black">{filteredLoggedFaculty.length}</strong> of {loggedFacultyList.length} faculty coordinators
              </div>
            </div>
          </div>

          {/* Logged Faculty High-Density Data Table */}
          <div className="glass-panel rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Portrait</th>
                    <th className="py-3 px-4">Faculty Name & Title</th>
                    <th className="py-3 px-4">Official Email</th>
                    <th className="py-3 px-4">Department & Batches</th>
                    <th className="py-3 px-4">Login Activity</th>
                    <th className="py-3 px-4">Last Seen Status</th>
                    <th className="py-3 px-4">Mentorship</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLoggedFaculty.length > 0 ? (
                    filteredLoggedFaculty.map((fac, idx) => {
                      const facAvatar = fac.photo_url || '';
                      const loginsCount = fac.total_logins || 1;
                      const lastLogin = fac.last_login_time || 'Recent';
                      const lastSeen = fac.last_seen_time || fac.last_seen_at;
                      const sessionStatus = fac.active_session_status || 'active';

                      return (
                        <tr key={fac.faculty_id || fac.user_id || idx} className="hover:bg-emerald-50/40 transition-all">
                          {/* 1. Portrait */}
                          <td className="py-3 px-4">
                            <div className="relative group w-12 h-12">
                              {facAvatar ? (
                                <img
                                  src={facAvatar}
                                  alt={fac.name}
                                  onClick={() => setActiveEnlargePhoto({ url: facAvatar, name: fac.name, role: fac.designation, detail: fac.department })}
                                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-300 shadow-sm cursor-pointer group-hover:scale-105 transition-all"
                                />
                              ) : (
                                <div 
                                  onClick={() => setActiveEnlargePhoto({ url: '', name: fac.name, role: fac.designation, detail: fac.department })}
                                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-600 text-white font-black text-sm flex items-center justify-center border-2 border-emerald-300 shadow-sm cursor-pointer group-hover:scale-105 transition-all"
                                >
                                  {(fac.name || 'NC').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-800 text-white rounded-full shadow cursor-pointer text-[9px]">
                                <Eye className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </td>

                          {/* 2. Name & Title */}
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 text-sm">{fac.name || 'Dr. Neeshu Chaudhary'}</div>
                            <div className="text-[11px] font-bold text-emerald-800 mt-0.5">
                              {fac.designation || 'Faculty Placement Coordinator'}
                            </div>
                          </td>

                          {/* 3. Official University Email */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {fac.email || 'neeshuchaudhary@gsfcuniversityfaculty.ac.in'}
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GSFC Faculty Domain Verified
                            </span>
                          </td>

                          {/* 4. Department & Batches */}
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-800 text-xs">{fac.department || 'Computer Science & Engineering'}</div>
                            <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                              {fac.assigned_batches || 'All BTech CSE & IT Batches'}
                            </div>
                          </td>

                          {/* 5. Persistent Login Activity */}
                          <td className="py-3 px-4">
                            <div className="font-black text-emerald-950 text-xs flex items-center gap-1">
                              <History className="w-3.5 h-3.5 text-emerald-700" /> {loginsCount} Total Logins
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                              Last: {typeof lastLogin === 'string' ? lastLogin.replace('T', ' ').substring(0, 16) : 'Active'}
                            </div>
                          </td>

                          {/* 6. Last Seen Status */}
                          <td className="py-3 px-4">
                            {formatLastSeenBadge(lastSeen, sessionStatus)}
                          </td>

                          {/* 7. Mentorship Activity */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                              {fac.mentorship_replies_count || 12} Endorsements
                            </span>
                          </td>

                          {/* 8. Actions */}
                          <td className="py-3 px-4 text-right space-y-1">
                            <button
                              type="button"
                              onClick={() => fetchFacultyDossier(fac)}
                              className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Faculty Profile</span>
                            </button>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleTriggerPasswordReset(fac.email, 'faculty', fac.name)}
                                className="text-[10px] font-bold text-slate-500 hover:text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3" /> Reset Pass
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500 font-bold">
                        No faculty coordinator matches the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MASTER LOGIN HISTORY AUDIT TRAIL */}
      {activeTab === 'login_history' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" /> 📜 Master User Login Audit Trail
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Chronological persistent database records of all student, faculty, recruiter, and administrator authentication events.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchLoginHistory(loginHistoryPage)}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-black border border-purple-200 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
              </button>
              <span className="text-xs font-black text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 shadow-xs">
                Total Events: {loginHistoryTotal || loginHistoryList.length}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search email, IP address, device..."
                value={loginHistorySearch}
                onChange={(e) => {
                  setLoginHistorySearch(e.target.value);
                  fetchLoginHistory(1, loginHistoryRoleFilter, e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={loginHistoryRoleFilter}
                onChange={(e) => {
                  setLoginHistoryRoleFilter(e.target.value);
                  fetchLoginHistory(1, e.target.value, loginHistorySearch);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="All">All User Roles</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty Only</option>
                <option value="recruiter">Recruiters Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>
          </div>

          {/* Master Login Events Table */}
          <div className="glass-panel rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User Email & ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Login Timestamp</th>
                    <th className="py-3 px-4">Session Status</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Device & Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loginHistoryList.length > 0 ? (
                    loginHistoryList.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-purple-50/30 transition-all">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{log.email}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.user_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            log.role === 'student' ? 'bg-blue-100 text-blue-800' :
                            log.role === 'faculty' ? 'bg-emerald-100 text-emerald-800' :
                            log.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {typeof log.login_at === 'string' ? log.login_at.replace('T', ' ').substring(0, 19) : 'Just now'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            log.session_status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.session_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {log.session_status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            {log.device_type === 'Mobile' ? <Smartphone className="w-3.5 h-3.5 text-slate-500" /> : <Laptop className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{log.device_type || 'Desktop'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs" title={log.user_agent}>
                            {log.user_agent || 'Chrome 128 / macOS'}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-bold">
                        No login history events found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MASTER ADMIN COMPLIANCE AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-800" /> 🛡️ Master Admin Governance & Compliance Audit Logs
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Immutable audit ledger recording all administrative viewings, credential dispatches, and profile approvals for NIRF/NAAC audit compliance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchAdminAuditLogs(adminAuditPage)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black border border-slate-300 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
              </button>
              <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
                Total Logs: {adminAuditTotal || adminAuditLogsList.length}
              </span>
            </div>
          </div>

          {/* Master Admin Compliance Table */}
          <div className="glass-panel rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Admin Email</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Details JSON Preview</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminAuditLogsList.length > 0 ? (
                    adminAuditLogsList.map((aud, idx) => (
                      <tr key={aud.id || idx} className="hover:bg-slate-50 transition-all">
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                          {aud.admin_email || 'admin@gsfcuniversity.ac.in'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-900 text-amber-300">
                            {aud.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs">{aud.target_entity_type}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{aud.target_entity_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded max-w-sm truncate block">
                            {aud.details_json}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-600 text-xs">
                          {typeof aud.created_at === 'string' ? aud.created_at.replace('T', ' ').substring(0, 19) : 'Recent'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 font-bold">
                        No admin compliance audit logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RECRUITER REGISTRY VIEW */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" /> Master Recruiter & Corporate Registry
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Manage all registered corporate hiring partners across GSFC University Schools & Branches.
              </p>
            </div>
            <span className="text-xs font-black text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              Showing {filteredCompanies.length} of {allCompaniesList.length} Registered Recruiter Accounts
            </span>
          </div>

          {/* GSFC Field & Industry Filter Control Panel */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 uppercase tracking-wider mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" /> GSFC Academic Fields & Disciplines Filter
                </div>
                <h3 className="text-sm font-black text-slate-900">Filter Corporate Partners by GSFC University Branch</h3>
              </div>

              {/* Company Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search company name, industry, email..."
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GSFC Academic Field Filter */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">GSFC Academic Field / Program</label>
                <select
                  value={selectedGsfcField}
                  onChange={(e) => setSelectedGsfcField(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                >
                  <option value="All">🎓 All GSFC Fields & Programs</option>
                  <option value="BTech CSE">💻 BTech CSE (Computer Science)</option>
                  <option value="BTech IT">🌐 BTech IT (Information Tech)</option>
                  <option value="BTech Chemical">🧪 BTech Chemical Engineering</option>
                  <option value="BTech Mechanical">⚙️ BTech Mechanical Engineering</option>
                  <option value="BTech Fire & Safety">🧯 BTech Fire & Safety</option>
                  <option value="BSc/MSc Chemistry">🔬 BSc / MSc Chemistry (Chemical Science)</option>
                  <option value="BSc/MSc Biotechnology">🧬 BSc / MSc Biotechnology</option>
                  <option value="BBA / MBA">📊 BBA / MBA (School of Management)</option>
                </select>
              </div>

              {/* Industry Sector Filter */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Corporate Industry Sector</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                >
                  <option value="All">🏢 All Industry Sectors</option>
                  <option value="Tech">💻 Technology & AI / Software</option>
                  <option value="Cloud">☁️ Cloud & Distributed Systems</option>
                  <option value="Services">IT Services & Consulting</option>
                  <option value="Quantum">⚛️ Quantum Tech & DeepTech</option>
                </select>
              </div>

              {/* TPC Verification Status Filter */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">TPC Approval Status</label>
                <select
                  value={companyStatusFilter}
                  onChange={(e) => setCompanyStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                >
                  <option value="All">⚡ All Approval Statuses</option>
                  <option value="Approved">✅ Verified & Approved Only</option>
                  <option value="Pending">⏳ Pending Approval Only</option>
                </select>
              </div>
            </div>
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
                  {filteredCompanies.map((comp) => (
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
                        <button
                          type="button"
                          onClick={() => handleOpenCompanyDrivesManager(comp)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-black text-xs rounded-xl cursor-pointer transition-all hover:scale-105 inline-flex items-center gap-1.5 shadow-sm"
                          title="Click to view & delete specific individual drives for this company"
                        >
                          <span>💼 {comp.posted_drives_count || 0} Posted Drives</span>
                          <span className="text-[10px] text-indigo-600 font-mono">Manage ▾</span>
                        </button>
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

                      <td className="py-4 px-5 text-right space-x-2">
                        {!comp.approved && (
                          <button
                            onClick={() => handleApproveRejectCompany(comp.id, 'approve')}
                            className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const compDrives = allDrivesList.filter(d => 
                              d.company_id === comp.id || 
                              d.company_name?.toLowerCase() === comp.company_name?.toLowerCase()
                            );
                            if (compDrives.length > 0) {
                              handleOpenCompanyDrivesManager(comp);
                            } else {
                              handleDeleteCompany(comp.id, comp.company_name);
                            }
                          }}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer hover:scale-105"
                          title="Selectively delete drives or remove whole company account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete / Remove</span>
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
                    <th className="py-4 px-5 text-right">Actions</th>
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

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteDrive(reqItem.id, reqItem.title, reqItem.company_name)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer hover:scale-105"
                          title={`Delete only this drive ("${reqItem.title}")`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Drive</span>
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

      {/* VIEW 1: CANDIDATE DATABASE VIEW WITH REAL-TIME SELECTED STUDENT LIST & DUAL CSV/PDF DOWNLOADS */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* MASTER YEAR RANGE & ACADEMIC BATCH CONTROLS CARD */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xl bg-white/95 dark:bg-slate-900/95 space-y-5">
            {/* Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-900 text-amber-300 flex items-center justify-center shadow-md font-black shrink-0">
                  <GraduationCap className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>Academic Year & Batch Range Selector</span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-full text-[10px] font-black uppercase">
                      TPC Master Filter
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Filter and export student records across every academic batch from 2020 to 2030 in real time.
                  </p>
                </div>
              </div>

              {/* DUAL DOWNLOAD & ACTION BUTTONS */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={toggleSelectAllYears}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    selectAllYears
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{selectAllYears ? '✅ All Years Selected' : 'Select All Years'}</span>
                </button>

                {/* CSV DOWNLOAD BUTTON */}
                <button
                  onClick={downloadReport}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
                  title="Download CSV Spreadsheet for all currently selected students"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>📥 Download CSV ({selectedStudentsList.length})</span>
                </button>

                {/* PDF DOWNLOAD BUTTON */}
                <button
                  onClick={() => setBatchPdfModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
                  title="Download Official GSFC Accreditation Batch PDF Report"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>📄 Download PDF ({selectedStudentsList.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Batch Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" /> Quick Batch Presets:
                </label>
                <span className="text-[10px] font-bold text-slate-500">
                  Click to quickly isolate a graduation cohort
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyBatchPreset('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === 'ALL'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🌟 All Academic Batches (2020-2030)
                </button>

                <button
                  onClick={() => applyBatchPreset('2026')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2026'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2026 (Final Year / Passing 2026)
                </button>

                <button
                  onClick={() => applyBatchPreset('2025')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2025'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2025 (Recent Batch / Passing 2025)
                </button>

                <button
                  onClick={() => applyBatchPreset('2024')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2024'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2024 (Alumni / Passing 2024)
                </button>

                <button
                  onClick={() => applyBatchPreset('2027')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2027'
                      ? 'bg-cyan-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2027 (Pre-Final Year)
                </button>

                <button
                  onClick={() => applyBatchPreset('2028')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2028'
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2028 (2nd Year Sophomore)
                </button>

                <button
                  onClick={() => applyBatchPreset('2029-2030')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBatchPreset === '2029-2030'
                      ? 'bg-rose-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Class of 2029-2030 (Freshmen & Incoming)
                </button>
              </div>
            </div>

            {/* Custom Range Dropdown Selectors */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-900 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Select Custom Year Range:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500">From Year:</span>
                  <select
                    value={startYear}
                    onChange={(e) => handleRangeChange(e.target.value, endYear)}
                    className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-black text-slate-400">➔</span>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500">To Year:</span>
                  <select
                    value={endYear}
                    onChange={(e) => handleRangeChange(startYear, e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => applyBatchPreset('ALL')}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Individual Year Multi-Select Checkbox Pills */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-900" /> Individual Year Checkboxes (Click to include/exclude specific years):
              </label>

              <div className="flex flex-wrap gap-2">
                {availableYears.map(year => {
                  const isSelected = selectAllYears || selectedYears.includes(year);
                  const countForYear = safeCandidates.filter(c => {
                    const py = c.passing_year ? parseInt(c.passing_year, 10) : (c.admission_year ? parseInt(c.admission_year, 10) + 4 : 2026);
                    const ay = c.admission_year ? parseInt(c.admission_year, 10) : (py - 4);
                    return py === year || ay === year;
                  }).length;

                  return (
                    <button
                      key={year}
                      onClick={() => toggleYear(year)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900/10 border-blue-900 text-blue-900 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
                      }`}
                    >
                      <span>{isSelected ? '☑' : '☐'}</span>
                      <span>Year {year}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-blue-900 text-white dark:bg-blue-400 dark:text-slate-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {countForYear}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Batch Analytics Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">Selected Students</div>
                <div className="text-xl font-black text-blue-900 dark:text-white mt-0.5">{batchStats.count} Candidates</div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">Batch Avg CGPA</div>
                <div className="text-xl font-black text-emerald-900 dark:text-emerald-300 mt-0.5">{batchStats.avgCgpa} / 10.0</div>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">Avg ATS Score</div>
                <div className="text-xl font-black text-indigo-900 dark:text-indigo-300 mt-0.5">{batchStats.avgAts} / 100</div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">High Tier CGPA ≥ 8.5</div>
                <div className="text-xl font-black text-amber-900 dark:text-amber-300 mt-0.5">{batchStats.placedCount} Students</div>
              </div>
            </div>
          </div>

          {/* DEDICATED REAL-TIME SELECTED STUDENTS ROSTER HEADER & TOOLBAR */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                  <span>Selected Students List ({selectedStudentsList.length} Active Records)</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Live real-time student selection updated instantly when year filters or search change.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleSelectAllVisibleStudents}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer ${
                    filteredCandidates.length > 0 && filteredCandidates.every(c => selectedStudentIds.has(c.id))
                      ? 'bg-blue-900 text-white border-blue-800 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {filteredCandidates.length > 0 && filteredCandidates.every(c => selectedStudentIds.has(c.id))
                      ? 'Deselect All' 
                      : 'Select All Visible'}
                  </span>
                </button>

                <button
                  onClick={downloadReport}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={() => setBatchPdfModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Secondary Search & Program Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate name, roll number, or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Discipline Dropdown Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Program Filter:</span>
                <select
                  value={candidateProgramFilter}
                  onChange={(e) => setCandidateProgramFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All GSFC Programs</option>
                  <option value="BTech CSE">BTech CSE</option>
                  <option value="BTech IT">BTech IT</option>
                  <option value="BTech Mechanical">BTech Mechanical</option>
                  <option value="BTech Chemical">BTech Chemical</option>
                  <option value="BTech Civil">BTech Civil</option>
                  <option value="BTech ECE">BTech ECE</option>
                  <option value="BTech Fire & Safety">BTech Fire & Safety</option>
                  <option value="MBA">BBA / MBA</option>
                  <option value="Biotechnology">Biotechnology</option>
                </select>
              </div>
            </div>
          </div>

          {/* CANDIDATE DATABASE TABLE WITH INTERACTIVE SELECTION CHECKBOXES */}
          <div className="glass-panel rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={filteredCandidates.length > 0 && filteredCandidates.every(c => selectedStudentIds.has(c.id))}
                        ref={el => {
                          if (el) {
                            const allSel = filteredCandidates.length > 0 && filteredCandidates.every(c => selectedStudentIds.has(c.id));
                            const someSel = filteredCandidates.some(c => selectedStudentIds.has(c.id));
                            el.indeterminate = !allSel && someSel;
                          }
                        }}
                        onChange={toggleSelectAllVisibleStudents}
                        className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer"
                        title="Select/Deselect All Visible"
                      />
                    </th>
                    <th className="py-4 px-4 sm:px-5">Candidate Name & Roll</th>
                    <th className="py-4 px-4 sm:px-5">Academic Batch & Year</th>
                    <th className="py-4 px-4 sm:px-5">Program & CGPA</th>
                    <th className="py-4 px-4 sm:px-5">ATS Score</th>
                    <th className="py-4 px-4 sm:px-5">Placement Status</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((cand) => {
                      const passingYear = cand.passing_year || (cand.admission_year ? cand.admission_year + 4 : 2026);
                      const batchStr = cand.batch_year || `${passingYear - 4}-${passingYear}`;
                      const isSelected = selectedStudentIds.has(cand.id);

                      return (
                        <tr 
                          key={cand.id} 
                          className={`transition-all ${
                            isSelected 
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30' 
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 opacity-40 bg-slate-50/20'
                          }`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudentSelection(cand.id)}
                              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer"
                            />
                          </td>

                          <td className="py-4 px-4 sm:px-5 font-black text-slate-900 dark:text-white">
                            <div className="text-sm font-black">{cand.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{cand.roll_number || 'GSFC Student'}</div>
                          </td>

                          <td className="py-4 px-4 sm:px-5">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black rounded-xl inline-flex items-center gap-1">
                              🎓 Batch: {batchStr}
                            </span>
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">Passing Year: {passingYear}</div>
                          </td>

                          <td className="py-4 px-4 sm:px-5">
                            <div className="text-slate-900 dark:text-white font-black">{cand.program}</div>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-black">{cand.cgpa} CGPA</div>
                          </td>

                          <td className="py-4 px-4 sm:px-5">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-black text-xs rounded-xl">
                              {cand.ats_score || 92} / 100
                            </span>
                          </td>

                          <td className="py-4 px-4 sm:px-5">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black rounded-xl flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ELIGIBLE
                            </span>
                          </td>

                          <td className="py-4 px-4 sm:px-5 text-right">
                            <button
                              onClick={() => openCandidatePdfReport(cand)}
                              className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-300" />
                              <span>PDF Report</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-bold text-xs">
                        No student candidate records match the selected year range and filters.
                      </td>
                    </tr>
                  )}
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

          {/* ACADEMIC YEAR-WISE BATCH PLACEMENT ANALYTICS CARD */}
          {analytics?.yearStats && analytics.yearStats.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 bg-white/95 dark:bg-slate-900/95 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-amber-300 flex items-center justify-center font-black">
                    <GraduationCap className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Academic Year-Wise Batch Distribution & Placement Metrics
                    </h2>
                    <p className="text-xs text-slate-500 font-bold">
                      NIRF & NAAC Audit cohort tracking across every graduation batch (2024 to 2030)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('database');
                    applyBatchPreset('ALL');
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-black hover:bg-blue-100 transition-all w-fit"
                >
                  Inspect In Candidate Database ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {analytics.yearStats.map((ys) => (
                  <div
                    key={ys.passing_year}
                    onClick={() => {
                      setActiveTab('database');
                      setSelectAllYears(false);
                      setSelectedYears([parseInt(ys.passing_year, 10)]);
                      setSelectedBatchPreset(String(ys.passing_year));
                    }}
                    className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-900 hover:shadow-md transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-900 text-white rounded-lg text-[10px] font-black">
                        Class of {ys.passing_year}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Batch {ys.batch_year}
                      </span>
                    </div>

                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {ys.total_students} Students
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300">
                      <div>Avg CGPA: <span className="font-black text-emerald-700 dark:text-emerald-400">{ys.avg_cgpa}</span></div>
                      <div>Avg ATS: <span className="font-black text-blue-900 dark:text-blue-400">{ys.avg_ats_score}%</span></div>
                    </div>
                  </div>
                ))}
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

      {/* VIEW: PREDICTIVE PLACEMENT AI ANALYTICS */}
      {activeTab === 'predictive' && (
        <div className="space-y-6 animate-fade-in">
          <PredictiveAnalyticsPanel />
        </div>
      )}

      {/* VIEW: PENDING ALUMNI MENTOR APPROVALS */}
      {activeTab === 'alumni_approvals' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 animate-fade-in bg-white/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-blue-900 text-xs font-black uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Alumni Network Governance</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                GSFC Alumni Mentor Verification Queue
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify alumni identity and corporate credentials before granting student mentorship privileges.
              </p>
            </div>
            <button
              onClick={fetchPendingAlumni}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {pendingAlumni.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-800">All Alumni Mentors Verified!</h3>
              <p className="text-xs text-slate-500">There are no pending alumni verification requests in the queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAlumni.map((al) => (
                <div key={al.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-sm">{al.name}</h3>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black">
                        Batch: {al.batch_year || 'GSFC Alumni'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-bold">
                      {al.designation} at <strong className="text-blue-900">{al.company}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">{al.email}</div>
                    {al.bio && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{al.bio}"
                      </p>
                    )}
                    {al.linkedin_url && (
                      <a href={al.linkedin_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline block">
                        LinkedIn Profile &rarr;
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveRejectAlumni(al.id, al.name, 0)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveRejectAlumni(al.id, al.name, 1)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Mentor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: COMMUNITY Q&A MODERATION */}
      {activeTab === 'qa' && (
        <div className="space-y-6 animate-fade-in">
          <QABoard currentUser={currentUser} />
        </div>
      )}

      {/* 🎪 VIEW: FESTS & EVENT GOVERNANCE */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminEventsManager />
        </div>
      )}

      {/* 🎟️ VIEW: EXTERNAL CANDIDATES DATABASE */}
      {activeTab === 'external_candidates' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminExternalCandidates />
        </div>
      )}

      {/* ⚡ VIEW: GATE QR SCANNER & LIVE ENTRY LOGS */}
      {activeTab === 'entry_logs' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminEntryLogsManager currentUser={currentUser} />
        </div>
      )}

      {/* 🛡️ VIEW: SECURITY STAFF & SCANNER ACCOUNTS */}
      {activeTab === 'security_staff' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminSecurityStaffManager />
        </div>
      )}

      {/* 📹 VIEW: IN-PORTAL VIDEO MEETINGS & PROCTORING AUDIT */}
      {activeTab === 'online_meetings' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminMeetingsManager 
            currentUser={currentUser} 
            onJoinMeetingRoom={(roomId) => window.location.hash = '#meeting/' + roomId} 
          />
        </div>
      )}

      {/* 💳 VIEW: RECRUITER SUBSCRIPTION PLANS & REVENUE */}
      {activeTab === 'subscription_plans' && (
        <div className="space-y-6 animate-fadeIn">
          <AdminSubscriptionPlansManager />
        </div>
      )}



      {/* JOB FAIR MANAGER MODAL */}
      <JobFairManagerModal
        isOpen={jobFairModalOpen}
        onClose={() => setJobFairModalOpen(false)}
        onFairsUpdated={fetchMasterData}
      />

      {/* PDF REPORT MODAL (SINGLE CANDIDATE) */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={selectedCandidateReport}
      />

      {/* BATCH CANDIDATE ROSTER PDF MODAL */}
      <BatchPDFReportModal
        isOpen={batchPdfModalOpen}
        onClose={() => setBatchPdfModalOpen(false)}
        selectedStudents={selectedStudentsList}
        batchStats={batchStats}
        yearRangeText={selectAllYears ? 'All Academic Years (2020 - 2030)' : `Batches: ${selectedYears.join(', ')}`}
      />

      {/* 🌐 ENTERPRISE ECOSYSTEM & OPERATIONS SUITE (POD.AI PARITY) */}
      <EcosystemHubModal
        isOpen={ecosystemModalOpen}
        onClose={() => setEcosystemModalOpen(false)}
        currentUser={currentUser}
      />

      {/* 🎓 TPC ADMIN: SINGLE STUDENT AUTHORIZE & ENROL MODAL */}
      {authorizeStudentModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden my-8 text-slate-900">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded-lg border border-emerald-500/30">
                  TPC Access Gatekeeper
                </span>
                <h2 className="text-lg font-black mt-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" /> Authorize Student for Portal Access
                </h2>
                <p className="text-xs text-slate-300 font-bold">
                  Students can only access or sign into the portal once authorized by TPC Admin.
                </p>
              </div>
              <button 
                onClick={() => setAuthorizeStudentModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAuthorizedStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {enrolErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{enrolErrorMsg}</span>
                </div>
              )}

              {enrolSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{enrolSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Roll / Enrollment No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24BT04171"
                    value={newStudentForm.roll_number}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, roll_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 uppercase"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Om Thakkar"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Official University Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1">Official GSFC Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. 24bt04171@gsfcuniversity.ac.in"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 lowercase"
                  />
                </div>

                {/* Academic Program */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Degree Program</label>
                  <select
                    value={newStudentForm.program}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, program: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="BTech CSE">BTech CSE</option>
                    <option value="BTech IT">BTech IT</option>
                    <option value="BTech Chemical">BTech Chemical</option>
                    <option value="BTech Mechanical">BTech Mechanical</option>
                    <option value="BTech Fire & Safety">BTech Fire & Safety</option>
                    <option value="BSc Chemistry">BSc Chemistry</option>
                    <option value="MSc Chemistry">MSc Chemistry</option>
                    <option value="BSc Biotechnology">BSc Biotechnology</option>
                    <option value="MSc Biotechnology">MSc Biotechnology</option>
                    <option value="BBA">BBA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                {/* Branch / Discipline */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Branch / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Eng"
                    value={newStudentForm.branch}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* CGPA */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="8.50"
                    value={newStudentForm.cgpa}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, cgpa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Passing Year */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Passing Year (Class of)</label>
                  <select
                    value={newStudentForm.passing_year}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, passing_year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newStudentForm.phone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Initial Portal Access Status */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Portal Access</label>
                  <select
                    value={newStudentForm.access_status}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, access_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="active">🟢 Active (Access Granted)</option>
                    <option value="blocked">🔴 Blocked (Access Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAuthorizeStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:from-blue-800 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {enrolSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  <span>{enrolSubmitting ? 'Authorizing...' : 'Authorize Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎓 TPC ADMIN: BULK ROSTER ENROLMENT MODAL */}
      {bulkEnrolModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900">
            <div className="bg-gradient-to-r from-indigo-900 via-blue-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase rounded-lg border border-indigo-500/30">
                  Batch Whitelist Importer
                </span>
                <h2 className="text-lg font-black mt-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-400" /> Bulk Enrol & Authorize Student Roster
                </h2>
                <p className="text-xs text-slate-300 font-bold">
                  Paste roster from Excel / CSV to pre-authorize entire batches in one click.
                </p>
              </div>
              <button 
                onClick={() => setBulkEnrolModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkEnrolStudents} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {enrolErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{enrolErrorMsg}</span>
                </div>
              )}

              {enrolSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{enrolSuccessMsg}</span>
                </div>
              )}

              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs text-slate-700 space-y-1">
                <div className="font-black text-blue-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Format Guidelines (Comma or Tab Separated):
                </div>
                <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-blue-200">
                  Roll_Number, Full_Name, Email, Program, CGPA, Passing_Year<br/>
                  24BT04171, Om Thakkar, 24bt04171@gsfcuniversity.ac.in, BTech CSE, 8.9, 2026<br/>
                  22BCE108, Tanvi Joshi, tanvi.j@gsfcuniversity.ac.in, BTech CSE, 9.1, 2026
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Paste Student Roster Data *</label>
                <textarea
                  required
                  rows={8}
                  placeholder={`24BT04171, Om Thakkar, 24bt04171@gsfcuniversity.ac.in, BTech CSE, 8.9, 2026\n21BCE045, Thakkar Om, thakkar_om@gmail.com, BTech CSE, 8.8, 2026`}
                  value={bulkRosterInput}
                  onChange={(e) => setBulkRosterInput(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setBulkRosterInput(
                      `24BT04171, Om Thakkar, 24bt04171@gsfcuniversity.ac.in, BTech CSE, 8.9, 2026\n21BCE045, Thakkar Om, thakkar_om@gmail.com, BTech CSE, 8.8, 2026\n22BCE108, Tanvi Joshi, tanvi.j@gsfcuniversity.ac.in, BTech CSE, 9.1, 2026\n22BCH012, Arav Sharma, arav.sharma@student.gsfc.ac.in, BTech Chemical, 8.4, 2026\n21BME034, Rahul Verma, rahul.verma@gsfcuniversity.ac.in, BTech Mechanical, 8.2, 2026`
                    );
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer"
                >
                  Load Sample Roster
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkEnrolModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrolSubmitting || !bulkRosterInput.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:from-blue-800 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {enrolSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    <span>{enrolSubmitting ? 'Enrolling...' : 'Authorize All Students'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECRUITER & DRIVE APPROVAL SUCCESS MODAL */}
      <ApprovalNotificationModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ ...approvalModal, isOpen: false })}
        title={approvalModal.title}
        message={approvalModal.message}
        entityName={approvalModal.entityName}
      />

      {/* MANAGE & SELECTIVELY DELETE DRIVES MODAL */}
      {manageDrivesModalOpen && selectedCompanyForDrives && (() => {
        const companyDrives = allDrivesList.filter(d => 
          d.company_id === selectedCompanyForDrives.id || 
          d.company_name?.toLowerCase() === selectedCompanyForDrives.company_name?.toLowerCase()
        );

        return (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30">
                    Granular Placement Drive Manager
                  </span>
                  <h2 className="text-xl font-black mt-1">Manage & Delete Drives: {selectedCompanyForDrives.company_name}</h2>
                  <p className="text-xs text-slate-300 font-bold">
                    Select a specific drive to delete individually while preserving all other drives, or remove the entire corporate account.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setManageDrivesModalOpen(false);
                    setSelectedCompanyForDrives(null);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Active Hiring Drives for this Recruiter ({companyDrives.length})
                </div>

                {companyDrives.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-bold">
                    No active hiring drives found for {selectedCompanyForDrives.company_name}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {companyDrives.map((d, idx) => (
                      <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-900 text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0">
                              Drive {idx + 1}
                            </span>
                            <h4 className="font-black text-slate-900 text-sm">{d.title}</h4>
                          </div>
                          <div className="text-xs text-slate-600 font-bold">
                            CTC: <strong className="text-blue-900">{d.ctc_range}</strong> • Min CGPA: {d.min_cgpa || 'None'} • {d.job_type}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {d.id} • Deadline: {d.deadline || 'Ongoing'}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteDrive(d.id, d.title, selectedCompanyForDrives.company_name)}
                          className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 hover:scale-105"
                          title={`Delete only Drive ${idx + 1} ("${d.title}")`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Drive {idx + 1} ("{d.title}")</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Full Recruiter Deletion Option */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                    <div className="text-xs font-black text-rose-900 uppercase">
                      ⚠️ Delete Entire Corporate Profile & All Drives
                    </div>
                    <p className="text-[11px] text-rose-700 font-medium">
                      If you want to permanently delete the company "{selectedCompanyForDrives.company_name}" and wipe all its {companyDrives.length} drives at once:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManageDrivesModalOpen(false);
                        handleDeleteCompany(selectedCompanyForDrives.id, selectedCompanyForDrives.company_name);
                      }}
                      className="py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Complete Recruiter Account ({selectedCompanyForDrives.company_name})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🖼️ High-Resolution Portrait Lightbox Modal */}
      {activeEnlargePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <button
              onClick={() => setActiveEnlargePhoto(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-blue-900 shadow-xl bg-slate-100 flex items-center justify-center">
              {activeEnlargePhoto.url ? (
                <img src={activeEnlargePhoto.url} alt={activeEnlargePhoto.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-900 via-indigo-800 to-amber-600 flex items-center justify-center text-white font-black text-3xl">
                  {(activeEnlargePhoto.name || 'GS').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{activeEnlargePhoto.name}</h3>
              <p className="text-xs font-bold text-blue-900">{activeEnlargePhoto.role}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{activeEnlargePhoto.detail}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => setActiveEnlargePhoto(null)}
                className="py-2 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 9-TAB PERSISTENT STUDENT DOSSIER MODAL */}
      {selectedStudentDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh] space-y-4">
            {/* Header with Photo, Candidate Name & Close */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-900 bg-slate-100 flex items-center justify-center shadow-md shrink-0">
                  {selectedStudentDossier.profile?.photo_url ? (
                    <img src={selectedStudentDossier.profile.photo_url} alt={selectedStudentDossier.profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black text-xl flex items-center justify-center">
                      {(selectedStudentDossier.profile?.name || 'S').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">{selectedStudentDossier.profile?.name}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-black">
                      {selectedStudentDossier.profile?.roll_number}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-600">
                    {selectedStudentDossier.profile?.program} &middot; {selectedStudentDossier.profile?.branch} &middot; Class of {selectedStudentDossier.profile?.passing_year || 2026}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">{selectedStudentDossier.profile?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentDossier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Tabs Navigation Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-bold">
              {[
                { id: 'profile', label: '👤 Profile & Bio' },
                { id: 'academic', label: '🎓 Academic Records' },
                { id: 'skills', label: '⚡ Skills & ATS' },
                { id: 'applications', label: `📄 Applications (${selectedStudentDossier.applications?.length || 0})` },
                { id: 'assessments', label: `📊 Mock Tests (${selectedStudentDossier.assessments?.length || 0})` },
                { id: 'interviews', label: `🎙️ Interviews (${selectedStudentDossier.interviews?.length || 0})` },
                { id: 'qa', label: `💬 Q&A Activity (${selectedStudentDossier.qa_activity?.length || 0})` },
                { id: 'timeline', label: `⏳ Timeline (${selectedStudentDossier.timeline?.length || 0})` },
                { id: 'logins', label: `📜 Login History (${selectedStudentDossier.login_history?.length || 0})` }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveStudentDossierTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeStudentDossierTab === t.id
                      ? 'bg-blue-900 text-white font-black shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Profile & Identity */}
            {activeStudentDossierTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fadeIn">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account ID</span>
                  <p className="font-mono font-bold text-slate-900">{selectedStudentDossier.profile?.id || selectedStudentDossier.profile?.user_id}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Phone / WhatsApp</span>
                  <p className="font-bold text-slate-900">{selectedStudentDossier.profile?.phone || '+91 95584 13347'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission & Passing Year</span>
                  <p className="font-bold text-slate-900">{selectedStudentDossier.profile?.admission_year || 2022} &rarr; {selectedStudentDossier.profile?.passing_year || 2026}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Division & Semester</span>
                  <p className="font-bold text-slate-900">Semester {selectedStudentDossier.profile?.current_semester || 7} (Division {selectedStudentDossier.profile?.current_division || 'A'})</p>
                </div>
                {selectedStudentDossier.profile?.linkedin_url && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">LinkedIn Profile</span>
                    <a href={selectedStudentDossier.profile.linkedin_url} target="_blank" rel="noreferrer" className="font-bold text-blue-900 hover:underline block truncate">
                      {selectedStudentDossier.profile.linkedin_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Academic Details */}
            {activeStudentDossierTab === 'academic' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Cumulative CGPA</span>
                  <p className="font-black text-emerald-950 text-base">{selectedStudentDossier.profile?.cgpa || 8.9} / 10.0</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active / History Backlogs</span>
                  <p className="font-bold text-slate-900">{selectedStudentDossier.profile?.active_backlogs || 0} Active ({selectedStudentDossier.profile?.history_backlogs || 0} History)</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">10th / 12th Marks</span>
                  <p className="font-bold text-slate-900">10th: {selectedStudentDossier.profile?.tenth_percentage || 88}% | 12th: {selectedStudentDossier.profile?.twelfth_percentage || 85}%</p>
                </div>
              </div>
            )}

            {/* Tab 3: Skills & ATS Resume */}
            {activeStudentDossierTab === 'skills' && (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">ATS Match Index</span>
                  <p className="font-black text-indigo-950 text-base">{selectedStudentDossier.profile?.ats_score || 92}% Compatibility Score</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verified Skill Tags</span>
                  <p className="font-bold text-slate-800">{selectedStudentDossier.profile?.skills || 'React, Node.js, Python, PostgreSQL, Fast-API, Docker'}</p>
                </div>
              </div>
            )}

            {/* Tab 4: Placement Applications */}
            {activeStudentDossierTab === 'applications' && (
              <div className="space-y-2 text-xs animate-fadeIn max-h-64 overflow-y-auto">
                {selectedStudentDossier.applications?.length > 0 ? (
                  selectedStudentDossier.applications.map((app, idx) => (
                    <div key={app.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-black text-slate-900">{app.job_title} &middot; {app.company_name}</div>
                        <div className="text-[11px] text-slate-500">Applied: {typeof app.applied_at === 'string' ? app.applied_at.substring(0, 10) : 'Recent'}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md font-black uppercase text-[10px] bg-blue-100 text-blue-900">
                        {app.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 font-bold">No placement drive applications submitted yet.</p>
                )}
              </div>
            )}

            {/* Tab 8: Timeline */}
            {activeStudentDossierTab === 'timeline' && (
              <div className="space-y-2 text-xs animate-fadeIn max-h-64 overflow-y-auto">
                {selectedStudentDossier.timeline?.length > 0 ? (
                  selectedStudentDossier.timeline.map((evt, idx) => (
                    <div key={evt.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-black text-slate-900">{evt.event_title}</div>
                        <div className="text-[11px] text-slate-600">{evt.event_description}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {typeof evt.created_at === 'string' ? evt.created_at.replace('T', ' ').substring(0, 16) : 'Recent'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 font-bold">No timeline events recorded.</p>
                )}
              </div>
            )}

            {/* Tab 9: Login History Audit */}
            {activeStudentDossierTab === 'logins' && (
              <div className="space-y-2 text-xs animate-fadeIn max-h-64 overflow-y-auto">
                {selectedStudentDossier.login_history?.length > 0 ? (
                  selectedStudentDossier.login_history.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-900" />
                          <span>Login: {typeof log.login_at === 'string' ? log.login_at.replace('T', ' ').substring(0, 19) : 'Just now'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">IP: {log.ip_address} | {log.device_type} ({log.user_agent})</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                        {log.session_status || 'active'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 font-bold">No historical login sessions logged yet.</p>
                )}
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleTriggerPasswordReset(selectedStudentDossier.profile?.email, 'student', selectedStudentDossier.profile?.name)}
                className="py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>Dispatch Password Reset Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentDossier(null)}
                className="py-2 px-5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👩‍🏫 5-TAB PERSISTENT FACULTY DOSSIER MODAL */}
      {selectedFacultyDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-700 bg-slate-100 flex items-center justify-center shadow-md shrink-0">
                  {selectedFacultyDossier.profile?.photo_url ? (
                    <img src={selectedFacultyDossier.profile.photo_url} alt={selectedFacultyDossier.profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-800 to-teal-600 text-white font-black text-xl flex items-center justify-center">
                      {(selectedFacultyDossier.profile?.name || 'NC').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">{selectedFacultyDossier.profile?.name}</h3>
                  <p className="text-xs font-bold text-emerald-800">{selectedFacultyDossier.profile?.designation} &middot; {selectedFacultyDossier.profile?.department}</p>
                  <p className="text-[11px] font-medium text-slate-500">{selectedFacultyDossier.profile?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFacultyDossier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-bold">
              {[
                { id: 'profile', label: '👤 Profile' },
                { id: 'department', label: '🏛️ Department & Batches' },
                { id: 'mentorship', label: '💬 Mentorship Activity' },
                { id: 'timeline', label: `⏳ Timeline (${selectedFacultyDossier.timeline?.length || 0})` },
                { id: 'logins', label: `📜 Login History (${selectedFacultyDossier.login_history?.length || 0})` }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveFacultyDossierTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeFacultyDossierTab === t.id
                      ? 'bg-emerald-800 text-white font-black shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeFacultyDossierTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fadeIn">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Official Faculty ID</span>
                  <p className="font-mono font-bold text-slate-900">{selectedFacultyDossier.profile?.id || selectedFacultyDossier.profile?.user_id}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Campus Contact</span>
                  <p className="font-bold text-slate-900">{selectedFacultyDossier.profile?.phone || '+91 95584 13347'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department Assignment</span>
                  <p className="font-bold text-slate-900">{selectedFacultyDossier.profile?.department} (School of Technology)</p>
                </div>
              </div>
            )}

            {/* Department Tab */}
            {activeFacultyDossierTab === 'department' && (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">Assigned Student Cohorts</span>
                  <p className="font-bold text-emerald-950">{selectedFacultyDossier.profile?.assigned_batches || 'All BTech CSE & IT Batches'}</p>
                </div>
              </div>
            )}

            {/* Login History Tab */}
            {activeFacultyDossierTab === 'logins' && (
              <div className="space-y-2 text-xs animate-fadeIn max-h-64 overflow-y-auto">
                {selectedFacultyDossier.login_history?.length > 0 ? (
                  selectedFacultyDossier.login_history.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Login: {typeof log.login_at === 'string' ? log.login_at.replace('T', ' ').substring(0, 19) : 'Recent'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">IP: {log.ip_address} | {log.device_type}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                        {log.session_status || 'active'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 font-bold">No historical login records for this faculty coordinator.</p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleTriggerPasswordReset(selectedFacultyDossier.profile?.email, 'faculty', selectedFacultyDossier.profile?.name)}
                className="py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>Dispatch Password Reset Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFacultyDossier(null)}
                className="py-2 px-5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Close Faculty View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official NAAC & NIRF Accreditation 1-Click Intelligence Modal */}
      <AccreditationNirfModal 
        isOpen={accreditationModalOpen} 
        onClose={() => setAccreditationModalOpen(false)} 
      />

      {/* 🔮 What-If Scenario Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={whatIfModalOpen}
        onClose={() => setWhatIfModalOpen(false)}
      />

      {/* 🗺️ University Skill Gap Heatmap Modal */}
      <SkillHeatmapModal
        isOpen={heatmapModalOpen}
        onClose={() => setHeatmapModalOpen(false)}
      />

      {/* 🤖 AI TPO Copilot Drawer */}
      <AICopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentUser={currentUser}
        mode="tpo"
      />
    </div>
  );
}
