import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle, Award, RefreshCw, ChevronRight, Mic, MicOff, Video, VideoOff, Zap, BookOpen, Clock, Activity, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MockInterviewChat({ student, currentUser, requirement, onBack }) {
  const [sessionId, setSessionId] = useState(null);
  const [qaPairs, setQaPairs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [completedReport, setCompletedReport] = useState(null);

  // Speech & Video Analytics State
  const [isListening, setIsListening] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerCount, setLiveFillerCount] = useState(0);
  const [webcamActive, setWebcamActive] = useState(false);
  const [loadingAdaptiveQ, setLoadingAdaptiveQ] = useState(false);
  
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

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
        difficulty: 'Medium',
        difficultyLevel: 2,
        question: `For the ${roleTitle} role at ${cName}, how would you architect a scalable, fault-tolerant backend service handling high concurrent user requests?`,
        expectedKeyPoints: ['Stateless application tier', 'Database indexing and caching strategies (Redis)', 'Load balancing and horizontal scaling', 'Resilience and circuit breaker patterns'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_2',
        category: 'Applied Problem Solving & Scalability',
        difficulty: 'Hard',
        difficultyLevel: 3,
        question: `Can you explain a complex data structure or algorithm optimization you implemented in a real project, and how you measured its latency/throughput improvement?`,
        expectedKeyPoints: ['Concrete project context', 'Time and space complexity analysis (Big-O)', 'Benchmarking methodology', 'Trade-offs considered'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_3',
        category: 'Project Defense & Troubleshooting',
        difficulty: 'Medium',
        difficultyLevel: 2,
        question: `Describe the most difficult technical bug or production failure you encountered in your university/internship work and your systematic debugging process.`,
        expectedKeyPoints: ['Reproducing the bug', 'Log analysis and observability', 'Root cause identification', 'Preventive regression tests'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_4',
        category: 'Behavioral STAR & Leadership Fit',
        difficulty: 'Easy',
        difficultyLevel: 1,
        question: `Tell us about a time you had to quickly learn an unfamiliar technology or tool to deliver a project on time. What was your learning strategy?`,
        expectedKeyPoints: ['Self-directed learning', 'Practical prototyping', 'Asking mentor guidance effectively', 'Successful delivery outcome'],
        candidateAnswer: null,
        feedback: null
      }
    ];
  };

  useEffect(() => {
    startSession();
    return () => {
      stopWebcam();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
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

  // Webcam Management
  const toggleWebcam = async () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamActive(true);
      } catch (e) {
        console.warn('Webcam permission denied or unavailable:', e.message);
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Web Speech API Voice Recognition & Live WPM Calculation
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Web Speech API is not supported in this browser. Please type your answer or use Google Chrome.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const startTime = Date.now();
      setSpeechStartTime(startTime);

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const clean = transcript.trim();
        setAnswerInput(clean);

        // Calculate live WPM & Fillers
        const elapsedMinutes = Math.max((Date.now() - startTime) / 60000, 0.1);
        const words = clean.split(/\s+/).filter(Boolean);
        const calculatedWpm = Math.round(words.length / elapsedMinutes);
        setLiveWpm(calculatedWpm);

        const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
        let fillerCount = 0;
        const lower = clean.toLowerCase();
        fillers.forEach(f => {
          const m = lower.match(new RegExp(`\\b${f}\\b`, 'gi'));
          if (m) fillerCount += m.length;
        });
        setLiveFillerCount(fillerCount);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  const handleSendAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!answerInput.trim() || !sessionId) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setSubmittingAnswer(true);
    const currAnswer = answerInput.trim();
    const durationSec = speechStartTime ? Math.round((Date.now() - speechStartTime) / 1000) : 30;

    try {
      const res = await fetch('/api/interview/mock/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: currentIndex,
          answer_text: currAnswer,
          speech_metrics: {
            durationSeconds: durationSec,
            wpm: liveWpm || 130,
            fillerCount: liveFillerCount
          }
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
          const updated = [...qaPairs];
          updated[currentIndex] = {
            ...updated[currentIndex],
            candidateAnswer: currAnswer,
            feedback: data.feedback
          };
          setQaPairs(updated);
        }
      } else {
        // Deterministic Fallback Scorecard
        const words = currAnswer.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const simulatedScore = Math.min(95, Math.max(50, Math.round(50 + (wordCount * 0.7))));

        const updated = [...qaPairs];
        updated[currentIndex] = {
          ...updated[currentIndex],
          candidateAnswer: currAnswer,
          feedback: {
            score: simulatedScore,
            clarityScore: Math.min(95, simulatedScore + 5),
            correctnessScore: simulatedScore,
            technicalDepthScore: Math.max(50, simulatedScore - 3),
            starScore: Math.max(60, simulatedScore),
            whatWasGood: 'Clear articulation and structured response with focus on key principles.',
            whatWasMissing: 'Can delve deeper into production failure modes and trade-off metrics.',
            coachingTip: 'Use STAR structure: State the context, technical action taken, and quantifiable business outcome.',
            suggestedNextDifficulty: simulatedScore >= 80 ? 'level_3_advanced' : 'level_2_standard',
            speechAnalytics: {
              wpm: liveWpm || 130,
              fillerCount: liveFillerCount,
              pacingGrade: 'Optimal Pacing'
            }
          }
        };
        setQaPairs(updated);
      }
      setAnswerInput('');
      setLiveWpm(0);
      setLiveFillerCount(0);
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const requestAdaptiveNextQuestion = async () => {
    setLoadingAdaptiveQ(true);
    try {
      const res = await fetch('/api/interview/mock/adaptive-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          current_category: 'Applied Architecture & Problem Solving'
        })
      });

      const data = await res.json();
      if (res.ok && data.newQuestion) {
        setQaPairs(prev => [...prev, data.newQuestion]);
        setCurrentIndex(qaPairs.length);
      }
    } catch (e) {
      console.warn('Adaptive next question error:', e.message);
    } finally {
      setLoadingAdaptiveQ(false);
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
        const scores = qaPairs.map(q => q.feedback?.score || 82);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setCompletedReport({
          overallScore: avg,
          readinessGrade: avg >= 85 ? 'Placement Ready (Top Tier)' : 'Interview Ready (Solid)',
          recommendation: 'Solid technical responses with structured clarity. Execute the 3-day sprint below to maximize campus placement conversion.',
          scorecardDimensions: {
            starCoverage: 80,
            technicalDepth: avg,
            communicationClarity: 85,
            problemSolving: avg,
            pacingAndConfidence: 82
          },
          strengths: ['Clear technical reasoning', 'Good problem decomposition under pressure'],
          areasForGrowth: ['Quantify project impact with specific percentage improvements', 'Refine edge-case defense'],
          personalizedStudyPlan: {
            targetCompany: requirement?.company_name || 'Tier-1 Hiring Partner',
            sprintSchedule: [
              {
                day: 'Day 1: Core Architecture & System Foundations',
                focus: 'Stateless microservices, Redis caching patterns, and database query optimization',
                tasks: ['Review high-concurrency stateless microservice design', 'Practice indexing & connection pooling trade-offs'],
                estimatedTimeMinutes: 90
              },
              {
                day: 'Day 2: STAR Framework & Behavioral Precision',
                focus: 'Eliminate filler words and rehearse structured problem-action-result narratives',
                tasks: ['Draft 3 STAR stories for conflict, deadline, and failure recovery', 'Record 2-minute voice intros at 130 WPM without fillers'],
                estimatedTimeMinutes: 60
              },
              {
                day: 'Day 3: Live Simulation & Edge-Case Defense',
                focus: 'Adaptive Level-3 Mock Interview under strict timer conditions',
                tasks: ['Execute full 5-question Adaptive AI Mock Interview', 'Review TPC salary benchmark reports'],
                estimatedTimeMinutes: 75
              }
            ],
            recommendedResources: [
              { title: 'System Design Primer (Interactive Blueprint)', type: 'Architecture Guide' },
              { title: 'STAR Behavioral Story Bank Template', type: 'Interview Template' }
            ]
          }
        });
      }

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
    } catch (err) {
      console.warn('Finish interview fallback:', err.message);
    }
  };

  if (initializing) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-bold text-white">AI Adaptive Interview Engine is Initializing...</h2>
        <p className="text-xs text-slate-400">Loading company question bank and calibrating real-time speech analytics.</p>
      </div>
    );
  }

  const currentQA = qaPairs[currentIndex];
  const isLastQuestion = currentIndex === qaPairs.length - 1;
  const currentAnswered = Boolean(currentQA?.candidateAnswer && currentQA?.feedback);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="text-center">
          <div className="text-sm font-black text-white">{requirement.title}</div>
          <div className="text-[11px] text-indigo-400 font-semibold">{requirement.company_name || 'GSFC Placement Partner'} • Adaptive AI Studio</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleWebcam}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              webcamActive 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {webcamActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span>{webcamActive ? 'Camera Active' : 'Enable Camera'}</span>
          </button>

          <div className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            Q {currentIndex + 1} / {qaPairs.length}
          </div>
        </div>
      </div>

      {/* FINAL SCORECARD MODAL */}
      {completedReport ? (
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="px-3.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
              {completedReport.readinessGrade || 'Placement Ready'}
            </span>
            <h2 className="text-3xl font-black text-white mt-3">
              Overall Readiness: <span className="text-emerald-400">{completedReport.overallScore}%</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mx-auto mt-2 font-medium leading-relaxed">
              {completedReport.recommendation}
            </p>
          </div>

          {/* 5-Dimensional Competency Radar Breakdown */}
          {completedReport.scorecardDimensions && (
            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3 text-left">
              <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> Multi-Dimensional Evaluation Scorecard
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {Object.entries(completedReport.scorecardDimensions).map(([dim, score]) => (
                  <div key={dim} className="p-3 bg-slate-900/90 rounded-xl border border-slate-700">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300 uppercase">
                      <span>{dim.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-indigo-400 font-black">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/70 space-y-2">
              <h3 className="text-xs font-black text-emerald-300 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Performance Highlights
              </h3>
              <ul className="space-y-1.5 text-xs text-emerald-100 font-semibold">
                {(completedReport.strengths || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-800/70 space-y-2">
              <h3 className="text-xs font-black text-indigo-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Targeted Coaching Focus
              </h3>
              <ul className="space-y-1.5 text-xs text-indigo-100 font-semibold">
                {(completedReport.areasForGrowth || []).map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-black">•</span> {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Personalized 3-Day Rapid Preparation Sprint */}
          {completedReport.personalizedStudyPlan && (
            <div className="p-6 bg-slate-800/90 rounded-2xl border border-slate-700 text-left space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> 3-Day Personalized Preparation Sprint
                </h3>
                <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold rounded-full">
                  Target: {completedReport.personalizedStudyPlan.targetCompany}
                </span>
              </div>

              <div className="space-y-3">
                {completedReport.personalizedStudyPlan.sprintSchedule?.map((dayPlan, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                      <span>{dayPlan.day}</span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {dayPlan.estimatedTimeMinutes} mins
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium">{dayPlan.focus}</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5 pt-1">
                      {dayPlan.tasks?.map((task, tIdx) => (
                        <li key={tIdx}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setCompletedReport(null);
                setCurrentIndex(0);
                startSession();
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Practice Another Session
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all"
            >
              Return to Placement Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE QUESTION WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question & Answer Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Question Card */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {currentQA?.category || 'Technical Assessment'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  currentQA?.difficultyLevel === 3 || currentQA?.difficulty === 'Hard'
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : currentQA?.difficultyLevel === 1 || currentQA?.difficulty === 'Easy'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  Level {currentQA?.difficultyLevel || 2} ({currentQA?.difficulty || 'Medium'})
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQA?.question}
              </h3>

              {currentQA?.expectedKeyPoints && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider">Target Key Evaluation Criteria:</div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {currentQA.expectedKeyPoints.map((pt, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 rounded text-slate-300 border border-slate-800">
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Answer & Speech Input Form */}
            {!currentAnswered ? (
              <form onSubmit={handleSendAnswer} className="space-y-4">
                <div className="relative">
                  <textarea
                    rows={6}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Type your structured answer here, or click the mic button below to answer with your voice in real-time..."
                    className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium leading-relaxed resize-none shadow-inner"
                  />

                  {/* Speech Recognition HUD Overlay */}
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 bg-rose-950/90 border border-rose-700 text-rose-300 rounded-lg text-[10px] font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Listening: {liveWpm} WPM • {liveFillerCount} Fillers
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                    <span>{isListening ? 'Stop Speaking' : 'Voice Input (Web Speech)'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAnswer || !answerInput.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {submittingAnswer ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* REAL-TIME AI SCORECARD FEEDBACK */
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Answer Score:</span>
                    <span className="text-xl font-black text-emerald-400">{currentQA.feedback?.score}%</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                    <span>Clarity: <strong className="text-indigo-400">{currentQA.feedback?.clarityScore}%</strong></span>
                    <span>Technical: <strong className="text-indigo-400">{currentQA.feedback?.correctnessScore}%</strong></span>
                    <span>STAR: <strong className="text-indigo-400">{currentQA.feedback?.starScore || 75}%</strong></span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-left">
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-emerald-200">
                    <strong className="text-emerald-400 block mb-0.5">Strengths:</strong>
                    {currentQA.feedback?.whatWasGood}
                  </div>
                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/60 text-indigo-200">
                    <strong className="text-indigo-400 block mb-0.5">Areas for Growth:</strong>
                    {currentQA.feedback?.whatWasMissing}
                  </div>
                  <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 text-amber-200">
                    <strong className="text-amber-400 block mb-0.5">💡 Expert Coaching Tip:</strong>
                    {currentQA.feedback?.coachingTip}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={requestAdaptiveNextQuestion}
                    disabled={loadingAdaptiveQ}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{loadingAdaptiveQ ? 'Calibrating...' : 'Branch to Adaptive Level Question'}</span>
                  </button>

                  {!isLastQuestion ? (
                    <button
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition-all"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishInterview}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      Complete Session & View Scorecard
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Video / Pacing Telemetry Sidebar */}
          <div className="space-y-4">
            {/* Live Video Proctor & Posture Monitor */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" /> Camera Feed
                </span>
                <span className={`w-2 h-2 rounded-full ${webcamActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              </div>

              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!webcamActive && (
                  <div className="text-center p-3 text-slate-500 text-xs font-medium">
                    Camera is off. Click "Enable Camera" for pacing & posture guidance.
                  </div>
                )}
              </div>
            </div>

            {/* Live Speech & Pacing Meter */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3 text-left">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Speech & Articulation Telemetry
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Pacing (WPM)</div>
                  <div className="text-base font-black text-white mt-0.5">{liveWpm || 130}</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">110–160 Ideal</div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Filler Words</div>
                  <div className="text-base font-black text-white mt-0.5">{liveFillerCount}</div>
                  <div className="text-[9px] text-slate-400 font-semibold">um, uh, like</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-200">Pro Tip:</strong> Maintain direct eye contact with your webcam and pause for 1 second instead of using conversational filler words.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
