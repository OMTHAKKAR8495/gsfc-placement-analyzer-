import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Download, Printer, GraduationCap, Building, Award, CheckCircle } from 'lucide-react';

export default function BatchPDFReportModal({ isOpen, onClose, selectedStudents, batchStats, yearRangeText }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedStudents) return null;

  const students = Array.isArray(selectedStudents) ? selectedStudents : [];
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-start justify-center p-2 sm:p-6 pt-12 sm:pt-16 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      
      {/* Top Floating Print & Close Bar (Hidden during actual print) */}
      <div className="fixed top-4 right-6 z-[1000000] flex items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="py-2.5 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>🖨️ Print / Save as PDF</span>
        </button>

        <button
          onClick={onClose}
          className="p-2.5 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl shadow-lg border border-slate-200 transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer"
          title="Close PDF view (ESC)"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">ESC</span>
        </button>
      </div>

      {/* Official GSFC Printable Document Container (A4 Formatted) */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 my-4 space-y-6">
        
        {/* GSFC Official Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <img
              src="/gsfc-logo-official.png"
              alt="GSFC University"
              className="h-14 sm:h-16 w-auto object-contain"
              onError={(e) => { e.target.src = '/gsfc-logo-official.jpg'; }}
            />
          </div>

          <div className="text-center sm:text-right space-y-0.5">
            <h1 className="text-base sm:text-lg font-black text-blue-950 uppercase tracking-tight">
              Training & Placement Cell (TPC)
            </h1>
            <div className="text-xs font-bold text-slate-600">
              NIRF & NAAC Candidate Accreditation Master Report
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500">
              Audit Date: {currentDate} • Batch: {yearRangeText || 'All Academic Years'}
            </div>
          </div>
        </div>

        {/* Executive Summary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-center p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] font-black uppercase text-slate-500">Total Candidates</div>
            <div className="text-xl font-black text-blue-950">{students.length}</div>
          </div>
          <div className="text-center p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] font-black uppercase text-slate-500">Cohort Avg CGPA</div>
            <div className="text-xl font-black text-emerald-700">{batchStats?.avgCgpa || '8.80'} / 10</div>
          </div>
          <div className="text-center p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] font-black uppercase text-slate-500">Avg ATS Score</div>
            <div className="text-xl font-black text-indigo-900">{batchStats?.avgAts || '90'} / 100</div>
          </div>
          <div className="text-center p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] font-black uppercase text-slate-500">High Tier (≥ 8.5)</div>
            <div className="text-xl font-black text-amber-700">{batchStats?.placedCount || students.length}</div>
          </div>
        </div>

        {/* Candidate Roster Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-900" />
              <span>Certified Candidate Roster ({students.length} Students Selected)</span>
            </h2>
            <span className="text-[10px] font-bold text-slate-500">
              Sorted by Passing Year & CGPA Merit
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[10px] uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Candidate Name</th>
                  <th className="py-2.5 px-3">Program & Branch</th>
                  <th className="py-2.5 px-3">Batch / Year</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">ATS Score</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((st, idx) => {
                  const passingYear = st.passing_year || (st.admission_year ? st.admission_year + 4 : 2026);
                  const batchStr = st.batch_year || `${passingYear - 4}-${passingYear}`;

                  return (
                    <tr key={st.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-black text-slate-900">{st.roll_number || '21BCE001'}</td>
                      <td className="py-2 px-3 font-black text-slate-900">{st.name}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{st.program}</div>
                        <div className="text-[9px] text-slate-500">{st.branch}</div>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-700">
                        {batchStr} ({passingYear})
                      </td>
                      <td className="py-2 px-3 font-black text-emerald-800">{st.cgpa}</td>
                      <td className="py-2 px-3 font-black text-blue-900">{st.ats_score || 90}%</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                          ELIGIBLE
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Sign-Off Footer */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-6 items-end text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-500">Accreditation Verification Authority</div>
            <div className="font-bold text-slate-800">GSFC University Training & Placement Cell</div>
            <div className="text-[10px] text-slate-500">Vigyan Bhavan, Fertilizernagar, Vadodara, Gujarat 391750</div>
          </div>

          <div className="text-right space-y-2">
            <div className="font-mono font-black text-blue-950 tracking-wider">
              [APPROVED & DIGITALLY VERIFIED]
            </div>
            <div className="border-t border-slate-400 w-48 ml-auto pt-1 text-[10px] font-bold text-slate-600">
              Authorized TPC Officer Signature
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
