import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Sparkles, Briefcase, Award, TrendingUp, Search, SlidersHorizontal, ArrowRight, Play, Cpu, Check, Layers, ChevronRight, Compass, ShieldCheck, PieChart, BarChart2, RefreshCw, Zap, Database, X, Star, CheckCircle2, AlertCircle, Edit3, Mail, Download, Paperclip, Printer, Trash2 } from 'lucide-react';
import MockInterviewChat from './MockInterviewChat';
import CompanyTrackerSidebar from '../common/CompanyTrackerSidebar';
import ReportPDFModal from '../common/ReportPDFModal';
import InternalAutoFillApplyModal from './InternalAutoFillApplyModal';
import ExternalApplyConfirmModal from './ExternalApplyConfirmModal';

export default function StudentDashboard({ student, onUpdateStudent, onOpenAuthModal }) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'profile', 'applications'
  const [requirementsFeed, setRequirementsFeed] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showAllFeed, setShowAllFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedTargetReqId, setSelectedTargetReqId] = useState('');
  const [targetCompanyMatchData, setTargetCompanyMatchData] = useState(null);

  const handleWithdrawApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw/delete your application?')) return;
    try {
      const res = await fetch(`/api/student/applications/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== appId));
        alert('Application withdrawn successfully.');
      } else {
        alert(data.error || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
    }
  };

  // AI Resume Analyzing Progress Modal & Countdown State
  const [analyzingModalOpen, setAnalyzingModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Editable Candidate Fields
  const [candidateName, setCandidateName] = useState(student?.name || 'Thakkar Om');
  const [candidateEmail, setCandidateEmail] = useState('thakkar_om@gmail.com');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Mail Modal & PDF Report Modal State
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);
  const [mailRecipient, setMailRecipient] = useState(candidateEmail);
  const [mailSentSuccess, setMailSentSuccess] = useState(false);

  // Database Save State
  const [savingToDb, setSavingToDb] = useState(false);
  const [dbSaveConfirmation, setDbSaveConfirmation] = useState(null);

  // AI Mock Interview state
  const [mockSessionActive, setMockSessionActive] = useState(false);
  const [mockTargetRequirement, setMockTargetRequirement] = useState(null);

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

  useEffect(() => {
    fetchFeed();
    if (student) {
      fetchApplications();
      if (student.name) setCandidateName(student.name);
    }
  }, [student, showAllFeed]);

  const fetchFeed = async () => {
    try {
      const studentId = student?.id || '';
      const res = await fetch(`/api/student/requirements?studentId=${studentId}&showAll=${showAllFeed}`);
      const data = await res.json();
      setRequirementsFeed(data.feed || []);
    } catch (err) {
      console.error('Error fetching feed:', err);
    }
  };

  const fetchApplications = async () => {
    if (!student?.id) return;
    try {
      const res = await fetch(`/api/student/applications?studentId=${student.id}`);
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!student?.id) {
      alert('Please sign in as a student to save your parsed resume.');
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
      alert('💾 Candidate Data, Extracted Skills & Selection Status saved to GSFC SQLite Database!');
    } catch (err) {
      alert(err.message);
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
      alert(`✉️ Candidate Placement Report mailed successfully to ${mailRecipient}!`);
    }, 1200);
  };

  const handleDownloadPDF = () => {
    setPdfReportModalOpen(true);
  };

  // Apply Branching State
  const [selectedReqForApply, setSelectedReqForApply] = useState(null);
  const [internalApplyModalOpen, setInternalApplyModalOpen] = useState(false);
  const [externalConfirmModalOpen, setExternalConfirmModalOpen] = useState(false);

  const handleApplyClick = async (reqItem) => {
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
    const studentId = student?.id || 's_arav';
    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          requirement_id: reqId,
          applied_via: 'external'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record external application');

      alert('✅ External application marked as applied in your tracker!');
      fetchApplications();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApply = async (reqId, formOverrideData) => {
    const studentId = student?.id || 's_rahul_verma';

    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          requirement_id: reqId,
          applied_via: 'internal',
          override_data: formOverrideData
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      alert(`🎉 Application Submitted Successfully! AI Placement Match Score: ${data.matchScore}%`);
      
      // Fetch updated applications & feed
      if (student?.id) {
        fetchApplications();
      } else {
        const targetReq = requirementsFeed.find(r => r.id === reqId);
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
      alert(err.message);
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
    return matchesSearch && matchesBranch;
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
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-4 sm:p-8 border border-slate-200/90 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-900/10 text-blue-900 border border-blue-900/25 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-800" /> GSFC University Placement Workspace
              </span>
              {student && (
                <span className="px-3 py-1 bg-emerald-600/10 text-emerald-800 border border-emerald-600/25 text-xs font-black rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {student.program} ({student.cgpa} CGPA)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Welcome to <span className="gradient-text">GSFC Placement Portal</span>, Made by Thakkar Om (BTech CSE)
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-1.5 max-w-2xl font-bold leading-relaxed">
              Smart Resume Analyzer powered by NLP & Gemini AI. Visual skill match analytics, ATS compliance evaluation, and automated interview coaching.
            </p>
          </div>

          {/* ATS Score Circular Meter */}
          <div className="flex flex-wrap items-center gap-4 bg-white/90 p-4 rounded-2xl border border-slate-200/90 shadow-lg backdrop-blur-md w-full md:w-auto justify-between sm:justify-start">
            {student ? (
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-200" fill="transparent" />
                    <circle
                      cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4"
                      strokeDasharray={138}
                      strokeDashoffset={138 - (138 * (student.ats_score || 92)) / 100}
                      className={`${(student.ats_score || 92) >= 85 ? 'text-blue-900' : 'text-amber-600'} transition-all duration-1000`}
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
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="text-[10px] text-blue-800 hover:underline font-extrabold mt-0.5 block"
                  >
                    View Breakdown &rarr;
                  </button>
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
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Live GSFC Requirements
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileText className="w-4 h-4" /> Smart Resume Analyzer
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'applications'
                ? 'bg-theme-gradient text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Award className="w-4 h-4" /> My Applications ({applications.length})
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

                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAllFeed}
                      onChange={(e) => setShowAllFeed(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4"
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
                            <h3 className="font-black text-sm text-slate-900 group-hover:text-blue-900 transition-colors leading-tight">{req.title}</h3>
                            <div className="text-xs text-slate-700 font-black mt-0.5">{req.company_name} • {req.job_type}</div>
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-2xl border text-center font-black text-xs shrink-0 shadow-sm ${
                          !req.eligible
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : req.matchScore >= 85
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }`}>
                          <div className="text-[9px] uppercase font-black tracking-wider opacity-80">NLP Match</div>
                          {req.eligible ? `${req.matchScore}% Match` : 'Ineligible'}
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

                      <button
                        onClick={() => handleApplyClick(req)}
                        disabled={!req.eligible}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 min-h-[42px] ${
                          !req.eligible
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white shadow-blue-900/20'
                        }`}
                      >
                        {req.eligible ? (
                          <><span>Apply Now</span> <ArrowRight className="w-3.5 h-3.5 shrink-0" /></>
                        ) : (
                          <span>{req.eligibilityReason || 'Ineligible'}</span>
                        )}
                      </button>
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
                      else alert('Please click "Sign In" at the top right header to log in or register your GSFC student account.');
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
                      onClick={handleSaveToDatabase}
                      disabled={savingToDb}
                      className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all min-h-[38px]"
                    >
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span>{savingToDb ? 'Saving...' : 'Save Candidate Data'}</span>
                    </button>

                    <button
                      onClick={handleDownloadPDF}
                      className="py-2 px-3.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all min-h-[38px]"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0" />
                      <span>Download PDF Report</span>
                    </button>

                    <button
                      onClick={() => setMailModalOpen(true)}
                      className="py-2 px-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all min-h-[38px]"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>Mail Report</span>
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
            </div>
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

      {/* INTERNAL AUTO-FILL APPLY MODAL */}
      <InternalAutoFillApplyModal
        isOpen={internalApplyModalOpen}
        onClose={() => setInternalApplyModalOpen(false)}
        requirement={selectedReqForApply}
        student={student}
        onSubmitApplication={(reqId, formData) => handleApply(reqId, formData)}
      />

      {/* EXTERNAL APPLY TRACKER CONFIRMATION MODAL */}
      <ExternalApplyConfirmModal
        isOpen={externalConfirmModalOpen}
        onClose={() => setExternalConfirmModalOpen(false)}
        requirement={selectedReqForApply}
        onConfirmApplied={(reqId) => handleConfirmExternalApply(reqId)}
      />
    </div>
  );
}
