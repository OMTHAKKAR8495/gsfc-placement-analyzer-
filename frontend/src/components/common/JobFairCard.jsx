import React from 'react';
import { Calendar, MapPin, Building2, Users, CheckCircle2, ArrowRight, Globe, Layers, Award } from 'lucide-react';

export default function JobFairCard({ fair, isRegistered, onRegister, onViewDrives, isRegistering }) {
  const isLive = fair.status === 'live';
  const isClosed = fair.status === 'closed';

  return (
    <div className={`glass-panel p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
      isLive 
        ? 'border-emerald-500/80 shadow-emerald-500/10 ring-2 ring-emerald-500/20 shadow-xl bg-emerald-950/5' 
        : 'border-slate-200/90 dark:border-slate-800 shadow-lg hover:shadow-xl bg-white/90 dark:bg-slate-900/90'
    }`}>
      {/* Status & Mode Badge Top Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isLive
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 animate-pulse'
                : isClosed
                ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
            }`}>
              {fair.status} Fair
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{fair.mode}</span>
            </span>
          </div>

          {isRegistered && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>Registered</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
            {fair.title}
          </h3>
          {fair.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
              {fair.description}
            </p>
          )}
        </div>

        {/* Event Key Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{new Date(fair.event_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 truncate">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">{fair.venue || 'GSFC University Grounds'}</span>
          </div>
        </div>

        {/* Participating Companies Strip */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Featured Hiring Drives ({fair.participating_companies?.length || fair.companies_count || 0})</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              {fair.registrations_count || 0} Students Registered
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {fair.participating_companies && fair.participating_companies.length > 0 ? (
              fair.participating_companies.map((comp, idx) => (
                <div 
                  key={idx} 
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0 text-xs"
                >
                  {comp.logo_url && (
                    <img src={comp.logo_url} alt="" className="w-4 h-4 rounded object-cover" />
                  )}
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {comp.company_name}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                    {comp.ctc_range?.split('-')[0] || ''}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                Placement Cell is finalizing participating company roster...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onViewDrives(fair)}
          className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Browse Drives ({fair.participating_companies?.length || 0})</span>
        </button>

        {!isClosed && (
          <button
            onClick={() => onRegister(fair.id)}
            disabled={isRegistered || isRegistering}
            className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isRegistered
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 cursor-default'
                : 'bg-theme-gradient hover:opacity-90 text-white shadow-blue-500/20 hover:scale-105'
            }`}
          >
            {isRegistered ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enrolled</span>
              </>
            ) : (
              <>
                <span>{isRegistering ? 'Registering...' : '1-Click Register'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
