import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Play,
  Building2,
  Layers,
  Filter,
  Tag,
  HelpCircle,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Award,
  CheckCircle
} from 'lucide-react';
import { generateTailoredInterviewQuestions } from '../../utils/interviewGenerator';
import { buildInterviewSet } from '../../utils/questionSelectionAlgorithm';
import CompanyQuestionUploadModal from '../common/CompanyQuestionUploadModal';
import PracticeModeModal from '../common/PracticeModeModal';
import { 
  getCompanyUploadedQuestions, 
  saveCompanyUploadedQuestion, 
  bulkUploadCompanyQuestions, 
  deleteCompanyUploadedQuestion 
} from '../../utils/companyQuestionStorage';

export default function InterviewStudioView({ studentProfile, selectedJob }) {
  const [uploadedCompanyQuestions, setUploadedCompanyQuestions] = useState(() => 
    getCompanyUploadedQuestions()
  );

  const [activeCategory, setActiveCategory] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');

  // Inline AI Evaluation Practice States
  const [inlinePracticeId, setInlinePracticeId] = useState(null);
  const [inlineAnswers, setInlineAnswers] = useState({});
  const [inlinePreviousAnswers, setInlinePreviousAnswers] = useState({});
  const [inlineEvaluations, setInlineEvaluations] = useState({});
  const [inlineAttempts, setInlineAttempts] = useState({});
  const [inlineIsEvaluating, setInlineIsEvaluating] = useState({});
  const [inlineIsListeningId, setInlineIsListeningId] = useState(null);
  const inlineRecognitionRef = useRef(null);

  // Company / Role Selection State
  const [availableDrives, setAvailableDrives] = useState([
    {
      id: 'req_google_swe',
      title: 'Software Development Engineer - AI & Cloud',
      company_name: 'Google Cloud India',
      ctc_range: '₹28,00,000 - ₹34,00,000 PA',
      required_skills_json: '["Python", "React", "SQL", "FastAPI"]',
      question_bank_json: JSON.stringify([
        { id: 'g_1', text: 'How do you optimize SQL query execution plans under high database concurrency?', category: 'Technical', difficulty: 'Medium', source: 'recruiter' },
        { id: 'g_2', text: 'Walk through architecting a real-time WebSocket notification engine in Node/FastAPI.', category: 'System Design', difficulty: 'Hard', source: 'recruiter' },
        { id: 'g_3', text: 'Explain the internal memory model of Python GIL vs multi-processing worker pools.', category: 'Technical', difficulty: 'Hard', source: 'recruiter' },
        { id: 'g_4', text: 'Describe a situation where a service failed in production. How did you diagnose it?', category: 'Behavioral', difficulty: 'Medium', source: 'recruiter' },
        { id: 'g_5', text: 'Why are you passionate about joining Google Cloud India?', category: 'HR', difficulty: 'Easy', source: 'recruiter' }
      ]),
      question_bank_status: 'complete'
    },
    {
      id: 'req_msft_azure',
      title: 'Graduate Software Engineer',
      company_name: 'Microsoft Azure Systems',
      ctc_range: '₹24,00,000 - ₹30,00,000 PA',
      required_skills_json: '["C#", "Azure", "Distributed Systems", "SQL"]',
      question_bank_json: JSON.stringify([
        { id: 'm_1', text: 'How do you implement distributed lock management in Azure Service Bus?', category: 'System Design', difficulty: 'Hard', source: 'recruiter' },
        { id: 'm_2', text: 'Compare garbage collection cycles in Java vs .NET CLR runtime.', category: 'Technical', difficulty: 'Medium', source: 'recruiter' },
        { id: 'm_3', text: 'How do you handle zero-downtime database schema migrations?', category: 'Technical', difficulty: 'Hard', source: 'recruiter' },
        { id: 'm_4', text: 'Tell me about a time you led a cross-functional team project.', category: 'Behavioral', difficulty: 'Medium', source: 'recruiter' },
        { id: 'm_5', text: 'Why Microsoft Azure over other cloud infrastructure vendors?', category: 'HR', difficulty: 'Easy', source: 'recruiter' }
      ]),
      question_bank_status: 'complete'
    }
  ]);

  const [selectedDriveId, setSelectedDriveId] = useState(() => selectedJob?.id || 'req_google_swe');

  const activeDrive = availableDrives.find(d => d.id === selectedDriveId) || availableDrives[0];
  const interviewSet = buildInterviewSet(activeDrive, studentProfile, 8);

  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [completedQuestionIds, setCompletedQuestionIds] = useState([]);

  const handleQuestionCompleted = (qId, evalData = null) => {
    if (!completedQuestionIds.includes(qId)) {
      setCompletedQuestionIds(prev => [...prev, qId]);
    }
    if (evalData) {
      setInlineEvaluations(prev => ({ ...prev, [qId]: evalData }));
    }
  };

  const toggleInlineSpeech = (qId) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported by your browser. Please type your answer.');
      return;
    }

    if (inlineIsListeningId === qId) {
      if (inlineRecognitionRef.current) inlineRecognitionRef.current.stop();
      setInlineIsListeningId(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInlineAnswers(prev => ({
          ...prev,
          [qId]: (prev[qId] ? prev[qId] + ' ' : '') + transcript
        }));
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setInlineIsListeningId(null);
      };

      recognition.onend = () => {
        setInlineIsListeningId(null);
      };

      recognition.start();
      inlineRecognitionRef.current = recognition;
      setInlineIsListeningId(qId);
    } catch (err) {
      alert('Could not initialize speech recognition: ' + err.message);
      setInlineIsListeningId(null);
    }
  };

  const handleInlineSubmitAnswer = async (q) => {
    const qId = q.id;
    const answer = (inlineAnswers[qId] || '').trim();
    if (!answer) return;

    if (inlineIsListeningId === qId && inlineRecognitionRef.current) {
      inlineRecognitionRef.current.stop();
      setInlineIsListeningId(null);
    }

    setInlineIsEvaluating(prev => ({ ...prev, [qId]: true }));
    const currentAttempt = inlineAttempts[qId] || 1;

    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.question || q.text,
          category: q.category,
          difficulty: q.difficulty,
          keyConcepts: q.keyPointsToInclude || q.keyConcepts || q.skillTags,
          suggestedAnswer: q.suggestedAnswer || q.answer,
          studentAnswer: answer,
          previousAnswer: inlinePreviousAnswers[qId] || '',
          attemptCount: currentAttempt
        })
      });

      const data = await res.json();
      setInlineEvaluations(prev => ({ ...prev, [qId]: data }));

      if (data.verdict === 'pass') {
        handleQuestionCompleted(qId, data);
        setExpandedQuestionId(qId); // Auto-expand suggested answer
      }
    } catch (err) {
      alert('Error evaluating answer: ' + err.message);
    } finally {
      setInlineIsEvaluating(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleInlineRetry = (qId) => {
    const attempts = inlineAttempts[qId] || 1;
    if (attempts < 3) {
      setInlineAttempts(prev => ({ ...prev, [qId]: attempts + 1 }));
      setInlinePreviousAnswers(prev => ({ ...prev, [qId]: inlineAnswers[qId] || '' }));
      setInlineAnswers(prev => ({ ...prev, [qId]: '' }));
      setInlineEvaluations(prev => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const allQuestions = generateTailoredInterviewQuestions(studentProfile || {}, selectedJob);

  const availableCompanies = Array.from(
    new Set(allQuestions.map(q => q.companyName).filter(Boolean))
  );

  const filteredQuestions = allQuestions.filter(q => {
    if (activeCategory !== 'All' && q.category !== activeCategory) {
      return false;
    }
    if (sourceFilter === 'project_based' && q.source !== 'project_based') {
      return false;
    }
    if (sourceFilter === 'company_uploaded' && q.source !== 'company_uploaded') {
      return false;
    }
    if (sourceFilter === 'standard' && q.source !== 'standard' && q.source) {
      return false;
    }
    if (selectedCompanyFilter !== 'All' && q.companyName !== selectedCompanyFilter) {
      return false;
    }
    return true;
  });

  const handleSaveQuestion = (newQ) => {
    const updated = saveCompanyUploadedQuestion(newQ);
    setUploadedCompanyQuestions(updated);
  };

  const handleBulkUpload = (qList) => {
    const updated = bulkUploadCompanyQuestions(qList);
    setUploadedCompanyQuestions(updated);
  };

  const handleDeleteQuestion = (id) => {
    const updated = deleteCompanyUploadedQuestion(id);
    setUploadedCompanyQuestions(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-900/10 text-blue-900 dark:text-blue-400 border border-blue-900/20">
              GSFC AI Practice Studio
            </span>
            <span className="text-xs text-slate-500 font-bold">
              Tailored for {selectedJob ? selectedJob.title : 'Software & Tech Professionals'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            GSFC Interview Question Generator & Practice Studio
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
            Questions dynamically framed around student project tech stacks & uploaded company placement question banks.
          </p>
        </div>

        {/* Recruiter / Admin Question Upload Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white font-black text-xs shadow-lg shadow-blue-900/20 flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Building2 className="w-4 h-4" />
            Upload Company Questions
          </button>
        </div>
      </div>

      {/* COMPANY / ROLE SELECTOR & SMART SAMPLER PANEL */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Target Company Drive Practice
              </span>
            </div>
            <h3 className="text-lg font-black text-white">
              Select Company & Hiring Drive for Focused Practice
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Practice with real recruiter question banks or AI-synthesized role benchmarks tailored to specific campus placement drives.
            </p>
          </div>

          {/* QUESTION SOURCE BADGE */}
          <div className="shrink-0">
            {interviewSet.sourceBadge === 'recruiter' && (
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Recruiter-Verified Questions ({interviewSet.questions.length})
              </span>
            )}
            {interviewSet.sourceBadge === 'mixed' && (
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Mixed Set (Recruiter + AI Benchmark)
              </span>
            )}
            {interviewSet.sourceBadge === 'ai_generated' && (
              <span className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                AI-Generated Practice Set
              </span>
            )}
          </div>
        </div>

        {/* SELECTOR DROPDOWN ROW */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white/10 dark:bg-slate-800/80 border border-white/20 rounded-2xl text-xs font-black text-white focus:outline-none focus:border-amber-400 cursor-pointer backdrop-blur-md"
            >
              {availableDrives.map((drive) => (
                <option key={drive.id} value={drive.id} className="bg-slate-900 text-white">
                  🏢 {drive.company_name} — {drive.title} ({drive.ctc_range})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setPracticeQuestion(interviewSet.questions[0])}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Mock Interview Session ({interviewSet.questions.length} Qs)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm space-y-4">
        
        {/* Origin Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-900 dark:text-blue-400" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Question Origin:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setSourceFilter('All')}
              className={'px-3 py-1.5 rounded-xl transition-all ' + (
                sourceFilter === 'All'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              )}
            >
              All Questions ({allQuestions.length})
            </button>

            <button
              onClick={() => setSourceFilter('project_based')}
              className={'px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ' + (
                sourceFilter === 'project_based'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              )}
            >
              🚀 Candidate Project Topics ({allQuestions.filter(q => q.source === 'project_based').length})
            </button>

            <button
              onClick={() => setSourceFilter('company_uploaded')}
              className={'px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ' + (
                sourceFilter === 'company_uploaded'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              )}
            >
              🏢 Company Uploaded ({allQuestions.filter(q => q.source === 'company_uploaded').length})
            </button>

            <button
              onClick={() => setSourceFilter('standard')}
              className={'px-3 py-1.5 rounded-xl transition-all ' + (
                sourceFilter === 'standard'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              )}
            >
              ⭐ Standard Benchmark
            </button>
          </div>
        </div>

        {/* Category Pills & Company Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Category:</span>
            {['All', 'Technical', 'System Design', 'Behavioral', 'HR / Culture'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={'px-3 py-1 rounded-xl text-xs font-bold transition-all ' + (
                  activeCategory === cat
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {availableCompanies.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-bold">Filter Company:</span>
              <select
                value={selectedCompanyFilter}
                onChange={e => setSelectedCompanyFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold rounded-xl px-3 py-1 focus:outline-none focus:border-blue-900"
              >
                <option value="All">All Companies ({availableCompanies.length})</option>
                {availableCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* Question Cards Feed */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No questions match your current filters</h3>
            <p className="text-xs text-slate-500 font-medium">
              Try switching the category or source filter above, or click "Upload Company Questions" to add custom questions.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const qId = q.id;
            const isExpanded = expandedQuestionId === qId;
            const isPracticingInline = inlinePracticeId === qId;
            const evaluation = inlineEvaluations[qId];
            const isEvaluating = inlineIsEvaluating[qId];
            const isListening = inlineIsListeningId === qId;
            const attempts = inlineAttempts[qId] || 1;
            const isCompleted = completedQuestionIds.includes(qId) || evaluation?.verdict === 'pass';

            return (
              <div
                key={qId || idx}
                className={`glass-panel rounded-3xl p-6 border transition-all shadow-sm space-y-4 ${
                  isCompleted 
                    ? 'border-emerald-500/50 bg-emerald-950/5 dark:bg-emerald-950/20' 
                    : 'border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-blue-900'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-blue-900/10 text-blue-900 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      Q{idx + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {q.companyName && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-md border border-amber-500/30 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Uploaded by {q.companyName}
                          </span>
                        )}

                        {q.projectTopic && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 rounded-md border border-cyan-500/30 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Project Topic: {q.projectTopic}
                          </span>
                        )}

                        <span className="px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:text-blue-300 bg-blue-900/10 rounded border border-blue-900/20">
                          {q.category}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 rounded border border-purple-500/20">
                          {q.difficulty} Level
                        </span>

                        {isCompleted && (
                          <span className="px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 rounded border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInlinePracticeId(isPracticingInline ? null : qId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 ${
                        isPracticingInline 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' 
                          : 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isPracticingInline ? 'Close Practice' : 'Practice'}
                    </button>
                  </div>
                </div>

                {/* Key Concepts & Keywords list */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Key Concepts & Keywords to Address:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(q.keyPointsToInclude || []).map((kp, kIdx) => (
                      <span key={kIdx} className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-bold">
                        • {kp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* INLINE AI ANSWER EVALUATION AGENT PANEL */}
                {isPracticingInline && (
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-blue-900/30 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> AI Recruiter Practice Agent (Attempt {attempts} of 3)
                      </span>

                      {/* Microphone Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleInlineSpeech(qId)}
                        disabled={evaluation?.verdict === 'pass' || isEvaluating}
                        className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                          isListening 
                            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isListening ? (
                          <><MicOff className="w-3.5 h-3.5" /> Recording Voice...</>
                        ) : (
                          <><Mic className="w-3.5 h-3.5 text-blue-600" /> Record Answer</>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      disabled={evaluation?.verdict === 'pass' || isEvaluating}
                      placeholder="Type or speak your technical answer using the STAR framework (Situation, Task, Action, Result)..."
                      value={inlineAnswers[qId] || ''}
                      onChange={(e) => setInlineAnswers({ ...inlineAnswers, [qId]: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-900 font-mono disabled:opacity-60"
                    />

                    {!evaluation && (
                      <button
                        onClick={() => handleInlineSubmitAnswer(q)}
                        disabled={isEvaluating || !(inlineAnswers[qId] || '').trim()}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
                      >
                        {isEvaluating ? (
                          <>Evaluating Answer Quality with AI Recruiter Agent...</>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Submit Answer for AI Review
                          </>
                        )}
                      </button>
                    )}

                    {/* EVALUATION RESULT PANEL */}
                    {evaluation && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md space-y-3 animate-in fade-in">
                        
                        {/* Verdict Pill Badge & Retry */}
                        <div className="flex items-center justify-between">
                          <div>
                            {evaluation.verdict === 'pass' && (
                              <span className="px-3.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ✅ Strong Answer ({evaluation.score}/100)
                              </span>
                            )}
                            {evaluation.verdict === 'needs_improvement' && (
                              <span className="px-3.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> ⚠️ Needs Improvement ({evaluation.score}/100)
                              </span>
                            )}
                            {evaluation.verdict === 'fail' && (
                              <span className="px-3.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-rose-600" /> ❌ Not Relevant / Insufficient ({evaluation.score}/100)
                              </span>
                            )}
                          </div>

                          {evaluation.verdict !== 'pass' && attempts < 3 && (
                            <button
                              onClick={() => handleInlineRetry(qId)}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Try Again ({3 - attempts} left)
                            </button>
                          )}
                        </div>

                        {/* Recruiter Feedback */}
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <strong className="text-slate-900 dark:text-white block mb-0.5">Recruiter Agent Feedback:</strong>
                          {evaluation.feedback}
                        </div>

                        {/* Concept Coverage Checklist */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                            Concept Coverage Checklist:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(evaluation.conceptsCovered || []).map((c, i) => (
                              <span key={i} className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-[11px] font-bold rounded-md flex items-center gap-1">
                                ✅ {c}
                              </span>
                            ))}
                            {(evaluation.conceptsMissing || []).map((c, i) => (
                              <span key={i} className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 text-[11px] font-bold rounded-md flex items-center gap-1">
                                ⭕ {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Benchmark Answer Expandable */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> High-Scoring Benchmark Answer:
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                        {q.suggestedAnswer}
                      </p>
                    </div>

                    {q.starGuide && (
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                        <h4 className="font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider">
                          STAR Framework Answer Structure:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <div><strong className="text-slate-900 dark:text-white">S - Situation:</strong> {q.starGuide.situation}</div>
                          <div><strong className="text-slate-900 dark:text-white">T - Task:</strong> {q.starGuide.task}</div>
                          <div><strong className="text-slate-900 dark:text-white">A - Action:</strong> {q.starGuide.action}</div>
                          <div><strong className="text-slate-900 dark:text-white">R - Result:</strong> {q.starGuide.result}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                  className="text-xs text-slate-500 hover:text-blue-900 dark:hover:text-blue-400 flex items-center gap-1 transition-colors font-bold"
                >
                  {isExpanded ? (
                    <>Hide Benchmark Answer <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Reveal Suggested Answer & STAR Breakdown <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>

              </div>
            );
          })
        )}
      </div>

      {/* END-OF-SESSION PRACTICE SUMMARY BANNER */}
      {completedQuestionIds.length > 0 && (() => {
        const passedCount = completedQuestionIds.length;
        const totalSessionCount = interviewSet.questions.length;
        const passPercent = Math.round((passedCount / totalSessionCount) * 100);

        // Find weakest category based on evaluations
        const categoryCounts = {};
        Object.values(inlineEvaluations).forEach(ev => {
          if (ev.verdict !== 'pass') {
            const cat = ev.category || 'System Design';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        });

        let weakestCategory = 'System Design';
        let maxFails = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > maxFails) {
            maxFails = count;
            weakestCategory = cat;
          }
        });

        return (
          <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-blue-950 text-white shadow-xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Practice Progress Summary: {passedCount} of {totalSessionCount} Questions Passed
              </h3>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-black border border-emerald-500/40 shrink-0">
                {passPercent}% Drive Readiness
              </span>
            </div>

            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              💡 <strong>Recruiter Recommendation for {activeDrive.company_name}</strong>: You have passed {passedCount} of {totalSessionCount} placement questions. Your weakest category is <strong>{weakestCategory}</strong>. Focus on practicing {weakestCategory} concepts before your live {activeDrive.title} placement drive!
            </p>
          </div>
        );
      })()}

      {practiceQuestion && (
        <PracticeModeModal
          question={practiceQuestion}
          onClose={() => setPracticeQuestion(null)}
          onQuestionCompleted={handleQuestionCompleted}
        />
      )}

      {showUploadModal && (
        <CompanyQuestionUploadModal
          onClose={() => setShowUploadModal(false)}
          onSaveQuestion={handleSaveQuestion}
          onBulkUpload={handleBulkUpload}
          uploadedQuestions={uploadedCompanyQuestions}
          onDeleteQuestion={handleDeleteQuestion}
        />
      )}

    </div>
  );
}
