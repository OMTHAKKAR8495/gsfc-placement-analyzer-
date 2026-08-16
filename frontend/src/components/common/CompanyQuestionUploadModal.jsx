import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, Building2, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompanyQuestionUploadModal({
  onClose,
  onSaveQuestion,
  onBulkUpload,
  uploadedQuestions = [],
  onDeleteQuestion
}) {
  const [activeTab, setActiveTab] = useState('single');
  const [successMsg, setSuccessMsg] = useState('');

  const [companyName, setCompanyName] = useState('GSFC University Placement Cell');
  const [roleTitle, setRoleTitle] = useState('Full Stack Developer');
  const [projectTopic, setProjectTopic] = useState('React & Node.js Web Application');
  const [category, setCategory] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionText, setQuestionText] = useState('');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [keyPointsInput, setKeyPointsInput] = useState('');
  
  const [starSituation, setStarSituation] = useState('');
  const [starTask, setStarTask] = useState('');
  const [starAction, setStarAction] = useState('');
  const [starResult, setStarResult] = useState('');

  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim() || !questionText.trim()) return;

    const keyPoints = keyPointsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const hasStar = starSituation || starTask || starAction || starResult;

    onSaveQuestion({
      companyName: companyName.trim(),
      roleTitle: roleTitle.trim() || 'Software Engineer',
      projectTopic: projectTopic.trim() || 'Software Architecture',
      category,
      difficulty,
      question: questionText.trim(),
      suggestedAnswer: suggestedAnswer.trim() || 'Focus on step-by-step problem breakdown, clean architecture, and quantifiable outcomes.',
      keyPointsToInclude: keyPoints.length > 0 ? keyPoints : ['Problem analysis', 'System optimization', 'Best practice implementation'],
      starGuide: hasStar ? {
        situation: starSituation.trim() || 'Faced a critical operational or technical requirement.',
        task: starTask.trim() || 'Tasked with engineering a scalable and resilient solution.',
        action: starAction.trim() || 'Implemented core components, unit tests, and performance monitoring.',
        result: starResult.trim() || 'Achieved improved efficiency and verified stability in production.'
      } : undefined
    });

    setSuccessMsg('Question successfully uploaded by ' + companyName + '!');
    setQuestionText('');
    setSuggestedAnswer('');
    setKeyPointsInput('');
    setStarSituation('');
    setStarTask('');
    setStarAction('');
    setStarResult('');

    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleLoadSampleJson = () => {
    const sample = [
      {
        companyName: 'GSFC Placement Cell',
        roleTitle: 'Full Stack Engineer',
        projectTopic: 'React & Microservices',
        category: 'Technical',
        difficulty: 'Hard',
        question: 'Explain how you structured real-time data sync and state management in your full-stack project.',
        suggestedAnswer: 'Used WebSockets for instant events and TanStack Query for state caching.',
        keyPointsToInclude: ['WebSocket pub/sub', 'TanStack Query', 'Optimistic UI']
      }
    ];
    setJsonText(JSON.stringify(sample, null, 2));
    setJsonError('');
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON must be an array of question objects.');
        return;
      }
      onBulkUpload(parsed);
      setSuccessMsg('Successfully bulk uploaded ' + parsed.length + ' company questions!');
      setJsonText('');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setJsonError('Invalid JSON format: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900/10 text-blue-900 dark:text-blue-400 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Upload GSFC Company Interview Questions
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-700">
                  Recruiter Portal
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frame questions around company requirements & student project topics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('single')}
            className={'px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ' + (
              activeTab === 'single'
                ? 'border-blue-900 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Plus className="w-3.5 h-3.5" /> Single Question Upload
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={'px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ' + (
              activeTab === 'bulk'
                ? 'border-blue-900 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Upload className="w-3.5 h-3.5" /> Bulk JSON Upload
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={'px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ' + (
              activeTab === 'manage'
                ? 'border-blue-900 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Manage Questions ({uploadedQuestions.length})
          </button>
        </div>

        {/* Notification banner */}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. GSFC University Placement Cell, Google Cloud India"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Job Role Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    placeholder="e.g. Full Stack Developer, Software Engineer"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Topic / Tech Stack</label>
                  <input
                    type="text"
                    value={projectTopic}
                    onChange={e => setProjectTopic(e.target.value)}
                    placeholder="e.g. React & WebSockets, Node.js API"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                  >
                    <option value="Technical">Technical</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="HR / Culture">HR / Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Interview Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="e.g. In your web project built with React & Node.js, how did you structure state synchronization?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" /> Suggested Benchmark Answer
                </label>
                <textarea
                  rows={4}
                  value={suggestedAnswer}
                  onChange={e => setSuggestedAnswer(e.target.value)}
                  placeholder="Provide the high-scoring answer candidates should target..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Key Concepts & Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={keyPointsInput}
                  onChange={e => setKeyPointsInput(e.target.value)}
                  placeholder="e.g. State caching, WebSockets pub/sub, Optimistic UI updates"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" /> Upload Company Question
                </button>
              </div>

            </form>
          )}

          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400">Paste a JSON array of interview questions uploaded by your company.</p>
                <button
                  type="button"
                  onClick={handleLoadSampleJson}
                  className="text-xs text-blue-900 dark:text-blue-400 underline hover:opacity-80 font-bold"
                >
                  Load Sample JSON Format
                </button>
              </div>

              {jsonError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <textarea
                rows={10}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='[ {"companyName": "GSFC Placement Cell", "question": "..." } ]'
                className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-blue-900"
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" disabled={!jsonText.trim()} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white font-black flex items-center gap-2 shadow-lg disabled:opacity-50">
                  <Upload className="w-4 h-4" /> Import Bulk Questions
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Manage company-uploaded interview question bank ({uploadedQuestions.length} total questions available).</p>
              <div className="space-y-3">
                {uploadedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-black bg-blue-900/10 text-blue-900 dark:text-blue-400 rounded border border-blue-900/20">{q.companyName || 'Company Uploaded'}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">{q.projectTopic || q.category}</span>
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white">{q.question}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{q.suggestedAnswer}</p>
                    </div>
                    {q.id && q.id.startsWith('user-co-q') && (
                      <button onClick={() => onDeleteQuestion(q.id)} className="text-rose-500 hover:text-rose-600 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
