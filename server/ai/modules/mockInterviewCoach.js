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
  const answerLength = (candidateAnswer || '').trim().length;

  if (answerLength < 15) {
    return {
      score: 40,
      clarityScore: 50,
      correctnessScore: 35,
      whatWasGood: "Brief initiation of response.",
      whatWasMissing: "The answer is too brief and lacks technical depth and examples.",
      coachingTip: "Elaborate with at least 3-4 detailed sentences explaining the 'why' and 'how'."
    };
  }

  const score = Math.min(95, 65 + Math.min(30, Math.floor(answerLength / 10)));

  return {
    score,
    clarityScore: Math.min(100, score + 5),
    correctnessScore: score,
    whatWasGood: "Demonstrated clear technical vocabulary and relevant domain concepts.",
    whatWasMissing: "Could expand on error handling, security considerations, or performance benchmarks.",
    coachingTip: "Highlight trade-offs (e.g. speed vs memory consumption) to show senior engineering maturity."
  };
}
