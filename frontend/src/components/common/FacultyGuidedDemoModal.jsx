import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, 
  Building2, Users, FileText, Award, Play, ShieldCheck, Zap
} from 'lucide-react';

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Recruiter Creates Job Description',
    badge: 'Recruiter Portal',
    desc: 'Google Cloud India posts "Software Development Engineer — AI & Cloud Systems" offering ₹24.00 - ₹28.00 LPA.',
    actionPreview: 'JD Uploaded & Parsed by AI (Python, React, SQL, Cloud Architecture).'
  },
  {
    step: 2,
    title: 'AI Automatically Extracts Eligibility & Skills',
    badge: 'AI Engine',
    desc: 'Natural Language Processor maps criteria: Minimum 7.5 CGPA, Zero backlogs, BTech CSE/IT branches.',
    actionPreview: 'Eligibility rules generated without manual TPO entry.'
  },
  {
    step: 3,
    title: 'System Scans & Ranks All Eligible Students',
    badge: 'Matching Engine',
    desc: 'Matching engine queries 124,400+ student profiles across consortium with vector & skill weighting.',
    actionPreview: 'Found 18 eligible students with average ATS score of 91%.'
  },
  {
    step: 4,
    title: 'AI Computes Match Justifications',
    badge: 'AI Explainability',
    desc: 'Generates explainable rationale: "Candidate Rahul Verma matches 94% skills with 2 relevant full-stack projects."',
    actionPreview: 'Transparent confidence scores displayed for recruiter review.'
  },
  {
    step: 5,
    title: 'TPO Reviews & Approves Candidate Roster',
    badge: 'TPO Command Center',
    desc: 'Placement Officer reviews recommendations, verifies academic attendance, and unlocks WhatsApp broadcast.',
    actionPreview: '1-Click digital approval recorded in immutable audit log.'
  },
  {
    step: 6,
    title: 'Instant Multi-Channel Notification Dispatch',
    badge: 'Notification Engine',
    desc: 'Automated WhatsApp alert & Email dispatched with deep-link application portal URL.',
    actionPreview: 'Dispatched to 18 eligible students in 0.082ms.'
  },
  {
    step: 7,
    title: 'Students Complete Proctored Assessment',
    badge: 'Assessment Studio',
    desc: 'Candidates solve Systems MCQs and live Kadane algorithm coding challenge in browser sandbox.',
    actionPreview: 'Anti-cheat monitor records 98.5% integrity score with 0 tab switches.'
  },
  {
    step: 8,
    title: 'AI Voice & STAR Mock Interview',
    badge: 'Voice AI Studio',
    desc: 'Student speaks into microphone answering technical & behavioral questions evaluated on STAR rubric.',
    actionPreview: 'Speech clarity evaluated with 91/100 readiness score.'
  },
  {
    step: 9,
    title: 'Recruiter Conducts Final Technical Rounds',
    badge: 'Recruiter Portal',
    desc: 'Talent Acquisition team reviews proctored code solution, STAR transcript, and shortlists candidates.',
    actionPreview: '5 Candidates shortlisted for final management round.'
  },
  {
    step: 10,
    title: '1-Click Digital Offer Letter Generation',
    badge: 'Governance',
    desc: 'Formal signed and stamped university appointment letter generated with reference GSFC-TPC-OFFER.',
    actionPreview: 'Offer letter archived in verified student document dossier.'
  },
  {
    step: 11,
    title: 'Placement Conversion Analytics Update Live',
    badge: 'Analytics Cockpit',
    desc: 'Department placement rate recalculates automatically from 91.2% to 94.2%.',
    actionPreview: 'Average CTC metrics incremented across university dashboards.'
  },
  {
    step: 12,
    title: 'AI Generates Management & NIRF Reports',
    badge: 'AI Report Generator',
    desc: 'Executive briefing drafted with certified NAAC Criterion 5.2.1 and NIRF Parameter 3 CSV.',
    actionPreview: 'Certified A4 batch roster ready for Vice-Chancellor presentation.'
  },
  {
    step: 13,
    title: 'Post-Placement Alumni Mentorship Handoff',
    badge: 'Alumni Network',
    desc: 'Selected candidates automatically onboarded into alumni mentorship network for junior batch coaching.',
    actionPreview: 'Continuous peer-to-peer placement flywheel activated!'
  }
];

export default function FacultyGuidedDemoModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stepData = DEMO_STEPS[currentStep];

  const modalContent = (
    <div 
      className="fixed inset-0 top-[4.25rem] z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[calc(100vh-5.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-black shadow-inner">
              <Play className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                  DEMO SCENARIO MODE
                </span>
                <span className="text-[10px] text-slate-300 font-mono">13-Step Executive Flow</span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                Faculty & Leadership Guided Demonstration
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded-xl text-xs font-black">
              Step {stepData.step} of {DEMO_STEPS.length}: {stepData.badge}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Workflow Sequence
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {stepData.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {stepData.desc}
            </p>
          </div>

          {/* Action Simulation Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Execution Status</span>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              ⚡ {stepData.actionPreview}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <span className="text-xs font-black text-slate-400">
            {currentStep + 1} / {DEMO_STEPS.length}
          </span>

          <button
            onClick={() => {
              if (currentStep < DEMO_STEPS.length - 1) {
                setCurrentStep(prev => prev + 1);
              } else {
                onClose();
              }
            }}
            className="px-5 py-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>{currentStep === DEMO_STEPS.length - 1 ? 'Complete Demonstration' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
