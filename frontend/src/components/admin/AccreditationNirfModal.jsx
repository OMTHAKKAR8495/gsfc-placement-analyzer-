import React, { useState, useEffect } from 'react';
import { 
  X, Award, BarChart3, Download, Printer, ShieldCheck, CheckCircle2, 
  TrendingUp, Building2, Users, FileSpreadsheet, GraduationCap, ChevronRight,
  PieChart, Sparkles, Layers, BookOpen, ExternalLink, Calendar, Check, Trophy, Filter,
  RefreshCw, Database
} from 'lucide-react';

export default function AccreditationNirfModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trends'); // 'trends', 'nirf', 'branches', 'naac'
  const [selectedFieldFilter, setSelectedFieldFilter] = useState('ALL');

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
      console.error('Error fetching live accreditation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  const metrics = data?.overall_metrics || {
    total_students_tracked: 0,
    overall_placement_percentage: 0,
    overall_median_lpa: 0,
    overall_highest_lpa: 0,
    overall_average_lpa: 0,
    total_companies_participated: 0,
    total_drives_conducted: 0
  };

  const nirfCohorts = data?.nirf_cohorts || [];
  const branchAnalytics = data?.branch_analytics || [];
  const naacRoster = data?.naac_placed_roster || [];
  const yearlyTrends = data?.yearly_hiring_trends || [];
  const fieldSummary = data?.field_summary || [];

  // Dynamically extract field options directly from live database field summary
  const dynamicFieldOptions = [
    { code: 'ALL', name: '🎓 All GSFC Fields (Live Summary)', icon: '🌟' },
    ...fieldSummary.map(f => ({
      code: f.field_code,
      name: `${f.field_name}`,
      icon: f.field_code === 'CSE' ? '💻' 
          : f.field_code === 'CHEM' ? '🧪' 
          : f.field_code === 'MECH' ? '⚙️' 
          : f.field_code === 'CIVIL' ? '🏗️' 
          : f.field_code === 'IT' ? '🌐' 
          : '📚'
    }))
  ];

  // Dynamic Chart calculations based on live database data
  const chartData = yearlyTrends.map(item => {
    const count = (selectedFieldFilter === 'ALL')
      ? (item.by_field?.ALL ?? item.total_hired ?? 0)
      : (item.by_field?.[selectedFieldFilter] ?? 0);
    
    return {
      year: item.year,
      hiredCount: count,
      avgLpa: item.avg_package_lpa || 0,
      highestLpa: item.highest_package_lpa || 0
    };
  });

  const maxHiredInSelection = Math.max(...chartData.map(d => d.hiredCount), 1);
  const peakYearItem = chartData.reduce((prev, current) => (prev.hiredCount > current.hiredCount) ? prev : current, chartData[0] || {});

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
                <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                  100% Live DB Data
                </span>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                  MHRD / NIRF & NAAC Ready
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5 flex items-center gap-2">
                <span>NAAC & NIRF Accreditation 1-Click Report Generator</span>
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Live Data Stream from GSFC University Placement Database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAccreditationData}
              disabled={loading}
              className="py-2 px-3 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Live DB</span>
            </button>

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
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trends'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>📊 Yearly Hiring Bar Chart & Fields</span>
            </button>

            <button
              onClick={() => setActiveTab('nirf')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'nirf'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>NIRF Parameter 3</span>
            </button>

            <button
              onClick={() => setActiveTab('branches')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'branches'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Branch Comparisons</span>
            </button>

            <button
              onClick={() => setActiveTab('naac')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'naac'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              <span>NAAC Metric 5.2.1</span>
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
              <span>NIRF (.CSV)</span>
            </a>

            <a
              href="/api/admin/accreditation/export-naac-csv"
              download
              className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer hover:scale-105"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>NAAC (.CSV)</span>
            </a>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Executive Live Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                Live Placement Ratio
              </div>
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
                {metrics.overall_placement_percentage}%
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                {metrics.total_applications_filed} Live Placed / Applied
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                Live Median Salary
              </div>
              <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
                ₹{metrics.overall_median_lpa} LPA
              </div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-0.5">
                Calculated from DB Offers
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                Live Highest CTC
              </div>
              <div className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1">
                ₹{metrics.overall_highest_lpa} LPA
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                Top Active Offer in Database
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-xs">
              <div className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 tracking-wider">
                Active Corporate Drives
              </div>
              <div className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1">
                {metrics.total_drives_conducted} Drives
              </div>
              <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold mt-0.5">
                {metrics.total_companies_participated} Approved Recruiters
              </div>
            </div>
          </div>

          {/* TAB 0: LIVE MULTI-YEAR HIRING BAR CHART & FIELD FILTER */}
          {activeTab === 'trends' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Field Filter Selection Strip */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Live Field / Department Selector
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      Select Department to View Real-Time Batch Hiring Volume
                    </h3>
                  </div>

                  <div className="w-full sm:w-80">
                    <select
                      value={selectedFieldFilter}
                      onChange={(e) => setSelectedFieldFilter(e.target.value)}
                      className="w-full py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-900 cursor-pointer shadow-sm"
                    >
                      {dynamicFieldOptions.map(opt => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Toggle Filter Badges */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {dynamicFieldOptions.map(opt => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setSelectedFieldFilter(opt.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedFieldFilter === opt.code
                          ? 'bg-blue-900 text-white shadow-md scale-105 ring-2 ring-amber-400'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.code === 'ALL' ? 'All Fields' : opt.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Peak Hiring Year Banner Highlight */}
              <div className="p-4.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-3xl shadow-lg flex items-center justify-between flex-wrap gap-4 border border-amber-400">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-md shrink-0">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
                      🏆 Live Highest Placement Year ({selectedFieldFilter === 'ALL' ? 'All GSFC Fields' : selectedFieldFilter})
                    </div>
                    <div className="text-lg font-black text-slate-950">
                      Batch {peakYearItem?.year || '2026'} with {peakYearItem?.hiredCount || 0} Placed Students
                    </div>
                  </div>
                </div>
                <div className="text-right bg-black/10 px-4 py-2 rounded-2xl">
                  <div className="text-[10px] font-black uppercase text-slate-900">Average Live Package</div>
                  <div className="text-base font-black text-slate-950">₹{peakYearItem?.avgLpa || 0} LPA</div>
                </div>
              </div>

              {/* INTERACTIVE VERTICAL BAR CHART WITH GUARANTEED PIXEL HEIGHT RENDERING */}
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-900 dark:text-blue-400" />
                      <span>Live Year-over-Year GSFC Hiring Volume Bar Chart</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Live placement volume for: <strong className="text-blue-900 dark:text-blue-300">{dynamicFieldOptions.find(f => f.code === selectedFieldFilter)?.name}</strong>
                    </p>
                  </div>
                </div>

                {/* VISIBLE BAR CHART DISPLAY */}
                <div className="pt-6 pb-2 px-2 sm:px-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-4 items-end h-72 border-b-2 border-slate-300 dark:border-slate-700 pb-3">
                    {chartData.map((item, idx) => {
                      const barHeightPx = Math.max(Math.round((item.hiredCount / maxHiredInSelection) * 190), 32);
                      const isPeak = item.year === peakYearItem?.year;

                      return (
                        <div key={idx} className="flex flex-col items-center justify-end h-full group">
                          {/* Peak Year Badge */}
                          {isPeak ? (
                            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md text-[9px] font-black uppercase tracking-wider mb-1 animate-pulse shadow-sm">
                              🏆 Peak
                            </span>
                          ) : (
                            <span className="h-5 mb-1"></span>
                          )}

                          {/* Student Count on top of bar */}
                          <div className={`text-xs sm:text-sm font-black mb-1.5 transition-all group-hover:scale-110 ${
                            isPeak ? 'text-amber-600 dark:text-amber-400 text-sm sm:text-base' : 'text-slate-900 dark:text-white'
                          }`}>
                            {item.hiredCount}
                          </div>

                          {/* Solid Bar Element */}
                          <div 
                            className={`w-full max-w-[48px] rounded-2xl transition-all duration-700 shadow-md relative cursor-pointer group-hover:scale-105 ${
                              isPeak 
                                ? 'bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400 shadow-amber-500/40 border-2 border-amber-300'
                                : 'bg-gradient-to-t from-blue-950 via-blue-800 to-indigo-500 shadow-blue-900/30 border border-blue-400/40'
                            }`}
                            style={{ height: `${barHeightPx}px` }}
                          >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                          </div>

                          {/* Year Label Under Bar */}
                          <div className="text-center mt-2.5">
                            <div className={`text-xs font-black ${isPeak ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.year}
                            </div>
                            <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                              ₹{item.avgLpa}L
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold pt-3 px-2">
                    <span>📅 Academic Batch Years from Database</span>
                    <span className="text-emerald-700 dark:text-emerald-400">💡 Packages in ₹ Lakhs Per Annum (LPA)</span>
                  </div>
                </div>
              </div>

              {/* WHICH FIELD GOT HIRED MORE? LIVE BREAKDOWN LEADERBOARD */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Which Academic Field Got Hired More? (Live Database Rankings)</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Live share of placements per engineering and science discipline. Click any card to filter the chart above.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {fieldSummary.map((f, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedFieldFilter(f.field_code)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedFieldFilter === f.field_code
                          ? 'bg-blue-900 text-white border-blue-900 shadow-md scale-105 ring-2 ring-amber-400'
                          : f.is_top
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          selectedFieldFilter === f.field_code
                            ? 'bg-white/20 text-white'
                            : f.is_top
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          Rank #{f.rank}
                        </span>
                        <span className="text-xs font-black">
                          {f.share_pct}%
                        </span>
                      </div>

                      <h5 className={`text-xs font-black mt-2 leading-tight ${
                        selectedFieldFilter === f.field_code ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        {f.field_name}
                      </h5>

                      <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] font-bold">
                        <span className={selectedFieldFilter === f.field_code ? 'text-blue-200' : 'text-slate-500'}>
                          {f.total_placed} Placed
                        </span>
                        <span className={selectedFieldFilter === f.field_code ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}>
                          ₹{f.avg_lpa} LPA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                  ✅ Live DB Verified
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
                  Live branch comparison across engineering and science departments from database.
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
                Verified and compiled dynamically from <strong>Live SQLite Database Records</strong> as per <strong>NIRF MHRD Parameter 3</strong> and <strong>NAAC Criterion 5.2.1</strong> quality standards.
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 font-bold">
              Doc Ref: GSFC/IQAC/2026/LIVE-SYNC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
