import React, { useState } from 'react';
import { Plus, Trash2, Upload, FileText, CheckCircle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function RequirementQuestionBankForm({ questions = [], onChangeQuestions }) {
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'upload'
  const [dragOver, setDragOver] = useState(false);

  // Manual Question Fields State
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('Technical');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newSkillTags, setNewSkillTags] = useState('Python, React');

  const categories = ['Technical', 'DSA', 'System Design', 'HR', 'Behavioral', 'Role-Specific'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newQ = {
      id: `q_recruiter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newText.trim(),
      category: newCategory,
      difficulty: newDifficulty,
      skillTags: newSkillTags.split(',').map(s => s.trim()).filter(Boolean),
      source: 'recruiter',
      createdAt: new Date().toISOString()
    };

    onChangeQuestions([...questions, newQ]);
    setNewText('');
  };

  const handleDeleteQuestion = (idx) => {
    const updated = questions.filter((_, i) => i !== idx);
    onChangeQuestions(updated);
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      
      const parsedQuestions = lines.map((line, i) => {
        // Simple CSV split check (text, category, difficulty, skills)
        const parts = line.split(',');
        let qText = line;
        let qCat = 'Role-Specific';
        let qDiff = 'Medium';
        let qSkills = ['Python', 'SQL'];

        if (parts.length >= 2) {
          qText = parts[0].replace(/^["']|["']$/g, '').trim();
          const matchCat = categories.find(c => c.toLowerCase() === parts[1].trim().toLowerCase());
          if (matchCat) qCat = matchCat;
        }

        return {
          id: `q_uploaded_${Date.now()}_${i}`,
          text: qText,
          category: qCat,
          difficulty: qDiff,
          skillTags: qSkills,
          source: 'recruiter',
          createdAt: new Date().toISOString()
        };
      });

      onChangeQuestions([...questions, ...parsedQuestions]);
    };

    reader.readAsText(file);
  };

  const isMinMet = questions.length >= 5;

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Mandatory Company Interview Question Bank *
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
            Job drives require at least 5 interview questions to publish for student practice.
          </p>
        </div>

        {/* Live Question Counter Badge */}
        <div className={`px-3 py-1 text-xs font-black rounded-xl border flex items-center gap-1.5 shrink-0 ${
          isMinMet
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
        }`}>
          {isMinMet ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
          <span>{questions.length} of 5 Minimum Questions Added</span>
        </div>
      </div>

      {/* Mode Selector Toggle: Manual vs File Upload */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
            inputMode === 'manual'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          ✍️ Manual Input Rows
        </button>
        <button
          type="button"
          onClick={() => setInputMode('upload')}
          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
            inputMode === 'upload'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          📂 Bulk File Upload (.csv, .txt, .pdf, .docx)
        </button>
      </div>

      {/* MODE 1: MANUAL INPUT FORM */}
      {inputMode === 'manual' && (
        <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Interview Question Text *</label>
              <input
                type="text"
                placeholder="e.g. How do you optimize query latency in PostgreSQL under high traffic?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Skill Tags (Comma separated)</label>
              <input
                type="text"
                value={newSkillTags}
                onChange={(e) => setNewSkillTags(e.target.value)}
                placeholder="Python, SQL, React"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: FILE UPLOAD DROPZONE */}
      {inputMode === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all bg-white dark:bg-slate-900 ${
            dragOver ? 'border-blue-900 bg-blue-50/50' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <Upload className="w-8 h-8 text-blue-900 dark:text-blue-400 mx-auto mb-2" />
          <div className="text-xs font-black text-slate-900 dark:text-slate-100">
            Drag & drop company question file here or click to browse
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">
            Supports .csv, .xlsx, .docx, .pdf, .txt format
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.docx,.pdf,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="req-q-file-input"
          />
          <label
            htmlFor="req-q-file-input"
            className="mt-3 inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            Select File from Device
          </label>
        </div>
      )}

      {/* ADDED QUESTIONS LIST */}
      {questions.length > 0 && (
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
            Added Interview Questions ({questions.length})
          </div>
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-slate-100">{q.text}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-extrabold">
                  <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded">{q.category}</span>
                  <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded">{q.difficulty}</span>
                  <span>Skills: {(q.skillTags || []).join(', ')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteQuestion(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
