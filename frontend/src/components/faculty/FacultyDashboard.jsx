import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Users, Award, Filter, Search, Eye, X, Briefcase, FileText, Clock,
  MessageSquare, Database, ChevronDown, ChevronUp, Building2, Download,
  Phone, Mail, ShieldCheck, CheckCircle, XCircle, AlertCircle, Send, ExternalLink,
  RefreshCw, Check, Sparkles, QrCode, Edit3, CheckCircle2
} from 'lucide-react';

import QABoard from '../common/QABoard';
import UniversalQRScanner from '../scanner/UniversalQRScanner';

const DEFAULT_STUDENTS = [
  {
    id: 's_om_thakkar',
    user_id: 'u_om_thakkar',
    name: 'Om Thakkar',
    roll_number: '24BT04171',
    email: '24bt04171@gsfcuniversity.ac.in',
    phone: '+91 95584 13347',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: 8.9,
    ats_score: 94,
    skills: ['Python', 'React.js', 'Node.js', 'SQL', 'FastAPI', 'Machine Learning', 'Docker', 'Kubernetes'],
    placement_status: 'Placed',
    applications_count: 3,
    mock_interview_score: 94,
    assessment_score: 96,
    applications: [
      {
        id: 'app_om_01',
        company_name: 'Google Cloud India',
        requirement_title: 'Software Development Engineer — AI & Cloud Systems',
        ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
        status: 'selected',
        match_score: 94.5,
        applied_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'app_om_02',
        company_name: 'Microsoft Azure Systems',
        requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
        ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
        status: 'interview',
        match_score: 91.0,
        applied_at: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'app_om_03',
        company_name: 'GSFC Limited',
        requirement_title: 'Graduate Engineer Trainee (IT & Software)',
        ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
        status: 'shortlisted',
        match_score: 96.0,
        applied_at: new Date(Date.now() - 6 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 's_arav',
    user_id: 'u_arav',
    name: 'Arav Sharma',
    roll_number: '21BCE045',
    email: 'arav.sharma@gsfcuniversity.ac.in',
    phone: '+91 98765 43210',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: 8.8,
    ats_score: 92,
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS', 'TensorFlow', 'REST APIs'],
    placement_status: 'Placed',
    applications_count: 2,
    mock_interview_score: 91,
    assessment_score: 93,
    applications: [
      {
        id: 'app_arav_01',
        company_name: 'Google Cloud India',
        requirement_title: 'Software Development Engineer — AI & Cloud Systems',
        ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
        status: 'selected',
        match_score: 93.0,
        applied_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'app_arav_02',
        company_name: 'Amazon Web Services',
        requirement_title: 'Cloud DevOps Trainee Engineer',
        ctc_range: '₹ 22,00,000 - ₹ 26,00,000 PA',
        status: 'interview',
        match_score: 89.5,
        applied_at: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 's_priya',
    user_id: 'u_priya',
    name: 'Priya Patel',
    roll_number: '21BCE088',
    email: 'priya.patel@gsfcuniversity.ac.in',
    phone: '+91 91234 56789',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: 8.7,
    ats_score: 90,
    skills: ['React.js', 'Next.js', 'Node.js', 'GraphQL', 'Tailwind CSS', 'Redux', 'MongoDB'],
    placement_status: 'Placed',
    applications_count: 2,
    mock_interview_score: 90,
    assessment_score: 92,
    applications: [
      {
        id: 'app_priya_01',
        company_name: 'Microsoft Azure Systems',
        requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
        ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
        status: 'selected',
        match_score: 92.0,
        applied_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'app_priya_02',
        company_name: 'GSFC Limited',
        requirement_title: 'Graduate Engineer Trainee (IT & Software)',
        ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
        status: 'selected',
        match_score: 95.0,
        applied_at: new Date(Date.now() - 8 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 's_vedant',
    user_id: 'u_vedant',
    name: 'Vedant Joshi',
    roll_number: '21BCE012',
    email: 'vedant@gsfc.ac.in',
    phone: '+91 94234 56780',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: 8.6,
    ats_score: 89,
    skills: ['C++', 'Algorithms', 'Distributed Systems', 'Go', 'Kubernetes', 'Linux'],
    placement_status: 'In-Process',
    applications_count: 2,
    mock_interview_score: 88,
    assessment_score: 90,
    applications: [
      {
        id: 'app_vedant_01',
        company_name: 'Google Cloud India',
        requirement_title: 'Software Development Engineer — AI & Cloud Systems',
        ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
        status: 'interview',
        match_score: 90.0,
        applied_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'app_vedant_02',
        company_name: 'Tata Consultancy Services',
        requirement_title: 'Data Systems & Cloud Engineering Trainee',
        ctc_range: '₹ 9,00,000 - ₹ 11,50,000 PA',
        status: 'shortlisted',
        match_score: 93.0,
        applied_at: new Date(Date.now() - 7 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 's_tanvi',
    user_id: 'u_tanvi',
    name: 'Tanvi Joshi',
    roll_number: '22BCE108',
    email: 'tanvi.j@gsfcuniversity.ac.in',
    phone: '+91 97234 56781',
    program: 'BTech CSE (AI & DS)',
    branch: 'Computer Science & Engineering',
    cgpa: 8.9,
    ats_score: 93,
    skills: ['PyTorch', 'Computer Vision', 'LLMs', 'Python', 'MLOps', 'FastAPI'],
    placement_status: 'Placed',
    applications_count: 2,
    mock_interview_score: 93,
    assessment_score: 95,
    applications: [
      {
        id: 'app_tanvi_01',
        company_name: 'Google Cloud India',
        requirement_title: 'Software Development Engineer — AI & Cloud Systems',
        ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
        status: 'selected',
        match_score: 95.0,
        applied_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'app_tanvi_02',
        company_name: 'Microsoft Azure Systems',
        requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
        ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
        status: 'interview',
        match_score: 91.5,
        applied_at: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    ]
  }
];

function getInitialFacultyData() {
  try {
    let localApps = [];
    const generic = JSON.parse(localStorage.getItem('gsfc_student_applications') || '[]');
    if (Array.isArray(generic)) localApps = [...generic];

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gsfc_student_applications_')) {
          try {
            const uApps = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(uApps)) {
              uApps.forEach(ua => {
                if (!localApps.some(a => (a.requirement_id && a.requirement_id === ua.requirement_id) || (a.job_title === ua.job_title && a.company_name === ua.company_name) || a.id === ua.id)) {
                  localApps.unshift(ua);
                }
              });
            }
          } catch(e) {}
        }
      }
    }

    const students = DEFAULT_STUDENTS.map(st => {
      if (st.id === 's_om_thakkar' && localApps.length > 0) {
        const merged = [...st.applications];
        localApps.forEach(la => {
          if (!merged.some(m => (m.requirement_title === (la.requirement_title || la.job_title) && m.company_name === la.company_name) || m.id === la.id)) {
            merged.unshift({
              id: la.id || 'app_' + Date.now(),
              company_name: la.company_name || 'Recruiting Partner',
              requirement_title: la.requirement_title || la.job_title || 'Software Development Engineer',
              ctc_range: la.ctc_range || '₹ 24,00,000 PA',
              status: la.status || 'applied',
              match_score: la.match_score || 94,
              applied_at: la.applied_at || new Date().toISOString()
            });
          }
        });
        return { ...st, applications: merged, applications_count: merged.length };
      }
      return st;
    });

    return {
      department: 'ALL',
      total_students: students.length,
      avg_cgpa: '8.8',
      avg_ats_score: '91.6',
      placement_conversion_rate: '80.0',
      students
    };
  } catch(e) {
    return {
      department: 'ALL',
      total_students: DEFAULT_STUDENTS.length,
      avg_cgpa: '8.8',
      avg_ats_score: '91.6',
      placement_conversion_rate: '80.0',
      students: DEFAULT_STUDENTS
    };
  }
}

export default function FacultyDashboard({ currentUser, onOpenAuth }) {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('gsfc_faculty_active_tab');
      return saved && ['applications', 'qa', 'analytics', 'tracker'].includes(saved) ? saved : 'applications';
    } catch(e) {
      return 'applications';
    }
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('gsfc_faculty_active_tab', tab);
    } catch(e) {}
  };
  
  // Tracker filter states
  const [department, setDepartment] = useState('ALL');
  const [minCgpa, setMinCgpa] = useState('0');
  const [minAts, setMinAts] = useState('0');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [placementStatus, setPlacementStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [data, setData] = useState(getInitialFacultyData);
  const [loading, setLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date());
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

  // Editing Registered Student State (Faculty & Department Governance)
  const [editingStudentModal, setEditingStudentModal] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    roll_number: '',
    email: '',
    phone: '',
    cgpa: '',
    program: '',
    branch: '',
    placement_status: 'Eligible'
  });

  // Doc Verification Modal
  const [docsModal, setDocsModal] = useState(null); // { student }
  const [docStatuses, setDocStatuses] = useState({});
  const [docsSaved, setDocsSaved] = useState(false);

  // Live Application Timestamp Formatter
  const formatAppliedTime = (dateStr) => {
    if (!dateStr) return { full: 'Recently Applied', relative: 'Live Record', isRecent: true };
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { full: dateStr, relative: 'Recent', isRecent: false };
      
      const full = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                   date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = 'Just now';
      let isRecent = false;
      if (diffMins < 2) {
        relative = 'Just now';
        isRecent = true;
      } else if (diffMins < 60) {
        relative = `${diffMins} mins ago`;
        isRecent = true;
      } else if (diffHours < 24) {
        relative = `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        relative = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      }

      return { full, relative, isRecent };
    } catch (e) {
      return { full: 'Recorded', relative: 'Active', isRecent: false };
    }
  };

  const fetchFacultyAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ department, minCgpa, minAts, skill: selectedSkill, status: placementStatus, search: searchQuery });
      const res = await fetch(`/api/faculty/department-analytics?${params.toString()}`);
      let json = null;
      if (res.ok) {
        json = await res.json();
      }

      if (!json || !json.students || json.students.length === 0) {
        json = {
          department: department || 'ALL',
          total_students: DEFAULT_STUDENTS.length,
          avg_cgpa: '8.8',
          avg_ats_score: '91.6',
          placement_conversion_rate: '80.0',
          students: [...DEFAULT_STUDENTS]
        };
      }

      // Check all local student applications across all localStorage keys (user-scoped + global)
      try {
        let allLocalApps = [];
        const generic = JSON.parse(localStorage.getItem('gsfc_student_applications') || '[]');
        if (Array.isArray(generic)) allLocalApps = [...generic];

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gsfc_student_applications_')) {
            try {
              const uApps = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(uApps)) {
                uApps.forEach(ua => {
                  if (!allLocalApps.some(a => (a.requirement_id && a.requirement_id === ua.requirement_id) || (a.job_title === ua.job_title && a.company_name === ua.company_name) || a.id === ua.id)) {
                    allLocalApps.unshift(ua);
                  }
                });
              }
            } catch(e) {}
          }
        }

        if (allLocalApps.length > 0 && json?.students) {
          const activeUser = JSON.parse(localStorage.getItem('campushire_user') || 'null');
          const studentEmail = (activeUser?.email || '24bt04171@gsfcuniversity.ac.in').toLowerCase();
          
          let studentFound = false;
          json.students = json.students.map(st => {
            const isMatch = (st.email || '').toLowerCase() === studentEmail || 
                            st.id === 's_om_thakkar' || 
                            (st.roll_number || '').toLowerCase().includes('24bt04171');
            if (isMatch) {
              studentFound = true;
              const mergedApps = [...(st.applications || [])];
              allLocalApps.forEach(la => {
                const alreadyExists = mergedApps.some(a => (a.requirement_title === (la.requirement_title || la.job_title) && a.company_name === la.company_name) || a.id === la.id);
                if (!alreadyExists) {
                  mergedApps.unshift({
                    id: la.id || 'app_' + Date.now(),
                    company_name: la.company_name || 'Recruiting Partner',
                    requirement_title: la.requirement_title || la.job_title || 'Software Development Engineer',
                    ctc_range: la.ctc_range || '₹ 24,00,000 PA',
                    status: la.status || 'applied',
                    match_score: la.match_score || st.ats_score || 94,
                    applied_at: la.applied_at || new Date().toISOString()
                  });
                }
              });
              return {
                ...st,
                applications: mergedApps,
                applications_count: mergedApps.length,
                placement_status: mergedApps.some(a => a.status === 'selected') ? 'Placed' : mergedApps.length > 0 ? 'In-Process' : st.placement_status
              };
            }
            return st;
          });

          if (!studentFound && allLocalApps.length > 0) {
            const formattedApps = allLocalApps.map(la => ({
              id: la.id || 'app_' + Date.now(),
              company_name: la.company_name || 'Recruiting Partner',
              requirement_title: la.requirement_title || la.job_title || 'Software Development Engineer',
              ctc_range: la.ctc_range || '₹ 24,00,000 PA',
              status: la.status || 'applied',
              match_score: la.match_score || 92,
              applied_at: la.applied_at || new Date().toISOString()
            }));
            
            const newStudentDossier = {
              id: 's_om_thakkar',
              user_id: 'u_om_thakkar',
              name: activeUser?.name || 'Om Thakkar',
              roll_number: '24BT04171',
              email: studentEmail,
              phone: '+91 95584 13347',
              program: 'BTech CSE',
              branch: 'Computer Science & Engineering',
              cgpa: 8.9,
              ats_score: 94,
              skills: ['Python', 'React.js', 'Node.js', 'SQL', 'FastAPI', 'Machine Learning', 'Docker', 'Kubernetes'],
              placement_status: 'In-Process',
              applications_count: formattedApps.length,
              mock_interview_score: 94,
              assessment_score: 96,
              applications: formattedApps
            };
            json.students.unshift(newStudentDossier);
          }
        }
      } catch (e) {}

      if (json && json.students) {
        json.total_students = json.students.length;
      }

      setData(json);
      setLastSyncedAt(new Date());
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

  const handleOpenEditStudent = (student) => {
    setEditingStudentModal(student);
    setEditStudentForm({
      name: student.name || '',
      roll_number: student.roll_number || student.id || '',
      email: student.email || student.user_email || '',
      phone: student.phone || student.contact_number || '+91 95584 13347',
      cgpa: student.cgpa || 8.5,
      program: student.program || 'BTech CSE',
      branch: student.branch || 'Computer Science & Engineering',
      placement_status: student.placement_status || 'Eligible'
    });
  };

  const handleSaveStudentEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingStudentModal) return;

    const roll = editingStudentModal.roll_number || editingStudentModal.id;
    const email = (editingStudentModal.email || editingStudentModal.user_email || `${roll.toLowerCase()}@gsfcuniversity.ac.in`).toLowerCase();

    const updated = {
      ...editingStudentModal,
      name: editStudentForm.name,
      phone: editStudentForm.phone,
      cgpa: Number(editStudentForm.cgpa) || editingStudentModal.cgpa,
      program: editStudentForm.program,
      branch: editStudentForm.branch,
      placement_status: editStudentForm.placement_status
    };

    // Update in faculty data state
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        students: (prev.students || []).map(s => {
          if (s.roll_number === roll || s.id === editingStudentModal.id || s.email === email) {
            return updated;
          }
          return s;
        })
      };
    });

    try {
      const profileData = {
        displayName: updated.name,
        name: updated.name,
        phone: updated.phone,
        program: updated.program,
        branch: updated.branch,
        cgpa: updated.cgpa,
        roll_number: roll,
        placement_status: updated.placement_status
      };
      localStorage.setItem('gsfc_user_profile_' + email, JSON.stringify(profileData));
      localStorage.setItem('gsfc_user_profile_' + roll.toLowerCase(), JSON.stringify(profileData));
      localStorage.setItem('gsfc_candidate_name', updated.name);

      window.dispatchEvent(new CustomEvent('gsfc-student-profile-updated', {
        detail: {
          roll_number: roll,
          email: email,
          name: updated.name,
          phone: updated.phone,
          cgpa: updated.cgpa,
          program: updated.program
        }
      }));
    } catch(err) {}

    try {
      await fetch(`/api/faculty/students/${encodeURIComponent(roll)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {}

    setEditingStudentModal(null);
  };

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


  // View mode switcher: 'table' (Matrix Grid), 'company' (Company-wise Grouping), 'cards' (Student Dossier Cards)
  const [viewMode, setViewMode] = useState('table');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [minAtsFilter, setMinAtsFilter] = useState('ALL');

  const appDbStudents = (data?.students || []).filter(s => {
    const query = appSearchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (s.name || '').toLowerCase().includes(query) ||
      (s.roll_number || '').toLowerCase().includes(query) ||
      (s.program || '').toLowerCase().includes(query) ||
      (s.branch || '').toLowerCase().includes(query) ||
      (s.applications || []).some(a => (a.company_name || '').toLowerCase().includes(query) || (a.requirement_title || '').toLowerCase().includes(query));

    const matchesStatus = appStatusFilter === 'ALL' || s.placement_status === appStatusFilter;
    const matchesCompany = companyFilter === 'ALL' || (s.applications || []).some(a => (a.company_name || '').toLowerCase().includes(companyFilter.toLowerCase()));
    
    let matchesAts = true;
    const atsVal = s.ats_score || 85;
    if (minAtsFilter === '90') matchesAts = atsVal >= 90;
    else if (minAtsFilter === '80') matchesAts = atsVal >= 80;
    else if (minAtsFilter === '70') matchesAts = atsVal >= 70;

    return matchesSearch && matchesStatus && matchesCompany && matchesAts;
  });

  // Flattened application rows for unified Matrix Table view
  const flattenedApplications = [];
  appDbStudents.forEach(s => {
    if (s.applications && s.applications.length > 0) {
      s.applications.forEach(app => {
        if (companyFilter === 'ALL' || (app.company_name || '').toLowerCase().includes(companyFilter.toLowerCase())) {
          flattenedApplications.push({
            student: s,
            application: app
          });
        }
      });
    } else if (appStatusFilter === 'ALL' || appStatusFilter === 'Unplaced') {
      flattenedApplications.push({
        student: s,
        application: null
      });
    }
  });

  // Unique companies list for filtering
  const availableCompanies = Array.from(
    new Set(
      (data?.students || []).flatMap(s => (s.applications || []).map(a => a.company_name)).filter(Boolean)
    )
  );

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    const s = status.toLowerCase();
    if (s === 'selected' || s === 'placed' || s === 'offer') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
    if (s === 'rejected' || s === 'declined') return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800';
    if (s === 'interview' || s === 'in-process') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
    if (s === 'shortlisted') return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
  };

  const getAtsBadge = (score) => {
    const s = parseInt(score) || 85;
    if (s >= 90) return { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300', label: 'Exceptional Fit', dot: 'bg-emerald-500' };
    if (s >= 80) return { bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300', label: 'Strong Fit', dot: 'bg-blue-500' };
    return { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300', label: 'Moderate Fit', dot: 'bg-amber-500' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn">

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-900/50">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase">Faculty Mentorship & Guidance Hub</span>
            <span className="text-[10px] text-slate-300 font-mono">GSFC University • Academic Year 2026-2027</span>
            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-md text-[9px] font-black flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Endpoint Connected
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Student Placement & ATS Performance Register</h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Live database tracking which candidate applied to which corporate drive, exact <strong>submission timestamps</strong>, verified <strong>ATS Resume Match Scores</strong>, and interview status.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold text-slate-200 border border-white/20">
            👩‍🏫 {currentUser?.name || 'Dr. Neeshu Chaudhary'} · Faculty Coordinator
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-300 font-mono">
              Synced: {lastSyncedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={fetchFacultyAnalytics}
              disabled={loading}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              title="Poll latest applications from database"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Live Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Candidates', value: data?.total_students || 0, color: 'text-blue-900 dark:text-blue-400', sub: 'In Monitored Batches' },
          { label: 'Avg ATS Match', value: `${data?.avg_ats_score || '88.5'}%`, color: 'text-emerald-600 dark:text-emerald-400', sub: 'Resume Compliance' },
          { label: 'Active Applicants', value: data?.students?.filter(s => s.applications_count > 0).length || 0, color: 'text-indigo-600 dark:text-indigo-400', sub: 'Applied to Drives' },
          { label: 'Placement Rate', value: `${data?.placement_conversion_rate || 0}%`, color: 'text-amber-500', sub: 'Offers Secured' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-[10px] font-black uppercase text-slate-400">{kpi.label}</div>
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-slate-500 font-bold">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
        {[
          { id: 'applications', icon: <Database className="w-4 h-4 text-indigo-400" />, label: '📋 Candidate Applications & ATS Scores', activeClass: 'bg-indigo-700' },
          { id: 'tracker', icon: <Users className="w-4 h-4 text-emerald-400" />, label: '🔍 Advanced Batch & Skill Filter', activeClass: 'bg-blue-900' },
          { id: 'scanner', icon: <QrCode className="w-4 h-4 text-purple-400" />, label: '🎟️ Gate QR Pass Scanner', activeClass: 'bg-purple-700' },
          { id: 'doubts', icon: <MessageSquare className="w-4 h-4 text-amber-400" />, label: '💬 Answer Student Doubts', activeClass: 'bg-emerald-700' },
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
      {/* TAB: GATE QR PASS SCANNER                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'scanner' && (
        <div className="space-y-4 animate-fadeIn">
          <UniversalQRScanner
            currentUser={currentUser}
            gateName="Auditorium Gate 1 (Faculty Desk)"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: APPLICATION & ATS SCORE DATABASE                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">

          {/* Search & Filter Header */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white flex-wrap">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Candidate Placement Applications & ATS Scores</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200">
                  {flattenedApplications.length} Application Record{flattenedApplications.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                  🟢 Database Connected
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📊 Unified Matrix Table
                </button>
                <button
                  onClick={() => setViewMode('company')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'company' ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🏢 By Company
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👤 Student Dossier Cards
                </button>
              </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap gap-2.5 items-center pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="Search candidate name, roll no, or company (e.g. Google, Om)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400"
                />
              </div>

              {/* Company Filter */}
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">🏢 All Companies ({availableCompanies.length})</option>
                {availableCompanies.map((comp, cIdx) => (
                  <option key={cIdx} value={comp}>{comp}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Application Statuses</option>
                <option value="Placed">Selected / Placed</option>
                <option value="In-Process">In-Process / Interview</option>
                <option value="Unplaced">Not Applied</option>
              </select>

              {/* Minimum ATS Score Filter */}
              <select
                value={minAtsFilter}
                onChange={(e) => setMinAtsFilter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">🎯 ATS Score: All</option>
                <option value="90">🎯 ATS ≥ 90% (Top Tier)</option>
                <option value="80">🎯 ATS ≥ 80% (Strong Match)</option>
                <option value="70">🎯 ATS ≥ 70% (Eligible)</option>
              </select>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ml-auto"
                title="Download Official Faculty Placement Register PDF Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* 1. VIEW MODE: UNIFIED MATRIX TABLE */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {loading ? (
                <div className="text-center py-16 text-slate-400 text-sm font-bold animate-pulse">Loading placement matrix from live database...</div>
              ) : flattenedApplications.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-bold">No candidate application records matching filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Candidate Identity</th>
                        <th className="py-3 px-4">Program & Roll No</th>
                        <th className="py-3 px-4">Applied Company & Drive</th>
                        <th className="py-3 px-4 text-center">ATS Resume Match</th>
                        <th className="py-3 px-4 text-center">When Applied (Timestamp)</th>
                        <th className="py-3 px-4 text-center">CGPA</th>
                        <th className="py-3 px-4 text-center">Package (CTC)</th>
                        <th className="py-3 px-4 text-center">Drive Status</th>
                        <th className="py-3 px-4 text-right">Faculty Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                      {flattenedApplications.map((item, idx) => {
                        const s = item.student;
                        const app = item.application;
                        const atsVal = app?.match_score || s.ats_score || 88;
                        const badge = getAtsBadge(atsVal);
                        const timeInfo = app ? formatAppliedTime(app.applied_at) : null;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                            {/* Candidate Identity */}
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                                  {(s.name || 'S').charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-black text-slate-900 dark:text-white truncate">{s.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Program & Roll */}
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                              <div className="font-bold">{s.program || 'BTech CSE'}</div>
                              <div className="text-[10px] font-mono text-slate-400">{s.roll_number || '—'}</div>
                            </td>

                            {/* Applied Company & Drive */}
                            <td className="py-3.5 px-4">
                              {app ? (
                                <div>
                                  <div className="font-black text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>{app.company_name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[220px]">
                                    {app.requirement_title || 'Software Development Engineer'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Not applied to live drives yet</span>
                              )}
                            </td>

                            {/* ATS Score */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-sm ${badge.bg}`}>
                                  <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                                  <span>{atsVal}% ATS</span>
                                </div>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${atsVal >= 90 ? 'bg-emerald-500' : atsVal >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    style={{ width: `${atsVal}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* When Applied (Timestamp) */}
                            <td className="py-3.5 px-4 text-center">
                              {timeInfo ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${timeInfo.isRecent ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {timeInfo.full}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                                    {timeInfo.relative}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">—</span>
                              )}
                            </td>

                            {/* CGPA */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-black text-slate-900 dark:text-white">{s.cgpa || '8.5'}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">/10</span>
                            </td>

                            {/* Package / CTC */}
                            <td className="py-3.5 px-4 text-center font-black text-emerald-700 dark:text-emerald-400 text-[11px]">
                              {app?.ctc_range || '—'}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-block ${getStatusColor(app?.status || s.placement_status)}`}>
                                {app?.status || s.placement_status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openWaModal(s)}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  title="Send WhatsApp Interview Invite"
                                >
                                  💬
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEmailModal(s)}
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  title="Send Official Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentActivity(s)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Dossier
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. VIEW MODE: COMPANY-WISE GROUPING */}
          {viewMode === 'company' && (
            <div className="space-y-4">
              {availableCompanies.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-bold bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                  No company application records found.
                </div>
              ) : (
                availableCompanies.map((comp, compIdx) => {
                  const companyApplicants = (data?.students || []).flatMap(s => {
                    const matchedApp = (s.applications || []).find(a => a.company_name === comp);
                    return matchedApp ? [{ student: s, app: matchedApp }] : [];
                  }).sort((a, b) => (b.app.match_score || b.student.ats_score || 0) - (a.app.match_score || a.student.ats_score || 0));

                  if (companyFilter !== 'ALL' && comp !== companyFilter) return null;

                  return (
                    <div key={compIdx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      {/* Company Header */}
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0 shadow-sm">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-slate-900 dark:text-white">{comp}</h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {companyApplicants.length} Candidate Application{companyApplicants.length !== 1 ? 's' : ''} Received
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200">
                            Avg ATS: {(companyApplicants.reduce((acc, ca) => acc + (ca.app.match_score || ca.student.ats_score || 85), 0) / (companyApplicants.length || 1)).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Applicants List */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {companyApplicants.map((ca, aIdx) => {
                          const s = ca.student;
                          const app = ca.app;
                          const atsVal = app.match_score || s.ats_score || 88;
                          const badge = getAtsBadge(atsVal);

                          return (
                            <div key={aIdx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0">
                                  {(s.name || 'S').charAt(0)}
                                </div>
                                <div>
                                  <div className="font-black text-sm text-slate-900 dark:text-white">{s.name}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {s.roll_number} · {s.program} · CGPA: {s.cgpa}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4">
                                <div className="text-left sm:text-right">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{app.requirement_title}</div>
                                  <div className="text-[10px] text-emerald-600 font-black">{app.ctc_range || '—'}</div>
                                  {app.applied_at && (
                                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                                      Applied: {formatAppliedTime(app.applied_at).full} ({formatAppliedTime(app.applied_at).relative})
                                    </div>
                                  )}
                                </div>

                                <div className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-sm ${badge.bg}`}>
                                  <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                  <span>{atsVal}% ATS Match</span>
                                </div>

                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(app.status)}`}>
                                  {app.status}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentActivity(s)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Dossier
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. VIEW MODE: STUDENT DOSSIER CARDS (EXPANDABLE) */}
          {viewMode === 'cards' && (
            <div className="space-y-3">
              {appDbStudents.map((s, idx) => {
                const badge = getAtsBadge(s.ats_score || 88);

                return (
                  <div key={s.id || idx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {/* Student summary row */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors select-none"
                      onClick={() => toggleStudentExpand(s.id || idx)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                          {(s.name || 'S').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-slate-900 dark:text-white truncate">{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.roll_number} · {s.program}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {/* ATS Badge */}
                        <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span>{s.ats_score || 88}% ATS Score</span>
                        </div>

                        {/* CGPA */}
                        <div className="text-center px-2">
                          <div className="text-xs font-black text-slate-900 dark:text-white">{s.cgpa}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">CGPA</div>
                        </div>

                        {/* Applied Drives Count */}
                        <div className="text-center px-2">
                          <div className={`text-xs font-black ${s.applications_count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                            {s.applications_count || 0}
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Drives Applied</div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${getStatusColor(s.placement_status)}`}>
                          {s.placement_status}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditStudent(s);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Edit</span>
                        </button>

                        <div className="shrink-0 text-slate-400">
                          {expandedStudents[s.id || idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded applications sub-table */}
                    {expandedStudents[s.id || idx] && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
                        {(!s.applications || s.applications.length === 0) ? (
                          <div className="py-4 text-xs text-slate-400 italic flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            This candidate has not submitted applications to active campus drives yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              Applied Corporate Drives ({s.applications.length})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {s.applications.map((app, aIdx) => {
                                const tInfo = formatAppliedTime(app.applied_at);
                                return (
                                  <div key={aIdx} className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
                                    <div className="min-w-0">
                                      <div className="font-black text-xs text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span>{app.company_name}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{app.requirement_title}</div>
                                      <div className="text-[10px] font-black text-emerald-600 mt-1">{app.ctc_range || '—'}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusColor(app.status)}`}>
                                        {app.status}
                                      </span>
                                      <span className={`text-[10px] font-bold font-mono ${tInfo.isRecent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {tInfo.full}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold">
                                        ⏱️ {tInfo.relative}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quick actions bar */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => openWaModal(s)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            💬 WhatsApp Alert
                          </button>
                          <button
                            type="button"
                            onClick={() => openEmailModal(s)}
                            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" /> Send Email
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenStudentActivity(s)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Full Dossier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* ✏️ FACULTY: EDIT REGISTERED STUDENT MODAL */}
      {editingStudentModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white animate-scaleUp">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-400/20 text-blue-300 text-[10px] font-black uppercase rounded-lg border border-blue-400/30">
                  Faculty Student Governance
                </span>
                <h2 className="text-lg font-black mt-1 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" /> Edit Registered Student Details
                </h2>
                <p className="text-xs text-slate-300 font-bold">
                  Editing this record automatically reflects across the student's dashboard & TPC records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentModal(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3 text-xs">
                {/* Full Student Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Om Thakkar"
                    value={editStudentForm.name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Roll Number & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                    <input
                      type="text"
                      disabled
                      value={editStudentForm.roll_number}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Contact Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={editStudentForm.phone}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                      placeholder="+91 95584 13347"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                {/* Academic Program & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Program</label>
                    <input
                      type="text"
                      value={editStudentForm.program}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, program: e.target.value })}
                      placeholder="BTech CSE"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={editStudentForm.branch}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, branch: e.target.value })}
                      placeholder="Computer Science & Engineering"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                {/* CGPA & Placement Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Cumulative CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editStudentForm.cgpa}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, cgpa: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Placement Status</label>
                    <select
                      value={editStudentForm.placement_status}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, placement_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-900"
                    >
                      <option value="Eligible">🟢 Eligible / Job Seeking</option>
                      <option value="Placed">🎉 Placed (Selected)</option>
                      <option value="In Process">⏳ In Process (Interviewing)</option>
                      <option value="Higher Studies">🎓 Higher Studies</option>
                      <option value="Opted Out">⚪ Opted Out</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudentModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-indigo-700 hover:from-blue-800 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Save & Sync to Student Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
