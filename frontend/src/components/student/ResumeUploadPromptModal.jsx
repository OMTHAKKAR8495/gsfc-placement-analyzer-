import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, Sparkles, CheckCircle2, 
  Building2, TrendingUp, ShieldCheck, ArrowRight, 
  Loader2, AlertCircle, Award, Target
} from 'lucide-react';

export default function ResumeUploadPromptModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  requirements = [], 
  onUploadSuccess,
  onOpenBuilder
}) {
  const [selectedReqId, setSelectedReqId] = useState(requirements[0]?.id || 'req_google_swe');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const targetReq = requirements.find(r => r.id === selectedReqId) || requirements[0];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a valid PDF document (.pdf).');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a valid PDF document (.pdf).');
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select or drop your resume PDF first.');
      return;
    }

    setUploading(true);
    setError('');

    const studentId = currentUser?.profile?.id || currentUser?.owner_id || currentUser?.id || 's_arav';

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('student_id', studentId);
      if (targetReq?.id) {
        formData.append('target_requirement_id', targetReq.id);
      }

      const res = await fetch('/api/student/resume/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload and analyze resume.');

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>AI Placement Readiness & ATS Booster</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
            Welcome, {currentUser?.name || currentUser?.profile?.name || 'Candidate'}! Check Your Recruiter Match & ATS Score
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Upload your resume to benchmark your profile directly against live campus requirements from top recruiters and get instant AI recommendations.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Recruiter Drive Selector */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Target Recruiter Drive to Benchmark:</span>
            </span>
            {targetReq && (
              <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                {targetReq.ctc_range}
              </span>
            )}
          </label>

          <select
            value={selectedReqId}
            onChange={(e) => setSelectedReqId(e.target.value)}
            disabled={uploading}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm cursor-pointer"
          >
            {requirements.map(req => (
              <option key={req.id} value={req.id}>
                {req.company_name} — {req.title} (Min CGPA: {req.min_cgpa})
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 scale-[1.01]'
              : file
              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-md">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 font-bold">
                  {(file.size / 1024).toFixed(1)} KB • Ready for AI ATS Evaluation
                </p>
              </div>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                Click or drop another file to change
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-md">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Drag & Drop Resume PDF here, or <span className="text-blue-600 underline">Browse</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  Supports PDF format (.pdf) up to 10 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 Don't have a resume? Create & Build One Now Option */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Don't have a resume? Build one from scratch
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                Fill details & upload your Marksheets, Certifications & Student ID files.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenBuilder) onOpenBuilder();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
          >
            <span>Create Resume Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Pillars Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
              <Target className="w-3.5 h-3.5" />
              <span>Skill Gaps</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
              Identifies missing keywords required by {targetReq?.company_name || 'recruiters'}.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
              <Award className="w-3.5 h-3.5" />
              <span>100-Pt ATS Score</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
              Evaluates section layout, project depth, and keyword density.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CGPA Eligibility</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
              Verifies instant qualification for high-package drives.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            I'll Do This Later
          </button>

          <button
            type="button"
            onClick={handleUploadAndAnalyze}
            disabled={uploading || !file}
            className="px-6 py-3 bg-theme-gradient hover:opacity-90 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Resume with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Upload & Calculate ATS Score</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
