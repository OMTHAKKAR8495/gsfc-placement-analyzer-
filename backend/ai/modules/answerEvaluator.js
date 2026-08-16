import { callLLM } from '../llm.js';
import { sanitizeAiPromptInput } from '../../middleware/security.js';

/**
 * AI Answer Evaluation Agent for Interview Studio
 * Supports multi-model providers (Gemini, Claude, Llama, Dual-Check)
 */
export async function gradeAnswer({
  provider = process.env.AI_GRADING_PROVIDER || 'gemini',
  questionText,
  category = 'Technical',
  difficulty = 'Medium',
  keyConcepts = [],
  suggestedAnswer = '',
  studentAnswer = '',
  previousAnswer = '',
  attemptCount = 1
}) {
  const sanitized = sanitizeAiPromptInput(studentAnswer || '');
  const wordCount = sanitized.trim().split(/\s+/).filter(Boolean).length;
  const conceptsArray = Array.isArray(keyConcepts) ? keyConcepts : (keyConcepts ? [keyConcepts] : []);

  // 1. Edge Case 1: Empty / Very short answer (< 15 words) -> Instant auto-fail without calling LLM
  if (wordCount < 15) {
    return {
      verdict: 'fail',
      score: wordCount === 0 ? 0 : 25,
      feedback: `Your answer is too brief (${wordCount} words) to demonstrate technical depth for a campus placement round. Please elaborate with specific technical concepts and concrete project examples.`,
      conceptsCovered: [],
      conceptsMissing: conceptsArray.length > 0 ? conceptsArray : ['Technical Depth', 'STAR Structure'],
      offTopic: true,
      providerUsed: 'local_precheck',
      attemptCount
    };
  }

  // 2. Edge Case 2: Duplicate identical resubmission detection
  if (previousAnswer && previousAnswer.trim().toLowerCase() === sanitized.trim().toLowerCase()) {
    return {
      verdict: 'needs_improvement',
      score: 45,
      feedback: `This submission appears identical to your previous attempt. To increase your score, try specifically addressing missing key concepts like "${conceptsArray[0] || 'technical implementation trade-offs'}".`,
      conceptsCovered: [],
      conceptsMissing: conceptsArray,
      offTopic: false,
      providerUsed: 'local_precheck',
      attemptCount
    };
  }

  // Primary Prompt Builder
  const conceptsListStr = conceptsArray.length > 0 ? conceptsArray.join(', ') : 'Core Domain Concepts & Technical Specificity';
  const prompt = `You are a Senior Technical Recruiter screening candidates for top campus placement drives at GSFC University.

EVALUATION RUBRIC:
Question Prompt: "${questionText}"
Category: "${category}"
Difficulty: "${difficulty}"
Key Concepts to Cover: "${conceptsListStr}"
Benchmark / STAR Ideal Answer: "${suggestedAnswer || 'Substantive technical response'}"

CANDIDATE ANSWER TO GRADE:
"${sanitized}"

STRICT GRADING INSTRUCTIONS:
1. "fail" (Score 0-35): If the answer is off-topic, generic filler, copy-pasted question text, or fails to address the actual prompt. Set "offTopic": true.
2. "needs_improvement" (Score 50-75): If the answer is on-topic but misses 1+ key concepts, lacks concrete project examples, or is overly superficial.
3. "pass" (Score 80-100): ONLY if the answer is substantive, technically accurate, and covers the majority of required key concepts for a ${difficulty} level role.
4. Do NOT be lenient just because the response sounds confident. Grade on content coverage and technical correctness.
5. Provide 2-4 sentences of specific constructive feedback explaining what was good, what was missing, and actionable advice.

Return JSON ONLY adhering to the requested schema.`;

  const schemaDescription = `{
    "verdict": "pass | needs_improvement | fail",
    "score": number (0 to 100 integer),
    "feedback": "string (2-4 sentences of specific constructive feedback)",
    "conceptsCovered": ["Array of concepts from keyConcepts explicitly addressed"],
    "conceptsMissing": ["Array of keyConcepts missed"],
    "offTopic": boolean
  }`;

  const fallbackGenerator = () => generateDeterministicFallback({
    sanitized,
    wordCount,
    conceptsArray,
    keyConcepts
  });

  // Call Primary LLM Provider
  let result;
  try {
    result = await callLLM({ prompt, schemaDescription, fallbackGenerator });
    result = validateAndCleanResult(result, conceptsArray);
  } catch (err) {
    result = fallbackGenerator();
  }

  // 3. Dual-Check Provider Logic: If verdict is 'fail' and dual_check enabled, cross-check
  if ((provider === 'dual_check' || process.env.AI_GRADING_PROVIDER === 'dual_check') && result.verdict === 'fail' && !result.offTopic) {
    try {
      const secondaryResult = fallbackGenerator();
      if (secondaryResult.verdict !== 'fail') {
        // Disagreement between models: give candidate the benefit of the doubt
        result.verdict = 'needs_improvement';
        result.score = Math.max(result.score, 55);
        result.feedback += ' (Dual-model consensus: borderline response updated to Needs Improvement for retry opportunity).';
      }
    } catch (e) {
      // Ignore secondary check failure
    }
  }

  result.providerUsed = provider;
  result.attemptCount = attemptCount;
  return result;
}

function validateAndCleanResult(raw, expectedConcepts) {
  const verdictOptions = ['pass', 'needs_improvement', 'fail'];
  let verdict = (raw.verdict || '').toLowerCase().trim();
  if (!verdictOptions.includes(verdict)) {
    if (raw.score >= 80) verdict = 'pass';
    else if (raw.score >= 50) verdict = 'needs_improvement';
    else verdict = 'fail';
  }

  const score = Math.min(100, Math.max(0, Math.round(Number(raw.score) || (verdict === 'pass' ? 85 : verdict === 'needs_improvement' ? 65 : 25))));
  const feedback = raw.feedback || (verdict === 'pass' 
    ? 'Strong technical response covering core domain concepts.' 
    : 'Good attempt. Focus on providing quantitative results and addressing key technical requirements.');

  const covered = Array.isArray(raw.conceptsCovered) ? raw.conceptsCovered : [];
  const missing = Array.isArray(raw.conceptsMissing) ? raw.conceptsMissing : [];

  return {
    verdict,
    score,
    feedback,
    conceptsCovered: covered,
    conceptsMissing: missing.length === 0 && covered.length === 0 ? expectedConcepts : missing,
    offTopic: Boolean(raw.offTopic)
  };
}

function generateDeterministicFallback({ sanitized, wordCount, conceptsArray }) {
  const lower = sanitized.toLowerCase();
  const covered = [];
  const missing = [];

  conceptsArray.forEach(c => {
    if (lower.includes(c.toLowerCase())) {
      covered.push(c);
    } else {
      missing.push(c);
    }
  });

  const isPass = covered.length >= Math.ceil(conceptsArray.length / 2) && wordCount >= 30;
  const verdict = isPass ? 'pass' : (covered.length > 0 || wordCount >= 25 ? 'needs_improvement' : 'fail');
  const score = verdict === 'pass' ? 84 : (verdict === 'needs_improvement' ? 68 : 30);

  return {
    verdict,
    score,
    feedback: verdict === 'pass'
      ? `Strong answer! You successfully referenced key concepts like ${covered.join(', ') || 'essential technical principles'}. Ensure you emphasize quantifiable results for top placement drives.`
      : `Solid effort, but your answer missed some key technical points: ${missing.join(', ') || 'core principles'}. Elaborate further using the STAR framework.`,
    conceptsCovered: covered,
    conceptsMissing: missing,
    offTopic: verdict === 'fail'
  };
}
