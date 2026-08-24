import React, { useState, useEffect } from 'react';
import { 
  Trophy, Medal, Award, Flame, Shield, User, Filter, RefreshCw, 
  Sparkles, Eye, EyeOff, Check, ChevronRight, Zap, Target, Star 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function LeaderboardTab({ currentStudent, onOpenBadgesModal }) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [nickname, setNickname] = useState('');
  const [summary, setSummary] = useState(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const studentId = currentStudent?.id || currentStudent?.user_id || 's_candidate';

  useEffect(() => {
    fetchLeaderboard();
    fetchSummary();
  }, [department, year, studentId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?department=${department}&year=${year}`);
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/gamification/summary/${studentId}`);
      const data = await res.json();
      if (data) {
        setSummary(data);
        setIsAnonymous(data.is_anonymous);
        setNickname(data.nickname || '');
      }
    } catch (e) {
      console.error('Error fetching gamification summary:', e);
    }
  };

  const handleToggleAnonymity = async () => {
    setSavingPrivacy(true);
    const newAnonState = !isAnonymous;
    try {
      const res = await fetch('/api/gamification/toggle-anonymity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          isAnonymous: newAnonState,
          nickname
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAnonymous(newAnonState);
        showToast(data.message || 'Privacy preference saved!', 'success');
        fetchLeaderboard();
      } else {
        showToast(data.error || 'Failed to update privacy settings', 'error');
      }
    } catch (err) {
      showToast('Network error saving privacy: ' + err.message, 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Student's Rank & Level Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-700/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shadow-amber-500/20">
              #{summary?.rank || 1}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-lg border-2 border-slate-900 shadow">
              <Trophy className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                Level {summary?.level || 1} • {summary?.level_title || 'Campus Candidate'}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-800/40">
                <Flame className="w-3.5 h-3.5 fill-orange-400" /> {summary?.current_streak || 3} Day Streak
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isAnonymous ? `🎭 ${nickname || 'Anonymous Candidate'}` : (summary?.student_name || currentStudent?.name || 'Om Thakkar')}
            </h2>
            
            <p className="text-xs text-blue-200/80">
              Total Points: <strong className="text-white text-sm font-black">{summary?.points_total || 450} Pts</strong> • Top 5% of Department
            </p>
          </div>
        </div>

        {/* Action Buttons & Badges Showcase */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={onOpenBadgesModal}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <Medal className="w-4 h-4 text-amber-300" />
            View Badges ({summary?.badges?.length || 2})
          </button>

          <button
            onClick={handleToggleAnonymity}
            disabled={savingPrivacy}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              isAnonymous 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAnonymous ? <EyeOff className="w-4 h-4 text-amber-300" /> : <Eye className="w-4 h-4 text-slate-400" />}
            {isAnonymous ? 'Anonymous Mode: ON' : 'Make Me Anonymous'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4" /> Filter:
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="Chemical">Chemical Engineering</option>
            <option value="Mechanical">Mechanical Engineering</option>
            <option value="IT">Information Technology</option>
            <option value="MBA">Management (MBA)</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Batches</option>
            <option value="2026">Class of 2026</option>
            <option value="2025">Class of 2025</option>
            <option value="2027">Class of 2027</option>
          </select>
        </div>

        <button
          onClick={fetchLeaderboard}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">CGPA</th>
                <th className="px-6 py-4">ATS Match</th>
                <th className="px-6 py-4">Badges</th>
                <th className="px-6 py-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((item) => {
                const isCurrentStudent = item.student_id === studentId;
                return (
                  <tr 
                    key={item.student_id}
                    className={`transition-colors ${
                      isCurrentStudent 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-6 py-4 font-black">
                      {item.rank === 1 && <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">🥇</span>}
                      {item.rank === 2 && <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black shadow-xs">🥈</span>}
                      {item.rank === 3 && <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black shadow-xs">🥉</span>}
                      {item.rank > 3 && <span className="text-slate-500 font-mono text-sm">#{item.rank}</span>}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                          {item.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {item.display_name}
                            {isCurrentStudent && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-blue-600 text-white rounded-md uppercase tracking-wider font-black">
                                You
                              </span>
                            )}
                            {item.is_anonymous && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-bold">
                                Avatar
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.roll_number}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.program}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.cgpa}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {item.ats_score}%
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> {item.badge_count} Badges
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {item.points_total} pts
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Level {item.level}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
