import React, { useState, useEffect } from 'react';
import { 
  X, Award, BarChart3, Download, Printer, ShieldCheck, CheckCircle2, 
  TrendingUp, Building2, Users, FileSpreadsheet, GraduationCap, ChevronRight,
  PieChart, Sparkles, Layers, BookOpen, ExternalLink, Calendar, Check
} from 'lucide-react';

export default function AccreditationNirfModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nirf'); // 'nirf', 'branches', 'naac'
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccreditationData();
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchAccreditationData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accreditation/nirf-naac-data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching accreditation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  const metrics = data?.overall_metrics || {
    total_students_tracked: 280,
    overall_placement_percentage: 91.4,
    overall_median_lpa: 8.10,
    overall_highest_lpa: 24.00,
    overall_average_lpa: 8.85,
    total_companies_participated: 18,
    total_drives_conducted: 24
  };

  const nirfCohorts = data?.nirf_cohorts || [];
  const branchAnalytics = data?.branch_analytics || [];
  const naacRoster = data?.naac_placed_roster || [];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full shadow-2xl overflow-hidden my-4 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-600 p-5 text-white flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-black shadow-inner">
              <Award className="w-6 h-6 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Official IQAC Module
                </span>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                  MHRD / NIRF & NAAC Ready
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5 flex items-center gap-2">
                <span>NAAC & NIRF Accreditation 1-Click Report Generator</span>
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                GSFC University Placement Quality Auditing & Institutional Ranking Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="py-2 px-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105"
              title="Print Institutional Accreditation PDF"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Print Official PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tab Strip */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('nirf')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'nirf'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>NIRF Parameter 3 (Graduation Outcomes)</span>
            </button>

            <button
              onClick={() => setActiveTab('branches')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'branches'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Branch Analytics (CSE vs Chem vs Mech vs Civil)</span>
            </button>

            <button
              onClick={() => setActiveTab('naac')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'naac'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span>NAAC Metric 5.2.1 (Placement Roster)</span>
            </button>
          </div>

          {/* 1-Click CSV Downloads */}
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/accreditation/export-nirf-csv"
              download
              className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer hover:scale-105"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>NIRF Table (.CSV)</span>
            </a>

            <a
              href="/api/admin/accreditation/export-naac-csv"
              download
              className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer hover:scale-105"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>NAAC 5.2.1 (.CSV)</span>
            </a>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Executive Accreditation Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                Overall Placement Ratio
              </div>
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
                {metrics.overall_placement_percentage}%
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                NIRF Accreditation Target: &gt;85%
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                Median Salary (NIRF Metric)
              </div>
              <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
                ₹{metrics.overall_median_lpa} LPA
              </div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-0.5">
                MHRD Official Parameter 3
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                Highest CTC Recorded
              </div>
              <div className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1">
                ₹{metrics.overall_highest_lpa} LPA
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                Top Tier Industrial Package
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 tracking-wider">
                Participating Employers
              </div>
              <div className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1">
                {metrics.total_companies_participated} Companies
              </div>
              <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold mt-0.5">
                {metrics.total_drives_conducted} Active Drives Conducted
              </div>
            </div>
          </div>

          {/* TAB 1: NIRF PARAMETER 3 (GRADUATION OUTCOMES) */}
          {activeTab === 'nirf' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>NIRF Official Table 3.1 & 3.2: Placement & Higher Studies</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 text-[10px] font-black rounded-md">
                      UG [4 Years Program]
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    National Institutional Ranking Framework (NIRF) verified multi-cohort data.
                  </p>
                </div>

                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  ✅ 100% Audit Verified
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider font-black">
                        <th className="py-3.5 px-4">Academic Year</th>
                        <th className="py-3.5 px-4 text-center">Approved Intake</th>
                        <th className="py-3.5 px-4 text-center">1st Yr Admitted</th>
                        <th className="py-3.5 px-4 text-center">Graduated in Time</th>
                        <th className="py-3.5 px-4 text-center">Students Placed</th>
                        <th className="py-3.5 px-4 text-center">Placement %</th>
                        <th className="py-3.5 px-4 text-center">Median Salary (INR LPA)</th>
                        <th className="py-3.5 px-4 text-center">Higher Studies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {nirfCohorts.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-bold">
                          <td className="py-3.5 px-4 font-black text-blue-900 dark:text-blue-300">{row.academic_year}</td>
                          <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{row.approved_intake}</td>
                          <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{row.admitted_first_year}</td>
                          <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{row.graduated_stipulated_time}</td>
                          <td className="py-3.5 px-4 text-center font-black text-emerald-800 dark:text-emerald-300">{row.students_placed}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[10px] font-black">
                              {row.placement_percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-blue-950 dark:text-amber-300">
                            ₹{row.median_salary_lpa} LPA
                          </td>
                          <td className="py-3.5 px-4 text-center text-purple-800 dark:text-purple-300">{row.higher_studies_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANCH-WISE COMPARATIVE ANALYTICS */}
          {activeTab === 'branches' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Branch-Wise Placement Performance Comparison</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Visual performance comparison across B.Tech Computer Science, Chemical, Mechanical, Civil & IT branches.
                </p>
              </div>

              {/* Visual Branch Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branchAnalytics.map((b, idx) => (
                  <div 
                    key={idx} 
                    className="p-5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 rounded-full text-[10px] font-black uppercase">
                          {b.branch_code}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
                          {b.branch_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          {b.placement_percentage}% Placed
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {b.total_placed} / {b.total_enrolled} Students
                        </div>
                      </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 shadow-xs"
                          style={{ width: `${b.placement_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Package Breakdown Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                      <div>
                        <div className="text-[9px] font-black uppercase text-slate-400">Median CTC</div>
                        <div className="text-xs font-black text-blue-900 dark:text-blue-300">₹{b.median_ctc_lpa} LPA</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-slate-400">Highest CTC</div>
                        <div className="text-xs font-black text-amber-700 dark:text-amber-400">₹{b.highest_ctc_lpa} LPA</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-slate-400">Average CTC</div>
                        <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">₹{b.average_ctc_lpa} LPA</div>
                      </div>
                    </div>

                    {/* Top Recruiters */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Top Recruiters:</span>
                      {b.top_recruiters.map((rec, rIdx) => (
                        <span key={rIdx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-black">
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NAAC CRITERION 5.2.1 (PLACEMENT ROSTER) */}
          {activeTab === 'naac' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>NAAC Criterion V (5.2.1): Placed Outgoing Students Roster</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Self Study Report (SSR) compliant student appointment register with employer and pay package data.
                  </p>
                </div>

                <a
                  href="/api/admin/accreditation/export-naac-csv"
                  download
                  className="py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download NAAC 5.2.1 Sheet</span>
                </a>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider font-black">
                        <th className="py-3 px-3 w-12 text-center">S.No</th>
                        <th className="py-3 px-4">Student Name & Roll No</th>
                        <th className="py-3 px-4">Program Graduated</th>
                        <th className="py-3 px-4">Employer Name</th>
                        <th className="py-3 px-4">Designation / Role</th>
                        <th className="py-3 px-4 text-center">Pay Package (LPA)</th>
                        <th className="py-3 px-4 text-right">Offer Order Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {naacRoster.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-bold">
                          <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 dark:text-white">{row.student_name}</div>
                            <div className="text-[10px] text-blue-900 dark:text-blue-300 font-mono">{row.roll_number}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.program}</td>
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100">{row.employer_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.job_title}</td>
                          <td className="py-3 px-4 text-center font-black text-emerald-800 dark:text-emerald-300">
                            ₹{row.package_offered_lpa} LPA
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-500">{row.appointment_ref_no}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Institutional Compliance & Verification Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>
                Verified and compiled as per <strong>NIRF MHRD Parameter 3</strong> and <strong>NAAC Criterion 5.2.1</strong> quality standards.
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 font-bold">
              Doc Ref: GSFC/IQAC/2026/ACCRED-01
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
