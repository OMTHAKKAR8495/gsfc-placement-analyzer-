import React from 'react';
import { X, Download, Printer, CheckCircle, AlertCircle, Award, Sparkles, FileText } from 'lucide-react';

export default function ReportPDFModal({ isOpen, onClose, candidateData }) {
  if (!isOpen || !candidateData) return null;

  const candidateName = candidateData.name || 'THAKKAR OM';
  const email = candidateData.email || 'thakkar_om@gmail.com';
  const atsScore = candidateData.atsScore || 92;
  const isPass = atsScore >= 70;
  const skills = candidateData.skills || ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Print Controls Bar (Hidden during actual PDF print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="py-2.5 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Download / Print PDF Report
        </button>
        <button
          onClick={onClose}
          className="p-2.5 bg-white text-slate-700 hover:text-slate-900 rounded-xl shadow-lg border border-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 1-Page Printable Report Document (Exact Reference Layout) */}
      <div id="printable-evaluation-report" className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900 border border-slate-200 my-8 print:my-0 print:shadow-none print:border-none print:w-full">
        
        {/* REPORT HEADER BANNER */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-blue-400">
              GSFC AI - RESUME EVALUATION REPORT
            </h1>
            <span className="text-[10px] text-slate-400 font-mono border border-slate-700 px-2 py-0.5 rounded">
              REF ID: GSFC-AI-{Date.now().toString().slice(-6)}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
            CANDIDATE NAME: {candidateName.toUpperCase()}
          </h2>
          <div className="text-xs text-slate-300 font-bold flex flex-wrap gap-4 pt-1 border-t border-slate-800">
            <span>Email: <strong className="text-white">{email}</strong></span>
            <span>Title: <strong className="text-white">Software & Tech Professional</strong></span>
            <span>Date: <strong className="text-white">{new Date().toLocaleDateString('en-GB')}</strong></span>
          </div>
        </div>

        {/* REPORT BODY CONTENT */}
        <div className="p-6 sm:p-8 space-y-6 text-xs font-semibold leading-relaxed">
          
          {/* SECTION 1: CANDIDATE METRICS & SKILLS */}
          <div className="space-y-2 pb-4 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              1. CANDIDATE METRICS & SKILLS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
              <div>• Title: <strong className="text-slate-900 font-black">Software & Tech Professional</strong></div>
              <div>• Experience Level: <strong className="text-slate-900 font-black">~1 Years</strong></div>
              <div>• Words Scanned: <strong className="text-slate-900 font-black">879 words</strong></div>
              <div>• Technical Keywords: <strong className="text-slate-900 font-black">{skills.length} skills extracted</strong></div>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 font-bold">• Extracted Skills: </span>
              <span className="font-black text-blue-900">{skills.join(', ')}</span>
            </div>
          </div>

          {/* SECTION 2: ATS SCORE AUDIT */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                2. ATS SCORE AUDIT: <span className="text-blue-900">{atsScore} / 100</span>
              </h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded ${isPass ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                {isPass ? 'High Fit' : 'Optimization Needed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>• Technical Keyword Density: <strong className="font-black">88%</strong></div>
              <div>• Section Formatting & Structure: <strong className="font-black">90%</strong></div>
              <div>• Action Verbs & Impact Metrics: <strong className="font-black">75%</strong></div>
              <div>• Contact Completeness: <strong className="font-black">100%</strong></div>
            </div>

            <div className="space-y-1 text-slate-800">
              <div><strong className="font-black text-slate-900">Key Strengths:</strong> Includes verified technical keywords, structured education metadata, and clear contact information.</div>
              <div><strong className="font-black text-slate-900">Action Items:</strong> Include more explicit project impact metrics (e.g. "Reduced API query latency by 35%").</div>
            </div>
          </div>

          {/* SECTION 3: COMPANY JOB MATCH & ELIGIBILITY MATRIX */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              3. COMPANY JOB MATCH & ELIGIBILITY MATRIX
            </h3>

            {/* Role 1 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-black text-xs">
                <span className="text-blue-900">#1 Software Development Engineer — AI & Cloud (Google Cloud India)</span>
                <span className="text-emerald-800 font-black">85% Fit</span>
              </div>
              <div className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                DECISION: PASS (ELIGIBLE) <span className="text-slate-500 font-normal">| Degree: BTech CSE | Min CGPA: 7.5</span>
              </div>
              <div className="text-[11px] text-slate-700">
                <span className="font-bold text-slate-900">Matching Skills:</span> Python, React, SQL, Cloud Architecture
              </div>
            </div>

            {/* Role 2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-black text-xs">
                <span className="text-blue-900">#2 Graduate Software Engineer (Microsoft Azure)</span>
                <span className="text-emerald-800 font-black">78% Fit</span>
              </div>
              <div className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                DECISION: PASS (ELIGIBLE) <span className="text-slate-500 font-normal">| Degree: BTech CSE | Min CGPA: 8.0</span>
              </div>
              <div className="text-[11px] text-slate-700">
                <span className="font-bold text-slate-900">Matching Skills:</span> Node.js, PostgreSQL, Data Structures
              </div>
            </div>
          </div>

          {/* SECTION 4: FINAL SELECTION RESULT BOX */}
          <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              FINAL SELECTION RESULT FOR CANDIDATE: {candidateName.toUpperCase()}
            </div>
            <div className={`text-base sm:text-lg font-black ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
              FINAL RESULT: {isPass ? 'PASS (ELIGIBLE FOR PLACEMENT ROUNDS)' : 'FAIL (NOT YET ELIGIBLE)'}
            </div>
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              Summary: Candidate {candidateName} fulfills core foundational academic cutoffs and technical skill matrices. Recommended for corporate placement rounds with targeted on-the-job training.
            </p>
          </div>

        </div>

        {/* REPORT FOOTER */}
        <div className="p-4 bg-slate-100 text-center text-[10px] font-bold text-slate-600 border-t border-slate-200">
          GSFC University Training & Placement Cell (TPC) • Official Automated AI Placement Evaluation Report
        </div>
      </div>
    </div>
  );
}
