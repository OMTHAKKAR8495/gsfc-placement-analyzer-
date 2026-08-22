import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Sliders, TrendingUp, Sparkles, Building2, BookOpen, 
  Award, Play, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function WhatIfSimulatorModal({ isOpen, onClose }) {
  const [dsaStudents, setDsaStudents] = useState(150);
  const [companyIncrease, setCompanyIncrease] = useState(20);
  const [interviewImprovement, setInterviewImprovement] = useState(15);
  const [workshopsCount, setWorkshopsCount] = useState(4);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dsaTrainingStudents: dsaStudents,
          companyParticipationIncreasePct: companyIncrease,
          interviewScoreImprovementPct: interviewImprovement,
          softSkillsWorkshopsCount: workshopsCount
        })
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error('Error running what-if simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen, dsaStudents, companyIncrease, interviewImprovement, workshopsCount]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 top-[4.25rem] z-40 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[calc(100vh-5.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-black shadow-inner">
              <Sliders className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                  TPO Strategy Engine
                </span>
                <span className="text-[10px] text-slate-300 font-mono">Statistical Regression Model</span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                Placement "What-If" Scenario Simulator
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                  DSA Training Enrollment
                </label>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded font-mono font-black text-xs">
                  {dsaStudents} Students
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={dsaStudents}
                onChange={(e) => setDsaStudents(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-900"
              />
              <span className="text-[10px] text-slate-400">Impact: +2.8% conversion lift per 100 students</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Company Drive Participation
                </label>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded font-mono font-black text-xs">
                  +{companyIncrease}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={companyIncrease}
                onChange={(e) => setCompanyIncrease(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400">Impact: Expands placement capacity & CTC ceiling</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Interview Performance Boost
                </label>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 rounded font-mono font-black text-xs">
                  +{interviewImprovement}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={interviewImprovement}
                onChange={(e) => setInterviewImprovement(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-[10px] text-slate-400">Impact: STAR Rubric & Voice coaching effectiveness</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Soft Skills & Aptitude Bootcamps
                </label>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded font-mono font-black text-xs">
                  {workshopsCount} Workshops
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={workshopsCount}
                onChange={(e) => setWorkshopsCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400">Impact: Reduces Day-1 rejection rate</span>
            </div>
          </div>

          {/* Simulation Output Cards */}
          {simulation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400">Projected Placement %</div>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-300">
                    {simulation.projection?.projected_placement_rate}%
                  </div>
                  <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded text-[9px] font-black">
                    {simulation.projection?.placement_rate_lift_pct} Lift
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400">Projected Avg Package</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    ₹{simulation.projection?.projected_avg_ctc_lpa} LPA
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded text-[9px] font-black">
                    {simulation.projection?.ctc_growth_pct} CTC Growth
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400">Additional Offers</div>
                  <div className="text-2xl font-black text-purple-900 dark:text-purple-300">
                    +{simulation.projection?.additional_offers}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">Candidate Placements</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400">Model Confidence</div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {simulation.projection?.statistical_confidence_pct}%
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">Historical Validation</span>
                </div>
              </div>

              {/* Management Briefing Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="text-amber-400 font-black flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive Management Briefing</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium">
                  {simulation.management_summary}
                </p>
                <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                  ⚠️ {simulation.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
