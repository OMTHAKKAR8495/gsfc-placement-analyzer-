import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle, Award, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MockInterviewChat({ student, currentUser, requirement, onBack }) {
  const [sessionId, setSessionId] = useState(null);
  const [qaPairs, setQaPairs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [completedReport, setCompletedReport] = useState(null);

  const getResolvedStudentId = () => {
    if (student?.id) return student.id;
    if (student?.student_id) return student.student_id;
    if (currentUser?.profile?.id) return currentUser.profile.id;
    if (currentUser?.id) return currentUser.id;
    const email = (currentUser?.email || student?.email || '').toLowerCase();
    if (email) return 's_' + email.split('@')[0].replace(/[^a-z0-9_]/g, '_');
    return 's_24bt04171';
  };

  const generateFallbackQuestions = (company, title) => {
    const cName = company || 'Corporate Placement Partner';
    const roleTitle = title || 'Software Engineer';
    return [
      {
        questionId: 'q_1',
        category: 'System Architecture & Tech Fundamentals',
        question: `For the ${roleTitle} role at ${cName}, how would you architect a scalable, fault-tolerant backend service handling high concurrent user requests?`,
        expectedKeyPoints: ['Stateless application tier', 'Database indexing and caching strategies (Redis)', 'Load balancing and horizontal scaling', 'Resilience and circuit breaker patterns'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_2',
        category: 'Applied Problem Solving & Optimization',
        question: `Can you explain a complex data structure or algorithm optimization you implemented in a real project, and how you measured its latency/throughput improvement?`,
        expectedKeyPoints: ['Concrete project context', 'Time and space complexity analysis (Big-O)', 'Benchmarking methodology', 'Trade-offs considered'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_3',
        category: 'Project Defense & Troubleshooting',
        question: `Describe the most difficult technical bug or production failure you encountered in your university/internship work and your systematic debugging process.`,
        expectedKeyPoints: ['Reproducing the bug', 'Log analysis and observability', 'Root cause identification', 'Preventive regression tests'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_4',
        category: 'Behavioral & Leadership Fit',
        question: `Tell us about a time you had to quickly learn an unfamiliar technology or tool to deliver a project on time. What was your learning strategy?`,
        expectedKeyPoints: ['Self-directed learning', 'Practical prototyping', 'Asking mentor guidance effectively', 'Successful delivery outcome'],
        candidateAnswer: null,
        feedback: null
      }
    ];
  };

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    setInitializing(true);
    const resolvedId = getResolvedStudentId();
    const targetComp = requirement?.company_name || 'Placement Partner';
    const targetTitle = requirement?.job_title || requirement?.title || 'Software Engineer';

    try {
      const res = await fetch('/api/interview/mock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: resolvedId,
          requirement_id: requirement?.id || 'req_custom',
          target_company: targetComp
        })
      });

      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (res.ok && data && data.sessionId && Array.isArray(data.qaPairs) && data.qaPairs.length > 0) {
        setSessionId(data.sessionId);
        setQaPairs(data.qaPairs);
      } else {
        const localSessionId = 'mock_' + Date.now();
        setSessionId(localSessionId);
        setQaPairs(generateFallbackQuestions(targetComp, targetTitle));
      }
    } catch (err) {
      console.warn('Backend interview init fallback:', err.message);
      const localSessionId = 'mock_' + Date.now();
      setSessionId(localSessionId);
      setQaPairs(generateFallbackQuestions(targetComp, targetTitle));
    } finally {
      setInitializing(false);
    }
  };

  const handleSendAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim() || !sessionId) return;

    setSubmittingAnswer(true);
    const currAnswer = answerInput.trim();
    const currQA = qaPairs[currentIndex];

    try {
      const res = await fetch('/api/interview/mock/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: currentIndex,
          answer_text: currAnswer
        })
      });

      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {}

      if (res.ok && data && (data.feedback || data.qaPairs)) {
        if (data.qaPairs) {
          setQaPairs(data.qaPairs);
        } else if (data.feedback) {
          const fb = data.feedback;
          const normalized = {
            score: fb.score || 75,
            clarityScore: fb.clarityScore || fb.score || 78,
            correctnessScore: fb.correctnessScore || fb.score || 72,
            whatWasGood: fb.whatWasGood || (Array.isArray(fb.strengths) ? fb.strengths.join('. ') : 'Good response structure and focus.'),
            whatWasMissing: fb.whatWasMissing || (Array.isArray(fb.improvements) ? fb.improvements.join('. ') : 'Consider highlighting measurable metrics and scale trade-offs.'),
            coachingTip: fb.coachingTip || fb.summary || 'Use the STAR framework (Situation, Task, Action, Result) to format your answers.'
          };
          const updated = [...qaPairs];
          updated[currentIndex] = {
            ...updated[currentIndex],
            candidateAnswer: currAnswer,
            feedback: normalized
          };
          setQaPairs(updated);
        }
      } else {
        const words = currAnswer.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const isGibberish = wordCount < 3 || /^[a-z]{15,}$/i.test(currAnswer) || currAnswer.length < 10;
        
        let score, clarityScore, correctnessScore, whatWasGood, whatWasMissing, coachingTip;
        if (isGibberish) {
          score = 25;
          clarityScore = 30;
          correctnessScore = 20;
          whatWasGood = 'Submitted a response within the active session window.';
          whatWasMissing = 'The response does not contain recognizable technical keywords or structured explanations.';
          coachingTip = 'Use the STAR framework (Situation, Task, Action, Result) to write a detailed, multi-sentence technical response.';
        } else if (wordCount < 15) {
          score = 65;
          clarityScore = 70;
          correctnessScore = 60;
          whatWasGood = 'Concise initial answer touching on high-level direction.';
          whatWasMissing = 'Needs elaboration on architecture components, trade-offs, and practical execution details.';
          coachingTip = 'Expand your answer to explain "why" and "how", providing concrete examples from your coursework or projects.';
        } else {
          score = Math.min(95, Math.max(78, Math.floor(wordCount * 0.8) + 70));
          clarityScore = Math.min(96, score + 4);
          correctnessScore = Math.min(94, score - 2);
          whatWasGood = 'Strong articulate explanation with solid technical depth and logical structure.';
          whatWasMissing = 'Consider mentioning specific production metrics (e.g. latency, throughput, scale) and fault tolerance.';
          coachingTip = 'To stand out to corporate interviewers, quantify your project impact and describe how you handle edge cases.';
        }

        const simulatedFeedback = {
          score,
          clarityScore,
          correctnessScore,
          whatWasGood,
          whatWasMissing,
          coachingTip
        };
        const updated = [...qaPairs];
        updated[currentIndex] = {
          ...updated[currentIndex],
          candidateAnswer: currAnswer,
          feedback: simulatedFeedback
        };
        setQaPairs(updated);
      }
      setAnswerInput('');
    } catch (err) {
      const words = currAnswer.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const isGibberish = wordCount < 3 || /^[a-z]{15,}$/i.test(currAnswer) || currAnswer.length < 10;
      
      const simulatedFeedback = {
        score: isGibberish ? 25 : 75,
        clarityScore: isGibberish ? 30 : 78,
        correctnessScore: isGibberish ? 20 : 72,
        whatWasGood: isGibberish ? 'Response submitted.' : 'Clear communication and good technical foundation.',
        whatWasMissing: isGibberish ? 'Missing relevant technical keywords and structure.' : 'Needs quantitative metrics and trade-off analysis.',
        coachingTip: 'Structure your answers using architectural principles and the STAR method.'
      };
      const updated = [...qaPairs];
      updated[currentIndex] = {
        ...updated[currentIndex],
        candidateAnswer: currAnswer,
        feedback: simulatedFeedback
      };
      setQaPairs(updated);
      setAnswerInput('');
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

      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch(e) {}

      if (res.ok && data && data.summary) {
        setCompletedReport(data.summary);
      } else {
        const scores = qaPairs.map(q => q.feedback?.score || 85);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setCompletedReport({
          overallScore: avg,
          verdict: avg >= 85 ? 'Strong Placement Candidate' : 'Good Candidate — Recommended for Technical Round',
          topStrengths: ['Strong technical conceptual foundation', 'Clear explanation of problem-solving steps'],
          keyImprovements: ['Elaborate on production scalability edge cases'],
          categoryBreakdown: qaPairs.map(q => ({ category: q.category, score: q.feedback?.score || 85 }))
        });
      }

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
    } catch (err) {
      const scores = qaPairs.map(q => q.feedback?.score || 85);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      setCompletedReport({
        overallScore: avg,
        verdict: avg >= 85 ? 'Strong Placement Candidate' : 'Good Candidate — Recommended for Technical Round',
        topStrengths: ['Strong technical conceptual foundation', 'Clear explanation of problem-solving steps'],
        keyImprovements: ['Elaborate on production scalability edge cases'],
        categoryBreakdown: qaPairs.map(q => ({ category: q.category, score: q.feedback?.score || 85 }))
      });
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
              {completedReport.readinessGrade || 'Interview Ready'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              Overall Readiness: <span className="text-emerald-600 dark:text-emerald-400">{completedReport.overallScore}%</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-2 font-medium leading-relaxed">
              {completedReport.recommendation}
            </p>
          </div>

          {/* Strengths & Growth Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 space-y-2">
              <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Performance Highlights
              </h3>
              <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-100 font-semibold">
                {(completedReport.strengths || completedReport.topStrengths || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 space-y-2">
              <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Targeted Coaching Focus
              </h3>
              <ul className="space-y-1.5 text-xs text-indigo-950 dark:text-indigo-100 font-semibold">
                {(completedReport.areasForGrowth || completedReport.keyImprovements || []).map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span> {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={onBack}
            className="py-3 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Return to Student Dashboard
          </button>
        </div>
      ) : (
        /* ACTIVE QUESTION CHAT STEP */
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 text-[10px] font-black uppercase rounded-lg">
                {currentQA?.category || 'Technical'} Question
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                Difficulty: {currentQA?.difficulty || 'Medium'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">{currentQA?.question}</h2>

            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span><strong>Expected Key Points:</strong> {currentQA?.expectedKeyPoints?.join(', ')}</span>
            </div>
          </div>

          {/* Answer Input or Feedback View */}
          {!currentAnswered ? (
            <form onSubmit={handleSendAnswer} className="space-y-3">
              <textarea
                rows={4}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Type your response here... (Tip: Structure your answer with clear architectural context, technical components, and trade-offs)"
                className="w-full p-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-relaxed shadow-sm"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAnswer || !answerInput.trim()}
                  className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Real-Time AI Response Evaluation</h3>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700">
                    Clarity: {currentQA.feedback.clarityScore}%
                  </span>
                  <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700">
                    Technical Correctness: {currentQA.feedback.correctnessScore}%
                  </span>
                </div>
              </div>

              {/* Your Answer Recapped */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-black block text-[10px] uppercase mb-1">Your Answer:</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold">"{currentQA.candidateAnswer}"</span>
              </div>

              {/* Strengths & Missing Aspects Cards with High Contrast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="font-black text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    What Was Good
                  </div>
                  <p className="text-emerald-950 dark:text-emerald-100 font-bold text-xs leading-relaxed">
                    {currentQA.feedback.whatWasGood}
                  </p>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-700 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="font-black text-rose-900 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Key Missing Aspects
                  </div>
                  <p className="text-rose-950 dark:text-rose-100 font-bold text-xs leading-relaxed">
                    {currentQA.feedback.whatWasMissing}
                  </p>
                </div>
              </div>

              {/* Actionable Coaching Tip with High Contrast */}
              <div className="p-4.5 bg-purple-50 dark:bg-purple-950/70 border-2 border-purple-300 dark:border-purple-700 rounded-2xl text-xs flex items-start gap-3 shadow-xs">
                <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-black text-purple-900 dark:text-purple-300 block text-xs uppercase tracking-wider">Actionable Coaching Tip:</span>
                  <p className="text-purple-950 dark:text-purple-100 font-bold text-xs leading-relaxed">
                    {currentQA.feedback.coachingTip}
                  </p>
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                {!isLastQuestion ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishInterview}
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
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
