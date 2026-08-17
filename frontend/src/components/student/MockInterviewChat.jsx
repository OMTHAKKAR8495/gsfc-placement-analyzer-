import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle, Award, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MockInterviewChat({ student, requirement, onBack }) {
  const [sessionId, setSessionId] = useState(null);
  const [qaPairs, setQaPairs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [completedReport, setCompletedReport] = useState(null);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    setInitializing(true);
    try {
      const res = await fetch('/api/interview/mock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          requirement_id: requirement.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize mock interview');

      setSessionId(data.sessionId);
      setQaPairs(data.qaPairs || []);
    } catch (err) {
      alert(err.message);
      onBack();
    } finally {
      setInitializing(false);
    }
  };

  const handleSendAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim() || !sessionId) return;

    setSubmittingAnswer(true);
    try {
      const res = await fetch('/api/interview/mock/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: currentIndex,
          answer_text: answerInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Answer evaluation failed');

      setQaPairs(data.qaPairs);
      setAnswerInput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleFinishInterview = async () => {
    try {
      const res = await fetch('/api/interview/mock/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const data = await res.json();
      setCompletedReport(data.summary);

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
    } catch (err) {
      alert(err.message);
    }
  };

  if (initializing) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-bold text-white">AI Interview Generator is crafting questions...</h2>
        <p className="text-xs text-slate-400">Analyzing role description and matching candidate resume projects.</p>
      </div>
    );
  }

  const currentQA = qaPairs[currentIndex];
  const isLastQuestion = currentIndex === qaPairs.length - 1;
  const currentAnswered = Boolean(currentQA?.candidateAnswer && currentQA?.feedback);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-white">{requirement.title}</div>
          <div className="text-[11px] text-indigo-400 font-semibold">{requirement.company_name} • AI Mock Session</div>
        </div>

        <div className="text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Question {currentIndex + 1} of {qaPairs.length}
        </div>
      </div>

      {/* FINAL REPORT CARD MODAL / VIEW */}
      {completedReport ? (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-full uppercase tracking-wider">
              {completedReport.readinessGrade}
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-3">
              Overall Readiness: <span className="gradient-text">{completedReport.overallScore}%</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2">
              {completedReport.recommendation}
            </p>
          </div>

          {/* Strengths & Growth Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Performance Highlights
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {completedReport.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Targeted Coaching Focus
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {completedReport.areasForGrowth.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400">•</span> {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={onBack}
            className="py-3 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            Return to Student Dashboard
          </button>
        </div>
      ) : (
        /* ACTIVE QUESTION CHAT STEP */
        <div className="space-y-6">
          {/* Question Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase rounded-md">
                {currentQA?.category || 'Technical'} Question
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Difficulty: {currentQA?.difficulty || 'Medium'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white">{currentQA?.question}</h2>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Expected key points: {currentQA?.expectedKeyPoints?.join(', ')}
            </div>
          </div>

          {/* Answer Input or Feedback View */}
          {!currentAnswered ? (
            <form onSubmit={handleSendAnswer} className="space-y-3">
              <textarea
                rows={4}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Type your response here... (Tip: Structure your answer with clear context, action taken, and outcome metrics)"
                className="w-full p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAnswer || !answerInput.trim()}
                  className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submittingAnswer ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>Submit Answer for AI Coaching <Send className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* AI Answer Feedback Evaluation Modal Card */
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Real-Time AI Response Evaluation</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Clarity: {currentQA.feedback.clarityScore}%
                  </span>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    Technical Correctness: {currentQA.feedback.correctnessScore}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Your Answer:</span>
                "{currentQA.candidateAnswer}"
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-400 text-[11px] uppercase">What Was Good</div>
                  <p className="text-emerald-200 text-xs">{currentQA.feedback.whatWasGood}</p>
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-1">
                  <div className="font-bold text-indigo-400 text-[11px] uppercase">Key Missing Aspects</div>
                  <p className="text-indigo-200 text-xs">{currentQA.feedback.whatWasMissing}</p>
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-purple-300 block text-[11px] uppercase">Actionable Coaching Tip:</span>
                  {currentQA.feedback.coachingTip}
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                {!isLastQuestion ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishInterview}
                    className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                  >
                    Finish Interview & View Final Report Card
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
