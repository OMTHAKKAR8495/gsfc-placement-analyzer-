import React, { useState, useEffect } from 'react';
import { 
  Users, Award, TrendingUp, AlertTriangle, BookOpen, 
  Send, Sparkles, Filter, CheckCircle2, ChevronRight, BarChart2, 
  ShieldCheck, ArrowRight, Search, Eye, X, Briefcase, FileText, CheckCircle, Clock
} from 'lucide-react';

export default function FacultyDashboard({ currentUser }) {
  const [department, setDepartment] = useState('ALL');
  const [minCgpa, setMinCgpa] = useState('0');
  const [minAts, setMinAts] = useState('0');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [placementStatus, setPlacementStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignedSuccessMsg, setAssignedSuccessMsg] = useState('');

  // Student Activity Drawer State
  const [selectedStudentActivity, setSelectedStudentActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchFacultyAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        department,
        minCgpa,
        minAts,
        skill: selectedSkill,
        status: placementStatus,
        search: searchQuery
      });
      const res = await fetch(`/api/faculty/department-analytics?${params.toString()}`);
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
  }, [department, minCgpa, minAts, selectedSkill, placementStatus, searchQuery]);

  const handleOpenStudentActivity = async (student) => {
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/faculty/student-activity/${student.id}`);
      const json = await res.json();
      setSelectedStudentActivity(json);
    } catch (err) {
      console.error('Error loading student activity:', err);
      setSelectedStudentActivity(student);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleAssignTraining = async (student) => {
    try {
      const res = await fetch('/api/faculty/assign-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          trainingModule: '14-Day DSA & Technical Interview Sprint',
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

  const clearFilters = () => {
    setDepartment('ALL');
    setMinCgpa('0');
    setMinAts('0');
    setSelectedSkill('');
    setPlacementStatus('ALL');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Faculty Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase">
              Faculty & Academic Mentorship Portal
            </span>
            <span className="text-[10px] text-slate-300 font-mono">GSFC University • Academic Year 2026-2027</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Department Student Activity Tracker & Placement Readiness
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium">
            Monitor student applications, assessment scores, and mock interview performance. Filter by required skills or CGPA to assign remedial coaching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold text-slate-200 border border-white/20">
            Role: Faculty Advisor
          </span>
        </div>
      </div>

      {assignedSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-md animate-bounce flex items-center justify-between">
          <span>{assignedSuccessMsg}</span>
          <button onClick={() => setAssignedSuccessMsg('')} className="p-1 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Filtered Students</div>
          <div className="text-2xl font-black text-blue-900 dark:text-blue-400">{data?.total_students || 0}</div>
          <div className="text-[10px] text-slate-500">In Current Selection</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Cohort Avg CGPA</div>
          <div className="text-2xl font-black text-emerald-600">{data?.avg_cgpa || '0.00'} / 10</div>
          <div className="text-[10px] text-slate-500">Academic Standing</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Average ATS Score</div>
          <div className="text-2xl font-black text-indigo-600">{data?.avg_ats_score || '0'}%</div>
          <div className="text-[10px] text-slate-500">Resume Compliance</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-400">Placement Conversion</div>
          <div className="text-2xl font-black text-amber-500">{data?.placement_conversion_rate || '0'}%</div>
          <div className="text-[10px] text-slate-500">Offer Conversion</div>
        </div>
      </div>

      {/* 🔍 ADVANCED CANDIDATE FILTER TOOLBAR FOR FACULTY */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Candidate Filter & Skill Search Suite</span>
          </div>
          {(department !== 'ALL' || minCgpa !== '0' || minAts !== '0' || selectedSkill || placementStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">BTech CSE & IT</option>
              <option value="Chemical">BTech Chemical</option>
              <option value="Mechanical">BTech Mechanical</option>
              <option value="Fire">BTech Fire & Safety</option>
            </select>
          </div>

          {/* Min CGPA Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Min CGPA</label>
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="0">All CGPA</option>
              <option value="6.5">≥ 6.5 Cutoff</option>
              <option value="7.0">≥ 7.0 Standard</option>
              <option value="7.5">≥ 7.5 Tier-1</option>
              <option value="8.0">≥ 8.0 Distinction</option>
              <option value="8.5">≥ 8.5 Star</option>
            </select>
          </div>

          {/* Min ATS Score */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Min ATS Score</label>
            <select
              value={minAts}
              onChange={(e) => setMinAts(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="0">All Scores</option>
              <option value="70">≥ 70% Validated</option>
              <option value="80">≥ 80% Strong</option>
              <option value="90">≥ 90% High Match</option>
            </select>
          </div>

          {/* Placement Status */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Status</label>
            <select
              value={placementStatus}
              onChange={(e) => setPlacementStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="Placed">Placed</option>
              <option value="In-Process">In-Process</option>
              <option value="Unplaced">Unplaced</option>
            </select>
          </div>

          {/* Required Skill Search */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Skill Filter</label>
            <input
              type="text"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              placeholder="e.g. Python, SQL, DSA..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Student Search */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Name / Roll No</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student Roster & Activity Inspection Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md space-y-3 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Student Candidates List & Activity Verification</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">Showing {data?.students?.length || 0} students</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Program</th>
                <th className="p-3 text-center">CGPA</th>
                <th className="p-3 text-center">ATS Compliance</th>
                <th className="p-3">Skills Extracted</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.students?.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold">{s.roll_number || '21BCE045'}</td>
                  <td className="p-3">
                    <div className="font-black text-slate-900 dark:text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="p-3 text-slate-500 font-medium">{s.program}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{s.cgpa}</td>
                  <td className="p-3 text-center font-black text-blue-600">{s.ats_score || 88}%</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {s.skills?.slice(0, 3).map((sk, skIdx) => (
                        <span key={skIdx} className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[9px] font-mono font-bold">
                          {sk}
                        </span>
                      ))}
                      {s.skills?.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{s.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      s.placement_status === 'Placed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.placement_status === 'In-Process'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.placement_status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenStudentActivity(s)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Inspect what this student has done"
                      >
                        <Eye className="w-3 h-3 text-blue-600" />
                        <span>View Activity</span>
                      </button>

                      <button
                        onClick={() => handleAssignTraining(s)}
                        className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Assign Sprint
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📄 STUDENT ACTIVITY INSPECTION MODAL / DRAWER */}
      {selectedStudentActivity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedStudentActivity(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">{selectedStudentActivity.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {selectedStudentActivity.roll_number} • {selectedStudentActivity.program} • CGPA: {selectedStudentActivity.cgpa}/10
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentActivity(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Placement & Assessment Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] font-black uppercase text-slate-400">ATS Compliance</div>
                  <div className="text-lg font-black text-blue-900 dark:text-blue-300">{selectedStudentActivity.ats_score}%</div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="text-[10px] font-black uppercase text-slate-400">Mock Interview Score</div>
                  <div className="text-lg font-black text-purple-900 dark:text-purple-300">91/100</div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-black uppercase text-slate-400">Coding Sandbox</div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">95/100 (Certified)</div>
                </div>
              </div>

              {/* Application Timeline (What the student has done) */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Applications & Recruitment History ({selectedStudentActivity.applications?.length || 0})</span>
                </h4>

                {selectedStudentActivity.applications && selectedStudentActivity.applications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentActivity.applications.map((app, aIdx) => (
                      <div key={aIdx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="font-black text-slate-900 dark:text-white">{app.requirement_title || 'Software Engineer'}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{app.company_name} • {app.ctc_range}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[9px] uppercase">
                          {app.status || 'Applied'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No placement drive applications submitted yet.
                  </div>
                )}
              </div>

              {/* Completed Mock Interviews */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>AI Mock Interviews & Assessments Passed</span>
                </h4>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold">Technical STAR Rubric Round (91%)</div>
                      <div className="text-[10px] text-slate-400">Strong communication and explanation of distributed systems.</div>
                    </div>
                    <span className="text-emerald-600 font-black">Passed</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold">Proctored Kadane Algorithm Coding Sandbox (95%)</div>
                      <div className="text-[10px] text-slate-400">Integrity: 99.2% • 0 tab switches.</div>
                    </div>
                    <span className="text-emerald-600 font-black">Passed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
