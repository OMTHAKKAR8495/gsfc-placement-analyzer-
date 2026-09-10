import React from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Download, LifeBuoy } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      safeModeActive: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛡️ [Safe Mode Guard] Caught UI crash exception:', error, errorInfo);
    try {
      sessionStorage.setItem('gsfc_last_crash_log', JSON.stringify({
        message: error?.message,
        stack: error?.stack,
        time: new Date().toISOString()
      }));
    } catch(e) {}
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gsfc_student_active_tab');
      sessionStorage.removeItem('gsfc_student_active_tab');
    } catch(e) {}
    this.setState({ hasError: false, error: null, safeModeActive: false });
    window.location.hash = '#student';
    window.location.reload();
  };

  handleEnableSafeMode = () => {
    this.setState({ safeModeActive: true });
  };

  handleDeepRepair = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {}
    window.location.hash = '#student';
    window.location.reload();
  };

  handleDownloadCrashLog = () => {
    const data = JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: this.state.error?.message || 'Unknown',
      stack: this.state.error?.stack || ''
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsfc_crash_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      const errDetail = this.state.error?.stack || this.state.error?.message || this.state.error?.toString() || 'Unknown Rendering Exception';

      if (this.state.safeModeActive) {
        return (
          <div className="min-h-[420px] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/95 text-white rounded-3xl m-4 border border-emerald-500/40 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-emerald-300">Temporary Safe Mode Active</h2>
            <p className="text-xs text-slate-300 max-w-md">
              The application is running in isolated safe mode to protect your session and data integrity. High-risk dynamic features are temporarily paused.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={() => { window.location.hash = '#student'; window.location.reload(); }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" /> Exit Safe Mode & Refresh
              </button>
              <button
                onClick={this.handleDownloadCrashLog}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Diagnostic Log
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[400px] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900 text-white rounded-3xl m-4 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-black">Something went wrong in this view</h2>
          <p className="text-xs text-slate-400 max-w-md">
            The platform encountered an unexpected runtime exception. The crash guard prevented total application failure.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 max-w-xl text-left overflow-auto max-h-32 w-full">
            {errDetail}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reset State
            </button>

            <button
              onClick={this.handleEnableSafeMode}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Run Safe Mode
            </button>

            <button
              onClick={this.handleDeepRepair}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4" /> Deep Cache Repair
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
