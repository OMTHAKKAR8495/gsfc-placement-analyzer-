import { callLLM } from '../llm.js';

export async function evaluateAnswer({ question, expectedKeyPoints = [], candidateAnswer }) {
  const schemaDescription = `{
    "score": number (0 to 100 integer score for this answer),
    "clarityScore": number (0 to 100),
    "correctnessScore": number (0 to 100),
    "whatWasGood": "string summarizing strengths of candidate's answer",
    "whatWasMissing": "string identifying gaps or missed technical aspects",
    "coachingTip": "string with actionable advice for real interview success"
  }`;

  const prompt = `Evaluate the candidate's answer to the following interview question:

Question: ${question}
Expected Key Points: ${expectedKeyPoints.join('; ')}
Candidate Answer: "${candidateAnswer}"

Be constructive, encouraging, and detailed. Provide scores (0-100) for clarity & correctness, highlight strengths, note missing points, and offer a concrete coaching tip.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateAnswerFeedbackFallback(question, candidateAnswer)
  });

  return {
    score: Math.min(100, Math.max(0, Math.round(result.score || 78))),
    clarityScore: Math.min(100, Math.max(0, Math.round(result.clarityScore || 80))),
    correctnessScore: Math.min(100, Math.max(0, Math.round(result.correctnessScore || 75))),
    whatWasGood: result.whatWasGood || "Good structure and confident tone in explaining your approach.",
    whatWasMissing: result.whatWasMissing || "Mentioning specific quantitative metrics or edge-case handling would strengthen the answer.",
    coachingTip: result.coachingTip || "Use the STAR method (Situation, Task, Action, Result) to give a structured narrative."
  };
}

export function generateFinalReadinessSummary(qaPairs = []) {
  if (qaPairs.length === 0) {
    return {
      overallScore: 70,
      readinessGrade: 'Good Progress',
      strengths: ['Active participation'],
      areasForGrowth: ['Complete all questions to unlock detailed summary report'],
      recommendation: 'Practice structured STAR framework responses.'
    };
  }

  const scores = qaPairs.map(p => p.feedback?.score || 70);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let readinessGrade = 'Placement Ready (Top Tier)';
  if (avgScore < 60) readinessGrade = 'Needs Practice';
  else if (avgScore < 80) readinessGrade = 'Interview Ready (Solid)';

  const strengths = [];
  const areasForGrowth = [];

  qaPairs.forEach((pair, idx) => {
    if (pair.feedback?.whatWasGood) {
      strengths.push(`Q${idx + 1}: ${pair.feedback.whatWasGood.slice(0, 80)}...`);
    }
    if (pair.feedback?.whatWasMissing) {
      areasForGrowth.push(`Q${idx + 1}: ${pair.feedback.whatWasMissing.slice(0, 80)}...`);
    }
  });

  return {
    overallScore: avgScore,
    readinessGrade,
    strengths: strengths.slice(0, 3),
    areasForGrowth: areasForGrowth.slice(0, 3),
    recommendation: avgScore >= 80 
      ? 'Exceptional performance! High technical accuracy and clear communication. You are ready for live company rounds.'
      : 'Good foundation. Focus on adding quantifiable metrics and edge-case handling to boost your overall score.'
  };
}

function generateAnswerFeedbackFallback(question, candidateAnswer) {
  const text = (candidateAnswer || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const technicalKeywords = [
    'stateless', 'redis', 'cache', 'caching', 'load balancer', 'load balancing', 'nginx',
    'horizontal', 'scaling', 'scale', 'microservice', 'microservices', 'replica', 'replicas',
    'index', 'indexing', 'queue', 'kafka', 'rabbitmq', 'circuit breaker', 'latency', 'throughput',
    'big-o', 'complexity', 'hashmap', 'tree', 'graph', 'dynamic programming', 'binary search',
    'benchmark', 'profiling', 'memory', 'cpu', 'concurrency', 'deadlock', 'mutex',
    'debugging', 'reproduce', 'logs', 'logger', 'observability', 'grafana', 'prometheus', 'sentry',
    'unit test', 'integration test', 'regression', 'postmortem', 'star', 'situation', 'task',
    'action', 'result', 'prototype', 'documentation', 'mentor', 'docker', 'kubernetes', 'sql', 'nosql'
  ];

  const lowerText = text.toLowerCase();
  const matchedKeywords = technicalKeywords.filter(k => lowerText.includes(k));
  
  const isSingleLongWord = /^[a-z]{12,}$/i.test(text);
  const hasNoSpaces = !text.includes(' ') && text.length > 8;
  const isVeryShort = wordCount < 3;
  const hasZeroTechKeywords = matchedKeywords.length === 0;

  if (isSingleLongWord || hasNoSpaces || isVeryShort || (wordCount < 6 && hasZeroTechKeywords)) {
    return {
      score: 15,
      clarityScore: 20,
      correctnessScore: 10,
      whatWasGood: '❌ Inadequate Response: The answer provided does not address the technical problem asked in this interview question.',
      whatWasMissing: '🔴 Critical Gaps: Expected core architectural concepts, structured reasoning, and relevant technical terminology.',
      coachingTip: '💡 Recommended Answer: "To build a high-concurrency scalable backend, deploy stateless microservices behind an NGINX load balancer, implement Redis caching for frequent queries, optimize DB indices with read replicas, and use message queues (RabbitMQ/Kafka) for asynchronous task processing."'
    };
  }

  if (matchedKeywords.length < 2 && wordCount < 18) {
    return {
      score: 55,
      clarityScore: 62,
      correctnessScore: 50,
      whatWasGood: 'Identified basic high-level intent, but lacks detailed engineering specifics and depth.',
      whatWasMissing: 'Missing key architectural layers: caching strategies (Redis), connection pooling, rate limiting, and concrete database trade-offs.',
      coachingTip: '💡 Pro Tip: Frame your answers using the STAR framework. Name specific tools (e.g. Redis, Docker, PostgreSQL) and explain why you chose them over alternatives.'
    };
  }

  if (matchedKeywords.length >= 4 || (matchedKeywords.length >= 2 && wordCount >= 30)) {
    const score = Math.min(96, Math.max(86, 75 + matchedKeywords.length * 4));
    return {
      score,
      clarityScore: Math.min(98, score + 2),
      correctnessScore: Math.min(95, score - 1),
      whatWasGood: `✅ Excellent Technical Depth: Successfully covered ${matchedKeywords.slice(0, 4).join(', ')} with clear logical structure.`,
      whatWasMissing: 'To make this a 100/100 response, mention quantitative system metrics (e.g. reduced P99 latency from 450ms to 40ms) and automated rollback plans.',
      coachingTip: '💡 Interview Edge: Conclude your answer by discussing how you monitor production health using telemetry (Prometheus/Grafana) and automated alerts.'
    };
  }

  return {
    score: 74,
    clarityScore: 78,
    correctnessScore: 70,
    whatWasGood: `Addressed key aspects of the problem with relevant context (${matchedKeywords.join(', ')}).`,
    whatWasMissing: 'Could elaborate on failover handling, scalability bottlenecks, and concrete benchmarking results.',
    coachingTip: '💡 Next Step: Discuss real-world constraints such as network latency, database lock contention, and cache invalidation strategies.'
  };
}
