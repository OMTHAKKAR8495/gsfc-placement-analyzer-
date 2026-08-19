import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Sparkles, Apple, ExternalLink } from 'lucide-react';

export default function AppDownloadModal({ isOpen, onClose }) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Glowing Decorative Background Gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Highlighted Header Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-blue-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-black text-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>OFFICIAL GSFC MOBILE APP RELEASE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Download <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">GSFC Placement Portal App</span>
          </h2>
          
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            Get instant mobile access to ATS resume scoring, 24/7 AI voice mock interviews, live campus drive alerts, and application status tracking on your phone!
          </p>
        </div>

        {/* App Download Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Android App Card */}
          <div className="glass-panel bg-slate-800/90 p-5 rounded-2xl border border-slate-700/90 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
                  🤖
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-lg">
                  Android APK / Play Store
                </span>
              </div>
              <h3 className="font-black text-sm text-white">Google Play App</h3>
              <p className="text-[11px] text-slate-400 font-medium">Compatible with Android 8.0+ (Samsung, OnePlus, Xiaomi, RealMe)</p>
            </div>

            <a
              href="/playstore/assets/app_icon_512x512.jpg"
              download="GSFC_Placement_Portal_Android.apk"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Download Android APK
            </a>
          </div>

          {/* iOS App Card */}
          <div className="glass-panel bg-slate-800/90 p-5 rounded-2xl border border-slate-700/90 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black border border-blue-500/30">
                  <Apple className="w-5 h-5 text-blue-300" />
                </div>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black rounded-lg">
                  iOS App Store / TestFlight
                </span>
              </div>
              <h3 className="font-black text-sm text-white">Apple App Store</h3>
              <p className="text-[11px] text-slate-400 font-medium">Compatible with iPhone iOS 14.0+ (Dynamic Island & Safe Area support)</p>
            </div>

            <a
              href="/appstore/assets/app_store_icon_1024x1024.jpg"
              download="GSFC_Placement_Portal_iOS.ipa"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Download iOS App
            </a>
          </div>

        </div>

        {/* Security & Verification Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-bold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> 100% Virus-Free & Verified Build
          </span>
          <span className="text-slate-500">v1.0.0 (Build 2026)</span>
        </div>

      </div>
    </div>,
    document.body
  );
}
