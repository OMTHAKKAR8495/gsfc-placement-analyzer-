import React from 'react';
import ReactDOM from 'react-dom';
import { ExternalLink, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export default function ExternalApplyConfirmModal({ isOpen, onClose, requirement, onConfirmApplied }) {
  if (!isOpen || !requirement) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30 shrink-0">
            <ExternalLink className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Opened External Application Page</h3>
            <p className="text-xs text-slate-500 font-bold">{requirement.company_name} • {requirement.title}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          We redirected you to <strong>{requirement.company_name}</strong>'s external careers page. Would you like to mark this role as <strong>"Applied externally"</strong> in your CampusHire AI tracker?
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <XCircle className="w-4 h-4 text-slate-400" /> Not yet
          </button>

          <button
            onClick={() => {
              onConfirmApplied(requirement.id);
              onClose();
            }}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Yes, I applied
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
