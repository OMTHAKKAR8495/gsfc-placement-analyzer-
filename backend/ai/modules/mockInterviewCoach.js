import { callLLM } from '../llm.js';

/**
 * Enterprise AI Mock Interview Evaluation & Multi-Dimensional Scorecard Engine
 */

// Filler words and hesitation markers for speech analytics
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of', 'i mean', 'right?'];

export async function evaluateAnswer({ question, expectedKeyPoints = [], candidateAnswer, speechMetrics = {} }) {
  const answerText = (candidateAnswer || '').trim();
  
  // 1. Compute Speech & Articulation Analytics
  const words = answerText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  const lowerAnswer = answerText.toLowerCase();
  const foundFillers = [];
  let fillerCount = 0;
  
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerAnswer.match(regex);
    if (matches) {
      fillerCount += matches.length;
      foundFillers.push({ word: filler, count: matches.length });
    }
  });

  const durationMinutes = speechMetrics.durationSeconds ? speechMetrics.durationSeconds / 60 : (wordCount / 130);
  const calculatedWpm = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 130;
  const pacingGrade = calculatedWpm >= 110 && calculatedWpm <= 160 ? 'Optimal (110-160 WPM)' : calculatedWpm < 110 ? 'Slow / Hesitant (<110 WPM)' : 'Fast Paced (>160 WPM)';

  // 2. STAR Framework Detection
  const hasSituation = /situation|context|background|project|when|at my|during|while working/i.test(lowerAnswer);
  const hasTask = /task|goal|responsibility|objective|needed to|assigned to|had to/i.test(lowerAnswer);
  const hasAction = /action|implemented|built|developed|designed|coded|optimized|refactored|led|collaborated/i.test(lowerAnswer);
  const hasResult = /result|outcome|improved|reduced|increased|achieved|delivered|percent|%|saved|boosted|learned/i.test(lowerAnswer);
  
  let starElementsCount = (hasSituation ? 1 : 0) + (hasTask ? 1 : 0) + (hasAction ? 1 : 0) + (hasResult ? 1 : 0);
  const starScore = Math.round((starElementsCount / 4) * 100);

  const schemaDescription = `{
    "score": number (0 to 100 overall integer score),
    "clarityScore": number (0 to 100 communication clarity),
    "correctnessScore": number (0 to 100 technical correctness & depth),
    "technicalDepthScore": number (0 to 100 depth of engineering reasoning),
    "whatWasGood": "string summarizing strengths of candidate's answer",
    "whatWasMissing": "string identifying gaps or missed technical aspects",
    "coachingTip": "string with actionable advice for real interview success",
    "suggestedNextDifficulty": "level_1_diagnostic | level_2_standard | level_3_advanced"
  }`;

  const prompt = `You are a Principal Tech Lead and Executive Interview Coach for GSFC University Campus Placements.
Evaluate the candidate's response to the following interview question with rigor and constructive precision:

Question: ${question}
Expected Key Points: ${expectedKeyPoints.join('; ')}
Candidate Answer: "${candidateAnswer}"

Candidate Speech Analytics:
- Word Count: ${wordCount} words
- Filler Words Detected: ${fillerCount} (${foundFillers.map(f => `${f.word}: ${f.count}`).join(', ') || 'None'})
- Estimated WPM: ${calculatedWpm} WPM (${pacingGrade})
- STAR Elements Detected: Situation (${hasSituation}), Task (${hasTask}), Action (${hasAction}), Result (${hasResult})

Provide comprehensive feedback with exact scores (0-100) for clarity, correctness, and technical depth. Highlight what was good, what was missing, an actionable coaching tip, and recommend the next adaptive difficulty level.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateAnswerFeedbackFallback(question, candidateAnswer, { starScore, fillerCount, calculatedWpm })
  });

  const overallScore = Math.min(100, Math.max(0, Math.round(result.score || 75)));
  
  // Determine adaptive difficulty for subsequent question
  let adaptiveDifficulty = result.suggestedNextDifficulty;
  if (!adaptiveDifficulty) {
    if (overallScore >= 85) adaptiveDifficulty = 'level_3_advanced';
    else if (overallScore >= 60) adaptiveDifficulty = 'level_2_standard';
    else adaptiveDifficulty = 'level_1_diagnostic';
  }

  return {
    score: overallScore,
    clarityScore: Math.min(100, Math.max(0, Math.round(result.clarityScore || 78))),
    correctnessScore: Math.min(100, Math.max(0, Math.round(result.correctnessScore || 75))),
    technicalDepthScore: Math.min(100, Math.max(0, Math.round(result.technicalDepthScore || 72))),
    starScore: Math.max(starScore, 40),
    whatWasGood: result.whatWasGood || "Clear logical articulation with direct focus on the problem statement.",
    whatWasMissing: result.whatWasMissing || "Could delve deeper into specific trade-offs and quantitative performance metrics.",
    coachingTip: result.coachingTip || "Structure your technical responses: Problem -> Architectural Decision -> Trade-off -> Measurable Result.",
    suggestedNextDifficulty: adaptiveDifficulty,
    speechAnalytics: {
      wordCount,
      fillerCount,
      fillerWords: foundFillers,
      wpm: calculatedWpm,
      pacingGrade,
      starBreakdown: {
        hasSituation,
        hasTask,
        hasAction,
        hasResult
      }
    }
  };
}

/**
 * Generates an Enterprise Multi-Dimensional Scorecard & Personalized Post-Interview Study Sprint
 */
export function generateFinalReadinessSummary(qaPairs = [], sessionContext = {}) {
  if (qaPairs.length === 0) {
    return {
      overallScore: 70,
      readinessGrade: 'In Progress',
      strengths: ['Active participation'],
      areasForGrowth: ['Complete session to unlock comprehensive diagnostic scorecard'],
      recommendation: 'Practice structured responses with the STAR framework.',
      scorecardDimensions: {
        starCoverage: 70,
        technicalDepth: 70,
        communicationClarity: 70,
        problemSolving: 70,
        pacingAndConfidence: 75
      },
      personalizedStudyPlan: generatePersonalizedStudyPlan([])
    };
  }

  const scores = qaPairs.map(p => p.feedback?.score || 70);
  const clarityScores = qaPairs.map(p => p.feedback?.clarityScore || 75);
  const technicalScores = qaPairs.map(p => p.feedback?.technicalDepthScore || p.feedback?.correctnessScore || 70);
  const starScores = qaPairs.map(p => p.feedback?.starScore || 65);
  const wpms = qaPairs.map(p => p.feedback?.speechAnalytics?.wpm || 130);
  const totalFillers = qaPairs.reduce((sum, p) => sum + (p.feedback?.speechAnalytics?.fillerCount || 0), 0);

  const avgOverall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgClarity = Math.round(clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length);
  const avgTechnical = Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length);
  const avgStar = Math.round(starScores.reduce((a, b) => a + b, 0) / starScores.length);
  const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);

  // Pacing and confidence score derived from WPM variance and filler word rate
  const pacingScore = Math.max(50, Math.min(100, Math.round(100 - (totalFillers * 4) - (Math.abs(135 - avgWpm) * 0.4))));

  let readinessGrade = 'Placement Ready (Top Tier)';
  if (avgOverall < 60) readinessGrade = 'Needs Targeted Remediation';
  else if (avgOverall < 78) readinessGrade = 'Interview Ready (Solid)';
  else if (avgOverall >= 90) readinessGrade = 'Exceptional (Day-1 Placement)';

  const strengths = [];
  const areasForGrowth = [];

  qaPairs.forEach((pair, idx) => {
    if (pair.feedback?.whatWasGood) {
      strengths.push(`Q${idx + 1}: ${pair.feedback.whatWasGood.slice(0, 90)}...`);
    }
    if (pair.feedback?.whatWasMissing) {
      areasForGrowth.push(`Q${idx + 1}: ${pair.feedback.whatWasMissing.slice(0, 90)}...`);
    }
  });

  const scorecardDimensions = {
    starCoverage: avgStar,
    technicalDepth: avgTechnical,
    communicationClarity: avgClarity,
    problemSolving: Math.round((avgTechnical + avgOverall) / 2),
    pacingAndConfidence: pacingScore
  };

  const personalizedStudyPlan = generatePersonalizedStudyPlan(qaPairs, sessionContext);

  return {
    overallScore: avgOverall,
    readinessGrade,
    strengths: strengths.slice(0, 4),
    areasForGrowth: areasForGrowth.slice(0, 4),
    recommendation: avgOverall >= 80 
      ? 'Outstanding technical poise and structured articulation. You demonstrate the maturity expected in Tier-1 technical rounds.'
      : 'Promising technical foundation. Execute the attached 3-day study sprint to close identified architecture and STAR articulation gaps.',
    scorecardDimensions,
    speechSummary: {
      averageWpm: avgWpm,
      totalFillerWords: totalFillers,
      pacingAssessment: avgWpm >= 115 && avgWpm <= 155 ? 'Ideal conversational pace' : 'Work on steady pacing without filler pauses'
    },
    personalizedStudyPlan
  };
}

/**
 * Synthesizes identified gaps into an actionable 3-Day Rapid Preparation Sprint
 */
export function generatePersonalizedStudyPlan(qaPairs = [], sessionContext = {}) {
  const targetCompany = sessionContext.target_company || 'Tier-1 Hiring Partner';
  const weakTopics = [];

  qaPairs.forEach(p => {
    if (p.feedback?.score < 75 && p.question) {
      weakTopics.push(p.question.slice(0, 60));
    }
  });

  return {
    targetCompany,
    generatedAt: new Date().toISOString(),
    sprintSchedule: [
      {
        day: 'Day 1: Core Architecture & Systems Foundations',
        focus: 'Close fundamental technical gaps identified in mock questions',
        tasks: [
          'Review high-concurrency stateless microservice design patterns and Redis caching layers.',
          'Practice explaining database indexing, query execution plans, and read replicas.',
          'Document 2 real university projects highlighting quantifiable impact (e.g. latency, throughput).'
        ],
        estimatedTimeMinutes: 90
      },
      {
        day: 'Day 2: STAR Framework & Behavioral Precision',
        focus: 'Eliminate filler words and structure problem-action-result narratives',
        tasks: [
          'Draft 3 STAR stories: Conflict resolution, tight deadline delivery, and technical failure recovery.',
          'Record a 2-minute self-introduction voice memo, maintaining 120-140 WPM without filler pauses.',
          'Review company-specific engineering culture and core product offerings.'
        ],
        estimatedTimeMinutes: 60
      },
      {
        day: 'Day 3: Live Simulation & Edge-Case Defense',
        focus: 'End-to-end rehearsal under time pressure',
        tasks: [
          'Execute a full 5-question Adaptive AI Mock Interview in Level 3 Advanced mode.',
          'Practice handling ambiguous problem statements by clarifying requirements upfront.',
          'Review TPC company dossiers and NIRF benchmark salary data for confident negotiation.'
        ],
        estimatedTimeMinutes: 75
      }
    ],
    recommendedResources: [
      { title: 'System Design Primer (Interactive Blueprint)', type: 'Architecture Guide', url: '#guide' },
      { title: 'STAR Behavioral Story Bank Template', type: 'Interview Template', url: '#star-bank' },
      { title: `${targetCompany} Past Interview Question Repository`, type: 'Company Bank', url: '#question-bank' }
    ]
  };
}

function generateAnswerFeedbackFallback(question, candidateAnswer, meta = {}) {
  const text = (candidateAnswer || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const technicalKeywords = [
    'stateless', 'redis', 'cache', 'caching', 'load balancer', 'nginx', 'microservice',
    'replica', 'index', 'indexing', 'queue', 'kafka', 'rabbitmq', 'circuit breaker', 'latency',
    'throughput', 'big-o', 'hashmap', 'tree', 'concurrency', 'mutex', 'unit test', 'docker', 'sql'
  ];

  const lowerText = text.toLowerCase();
  const matchedCount = technicalKeywords.filter(k => lowerText.includes(k)).length;
  
  if (wordCount < 6 || (wordCount < 12 && matchedCount === 0)) {
    return {
      score: 30,
      clarityScore: 35,
      correctnessScore: 25,
      technicalDepthScore: 20,
      whatWasGood: 'Attempted response, but content was too brief for technical assessment.',
      whatWasMissing: 'Missing core engineering principles, structured trade-offs, and tool justifications.',
      coachingTip: 'Use the STAR framework to explain the problem, your architectural decision, and the result.',
      suggestedNextDifficulty: 'level_1_diagnostic'
    };
  }

  const score = Math.min(94, Math.max(55, Math.round(55 + (matchedCount * 7) + (meta.starScore ? meta.starScore * 0.25 : 10))));

  return {
    score,
    clarityScore: Math.min(95, Math.max(60, Math.round(60 + (wordCount > 25 ? 20 : 10)))),
    correctnessScore: score,
    technicalDepthScore: Math.min(92, Math.max(50, Math.round(50 + (matchedCount * 8)))),
    whatWasGood: 'Good communication flow and clear intent addressing the core requirements.',
    whatWasMissing: 'Could expand on edge-case failure modes and quantitative benchmarking metrics.',
    coachingTip: 'Quantify your achievements (e.g. "reduced latency by 35%") to make technical claims concrete.',
    suggestedNextDifficulty: score >= 80 ? 'level_3_advanced' : 'level_2_standard'
  };
}
