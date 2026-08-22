import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Layers, Filter, Sparkles, BookOpen, AlertTriangle, 
  CheckCircle2, ArrowRight, BarChart2, Zap
} from 'lucide-react';

export default function SkillHeatmapModal({ isOpen, onClose }) {
  const [department, setDepartment] = useState('ALL');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/intelligence/skill-heatmap?department=${department}`);
      const data = await res.json();
      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching skill heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHeatmap();
    }
  }, [isOpen, department]);

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
              <Layers className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Academic Intelligence
                </span>
                <span className="text-[10px] text-slate-300 font-mono">Institutional Skill Gap Diagnostic</span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                University-Wide Skill Gap Heatmap
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

        {/* Filter Strip */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Departments' },
              { id: 'CSE', label: 'BTech CSE & IT' },
              { id: 'Chemical', label: 'BTech Chemical' },
              { id: 'Mechanical', label: 'BTech Mechanical' },
              { id: 'FireSafety', label: 'BTech Fire & Safety' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDepartment(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  department === tab.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
            {heatmapData?.skills?.length || 8} Technical Domains Evaluated
          </span>
        </div>

        {/* Heatmap Grid Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {heatmapData?.skills?.map((item, idx) => {
              const isStrong = item.tier === 'STRONG';
              const isCritical = item.tier === 'CRITICAL';

              return (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {item.skill}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      isStrong
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : isCritical
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {item.tier}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Student Cohort Proficiency</span>
                      <span className="font-black text-slate-900 dark:text-white">{item.proficiency_pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isStrong ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.proficiency_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div>✅ {item.strong_count} High Readiness</div>
                    <div>⚠️ {item.weak_count} Require Remedial Training</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
