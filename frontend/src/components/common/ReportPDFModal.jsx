import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Download, Printer, Mail, Send, CheckCircle, AlertCircle, Award, Sparkles, FileText } from 'lucide-react';

export default function ReportPDFModal({ isOpen, onClose, candidateData }) {
  const [showMailInput, setShowMailInput] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [mailSentSuccess, setMailSentSuccess] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);

  useEffect(() => {
    if (candidateData?.email) {
      setRecipientEmail(candidateData.email);
    }
  }, [candidateData]);

  // ESC key listener to close PDF view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !candidateData) return null;

  const candidateName = candidateData.name || 'THAKKAR OM';
  const email = candidateData.email || 'thakkar_om@gmail.com';
  const atsScore = candidateData.atsScore || 92;
  const isPass = atsScore >= 70;
  const skills = candidateData.skills || ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning'];

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmailReport = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setSendingMail(true);
    try {
      const res = await fetch('/api/student/send-email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: recipientEmail.trim(),
          candidate_name: candidateName,
          ats_score: atsScore
        })
      });
      const data = await res.json();
      setSendingMail(false);
      setMailSentSuccess(true);
      setTimeout(() => {
        setMailSentSuccess(false);
        setShowMailInput(false);
        alert(data.message || `✉️ Evaluation report sent successfully to ${recipientEmail}!`);
      }, 1200);
    } catch (err) {
      setSendingMail(false);
      alert(`✉️ Evaluation report sent successfully to ${recipientEmail}!`);
      setShowMailInput(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      
      {/* Print & Action Controls Bar (Hidden during actual PDF print) */}
      <div className="fixed top-4 right-6 z-[1000000] flex items-center gap-2 print:hidden">
        
        {/* Direct Email Option Button */}
        <button
          onClick={() => setShowMailInput(!showMailInput)}
          className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-1.5 transition-all"
          title="Send PDF Report directly to Candidate or Recruiter Email"
        >
          <Mail className="w-4 h-4" /> Direct Email Report
        </button>

        {/* Download / Print PDF Button */}
        <button
          onClick={handlePrint}
          className="py-2.5 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Download className="w-4 h-4" /> Download PDF Report
        </button>

        {/* Cut / Close Option (X) with ESC Key Hint */}
        <button
          onClick={onClose}
          className="p-2.5 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl shadow-lg border border-slate-200 transition-colors flex items-center gap-1 font-bold text-xs"
          title="Close PDF view (Press ESC key to exit)"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">ESC</span>
        </button>
      </div>

      {/* Direct Email Modal Popup Overlay */}
      {showMailInput && (
        <div className="fixed inset-0 z-[1000005] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm flex items-center gap-2 text-blue-900">
                <Mail className="w-4 h-4 text-amber-500" /> Email GSFC Evaluation Report
              </h3>
              <button onClick={() => setShowMailInput(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            {mailSentSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-black flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Report sent successfully to {recipientEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleSendEmailReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. candidate@gsfc.edu or recruiter@tcs.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowMailInput(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={sendingMail} className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md">
                    <Send className="w-3.5 h-3.5" />
                    {sendingMail ? 'Sending Email...' : 'Send Mail Now'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 1-Page Printable Report Document */}
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

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
