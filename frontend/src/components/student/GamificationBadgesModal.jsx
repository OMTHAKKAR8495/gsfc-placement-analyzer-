import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Award, Medal, Trophy, Sparkles, CheckCircle2, Lock, 
  Flame, TrendingUp, Star, Zap, Clock, ShieldCheck, FileText, Send, Cpu, Compass, MessageSquare 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function GamificationBadgesModal({ isOpen, onClose, studentId }) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('badges'); // 'badges' | 'history'

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, studentId]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/summary/${studentId || 's_candidate'}`);
      const data = await res.json();
      if (data) {
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
              🏆
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                Career Achievement Hub
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                {summary?.student_name || 'Candidate'} Achievements
              </h2>
              <div className="text-xs text-blue-200 mt-0.5">
                Level {summary?.level || 1}: <strong>{summary?.level_title}</strong> • {summary?.points_total || 0} Total Career Points
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-blue-200">
              <span>Level {summary?.level} Progress</span>
              <span>{summary?.progress_pct || 50}% to Level {(summary?.level || 1) + 1}</span>
            </div>
            <div className="h-2 w-full bg-blue-950/80 rounded-full overflow-hidden border border-blue-800/40">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${summary?.progress_pct || 50}%` }}
              />
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveSubTab('badges')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'badges' ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              🏅 Badges Catalog ({summary?.badges?.length || 0} Unlocked)
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'history' ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              📜 Points Activity Log
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeSubTab === 'badges' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {summary?.badge_catalog?.map((badge) => (
                <div
                  key={badge.badge_code}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    badge.is_unlocked
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold ${
                    badge.is_unlocked ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {badge.is_unlocked ? '⭐' : <Lock className="w-5 h-5 text-slate-400" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                        {badge.badge_name}
                      </h4>
                      {badge.is_unlocked && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {badge.badge_desc}
                    </p>
                    <div className="text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400">
                      +{badge.points_reward} Career Pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary?.recent_logs?.length > 0 ? (
                summary.recent_logs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.description}</div>
                        <div className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                      +{log.points_awarded} pts
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No points activity logged yet. Complete mock interviews or apply to drives to earn points!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
