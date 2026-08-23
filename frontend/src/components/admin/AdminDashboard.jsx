import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, BarChart3, Download, Building, Users, 
  Briefcase, FileSpreadsheet, Sparkles, TrendingUp, PieChart, Database, Search, 
  Printer, CheckCircle, Trash2, Calendar, Filter, SlidersHorizontal, Layers, 
  CheckSquare, Square, RefreshCw, Eye, EyeOff, GraduationCap, Award, Check, FileText, X, HelpCircle, Globe, Sliders, MapPin
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

export default function AdminDashboard({ currentUser, onAdminAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'predictive', 'database', 'companies', 'drives', 'applications', 'alumni_approvals', 'qa'
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

  const fetchAdminData = async () => {
    try {
      fetchAdminDataSilently();
      Promise.all([
        fetchCandidateDatabase(),
        fetchMasterData()
      ]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchCandidateDatabase();

    const handleStudentSync = () => fetchCandidateDatabase();
    window.addEventListener('student-database-updated', handleStudentSync);
    window.addEventListener('storage', handleStudentSync);

    // Live 15-second auto-sync interval (Only when tab is active)
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (currentUser?.role === 'admin' || !currentUser) {
        fetchAdminDataSilently();
        fetchCandidateDatabase();
        fetchMasterData();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('student-database-updated', handleStudentSync);
      window.removeEventListener('storage', handleStudentSync);
    };
  }, [currentUser]);

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

  const MASTER_STUDENT_ROSTER = [
    { id: 's_om', name: 'Om Thakkar', email: 'thakkar_om@gmail.com', phone: '+91 98765 43210', roll_number: '21BCE045', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2026, admission_year: 2022, cgpa: 8.9, backlogs: 0, skills: 'React, Node.js, Python, System Design', ats_score: 92, placement_status: 'Shortlisted' },
    { id: 's_vedant', name: 'Vedant Patel', email: 'vedant@gmail.com', phone: '+91 98251 67890', roll_number: '24BCE181', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Python, Machine Learning, React, PostgreSQL', ats_score: 91, placement_status: 'In Process' },
    { id: 's_arav', name: 'Arav Sharma', email: 'arav.sharma@gsfcuniversity.ac.in', phone: '+91 98765 43211', roll_number: '22BCE101', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2026, admission_year: 2022, cgpa: 8.9, backlogs: 0, skills: 'Java, Spring Boot, AWS, Kubernetes', ats_score: 90, placement_status: 'Offer Received' },
    { id: 's_rohan', name: 'Rohan Patel', email: 'rohan.patel@gsfcuniversity.ac.in', phone: '+91 98765 43212', roll_number: '22BME034', program: 'BTech Mechanical', branch: 'Mechanical Engineering', passing_year: 2025, admission_year: 2021, cgpa: 8.4, backlogs: 0, skills: 'AutoCAD, SolidWorks, Ansys, Thermodynamics', ats_score: 86, placement_status: 'Offer Received' },
    { id: 's_sneha', name: 'Sneha Joshi', email: 'sneha.joshi@gsfcuniversity.ac.in', phone: '+91 98765 43213', roll_number: '22BCH012', program: 'BTech Chemical', branch: 'Chemical Engineering', passing_year: 2025, admission_year: 2021, cgpa: 8.8, backlogs: 0, skills: 'Aspen Plus, Chemical Process Safety, Heat Transfer', ats_score: 89, placement_status: 'Offer Received' },
    { id: 's_devansh', name: 'Devansh Shah', email: 'devansh.shah@gsfcuniversity.ac.in', phone: '+91 98765 43214', roll_number: '23BIT055', program: 'BTech IT', branch: 'Information Technology', passing_year: 2027, admission_year: 2023, cgpa: 8.6, backlogs: 0, skills: 'Flutter, Android, React Native, Firebase', ats_score: 85, placement_status: 'In Process' },
    { id: 's_priya', name: 'Priya Patel', email: 'priya.patel@alumni.gsfc.ac.in', phone: '+91 98765 43215', roll_number: '19BCE018', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2024, admission_year: 2020, cgpa: 9.1, backlogs: 0, skills: 'Cloud Architecture, Microservices, Go, Docker', ats_score: 94, placement_status: 'Placed' },
    { id: 's_ananya', name: 'Ananya Desai', email: 'ananya.desai@gsfcuniversity.ac.in', phone: '+91 98765 43216', roll_number: '22BFE008', program: 'BTech Fire & Safety', branch: 'Fire & Environment Health Safety', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Industrial Safety Standards, Hazard Analysis, EHS', ats_score: 88, placement_status: 'In Process' },
    { id: 's_yash', name: 'Yash Dave', email: 'yash.dave@gsfcuniversity.ac.in', phone: '+91 98765 43217', roll_number: '23BCE099', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2027, admission_year: 2023, cgpa: 8.5, backlogs: 0, skills: 'C++, DSA, Competitive Programming, SQL', ats_score: 82, placement_status: 'In Process' },
    { id: 's_krunal', name: 'Krunal Varma', email: 'krunal.varma@gsfcuniversity.ac.in', phone: '+91 98765 43218', roll_number: '22BSC041', program: 'BSc/MSc Chemistry', branch: 'Applied Chemistry', passing_year: 2025, admission_year: 2022, cgpa: 8.6, backlogs: 0, skills: 'Spectroscopy, Chromatography, Organic Synthesis', ats_score: 84, placement_status: 'In Process' },
    { id: 's_manan', name: 'Manan Mehta', email: 'manan.mehta@gsfcuniversity.ac.in', phone: '+91 98765 43219', roll_number: '24BCH023', program: 'BTech Chemical', branch: 'Chemical Engineering', passing_year: 2028, admission_year: 2024, cgpa: 8.7, backlogs: 0, skills: 'Process Control, Mass Transfer, MATLAB', ats_score: 87, placement_status: 'In Process' },
    { id: 's_riya', name: 'Riya Shah', email: 'riya.shah@gsfcuniversity.ac.in', phone: '+91 98765 43220', roll_number: '23BBT019', program: 'BSc/MSc Biotechnology', branch: 'Biotechnology', passing_year: 2027, admission_year: 2023, cgpa: 8.8, backlogs: 0, skills: 'Bioprocess Engineering, Bioinformatics, Python', ats_score: 90, placement_status: 'In Process' },
    { id: 's_parth', name: 'Parth Trivedi', email: 'parth.trivedi@gsfcuniversity.ac.in', phone: '+91 98765 43221', roll_number: '25BCE204', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2029, admission_year: 2025, cgpa: 8.7, backlogs: 0, skills: 'Data Structures, Web Development, Java', ats_score: 88, placement_status: 'In Process' },
    { id: 's_heta', name: 'Heta Joshi', email: 'heta.joshi@gsfcuniversity.ac.in', phone: '+91 98765 43222', roll_number: '24BBA015', program: 'BBA / MBA', branch: 'Business Analytics & HR', passing_year: 2028, admission_year: 2025, cgpa: 8.5, backlogs: 0, skills: 'Financial Modeling, Power BI, Excel, Marketing Analytics', ats_score: 83, placement_status: 'In Process' },
    { id: 's_harshil', name: 'Harshil Parikh', email: 'harshil.parikh@gsfcuniversity.ac.in', phone: '+91 98765 43223', roll_number: '21BME056', program: 'BTech Mechanical', branch: 'Mechanical Engineering', passing_year: 2024, admission_year: 2020, cgpa: 8.3, backlogs: 0, skills: 'Mechatronics, Robotics, Fluid Mechanics', ats_score: 85, placement_status: 'Placed' },
    { id: 's_dhruv', name: 'Dhruv Solanki', email: 'dhruv.solanki@gsfcuniversity.ac.in', phone: '+91 98765 43224', roll_number: '26BCE310', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2030, admission_year: 2026, cgpa: 8.7, backlogs: 0, skills: 'Python, Algorithms, Linux, Git', ats_score: 89, placement_status: 'In Process' },
    { id: 's_tanvi', name: 'Tanvi Panchal', email: 'tanvi.panchal@gsfcuniversity.ac.in', phone: '+91 98765 43225', roll_number: '22BIT088', program: 'BTech IT', branch: 'Information Technology', passing_year: 2025, admission_year: 2021, cgpa: 8.6, backlogs: 0, skills: 'Cybersecurity, Network Security, Python, SQL', ats_score: 87, placement_status: 'In Process' },
    { id: 's_shreyas', name: 'Shreyas Bhatt', email: 'shreyas.bhatt@gsfcuniversity.ac.in', phone: '+91 98765 43226', roll_number: '23BCH071', program: 'BTech Chemical', branch: 'Chemical Engineering', passing_year: 2026, admission_year: 2022, cgpa: 8.4, backlogs: 0, skills: 'Petroleum Refining, Chemical Reaction Engineering', ats_score: 81, placement_status: 'In Process' },
    { id: 's_nidhi', name: 'Nidhi Shah', email: 'nidhi.shah@gsfcuniversity.ac.in', phone: '+91 98765 43227', roll_number: '24BCE155', program: 'BTech CSE', branch: 'Computer Science & Engineering', passing_year: 2028, admission_year: 2024, cgpa: 8.8, backlogs: 0, skills: 'TypeScript, Next.js, AI Ethics, Data Science', ats_score: 92, placement_status: 'In Process' },
    { id: 's_jay', name: 'Jay Rathod', email: 'jay.rathod@gsfcuniversity.ac.in', phone: '+91 98765 43228', roll_number: '22BME091', program: 'BTech Mechanical', branch: 'Mechanical Engineering', passing_year: 2025, admission_year: 2021, cgpa: 8.2, backlogs: 0, skills: 'Industrial Design, 3D Printing, Manufacturing Tech', ats_score: 80, placement_status: 'In Process' },
    { id: 's_khushi', name: 'Khushi Gandhi', email: 'khushi.gandhi@gsfcuniversity.ac.in', phone: '+91 98765 43229', roll_number: '23BBT044', program: 'BSc/MSc Biotechnology', branch: 'Biotechnology', passing_year: 2027, admission_year: 2023, cgpa: 8.9, backlogs: 0, skills: 'Genetic Engineering, Cell Biology, R Programming', ats_score: 91, placement_status: 'In Process' },
    { id: 's_meet', name: 'Meet Patel', email: 'meet.patel@gsfcuniversity.ac.in', phone: '+91 98765 43230', roll_number: '25BIT112', program: 'BTech IT', branch: 'Information Technology', passing_year: 2029, admission_year: 2025, cgpa: 8.7, backlogs: 0, skills: 'Full-stack Development, React, GraphQL, Docker', ats_score: 86, placement_status: 'In Process' }
  ];

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

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAccreditationModalOpen(true)}
            className="py-3 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" /> 
            <span>📊 NAAC & NIRF Accreditation Hub</span>
          </button>

          <button
            onClick={downloadReport}
            className="py-3 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> 
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Segment: Overview vs Candidate Database */}
      <div className="flex items-center gap-3 bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Governance
        </button>

        <button
          onClick={() => setActiveTab('predictive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'predictive'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" /> 🔮 AI Predictive Forecast
        </button>

        <button
          onClick={() => setJobFairModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-purple-50 text-purple-950 border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-xs"
        >
          <Calendar className="w-4 h-4 text-purple-600" /> 🎪 Job Fair Manager
        </button>

        <button
          onClick={() => setEcosystemModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white cursor-pointer shadow-md border border-amber-400/40"
        >
          <Globe className="w-4 h-4 text-amber-300 animate-pulse" /> 🌐 Enterprise Suite
        </button>

        <button
          onClick={() => setCopilotOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-md border border-purple-400/30"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> 🤖 AI TPO Copilot
        </button>

        <button
          onClick={() => setWhatIfModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer shadow-md border border-indigo-400/30"
        >
          <Sliders className="w-4 h-4 text-amber-300" /> 🔮 What-If Simulator
        </button>

        <button
          onClick={() => setHeatmapModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-teal-900 hover:bg-teal-800 text-white cursor-pointer shadow-md border border-teal-400/30"
        >
          <Layers className="w-4 h-4 text-amber-300" /> 🗺️ Skill Heatmap
        </button>

        <button
          onClick={() => setActiveTab('alumni_approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'alumni_approvals'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-blue-500" /> 🎓 Alumni Approvals ({pendingAlumni.length})
        </button>

        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'qa'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-cyan-500" /> 💬 Q&A Moderation
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'database'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" /> 🗄️ Candidate Database ({filteredCandidates.length})
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'companies'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-amber-500" /> 🏢 Recruiters ({allCompaniesList.length})
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'drives'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-400" /> 💼 Drives ({allDrivesList.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'applications'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" /> 📄 Applications ({allApplicationsList.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('search');
            fetchGlobalSearch(searchQuery);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'search'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4 text-cyan-400" /> 🔍 Cross-Tenant Search
        </button>

        <button
          onClick={() => setAccreditationModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100 cursor-pointer shadow-xs"
        >
          <Award className="w-4 h-4 text-amber-600 stroke-[2.5]" /> 🏆 NAAC / NIRF
        </button>
      </div>

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
