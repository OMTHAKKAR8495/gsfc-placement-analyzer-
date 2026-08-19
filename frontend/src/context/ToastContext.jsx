import React, { createContext, useContext, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, Info, Sparkles, X, Trophy } from 'lucide-react';

const ToastContext = createContext(null);

export const triggerCelebrationCrackles = () => {
  // Multi-stage firecracker celebration crackles
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 999999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Center burst
  confetti({
    ...defaults,
    particleCount: 70,
    origin: { y: 0.7, x: 0.5 },
    colors: ['#2563eb', '#4f46e5', '#d97706', '#10b981', '#ec4899', '#f59e0b']
  });

  // Repeating crackles from left and right
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 35 * (timeLeft / duration);
    // Left crackle
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
    });
    // Right crackle
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']
    });
  }, 250);
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ 
    type = 'success', 
    title = '', 
    message = '', 
    matchScore = null, 
    duration = 4500,
    triggerCrackles = true 
  }) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    if (triggerCrackles || type === 'celebration' || type === 'success') {
      triggerCelebrationCrackles();
    }

    setToasts((prev) => [...prev, { id, type, title, message, matchScore, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, triggerCelebrationCrackles }}>
      {children}

      {/* BOTTOM-POPPING TOAST CONTAINER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all duration-300 transform flex items-start gap-3.5 ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-white border-rose-500/50 shadow-rose-950/60'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 text-white border-amber-500/50 shadow-amber-950/60'
                : 'bg-slate-900/95 text-white border-blue-500/40 shadow-blue-950/70 ring-1 ring-white/10'
            }`}
            style={{
              animation: 'slideUpBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}
          >
            {/* ICON */}
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 text-white shadow-lg shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-200" />
              ) : toast.type === 'warning' ? (
                <Info className="w-5 h-5 text-amber-200" />
              ) : toast.matchScore !== null ? (
                <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm text-white tracking-wide">
                  {toast.title || (toast.type === 'error' ? 'Notice' : 'Success!')}
                </h4>
                {toast.matchScore !== null && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-[10px] uppercase rounded-full shadow-sm">
                    ✨ {toast.matchScore}% Match
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUpBounce {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.92);
          }
          70% {
            opacity: 1;
            transform: translateY(-8px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: ({ title, message, matchScore }) => {
        triggerCelebrationCrackles();
        console.log(`[Toast] ${title}: ${message} (${matchScore}%)`);
      },
      removeToast: () => {},
      triggerCelebrationCrackles
    };
  }
  return context;
};
