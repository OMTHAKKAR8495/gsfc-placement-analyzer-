import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Sparkles, AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Download, FileText, Search, Tag, ShieldCheck, Database, Printer, Eye, Briefcase, XCircle, Trash2, Pencil } from 'lucide-react';
import InterviewQuestionGeneratorModal from './InterviewQuestionGeneratorModal';
import ReportPDFModal from '../common/ReportPDFModal';
import CompanyQuestionUploadModal from '../common/CompanyQuestionUploadModal';
import RequirementQuestionBankForm from './RequirementQuestionBankForm';
import { getCompanyUploadedQuestions, saveCompanyUploadedQuestion, bulkUploadCompanyQuestions, deleteCompanyUploadedQuestion } from '../../utils/companyQuestionStorage';

export default function CompanyDashboard({ currentUser, company, onCompanyAuthSuccess, onRefreshCompany }) {
  const [activeTab, setActiveTab] = useState('my_applications'); // 'my_applications', 'requirements', 'database', 'applicants'
  const [requirements, setRequirements] = useState([]);
  const [activeReqApplicants, setActiveReqApplicants] = useState(null);
  const [applicantsData, setApplicantsData] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!window.confirm('Are you sure you want to delete this applicant entry?')) return;
    try {
      const res = await fetch(`/api/company/applications/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAllCompanyApplicants(prev => prev.filter(a => a.application_id !== appId));
        alert('Applicant entry deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete application');
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

  const handleOpenEditModal = (req) => {
    setEditingReqId(req.id);
    let elProg = ['BTech CSE', 'BTech IT'];
    let reqSkills = 'Python, React, SQL';
    let prefSkills = 'Docker, FastAPI';
    let qBank = [];

    try { elProg = typeof req.eligible_programs_json === 'string' ? JSON.parse(req.eligible_programs_json) : (req.eligible_programs_json || elProg); } catch(e) {}
    try { reqSkills = typeof req.required_skills_json === 'string' ? JSON.parse(req.required_skills_json).join(', ') : (Array.isArray(req.required_skills_json) ? req.required_skills_json.join(', ') : reqSkills); } catch(e) {}
    try { prefSkills = typeof req.preferred_skills_json === 'string' ? JSON.parse(req.preferred_skills_json).join(', ') : (Array.isArray(req.preferred_skills_json) ? req.preferred_skills_json.join(', ') : prefSkills); } catch(e) {}
    try { qBank = typeof req.question_bank_json === 'string' ? JSON.parse(req.question_bank_json) : (req.question_bank_json || []); } catch(e) {}

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
      question_bank: qBank.length > 0 ? qBank : postForm.question_bank
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
      }, 2000);
    } catch (err) {
      setPostStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      const res = await fetch('/api/company/update-application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, status: newStatus })
      });
      if (res.ok) {
        setApplicantsData(prev => prev.map(a => a.application_id === appId ? { ...a, status: newStatus } : a));
        setAllCompanyApplicants(prev => prev.map(a => a.application_id === appId ? { ...a, status: newStatus } : a));
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
    setSelectedCandidateReport({
      name: candidate.name,
      email: candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '_')}@student.edu`,
      atsScore: candidate.ats_score || 92,
      skills: ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning']
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
            src={company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'}
            alt={company?.company_name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-contain bg-slate-50 p-2 border border-slate-200 shadow-md shrink-0"
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

      {/* Recruiter Navigation Bar: Posted Applications, Active Requirements, Candidate Database */}
      <div className="flex items-center gap-3 bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_applications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeTab === 'my_applications'
              ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <span>📋 Posted Hiring Applications ({requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeTab === 'requirements'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" /> Active Hiring Drives ({requirements.length})
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeTab === 'database'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400 shrink-0" /> 🗄️ Candidate Database ({allCandidates.length})
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeTab === 'applicants'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400 shrink-0" /> 📥 Applied Candidates Feed ({allCompanyApplicants.length})
        </button>
      </div>

      {/* VIEW 0: POSTED HIRING APPLICATIONS COLUMN VIEW */}
      {activeTab === 'my_applications' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Recruiter Application Vault</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">Your Submitted Hiring Drive Applications</h3>
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
                    <div>
                      <h4 className="font-black text-base text-slate-900">{req.title}</h4>
                      <div className="text-xs text-blue-900 font-black mt-0.5">{req.job_type} • CTC: {req.ctc_range}</div>
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

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <button
                      onClick={() => handleOpenEditModal(req)}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
                      title="Edit application parameters"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => viewApplicants(req)}
                      className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Applicants ({req.applicant_count || 0})</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
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

      {/* VIEW 1: CANDIDATE DATABASE VIEW */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate database..."
                value={searchCandidateQuery}
                onChange={(e) => setSearchCandidateQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="text-xs text-blue-900 font-black">
              Showing {filteredCandidates.length} Saved GSFC Candidate Profiles
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 sm:px-5">Candidate Name</th>
                    <th className="py-4 px-4 sm:px-5">Degree & CGPA</th>
                    <th className="py-4 px-4 sm:px-5">ATS Score</th>
                    <th className="py-4 px-4 sm:px-5">Shortlist Status</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        <div className="text-sm">{cand.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{cand.roll_number}</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-900 font-black">{cand.program}</div>
                        <div className="text-[11px] text-emerald-800 font-black">{cand.cgpa} CGPA</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-xl flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PASS (ELIGIBLE)
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5 text-right">
                        <button
                          onClick={() => openCandidatePdfReport(cand)}
                          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" />
                          <span>PDF Report</span>
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

      {/* VIEW 3: MASTER APPLIED CANDIDATES FEED */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" /> Master Candidate Application Entries for {company?.company_name || 'Your Company'}
            </h2>
            <div className="text-xs font-black text-emerald-800">
              Total Submissions: {allCompanyApplicants.length}
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 sm:px-5">Candidate Details</th>
                    <th className="py-4 px-4 sm:px-5">Applied Position</th>
                    <th className="py-4 px-4 sm:px-5">AI Match Score</th>
                    <th className="py-4 px-4 sm:px-5">Applied Date & Method</th>
                    <th className="py-4 px-4 sm:px-5">Current Status</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allCompanyApplicants.map((app) => (
                    <tr key={app.application_id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        <div className="text-sm">{app.candidate_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{app.candidate_email} • {app.program} ({app.cgpa} CGPA)</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-900 font-black">{app.job_title}</div>
                        <div className="text-[11px] text-blue-900 font-bold">{app.ctc_range}</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs rounded-xl">
                          {app.match_score}% Match
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-800 font-bold">{app.applied_at ? String(app.applied_at).split('T')[0] : 'Today'}</div>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded ${app.applied_via === 'external' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                          {app.applied_via === 'external' ? 'Applied Externally' : 'Internal CampusHire AI'}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <select
                          value={app.status || 'applied'}
                          onChange={(e) => handleUpdateApplicationStatus(app.application_id, e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-900 cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview Scheduled</option>
                          <option value="selected">Selected (Offer)</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 sm:px-5 text-right space-x-2">
                        <button
                          onClick={() => openCandidatePdfReport({ name: app.candidate_name, email: app.candidate_email, ats_score: app.ats_score || 92 })}
                          className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" /> PDF Report
                        </button>

                        <button
                          onClick={() => handleDeleteApplication(app.application_id)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md"
                          title="Delete candidate application entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
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

      {/* VIEW 2: ACTIVE REQUIREMENTS GRID */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requirements.map((req) => (
              <div key={req.id} className="glass-card p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900">{req.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-blue-900 font-black">{req.job_type} • CTC: {req.ctc_range}</span>
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
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" /> {req.applicant_count} Applicants
                  </span>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-bold">{req.job_description}</p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <button
                    onClick={() => handleOpenEditModal(req)}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
                    title="Edit placement requirement drive details"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => viewApplicants(req)}
                    className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Applicants ({req.applicant_count || 0})</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRequirement(req.id)}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
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
      {activeReqApplicants && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-slate-100">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit mb-1">
                  <Users className="w-3 h-3" /> Candidate Applicants Feed
                </span>
                <h2 className="text-xl font-black">{activeReqApplicants.title}</h2>
                <p className="text-xs text-slate-300 font-bold">{company?.company_name || 'Recruiter'} • {applicantsData.length} Candidates Submitted</p>
              </div>
              <button
                onClick={() => setActiveReqApplicants(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {applicantsData.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="font-black text-sm text-slate-700 dark:text-slate-300">No Applications Submitted Yet</h3>
                  <p className="text-xs text-slate-500">Students will appear here as soon as they apply to this hiring drive.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicantsData.map((app) => (
                    <div key={app.application_id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{app.name}</h4>
                          <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 text-[10px] font-black rounded-lg border border-blue-200 dark:border-blue-700">
                            {app.matchScore || app.match_score || 85}% AI Match
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                          {app.program} • CGPA: {app.cgpa} • Applied: {app.applied_at ? String(app.applied_at).split('T')[0] : 'Recently'}
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

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <select
                          value={app.status || 'applied'}
                          onChange={(e) => handleUpdateApplicationStatus(app.application_id, e.target.value)}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900 cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview Scheduled</option>
                          <option value="selected">Selected (Offer)</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        <button
                          onClick={() => openCandidatePdfReport({ name: app.name, email: app.email || `${app.name.toLowerCase().replace(/\s+/g, '_')}@student.edu`, ats_score: app.ats_score || 92 })}
                          className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" /> PDF Report
                        </button>

                        <button
                          onClick={() => handleDeleteApplication(app.application_id)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 transition-all shadow-md"
                          title="Delete candidate application entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setActiveReqApplicants(null)}
                className="px-5 py-2 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close Applicants Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF REPORT MODAL */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={selectedCandidateReport}
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
                <div className={`p-4 rounded-2xl border font-bold text-xs flex items-center justify-between gap-3 shadow-lg ${
                  postStatus.type === 'pending'
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

              {/* Application Method Toggle (Addendum Spec) */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100">Application Method *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPostForm({ ...postForm, application_type: 'internal' })}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                      postForm.application_type === 'internal'
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
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                      postForm.application_type === 'external'
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Required Technical Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="Python, React, SQL, FastAPI"
                  value={postForm.required_skills}
                  onChange={(e) => setPostForm({ ...postForm, required_skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Skills (Optional)</label>
                <input
                  type="text"
                  placeholder="Docker, Kubernetes, AWS"
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
                  className={`px-6 py-2.5 font-black text-xs rounded-xl shadow-xl flex items-center gap-2 transition-all ${
                    (postForm.question_bank || []).length >= 5
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
    </div>
  );
}
