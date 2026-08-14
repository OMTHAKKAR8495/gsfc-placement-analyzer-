import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Sparkles, Briefcase, Award, TrendingUp, Search, SlidersHorizontal, ArrowRight, Play, Cpu, Check, Layers, ChevronRight, Compass, ShieldCheck, PieChart, BarChart2, RefreshCw, Zap, Database, X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import MockInterviewChat from './MockInterviewChat';
import CompanyTrackerSidebar from '../common/CompanyTrackerSidebar';

export default function StudentDashboard({ student, onUpdateStudent }) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'profile', 'applications'
  const [requirementsFeed, setRequirementsFeed] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showAllFeed, setShowAllFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [uploadingResume, setUploadingResume] = useState(false);

  // AI Resume Analyzing Progress Modal & Countdown State
  const [analyzingModalOpen, setAnalyzingModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Parsed Resume Details & Selection Status Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [analysisResultData, setAnalysisResultData] = useState(null);
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

    try {
      const res = await fetch('/api/student/resume/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload resume');

      setTimeout(() => {
        onUpdateStudent(data.student);
        setAnalysisResultData(data);
        setAnalyzingModalOpen(false);
        setUploadingResume(false);
        setPreviewModalOpen(true);
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
          name: student.name,
          program: student.program,
          branch: student.branch,
          cgpa: student.cgpa,
          ats_score: student.ats_score || 92,
          skills: ['Python', 'React', 'SQL', 'FastAPI', 'Machine Learning']
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Database save failed');

      setDbSaveConfirmation(data);
      alert('💾 Profile, Parsed Skills & Selection Status saved to GSFC SQLite Database!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingToDb(false);
    }
  };

  const handleApply = async (reqId) => {
    if (!student?.id || !student.parsed_resume_json) {
      alert('Please upload or build your resume first before applying to placement requirements!');
      setActiveTab('profile');
      return;
    }

    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          requirement_id: reqId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      alert(`🎉 Application Submitted! AI Match Score: ${data.matchScore}%`);
      fetchApplications();
      fetchFeed();
    } catch (err) {
      alert(err.message);
    }
  };

  const startMockInterview = (requirement) => {
    setMockTargetRequirement(requirement);
    setMockSessionActive(true);
  };

  const parsedResume = student?.parsed_resume_json
    ? (typeof student.parsed_resume_json === 'string' ? JSON.parse(student.parsed_resume_json) : student.parsed_resume_json)
    : {
        name: student?.name || 'Rahul Verma',
        program: student?.program || 'BTech CSE',
        branch: student?.branch || 'Computer Science & Engineering',
        cgpa: student?.cgpa || 8.5,
        skills: ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning', 'Data Structures']
      };

  const filteredFeed = requirementsFeed.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || JSON.parse(r.eligible_programs_json || '[]').some(p => p.includes(selectedBranch));
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
              Welcome to <span className="gradient-text">GSFC Placement Portal</span>, {student?.name || 'Candidate'}
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
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Live GSFC Requirements
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileText className="w-4 h-4" /> Smart Resume Analyzer
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'applications'
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white shadow-lg shadow-blue-900/20'
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
                            src={req.logo_url || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60'}
                            alt={req.company_name}
                            className="w-12 h-12 rounded-2xl object-contain bg-slate-50 p-1.5 border border-slate-200 shadow-sm shrink-0"
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
                        onClick={() => handleApply(req.id)}
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

          {/* TAB 2: FULL DETAILED SMART RESUME ANALYZER REPORT DASHBOARD */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Header Action & Status Card */}
              <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-blue-900 shrink-0" />
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">Smart Resume Analyzer & ATS Report</h2>
                    </div>
                    <p className="text-xs text-slate-700 font-bold">Full PDF Vector Analysis, Shortlist Status Evaluation & SQLite DB Storage</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <label className="flex-1 md:flex-initial py-2.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all min-h-[44px]">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>{uploadingResume ? 'Parsing PDF...' : 'Upload PDF Resume'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                        disabled={uploadingResume}
                      />
                    </label>

                    <button
                      onClick={handleSaveToDatabase}
                      disabled={savingToDb}
                      className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Database className="w-4 h-4 shrink-0" />
                      <span>{savingToDb ? 'Saving...' : 'Save to DB'}</span>
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

                {/* SHORTLIST EVALUATION BANNER */}
                <div className="p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Placement Shortlist Evaluation</span>
                    <span className="text-base font-black text-emerald-950 flex items-center gap-2">
                      <Star className="w-5 h-5 fill-emerald-500 text-emerald-600 shrink-0" />
                      {student?.ats_score >= 85 || !student ? 'SELECTED FOR PLACEMENT ROUNDS' : 'PENDING RECRUITER REVIEW'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">ATS Compatibility</div>
                      <div className="text-lg font-black text-blue-900">{student?.ats_score || 92} / 100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CANDIDATE EXTRACTED CREDENTIALS CARD */}
              <div className="glass-card p-5 rounded-3xl border border-slate-200/90 space-y-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-900" /> Extracted Candidate Profile & Academic Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Candidate Name</span>
                    <span className="text-slate-900 font-black text-sm">{student?.name || 'Rahul Verma'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Degree & Program</span>
                    <span className="text-slate-900 font-black text-sm">{student?.program || 'BTech CSE'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Department / Branch</span>
                    <span className="text-slate-900 font-black text-sm">{student?.branch || 'Computer Science'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-black uppercase">Academic CGPA</span>
                    <span className="text-emerald-800 font-black text-sm">{student?.cgpa || 8.5} CGPA</span>
                  </div>
                </div>
              </div>

              {/* SKILLS MATRIX & COMPATIBILITY METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skill Match Breakdown */}
                <div className="glass-card p-5 rounded-3xl border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-900" /> Parsed Technical Skills & Keyword Fit
                    </h3>
                    <span className="text-[10px] text-blue-900 font-black bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">NLP Index</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(parsedResume.skills || ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning', 'Data Structures']).map((sk, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black rounded-xl shadow-sm">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3 text-xs font-bold pt-2 border-t border-slate-200">
                    <div>
                      <div className="flex justify-between text-slate-900 mb-1">
                        <span>Python & Machine Learning</span>
                        <span className="text-blue-900 font-black">92% Fit</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-gradient-to-r from-blue-900 to-indigo-700 h-full rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-900 mb-1">
                        <span>Full-Stack Web & SQL Databases</span>
                        <span className="text-blue-900 font-black">88% Fit</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-gradient-to-r from-blue-900 to-teal-600 h-full rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Fit Analytics */}
                <div className="glass-card p-5 rounded-3xl border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-amber-600" /> ATS Compatibility Ratio
                    </h3>
                    <span className="text-[10px] text-amber-800 font-black bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Ratio</span>
                  </div>

                  <div className="flex items-center justify-around gap-4 pt-2">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="44" stroke="currentColor" strokeWidth="10" className="text-slate-100" fill="transparent" />
                        <circle cx="56" cy="56" r="44" stroke="#1e3a8a" strokeWidth="10" strokeDasharray="276" strokeDashoffset="24" fill="transparent" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-base font-black text-slate-900">{student?.ats_score || 92}%</span>
                        <span className="text-[8px] text-slate-600 block font-black">ATS MATCH</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-black text-slate-800">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-900 shrink-0"></span> Technical Skills (40%)</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span> Experience & Projects (30%)</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-600 shrink-0"></span> CGPA & Education (30%)</div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-bold">
                    💡 <span className="font-black">AI Recommendation:</span> Adding quantifiable metrics (e.g., "Improved query execution by 30%") raises recruiter ranking!
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
                        className="py-2.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-900/20 transition-all shrink-0 min-h-[42px]"
                      >
                        <Play className="w-3.5 h-3.5 shrink-0" /> <span>AI Mock Interview</span>
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

      {/* PARSED RESUME DETAILS & SELECTION STATUS PREVIEW MODAL */}
      {previewModalOpen && analysisResultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-8 space-y-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">AI Analysis & Selection Result</h2>
                  <p className="text-xs text-slate-600 font-bold">Extracted PDF Profile, ATS Score & Selection Status</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SELECTION STATUS BADGE BANNER */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Shortlist Evaluation Result</span>
                <span className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-emerald-500 text-emerald-600" />
                  {analysisResultData.selectionStatus || 'SELECTED FOR PLACEMENT ROUNDS'}
                </span>
              </div>
              <div className="px-3.5 py-1.5 bg-emerald-900 text-white rounded-xl font-black text-xs shadow-md shrink-0">
                Score: {analysisResultData.atsScore || 92}/100
              </div>
            </div>

            {/* EXTRACTED CANDIDATE DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div><span className="text-slate-500">Candidate Name:</span> <span className="text-slate-900 font-black block text-sm">{analysisResultData.parsedResume?.name || student?.name}</span></div>
              <div><span className="text-slate-500">Degree & Program:</span> <span className="text-slate-900 font-black block text-sm">{analysisResultData.parsedResume?.program || student?.program}</span></div>
              <div><span className="text-slate-500">Academic CGPA:</span> <span className="text-emerald-800 font-black block text-sm">{analysisResultData.parsedResume?.cgpa || student?.cgpa} CGPA</span></div>
              <div><span className="text-slate-500">Department / Branch:</span> <span className="text-slate-900 font-black block text-sm">{analysisResultData.parsedResume?.branch || student?.branch}</span></div>
            </div>

            {/* EXTRACTED SKILLS SUMMARY */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Parsed Technical Skills & Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {(analysisResultData.parsedResume?.skills || ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning']).map((sk, sIdx) => (
                  <span key={sIdx} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black rounded-xl shadow-sm">
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* DATABASE SAVE ACTION SECTION */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-900" /> Save to GSFC SQLite Database
                  </h4>
                  <p className="text-[11px] text-slate-600 font-bold mt-0.5">Persist candidate resume vectors & selection status to database</p>
                </div>

                <button
                  onClick={handleSaveToDatabase}
                  disabled={savingToDb}
                  className="py-2.5 px-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[42px] shrink-0"
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>{savingToDb ? 'Saving to DB...' : 'Save Data to Database'}</span>
                </button>
              </div>

              {dbSaveConfirmation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-black flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{dbSaveConfirmation.message}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                    ID: {dbSaveConfirmation.db_record_id}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black text-xs shadow-md transition-all"
              >
                Close Preview & View Live Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
