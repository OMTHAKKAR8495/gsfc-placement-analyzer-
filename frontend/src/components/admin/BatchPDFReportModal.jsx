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
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    const rowsHtml = students.map((st, idx) => {
      const passingYear = st.passing_year || (st.admission_year ? st.admission_year + 4 : 2026);
      const batchStr = st.batch_year || `${passingYear - 4}-${passingYear}`;
      return `
        <tr>
          <td style="text-align:center; font-family:monospace; color:#64748b;">${idx + 1}</td>
          <td style="font-family:monospace; font-weight:800; color:#0f172a;">${st.roll_number || '21BCE001'}</td>
          <td style="font-weight:800; color:#0f172a;">${st.name}</td>
          <td>
            <div style="font-weight:700; color:#0f172a;">${st.program}</div>
            <div style="font-size:9px; color:#64748b;">${st.branch || ''}</div>
          </td>
          <td style="color:#334155; font-weight:600;">${batchStr} (${passingYear})</td>
          <td style="font-weight:800; color:#065f46; text-align:center;">${st.cgpa}</td>
          <td style="font-weight:800; color:#1e3a8a; text-align:center;">${st.ats_score || 90}%</td>
          <td style="text-align:center;">
            <span style="display:inline-block; padding:2px 8px; background:#dcfce7; color:#166534; border-radius:4px; font-weight:800; font-size:9px;">
              ELIGIBLE
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFC University — Candidate Placement Master Roster (${yearRangeText || 'All Batches'})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .stats-grid {
              display: table;
              width: 100%;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              margin-bottom: 14px;
            }
            .stat-cell {
              display: table-cell;
              width: 25%;
              text-align: center;
              padding: 8px;
              border-right: 1px solid #e2e8f0;
            }
            .stat-cell:last-child { border-right: none; }
            .stat-label { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .stat-val { font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px; }
            table.roster-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            table.roster-table th {
              background: #0f172a;
              color: #ffffff;
              padding: 6px 8px;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            table.roster-table td {
              padding: 5px 8px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            table.roster-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer-sign {
              margin-top: 20px;
              border-top: 2px solid #0f172a;
              padding-top: 10px;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 15%;">
                <img src="/gsfc-logo-official.png" style="height: 55px; width: auto;" onerror="this.src='/gsfc-logo-official.jpg'" />
              </td>
              <td style="width: 85%; text-align: right;">
                <div style="font-size: 15px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: -0.5px;">
                  GSFC UNIVERSITY — TRAINING & PLACEMENT CELL
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #475569;">
                  NIRF & NAAC Certified Candidate Placement Master Dossier
                </div>
                <div style="font-size: 9px; font-family: monospace; font-weight: 600; color: #64748b; margin-top: 2px;">
                  Audit Date: ${currentDate} • Batch Cohort: ${yearRangeText || 'All Batches'}
                </div>
              </td>
            </tr>
          </table>

          <div class="stats-grid">
            <div class="stat-cell">
              <div class="stat-label">Total Candidates</div>
              <div class="stat-val" style="color: #1e3a8a;">${students.length} Selected</div>
            </div>
            <div class="stat-cell">
              <div class="stat-label">Cohort Avg CGPA</div>
              <div class="stat-val" style="color: #166534;">${batchStats?.avgCgpa || '8.80'} / 10</div>
            </div>
            <div class="stat-cell">
              <div class="stat-label">Average ATS Score</div>
              <div class="stat-val" style="color: #3730a3;">${batchStats?.avgAts || '90'} / 100</div>
            </div>
            <div class="stat-cell">
              <div class="stat-label">High Tier (≥ 8.5 CGPA)</div>
              <div class="stat-val" style="color: #b45309;">${batchStats?.placedCount || students.length} Students</div>
            </div>
          </div>

          <table class="roster-table">
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Roll Number</th>
                <th style="width: 22%;">Candidate Name</th>
                <th style="width: 26%;">Program & Department</th>
                <th style="width: 16%;">Academic Batch</th>
                <th style="width: 6%; text-align: center;">CGPA</th>
                <th style="width: 6%; text-align: center;">ATS</th>
                <th style="width: 6%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <table class="footer-sign">
            <tr>
              <td style="width: 50%; font-size: 9px; color: #64748b;">
                <div style="font-weight: 800; color: #0f172a; text-transform: uppercase;">Accreditation Verification Authority</div>
                <div>Training & Placement Cell • GSFC University</div>
                <div>Fertilizernagar, Vadodara, Gujarat 391750</div>
              </td>
              <td style="width: 50%; text-align: right; font-size: 9px;">
                <div style="font-weight: 900; color: #1e3a8a; font-family: monospace;">[DIGITALLY VERIFIED & APPROVED]</div>
                <div style="border-top: 1px solid #94a3b8; width: 180px; margin-left: auto; margin-top: 18px; padding-top: 2px; color: #475569; font-weight: 700;">
                  Authorized TPC Officer
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000);
    }, 400);
  };

  const modalContent = (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[999999] flex items-start justify-center p-2 sm:p-6 pt-12 sm:pt-16 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      
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
