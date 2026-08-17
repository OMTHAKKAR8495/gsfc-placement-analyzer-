import React from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, X, ArrowRight } from 'lucide-react';

export default function ApprovalNotificationModal({ isOpen, onClose, title, message, entityName, actionType = 'approved' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 max-w-md w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transform transition-all scale-100">
        
        {/* Modal Top Banner with Emerald Gradient */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <ShieldCheck className="w-32 h-32 text-white" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 rounded-xl text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/50 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          </div>

          <span className="px-3 py-1 bg-emerald-400/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-400/30 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> GSFC TPC Official Verification
          </span>

          <h3 className="text-xl font-black leading-tight text-white">
            {title || '🎉 Request Accepted & Approved!'}
          </h3>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed text-center">
            {message || 'The recruiter hiring application request has been officially verified and accepted by GSFC Placement Cell.'}
          </p>

          {entityName && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">Entity / Recruiter</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300">{entityName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">Portal Verification</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified & Active
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-900 hover:from-emerald-500 hover:to-blue-800 text-white font-black text-xs rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Governance Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
