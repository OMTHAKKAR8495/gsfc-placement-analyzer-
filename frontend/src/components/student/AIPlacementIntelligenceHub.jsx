import React, { useState, useEffect } from 'react';
import {
  Sparkles, Award, Target, BookOpen, Code, Terminal, Play, 
  CheckCircle2, AlertTriangle, ArrowRight, Zap, Flame, Trophy,
  FileText, Briefcase, ChevronRight, RefreshCw, BarChart2, ShieldCheck,
  HelpCircle, Send, Check, X, Layers, Clock, Cpu, UserCheck, MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AIPlacementIntelligenceHub({ student, currentUser, onSelectTargetRequirement }) {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('readiness'); 
  // 'readiness', 'matching', 'skill_gap', 'resume_opt', 'coding_sandbox', 'mock_studio', 'prep_planner', 'communication_gd', 'study_generator', 'gamification'

  const [loading, setLoading] = useState(false);
  const [readinessData, setReadinessData] = useState(null);
  const [gamificationData, setGamificationData] = useState(null);

  // Target Company Selection State
  const [targetCompany, setTargetCompany] = useState('Google Cloud India');
  const [targetRole, setTargetRole] = useState('Software Development Engineer - Cloud & AI');

  // Company Match State
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Skill Gap State
  const [skillGapResult, setSkillGapResult] = useState(null);
  const [skillGapLoading, setSkillGapLoading] = useState(false);

  // Resume Optimizer State
  const [resumeOptResult, setResumeOptResult] = useState(null);
  const [resumeOptLoading, setResumeOptLoading] = useState(false);

  // Coding Sandbox State
  const [codingProblem, setCodingProblem] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('Arrays & Hashing');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [userCode, setUserCode] = useState('');
  const [codeEvalResult, setCodeEvalResult] = useState(null);
  const [evaluatingCode, setEvaluatingCode] = useState(false);
  const [codingHistory, setCodingHistory] = useState([]);

  // Prep Planner State
  const [plannerDays, setPlannerDays] = useState(30);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Communication & GD State
  const [commType, setCommType] = useState('hr_question');
  const [commTopic, setCommTopic] = useState('Tell me about a complex bug you resolved and how you verified the fix.');
  const [commResponse, setCommResponse] = useState('');
  const [commFeedback, setCommFeedback] = useState(null);
  const [analyzingComm, setAnalyzingComm] = useState(false);

  // Study Generator State
  const [studyCategory, setStudyCategory] = useState('flashcards');
  const [studyMaterial, setStudyMaterial] = useState(null);
  const [generatingStudy, setGeneratingStudy] = useState(false);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const studentId = currentUser?.profile?.id || currentUser?.owner_id || student?.id || 's_rahul_verma';
  const token = localStorage.getItem('campushire_token');
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  useEffect(() => {
    fetchInitialIntelligenceData();
  }, [studentId]);

  const fetchInitialIntelligenceData = async () => {
    setLoading(true);
    try {
      const [readinessRes, gamifyRes] = await Promise.all([
        fetch(`/api/intelligence/readiness/${studentId}`, { headers: authHeaders }),
        fetch(`/api/intelligence/gamification/${studentId}`, { headers: authHeaders })
      ]);

      if (readinessRes.ok) {
        const rData = await readinessRes.json();
        setReadinessData(rData);
      }
      if (gamifyRes.ok) {
        const gData = await gamifyRes.json();
        setGamificationData(gData);
      }
    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Run Company Match
  const handleRunCompanyMatch = async () => {
    setMatchingLoading(true);
    try {
      const res = await fetch('/api/intelligence/match-company', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          custom_requirement: {
            company_name: targetCompany,
            title: targetRole,
            min_cgpa: 7.5,
            required_skills_json: JSON.stringify(['Python', 'SQL', 'Docker', 'System Design', 'React'])
          }
        })
      });
      const data = await res.json();
      setMatchResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingLoading(false);
    }
  };

  // 2. Run Skill Gap Analyzer
  const handleRunSkillGap = async () => {
    setSkillGapLoading(true);
    try {
      const res = await fetch('/api/intelligence/skill-gap-analysis', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          target_company: targetCompany,
          target_role: targetRole
        })
      });
      const data = await res.json();
      setSkillGapResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSkillGapLoading(false);
    }
  };

  // 3. Run Resume Optimizer
  const handleRunResumeOptimizer = async () => {
    setResumeOptLoading(true);
    try {
      const res = await fetch('/api/intelligence/resume-optimizer', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          target_company: targetCompany
        })
      });
      const data = await res.json();
      setResumeOptResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setResumeOptLoading(false);
    }
  };

  // 4. Fetch Coding Problem
  const handleLoadCodingProblem = async (topic = selectedTopic, difficulty = selectedDifficulty) => {
    try {
      const res = await fetch('/api/intelligence/coding-problem', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ company: targetCompany, difficulty, topic })
      });
      const data = await res.json();
      setCodingProblem(data);
      setUserCode(data.starterCode || '');
      setCodeEvalResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Submit Code for Sandbox Evaluation
  const handleSubmitCode = async () => {
    if (!userCode.trim()) return;
    setEvaluatingCode(true);
    try {
      const res = await fetch('/api/intelligence/evaluate-code', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          problem_id: codingProblem?.id || 'prob_01',
          problem_title: codingProblem?.title || 'Algorithm Problem',
          difficulty: codingProblem?.difficulty || 'Medium',
          company: targetCompany,
          language: 'javascript',
          code: userCode
        })
      });
      const data = await res.json();
      setCodeEvalResult(data);
      if (data.status === 'ACCEPTED') {
        showToast({
          type: 'success',
          title: '🏆 Problem Accepted!',
          message: `Optimal ${data.time_complexity} runtime achieved. +40 Placement XP awarded!`,
          triggerCrackles: true
        });
        fetchInitialIntelligenceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingCode(false);
    }
  };

  // 6. Generate Preparation Plan
  const handleGeneratePlan = async () => {
    setCreatingPlan(true);
    try {
      const res = await fetch('/api/intelligence/preparation-planner', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          target_company: targetCompany,
          target_role: targetRole,
          total_days: plannerDays
        })
      });
      const data = await res.json();
      setCurrentPlan(data);
      showToast({
        type: 'success',
        title: '📅 30-Day Roadmap Generated',
        message: 'Personalized daily schedule saved to your database profile!',
        triggerCrackles: true
      });
      fetchInitialIntelligenceData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingPlan(false);
    }
  };

  // 7. Toggle Plan Task Checkbox
  const handleToggleTask = async (taskId, currentStatus) => {
    if (!currentPlan?.id) return;
    try {
      const res = await fetch(`/api/intelligence/preparation-plans/${currentPlan.id}/task`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ task_id: taskId, completed: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPlan(prev => ({ ...prev, progress_percentage: data.progress_percentage, days: data.days }));
        showToast({
          type: 'info',
          title: 'Task Progress Updated',
          message: `Progress: ${data.progress_percentage}% (+15 XP)`,
          triggerCrackles: false
        });
        fetchInitialIntelligenceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Analyze Communication Response
  const handleAnalyzeCommunication = async () => {
    if (!commResponse.trim()) return;
    setAnalyzingComm(true);
    try {
      const res = await fetch('/api/intelligence/analyze-communication', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          practice_type: commType,
          topic_or_question: commTopic,
          student_response: commResponse
        })
      });
      const data = await res.json();
      setCommFeedback(data);
      showToast({
        type: 'success',
        title: '🎙️ Speech Analysis Complete',
        message: `Overall Score: ${data.overall_score}/100 (+30 XP)`,
        triggerCrackles: true
      });
      fetchInitialIntelligenceData();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingComm(false);
    }
  };

  // 9. Generate AI Study Material
  const handleGenerateStudy = async () => {
    setGeneratingStudy(true);
    try {
      const res = await fetch('/api/intelligence/generate-study-material', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: studentId,
          category: studyCategory,
          company: targetCompany,
          topic: 'Cloud & Database Architecture'
        })
      });
      const data = await res.json();
      setStudyMaterial(data);
      setActiveFlashcardIndex(0);
      setFlashcardFlipped(false);
      showToast({
        type: 'success',
        title: '📚 Revision Material Generated',
        message: 'Saved to your personal study vault!',
        triggerCrackles: true
      });
      fetchInitialIntelligenceData();
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingStudy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 Top Intelligence Hero Banner with XP & Streaks */}
      <div className="p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white border-2 border-blue-800/80">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 bg-amber-400 text-slate-950 font-black rounded-full text-xs flex items-center gap-1.5 shadow-md border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950 animate-pulse" /> GSFC AI Placement Intelligence Hub
              </span>
              <span className="px-3 py-1 bg-purple-900/90 text-purple-100 border border-purple-400/50 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-purple-300" /> Neural Recruiter Matching Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Placement Intelligence & Career Readiness Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-2xl leading-relaxed">
              Personalized recruitment analytics, 0–100 readiness scoring, dynamic coding sandboxes, ATS resume optimization, and adaptive study roadmaps for GSFC students.
            </p>
          </div>

          {/* Gamification Stats Block */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-xl shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-amber-400 font-black flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" /> {gamificationData?.current_streak || 1} Days
                </div>
                <div className="text-[10px] text-slate-300 uppercase font-black tracking-wider mt-0.5">Streak</div>
              </div>

              <div className="w-px h-8 bg-slate-700" />

              <div className="text-center">
                <div className="text-sm text-emerald-400 font-black flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-emerald-400 fill-emerald-400" /> {gamificationData?.total_xp || 120} XP
                </div>
                <div className="text-[10px] text-slate-300 uppercase font-black tracking-wider mt-0.5">Level {gamificationData?.level || 1}</div>
              </div>

              <div className="w-px h-8 bg-slate-700" />

              <div className="text-center">
                <div className="text-sm text-purple-300 font-black flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-purple-300" /> {readinessData?.overall_readiness_score || 85}%
                </div>
                <div className="text-[10px] text-slate-300 uppercase font-black tracking-wider mt-0.5">Readiness</div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Sub-Navigation Bar */}
        <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/25 overflow-x-auto max-w-full pb-2">
          {[
            { id: 'readiness', label: '📊 0–100 Readiness Scorecard' },
            { id: 'matching', label: '🎯 AI Company Matcher' },
            { id: 'skill_gap', label: '🔍 Skill Gap Analyzer' },
            { id: 'resume_opt', label: '📄 AI Resume Optimizer' },
            { id: 'coding_sandbox', label: '💻 Coding Interviewer Studio' },
            { id: 'prep_planner', label: '📅 30-Day Prep Planner' },
            { id: 'communication_gd', label: '🎙️ Communication & GD Arena' },
            { id: 'study_generator', label: '📚 AI Study Generator' },
            { id: 'gamification', label: '🏆 Placement XP & Badges' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                if (tab.id === 'coding_sandbox' && !codingProblem) handleLoadCodingProblem();
                if (tab.id === 'matching' && !matchResult) handleRunCompanyMatch();
                if (tab.id === 'skill_gap' && !skillGapResult) handleRunSkillGap();
                if (tab.id === 'resume_opt' && !resumeOptResult) handleRunResumeOptimizer();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-sm ${
                activeSubTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-lg scale-105 border-2 border-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-slate-900/90 text-white hover:bg-slate-800 hover:text-amber-300 border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Company Selector Bar (Persistent across tools) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-black shrink-0">
          <Target className="w-4 h-4 text-blue-900" />
          <span>Active Target Placement Goal:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <select
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-blue-900"
          >
            <option value="Google Cloud India">Google Cloud India (Dream Tier • 18.5 LPA)</option>
            <option value="Reliance Industries Limited">Reliance Industries (Core • 10.2 LPA)</option>
            <option value="Larsen & Toubro (L&T)">Larsen & Toubro (Core • 8.8 LPA)</option>
            <option value="Tata Consultancy Services">TCS Digital (Regular • 7.5 LPA)</option>
            <option value="Amazon Web Services">Amazon AWS (Super Dream • 22.0 LPA)</option>
          </select>

          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Role (e.g. SDE - Cloud & AI)"
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-full sm:w-64 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DYNAMIC 0–100 PLACEMENT READINESS SCORECARD */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'readiness' && readinessData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Scorecard Tile */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
              <div className="w-24 h-24 rounded-full border-8 border-blue-900/20 flex items-center justify-center relative shadow-inner">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="#1e3a8a"
                    strokeWidth="3.5"
                    strokeDasharray={`${readinessData.overall_readiness_score || 85}, 100`}
                    strokeLinecap="round" fill="transparent"
                  />
                </svg>
                <span className="absolute font-black text-2xl text-slate-900">{readinessData.overall_readiness_score}%</span>
              </div>

              <div>
                <h3 className="font-black text-lg text-slate-900">Overall Placement Readiness</h3>
                <div className={`mt-1.5 inline-block px-3 py-1 rounded-full text-xs font-black ${readinessData.risk_badge_color}`}>
                  {readinessData.risk_level}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 max-w-xs">
                  Estimated candidate selection probability: <span className="font-black text-blue-950">{readinessData.placement_probability}%</span>
                </p>
              </div>
            </div>

            {/* Pillar Breakdown Dimension Bars */}
            <div className="md:col-span-2 glass-card p-6 rounded-3xl border border-slate-200/90 space-y-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-900" /> 10-Point Readiness Dimensions Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(readinessData.dimensions || []).map((dim, dIdx) => (
                  <div key={dIdx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-700">{dim.name}</span>
                      <span className="text-blue-950 font-black">{dim.score} {dim.unit}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-theme-gradient h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(dim.score / dim.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Actionable Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-3">
              <h3 className="font-black text-sm text-emerald-900 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile Strengths & Positive Drivers
              </h3>
              <div className="space-y-2">
                {(readinessData.positive_reasons || []).map((pos, pIdx) => (
                  <div key={pIdx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pos}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-3">
              <h3 className="font-black text-sm text-amber-900 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> High-Impact Optimization Recommendations
              </h3>
              <div className="space-y-2">
                {(readinessData.action_plans?.sevenDayPlan || []).map((act, aIdx) => (
                  <div key={aIdx} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. AI COMPANY & JOB MATCHING ENGINE */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'matching' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-900" /> AI Neural Company Match Analysis
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Evaluating candidate eligibility, skill overlap, and selection probability for <span className="font-black text-slate-900">{targetCompany}</span>.
              </p>
            </div>

            <button
              onClick={handleRunCompanyMatch}
              disabled={matchingLoading}
              className="px-4 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${matchingLoading ? 'animate-spin' : ''}`} />
              <span>Re-Evaluate Match</span>
            </button>
          </div>

          {matchResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-black uppercase">Overall Match Index</div>
                  <div className="text-3xl font-black text-blue-900 mt-1">{matchResult.match_percentage}%</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">High Compatibility</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-black uppercase">Academic CGPA Cutoff</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{matchResult.student_cgpa} <span className="text-xs text-slate-400 font-medium">/ {matchResult.min_cgpa} min</span></div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">✓ Cutoff Satisfied</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-black uppercase">Eligibility Decision</div>
                  <div className="text-xl font-black text-emerald-800 mt-2">ELIGIBLE FOR DRIVE</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">Ready for Internal Apply</div>
                </div>
              </div>

              {/* Matched vs Missing Skills Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Matched Verified Skills ({matchResult.matched_skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(matchResult.matched_skills || []).map((sk, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-black shadow-sm">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" /> High-Priority Missing Skills ({matchResult.missing_skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(matchResult.missing_skills || []).map((sk, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-black shadow-sm">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. AI SKILL GAP ANALYZER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'skill_gap' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <SearchIcon className="w-5 h-5 text-blue-900" /> AI Skill Gap & Priority Learning Roadmap
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Categorized technical gaps and dynamic 3-phase curriculum for <span className="font-black text-slate-900">{targetCompany}</span>.
              </p>
            </div>

            <button
              onClick={handleRunSkillGap}
              disabled={skillGapLoading}
              className="px-4 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${skillGapLoading ? 'animate-spin' : ''}`} />
              <span>Analyze Gaps</span>
            </button>
          </div>

          {skillGapResult && (
            <div className="space-y-6">
              {/* High Priority Gaps */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> High-Priority Missing Competencies
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(skillGapResult.high_priority_gaps || []).map((gap, gIdx) => (
                    <div key={gIdx} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{gap.skill}</span>
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-black rounded-lg">{gap.estimated_learning_hours} Hours</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{gap.why_important}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-Phase Roadmap */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> Automated 3-Phase Remedial Learning Plan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(skillGapResult.learning_roadmap || []).map((phase, pIdx) => (
                    <div key={pIdx} className="glass-card p-4 rounded-2xl border border-slate-200/90 space-y-2.5">
                      <div className="font-black text-xs text-blue-950 uppercase">{phase.phase}</div>
                      <div className="font-extrabold text-sm text-slate-900">{phase.focus}</div>
                      <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                        {(phase.tasks || []).map((tsk, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-1.5">
                            <span className="text-blue-900 font-black">•</span>
                            <span>{tsk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. AI RESUME OPTIMIZER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'resume_opt' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" /> AI Resume ATS Optimizer & Bullet Rewriter
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Tailoring resume bullet points using the Google XYZ formula for <span className="font-black text-slate-900">{targetCompany}</span>.
              </p>
            </div>

            <button
              onClick={handleRunResumeOptimizer}
              disabled={resumeOptLoading}
              className="px-4 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resumeOptLoading ? 'animate-spin' : ''}`} />
              <span>Optimize Resume</span>
            </button>
          </div>

          {resumeOptResult && (
            <div className="space-y-6">
              {/* ATS Potential Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-black uppercase">Current ATS Score</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{resumeOptResult.current_ats_score}%</div>
                  <div className="text-[10px] text-amber-700 font-bold mt-1">Optimization Opportunity</div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-800 font-black uppercase">Potential Target ATS Score</div>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{resumeOptResult.potential_ats_score}%</div>
                  <div className="text-[10px] text-emerald-800 font-bold mt-1">Tier-1 Highly Recommended</div>
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="text-xs font-black text-slate-900 uppercase">Recommended Keywords to Include</div>
                <div className="flex flex-wrap gap-2">
                  {(resumeOptResult.missing_keywords || []).map((kw, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 shadow-sm flex items-center gap-1.5">
                      <span>{kw.keyword}</span>
                      <span className="text-[10px] text-emerald-600 font-black">{kw.impact_weight}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Bullet Improvements */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Before / After AI Bullet Rewrites</h3>
                <div className="space-y-3">
                  {(resumeOptResult.bullet_point_improvements || []).map((b, bIdx) => (
                    <div key={bIdx} className="glass-card p-4 rounded-2xl border border-slate-200/90 space-y-2">
                      <div className="text-[11px] font-black text-slate-400 uppercase">{b.section}</div>
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium">
                        <span className="font-black text-rose-800">Original: </span> {b.original}
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold">
                        <span className="font-black text-emerald-800">AI Enhanced: </span> {b.optimized}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{b.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. AI CODING INTERVIEWER STUDIO */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'coding_sandbox' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-900" /> AI Coding Interviewer & Test Sandbox
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Live interactive coding challenges with dynamic complexity analysis and execution verification.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  handleLoadCodingProblem(e.target.value, selectedDifficulty);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
              >
                <option value="Arrays & Hashing">Arrays & Hashing</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
              </select>

              <button
                onClick={() => handleLoadCodingProblem()}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-200 cursor-pointer"
              >
                New Problem
              </button>
            </div>
          </div>

          {codingProblem && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem Description */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900">{codingProblem.title}</h3>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-lg">
                    {codingProblem.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {codingProblem.description}
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="text-[11px] font-black text-slate-700 uppercase">Test Case Example</div>
                  <div className="text-xs font-mono text-slate-900 bg-white p-2 rounded-xl border border-slate-200">
                    Input: {codingProblem.testCases?.[0]?.input} <br />
                    Expected: {codingProblem.testCases?.[0]?.expected}
                  </div>
                </div>

                {codeEvalResult && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    codeEvalResult.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between font-black text-xs">
                      <span>Status: {codeEvalResult.status}</span>
                      <span>Runtime: {codeEvalResult.execution_time_ms} ms</span>
                    </div>
                    <div className="text-xs font-medium">{codeEvalResult.ai_feedback}</div>
                    <div className="text-[11px] font-bold">
                      Complexity: <span className="font-black">{codeEvalResult.time_complexity}</span> time • <span className="font-black">{codeEvalResult.space_complexity}</span> space
                    </div>
                  </div>
                )}
              </div>

              {/* Code Editor Box */}
              <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-600 font-black">
                  <span>JavaScript (ES6) Environment</span>
                  <span>Auto-Linting Active</span>
                </div>

                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows={12}
                  className="w-full font-mono text-xs p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed resize-none shadow-inner"
                />

                <button
                  onClick={handleSubmitCode}
                  disabled={evaluatingCode}
                  className="w-full py-3 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${evaluatingCode ? 'animate-spin' : ''}`} />
                  <span>{evaluatingCode ? 'Running Test Cases...' : 'Submit Solution & Run Tests (+40 XP)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. PERSONALIZED 30-DAY PREPARATION PLANNER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'prep_planner' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-900" /> Personalized Day-by-Day Placement Roadmap
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Structured daily task schedule customized for <span className="font-black text-slate-900">{targetCompany}</span>.
              </p>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={creatingPlan}
              className="px-4 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${creatingPlan ? 'animate-spin' : ''}`} />
              <span>Generate 30-Day Plan (+25 XP)</span>
            </button>
          </div>

          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800">Overall Plan Completion</span>
                <span className="text-sm font-black text-blue-900">{currentPlan.progress_percentage}%</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto p-1">
                {(currentPlan.days || []).map((d) => (
                  <div key={d.day_number} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900">Day {d.day_number}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">{d.phase}</span>
                    </div>

                    <div className="space-y-2">
                      {(d.tasks || []).map((t) => (
                        <label key={t.id} className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => handleToggleTask(t.id, t.completed)}
                            className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 w-3.5 h-3.5 mt-0.5"
                          />
                          <span className={t.completed ? 'line-through text-slate-400' : ''}>{t.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">No Active Preparation Plan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Generate 30-Day Plan" above to create an automated daily roadmap for {targetCompany}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. COMMUNICATION & GD PRACTICE ARENA */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'communication_gd' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-900" /> Communication, HR & Group Discussion Analyzer
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Practice answering HR and GD topics with real-time feedback on STAR structure, fluency, and filler words.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={commType}
                onChange={(e) => {
                  setCommType(e.target.value);
                  if (e.target.value === 'gd_topic') setCommTopic('Artificial Intelligence in Higher Education: Catalyst or Threat to Creativity?');
                  else setCommTopic('Tell me about a complex bug you resolved and how you verified the fix.');
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
              >
                <option value="hr_question">HR & Behavioral Practice</option>
                <option value="gd_topic">Group Discussion (GD) Topic</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] font-black text-slate-500 uppercase">Selected Practice Prompt</div>
              <div className="text-sm font-black text-slate-900 mt-1">{commTopic}</div>
            </div>

            <textarea
              value={commResponse}
              onChange={(e) => setCommResponse(e.target.value)}
              placeholder="Type your response here using the STAR framework (Situation -> Task -> Action -> Result)..."
              rows={5}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-900"
            />

            <button
              onClick={handleAnalyzeCommunication}
              disabled={analyzingComm || !commResponse.trim()}
              className="px-5 py-2.5 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${analyzingComm ? 'animate-spin' : ''}`} />
              <span>{analyzingComm ? 'Analyzing Speech & Fluency...' : 'Analyze My Response (+30 XP)'}</span>
            </button>

            {commFeedback && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Overall Score</span>
                    <div className="text-xl font-black text-blue-900 mt-0.5">{commFeedback.overall_score}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Fluency</span>
                    <div className="text-xl font-black text-emerald-800 mt-0.5">{commFeedback.fluency_score}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-black">STAR Structure</span>
                    <div className="text-xl font-black text-indigo-800 mt-0.5">{commFeedback.structure_score}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Filler Words</span>
                    <div className="text-xl font-black text-amber-700 mt-0.5">{commFeedback.filler_words_detected}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-black text-emerald-900">Key Strengths:</div>
                  {(commFeedback.feedback?.strengths || []).map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. AI STUDY GENERATOR & FLASHCARDS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'study_generator' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-900" /> AI Study Generator & Flashcard Studio
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Generate high-yield revision flashcards, MCQs, and cheat sheets for <span className="font-black text-slate-900">{targetCompany}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={studyCategory}
                onChange={(e) => setStudyCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
              >
                <option value="flashcards">Interactive Flashcards</option>
                <option value="revision_notes">Revision Cheat Sheet</option>
                <option value="mcq_quiz">Company Practice Quiz</option>
              </select>

              <button
                onClick={handleGenerateStudy}
                disabled={generatingStudy}
                className="px-4 py-2 bg-theme-gradient text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingStudy ? 'animate-spin' : ''}`} />
                <span>Generate (+20 XP)</span>
              </button>
            </div>
          </div>

          {studyMaterial?.content?.cards && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div
                onClick={() => setFlashcardFlipped(prev => !prev)}
                className="w-full max-w-lg min-h-[200px] p-8 rounded-3xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 shadow-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:scale-102"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                  {flashcardFlipped ? 'Answer / Key Explanation' : 'Question / Concept Prompt'}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 mt-3 leading-relaxed">
                  {flashcardFlipped
                    ? studyMaterial.content.cards[activeFlashcardIndex]?.back
                    : studyMaterial.content.cards[activeFlashcardIndex]?.front}
                </p>
                <span className="text-[10px] text-slate-400 font-bold mt-4">Click to flip card</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={activeFlashcardIndex === 0}
                  onClick={() => { setActiveFlashcardIndex(prev => prev - 1); setFlashcardFlipped(false); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black disabled:opacity-40 cursor-pointer"
                >
                  &larr; Previous
                </button>
                <span className="text-xs font-black text-slate-600">
                  {activeFlashcardIndex + 1} / {studyMaterial.content.cards.length}
                </span>
                <button
                  disabled={activeFlashcardIndex === studyMaterial.content.cards.length - 1}
                  onClick={() => { setActiveFlashcardIndex(prev => prev + 1); setFlashcardFlipped(false); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black disabled:opacity-40 cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. PLACEMENT XP & GAMIFICATION CENTER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'gamification' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Placement XP, Achievements & Streaks
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Track your active recruitment milestones and unlock verified skill achievements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-3xl shadow-lg text-center space-y-1">
              <span className="text-xs font-black uppercase opacity-80">Total Placement XP</span>
              <div className="text-4xl font-black">{gamificationData?.total_xp || 120}</div>
              <div className="text-xs font-extrabold mt-1">Level {gamificationData?.level || 1} Candidate</div>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-3xl shadow-lg text-center space-y-1">
              <span className="text-xs font-black uppercase text-amber-300">Daily Study Streak</span>
              <div className="text-4xl font-black flex items-center justify-center gap-1.5">
                <Flame className="w-7 h-7 text-amber-400 fill-amber-400 animate-pulse" />
                <span>{gamificationData?.current_streak || 1} Days</span>
              </div>
              <div className="text-xs text-purple-200 font-medium mt-1">Highest: {gamificationData?.highest_streak || 1} Days</div>
            </div>

            <div className="p-6 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg text-center space-y-1">
              <span className="text-xs font-black uppercase text-emerald-300">Verified Badges</span>
              <div className="text-4xl font-black">{gamificationData?.badges?.length || 1}</div>
              <div className="text-xs text-emerald-200 font-medium mt-1">Recruiter Verified</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
