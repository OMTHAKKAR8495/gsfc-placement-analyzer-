import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Play,
  Building2,
  Layers,
  Filter,
  Tag,
  HelpCircle
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

  const handleQuestionCompleted = (qId) => {
    if (!completedQuestionIds.includes(qId)) {
      setCompletedQuestionIds(prev => [...prev, qId]);
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
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id || idx}
                className="glass-panel rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-4 hover:border-blue-900 transition-all shadow-sm"
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
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setPracticeQuestion(q)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white font-black text-xs shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 transition-transform"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Practice
                  </button>
                </div>

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
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
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
      {completedQuestionIds.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-blue-950 text-white shadow-xl space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> Practice Progress Summary: {completedQuestionIds.length} of {interviewSet.questions.length} Questions Passed
            </h3>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-black border border-emerald-500/40 shrink-0">
              {Math.round((completedQuestionIds.length / interviewSet.questions.length) * 100)}% Drive Mastery
            </span>
          </div>

          <p className="text-xs text-slate-300 font-bold leading-relaxed">
            💡 **Recruiter Recommendation for {activeDrive.company_name}**: Your technical answers on core principles are solid! Review **System Design & query latency optimization** before your live {activeDrive.title} placement drive.
          </p>
        </div>
      )}

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
