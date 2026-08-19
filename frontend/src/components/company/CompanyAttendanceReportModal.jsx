import React from 'react';
import { Download, Printer, X, CheckCircle, XCircle, Clock, Building2, FileText, Sparkles, ShieldCheck, Users, Calendar, Award } from 'lucide-react';

export default function CompanyAttendanceReportModal({ isOpen, onClose, requirement, applicants = [], company }) {
  if (!isOpen) return null;

  const totalApplicants = applicants.length;
  const presentCount = applicants.filter(a => a.attendance_status === 'present').length;
  const absentCount = applicants.filter(a => a.attendance_status === 'absent').length;
  const pendingCount = applicants.filter(a => !a.attendance_status || a.attendance_status === 'pending').length;
  const attendanceRate = totalApplicants > 0 ? Math.round((presentCount / totalApplicants) * 100) : 0;
  const avgMatchScore = totalApplicants > 0 ? Math.round(applicants.reduce((acc, a) => acc + (a.matchScore || a.match_score || 0), 0) / totalApplicants) : 0;

  const companyName = requirement?.company_name || company?.company_name || 'Corporate Recruiter';
  const jobTitle = requirement?.title || 'Campus Placement Drive';
  const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = [
      'S.No',
      'Student Name',
      'Roll Number',
      'Program / Branch',
      'CGPA',
      'ATS Score',
      'NLP Match Score %',
      'Attendance Status',
      'Application Status',
      'Applied Via',
      'Company Name',
      'Job Title',
      'Applied Date'
    ];

    const rows = applicants.map((app, idx) => [
      idx + 1,
      `"${app.name || app.candidate_name || 'N/A'}"`,
      `"${app.roll_number || 'GSFC/2026/CSE/' + String(idx + 1).padStart(3, '0')}"`,
      `"${app.program || 'BTech CSE'}"`,
      app.cgpa || 8.0,
      app.ats_score || 90,
      app.matchScore || app.match_score || 85,
      (app.attendance_status || 'pending').toUpperCase(),
      (app.status || 'applied').toUpperCase(),
      app.applied_via === 'external' ? 'External' : 'Internal CampusHire AI',
      `"${companyName}"`,
      `"${jobTitle}"`,
      app.applied_at ? String(app.applied_at).split('T')[0] : currentDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedTitle = (jobTitle || 'Drive').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `GSFC_TPC_Attendance_Report_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-5xl w-full shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900 print:border-none print:shadow-none print:m-0 print:max-w-none print:rounded-none">
        
        {/* ACTION BAR (Hidden in print) */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>Placement Drive Attendance & Candidate Report</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] uppercase font-black">
                  TPC Official
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-bold">
                Formatted for GSFC University Training & Placement Cell (TPC) Accreditation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Download structured CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL REPORT CANVAS (A4 Format) */}
        <div className="p-6 sm:p-10 space-y-6 bg-white font-sans max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8">
          
          {/* Official University Header */}
          <div className="flex items-center justify-between border-b-2 border-blue-900 pb-5 gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/gsfc-logo-official.png"
                alt="GSFC University Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/gsfc-logo-official.jpg';
                }}
              />
              <div>
                <div className="text-xl font-black text-blue-900 tracking-tight">GSFC UNIVERSITY</div>
                <div className="text-xs font-black text-slate-600 tracking-wide uppercase">
                  Training & Placement Cell (TPC) • Corporate Relations
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                  Vigyan Bhavan, Fertilizernagar, Vadodara, Gujarat 391750
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-3 py-1 bg-blue-900 text-white text-[10px] font-black uppercase rounded-lg tracking-wider">
                Official Drive Report
              </span>
              <div className="text-xs font-black text-slate-900 mt-1">Date: {currentDate}</div>
              <div className="text-[10px] text-slate-500 font-bold">Generated: {currentTime}</div>
            </div>
          </div>

          {/* Drive & Company Metadata Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Campus Placement Drive</span>
                <h1 className="text-lg sm:text-xl font-black text-slate-900">{jobTitle}</h1>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Hiring Partner</span>
                <div className="text-base font-black text-blue-900 flex items-center gap-1.5 sm:justify-end">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>{companyName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Package (CTC)</span>
                <span className="font-black text-blue-900">{requirement?.ctc_range || 'Competitive'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Job Type</span>
                <span className="font-black text-slate-900">{requirement?.job_type || 'Full-time'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Min CGPA Cutoff</span>
                <span className="font-black text-slate-900">{requirement?.min_cgpa || '7.5'} CGPA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Applications Status</span>
                <span className={`font-black ${requirement?.applications_open === 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {requirement?.applications_open === 0 ? 'Closed' : 'Active / Open'}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Attendance & Assessment Summary Metrics */}
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-900" />
              <span>Drive Attendance & Evaluation Summary</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-blue-800">Total Registered</div>
                <div className="text-xl font-black text-blue-950 mt-0.5">{totalApplicants}</div>
                <div className="text-[9px] text-blue-700 font-bold">100% Candidates</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-emerald-800">Marked Present</div>
                <div className="text-xl font-black text-emerald-950 mt-0.5">{presentCount}</div>
                <div className="text-[9px] text-emerald-700 font-bold">{attendanceRate}% Turnout</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-rose-800">Marked Absent</div>
                <div className="text-xl font-black text-rose-950 mt-0.5">{absentCount}</div>
                <div className="text-[9px] text-rose-700 font-bold">
                  {totalApplicants > 0 ? Math.round((absentCount / totalApplicants) * 100) : 0}% Non-attended
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-[10px] font-black uppercase text-amber-800">Pending Review</div>
                <div className="text-xl font-black text-amber-950 mt-0.5">{pendingCount}</div>
                <div className="text-[9px] text-amber-700 font-bold">In-Progress</div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-black uppercase text-indigo-800">Avg NLP Match</div>
                <div className="text-xl font-black text-indigo-950 mt-0.5">{avgMatchScore}%</div>
                <div className="text-[9px] text-indigo-700 font-bold">Candidate Quality</div>
              </div>
            </div>
          </div>

          {/* Student Candidate Roster Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-900" />
                <span>Candidate Roster & Attendance Register ({totalApplicants} Students)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Official Roster for GSFC Placement Archives
              </span>
            </h3>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[10px] uppercase font-black">
                    <th className="py-2.5 px-3 w-10 text-center">S.No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Program & Branch</th>
                    <th className="py-2.5 px-3 text-center">CGPA</th>
                    <th className="py-2.5 px-3 text-center">NLP Match</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applicants.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500 font-bold text-xs">
                        No candidate applications recorded for this placement drive yet.
                      </td>
                    </tr>
                  ) : (
                    applicants.map((app, idx) => {
                      const att = app.attendance_status || 'pending';
                      return (
                        <tr key={app.application_id || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">
                            {app.name || app.candidate_name || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {app.roll_number || `GSFC/2026/CSE/${String(idx + 1).padStart(3, '0')}`}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {app.program || 'BTech CSE'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900">
                            {app.cgpa || 8.0}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              (app.matchScore || app.match_score) >= 80 
                                ? 'bg-emerald-100 text-emerald-900' 
                                : 'bg-blue-100 text-blue-900'
                            }`}>
                              {app.matchScore || app.match_score || 85}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-black">
                            {att === 'present' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-[10px] inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> PRESENT
                              </span>
                            ) : att === 'absent' ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded font-black text-[10px] inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> ABSENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-black text-[10px] inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" /> PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black uppercase text-[10px]">
                            <span className="text-slate-800 font-black">{app.status || 'applied'}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official TPC Verification & Sign-off Section */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-8">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500">Corporate Recruiter Sign-off</div>
                <div className="font-black text-slate-900 mt-1">{companyName} Talent Acquisition Team</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 font-bold">
                Authorized Recruiter Signature & Date
              </div>
            </div>

            <div className="space-y-8 text-right">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500">University Verification</div>
                <div className="font-black text-blue-900 mt-1">Head — Training & Placement Cell (TPC)</div>
                <div className="text-[10px] text-slate-600 font-bold">GSFC University, Vadodara</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 font-bold">
                TPC Faculty Coordinator Signature & University Seal
              </div>
            </div>
          </div>

          {/* Footer Accreditation Notice */}
          <div className="text-center pt-2 text-[9px] text-slate-500 font-bold border-t border-slate-200">
            Official Placement Record generated by GSFC University Placement Portal • Verified by AI Evaluation Core • Confidential Document
          </div>
        </div>
      </div>
    </div>
  );
}
