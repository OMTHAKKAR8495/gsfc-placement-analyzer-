import React, { useState, useEffect } from 'react';
import { 
  Users, Award, TrendingUp, AlertTriangle, BookOpen, 
  Send, Sparkles, Filter, CheckCircle2, ChevronRight, BarChart2, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function FacultyDashboard({ currentUser }) {
  const [department, setDepartment] = useState('BTech CSE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignedSuccessMsg, setAssignedSuccessMsg] = useState('');

  const fetchFacultyAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/department-analytics?department=${encodeURIComponent(department)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching faculty analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyAnalytics();
  }, [department]);

  const handleAssignTraining = async (student) => {
    try {
      const res = await fetch('/api/faculty/assign-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          trainingModule: '14-Day DSA & Resume Sprint',
          deadlineDays: 14
        })
      });
      const resData = await res.json();
      setAssignedSuccessMsg(resData.message);
      setTimeout(() => setAssignedSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error assigning training:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Faculty Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-black uppercase">
              Faculty & HOD Intelligence Portal
            </span>
            <span className="text-[10px] text-slate-300 font-mono">Academic Cohort 2026-2027</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Departmental Placement Analytics & Remedial Hub
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            Monitor batch placement readiness, evaluate academic-to-recruitment conversion rates, and assign targeted remedial training sprints to at-risk students.
          </p>
        </div>

        {/* Department Switcher */}
        <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 flex items-center gap-1 shrink-0">
          {['BTech CSE', 'Chemical', 'Mechanical', 'Fire & Safety'].map(dept => (
            <button
              key={dept}
              onClick={() => setDepartment(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                department === dept ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {assignedSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-md animate-bounce">
          {assignedSuccessMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Department Students</div>
          <div className="text-2xl font-black text-blue-900 dark:text-blue-400">{data?.total_students || 18}</div>
          <div className="text-[10px] text-slate-500">Tracked in Cohort</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Batch Avg CGPA</div>
          <div className="text-2xl font-black text-emerald-600">{data?.avg_cgpa || '8.75'} / 10</div>
          <div className="text-[10px] text-slate-500">Academic Average</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Average ATS Score</div>
          <div className="text-2xl font-black text-indigo-600">{data?.avg_ats_score || '89.2'}%</div>
          <div className="text-[10px] text-slate-500">Resume Compliance</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Placement Conversion</div>
          <div className="text-2xl font-black text-amber-500">{data?.placement_conversion_rate || '93.5'}%</div>
          <div className="text-[10px] text-slate-500">High Conversion</div>
        </div>
      </div>

      {/* Student Roster & Remedial Assignment Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md space-y-3 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Department Student Roster & 1-Click Remedial Intervention</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">{department}</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Program</th>
                <th className="p-3 text-center">CGPA</th>
                <th className="p-3 text-center">ATS Score</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.students?.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold">{s.roll_number || '21BCE001'}</td>
                  <td className="p-3 font-black text-slate-900 dark:text-white">{s.name}</td>
                  <td className="p-3 text-slate-500">{s.program}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{s.cgpa}</td>
                  <td className="p-3 text-center font-black text-blue-600">{s.ats_score || 88}%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                      ELIGIBLE
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleAssignTraining(s)}
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer shadow-xs"
                    >
                      Assign Training
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
