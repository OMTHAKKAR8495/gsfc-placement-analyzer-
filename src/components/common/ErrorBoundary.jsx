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
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900 text-white rounded-3xl m-4 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-black">Something went wrong in this component</h2>
          <p className="text-xs text-slate-400 max-w-md">
            The GSFC system encountered a non-fatal rendering issue. The rest of your session is protected.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 max-w-md truncate">
            {this.state.error?.toString() || 'Unknown Rendering Exception'}
          </div>

          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
          >
            <RefreshCw className="w-4 h-4" /> Reset Component State
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
