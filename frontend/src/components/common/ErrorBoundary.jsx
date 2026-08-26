import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GSFC Platform Error Boundary Caught Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gsfc_student_active_tab');
      sessionStorage.removeItem('gsfc_student_active_tab');
      localStorage.removeItem('gsfc_active_workspace');
    } catch(e) {}
    this.setState({ hasError: false, error: null });
    window.location.hash = '#student';
    window.location.reload();
  };

  handleDeepRepair = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {}
    window.location.hash = '#student';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errDetail = this.state.error?.stack || this.state.error?.message || this.state.error?.toString() || 'Unknown Rendering Exception';
      return (
        <div className="min-h-[400px] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900 text-white rounded-3xl m-4 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-black">Something went wrong in this component</h2>
          <p className="text-xs text-slate-400 max-w-md">
            The GSFC system encountered a non-fatal rendering issue. The rest of your session is protected.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 max-w-xl text-left overflow-auto max-h-36">
            {errDetail}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition-transform cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reset Component State
            </button>

            <button
              onClick={this.handleDeepRepair}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition-transform cursor-pointer"
            >
              <span>⚡ Deep Repair & Re-enter Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
