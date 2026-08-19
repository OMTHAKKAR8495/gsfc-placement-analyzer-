import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Download, Printer, Mail, Send, Award, CheckCircle, ShieldCheck, Building2, Calendar, MapPin, DollarSign, FileText, Check, Phone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function OfferLetterModal({ isOpen, onClose, candidate, requirement, company, onOfferDispatched }) {
  const { showToast } = useToast();
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateRoll, setCandidateRoll] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ctc, setCtc] = useState('');
  const [joiningDate, setJoiningDate] = useState('01 July 2027');
  const [reportingLocation, setReportingLocation] = useState('Corporate Headquarters / Technology Park, Vadodara');
  const [notes, setNotes] = useState('We congratulate you on your selection and look forward to your impactful contributions.');
  
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    if (candidate) {
      setCandidateName(candidate.candidate_name || candidate.name || 'Tanvi Joshi');
      setCandidateEmail(candidate.candidate_email || candidate.email || 'tanvi.j@gsfcuniversity.ac.in');
      setCandidatePhone(candidate.phone || candidate.candidate_phone || '9876543210');
      setCandidateRoll(candidate.roll_number || 'GSFC/2026/CSE/001');
      setJobTitle(candidate.job_title || requirement?.title || 'Software Development Engineer — AI & Full Stack');
      setCompanyName(candidate.company_name || requirement?.company_name || company?.company_name || 'gsfc limited');
      setCtc(candidate.ctc_range || requirement?.ctc_range || '₹ 18,00,000 - ₹ 24,00,000 PA');
    }
  }, [candidate, requirement, company]);

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const letterRefNo = `GSFC-TPC-OFFER-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleDispatchOffer = async (channel = 'all') => {
    setDispatching(true);
    setDispatchSuccess('');
    try {
      const res = await fetch('/api/notifications/send-offer-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: candidate.application_id || candidate.id,
          studentId: candidate.student_id,
          candidateName,
          candidateEmail,
          candidatePhone,
          candidateRoll,
          jobTitle,
          companyName,
          ctc,
          joiningDate,
          reportingLocation,
          notes
        })
      });
      const data = await res.json();
      setDispatching(false);
      if (res.ok) {
        setDispatchSuccess(`🎉 Official Offer Letter dispatched to ${candidateName} via WhatsApp & Email!`);
        showToast({
          type: 'success',
          title: '🎉 Offer Letter Dispatched!',
          message: `Official signed employment letter dispatched to ${candidateName} via WhatsApp & Email.`,
          triggerCrackles: true
        });
        if (data.whatsapp_url) {
          setWhatsappUrl(data.whatsapp_url);
        }
        if (onOfferDispatched) onOfferDispatched(data.offer_data);
      } else {
        showToast({
          type: 'error',
          title: 'Dispatch Failed',
          message: data.error || 'Failed to dispatch offer letter',
          triggerCrackles: false
        });
      }
    } catch (err) {
      setDispatching(false);
      console.error('Error dispatching offer letter:', err);
      showToast({
        type: 'error',
        title: 'Dispatch Error',
        message: err.message,
        triggerCrackles: false
      });
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn tpc-print-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900 tpc-print-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ACTION BAR (Hidden in print) */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>1-Click Official Offer Letter Generator</span>
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-full text-[10px] uppercase font-black">
                  TPC Verified
                </span>
              </h2>
              <p className="text-xs text-slate-200 font-bold">
                Accredited GSFC University Training & Placement Cell Employment Letter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleDispatchOffer('all')}
              disabled={dispatching}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
              title="Dispatch Offer Letter via WhatsApp & Email"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dispatching ? 'Dispatching...' : '📲 Dispatch WhatsApp & Email'}</span>
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Open WhatsApp Chat Directly"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Open WhatsApp</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105"
              title="Print or Save as Signed PDF"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print / Save PDF</span>
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

        {dispatchSuccess && (
          <div className="p-3 bg-emerald-100 border-b border-emerald-300 text-emerald-900 text-xs font-black flex items-center justify-between gap-2 px-6 print:hidden animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dispatchSuccess}</span>
            </div>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black underline"
              >
                Chat on WhatsApp Now ➔
              </a>
            )}
          </div>
        )}

        {/* PRINTABLE OFFICIAL OFFER LETTER DOSSIER (A4 1-Page Format) */}
        <div 
          id="printable-offer-canvas" 
          className="p-8 sm:p-12 space-y-6 bg-white font-sans max-h-[80vh] overflow-y-auto tpc-print-body print:p-4 print:space-y-4 print:max-h-none print:overflow-visible"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4 gap-4 print-keep-together">
            <div className="flex items-center gap-4">
              <img
                src="/gsfc-logo-official.png"
                alt="GSFC University Logo"
                className="h-16 sm:h-18 w-auto object-contain shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/gsfc-logo-official.jpg';
                }}
              />
              <div>
                <div className="text-lg sm:text-xl font-black text-blue-900 tracking-tight">GSFC UNIVERSITY</div>
                <div className="text-xs sm:text-sm font-black text-slate-700 tracking-wide uppercase">
                  Training & Placement Cell (TPC) • Corporate Relations
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                  Vigyan Bhavan, Fertilizernagar, Vadodara, Gujarat 391750
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-900 to-amber-600 text-white text-[10px] font-black uppercase rounded-lg tracking-wider inline-block shadow-sm">
                Official Offer Letter
              </span>
              <div className="text-xs font-black text-slate-900 mt-1">Ref: {letterRefNo}</div>
              <div className="text-[10px] text-slate-500 font-bold">Date of Issue: {issueDate}</div>
            </div>
          </div>

          {/* Recipient & Drive Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 print-keep-together">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[9.5px] font-black uppercase text-blue-900 tracking-wider">Candidate Details</span>
                <h1 className="text-lg font-black text-slate-900">{candidateName}</h1>
                <div className="text-xs text-slate-600 font-bold font-mono">{candidateRoll} • {candidateEmail}</div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Employing Partner</span>
                <div className="text-base font-black text-blue-900 flex items-center gap-1.5 sm:justify-end">
                  <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{companyName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block font-bold uppercase">Designation</span>
                <span className="font-black text-slate-900 text-xs">{jobTitle}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-bold uppercase">Annual Compensation (CTC)</span>
                <span className="font-black text-emerald-800 text-xs">{ctc}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-bold uppercase">Joining Date</span>
                <span className="font-black text-slate-900 text-xs">{joiningDate}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-bold uppercase">Placement Status</span>
                <span className="font-black text-emerald-700 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> SELECTED (PPO/FTE)
                </span>
              </div>
            </div>
          </div>

          {/* Formal Offer Terms & Conditions Letter Body */}
          <div className="space-y-3.5 text-xs text-slate-800 font-medium leading-relaxed print-keep-together">
            <p>
              Dear <strong>{candidateName}</strong>,
            </p>
            <p>
              Following your outstanding performance in the campus recruitment evaluation, technical assessments, and interview rounds conducted for <strong>{companyName}</strong> through the GSFC University Placement Portal, we are pleased to extend this formal <strong>Offer of Employment</strong> for the position of <strong>{jobTitle}</strong>.
            </p>
            
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-slate-900">
              <div className="text-[11px] font-black text-blue-950 uppercase tracking-wide">Key Employment Terms & Guidelines:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Compensation Package:</strong> Fixed + Variable Gross CTC of <strong>{ctc}</strong> as detailed in the compensation annexure.</li>
                <li><strong>Reporting Location:</strong> {reportingLocation}.</li>
                <li><strong>Pre-requisites:</strong> Successful completion of your degree with no active backlogs and submission of final academic transcripts.</li>
                <li><strong>Acceptance Protocol:</strong> Please confirm your formal acceptance via the GSFC Placement Portal within 7 calendar days of issuance.</li>
              </ul>
            </div>

            <p className="text-xs text-slate-600 italic">
              "{notes}"
            </p>
          </div>

          {/* Official Signatures & Digital TPC Stamp */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-xs items-center print-keep-together">
            <div className="space-y-4">
              <div>
                <div className="text-[9px] font-black uppercase text-slate-500">Corporate Recruiter</div>
                <div className="font-black text-slate-900 mt-0.5 text-xs">Authorized HR & Talent Acquisition</div>
                <div className="text-[10px] text-slate-600 font-bold">{companyName}</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500 font-bold">
                Employer Signature & Seal
              </div>
            </div>

            {/* GSFC TPC Official Digital Verification Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-500 bg-amber-50/60 flex flex-col items-center justify-center p-2 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-blue-900" />
                <span className="text-[8px] font-black text-blue-900 uppercase tracking-tighter mt-0.5">GSFC TPC</span>
                <span className="text-[7px] font-bold text-amber-700">VERIFIED</span>
              </div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mt-1">Digital TPC Stamp</span>
            </div>

            <div className="space-y-4 text-right">
              <div>
                <div className="text-[9px] font-black uppercase text-slate-500">University Placement Authority</div>
                <div className="font-black text-blue-900 mt-0.5 text-xs">Head — Training & Placement Cell (TPC)</div>
                <div className="text-[10px] text-slate-600 font-bold">GSFC University, Vadodara</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500 font-bold">
                TPC Director Signature & Seal
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-3 text-[8.5px] text-slate-500 font-bold border-t border-slate-200 print-keep-together">
            Official Placement Record generated by GSFC University Placement Portal • Verified by AI Evaluation Core • Confidential Document
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
