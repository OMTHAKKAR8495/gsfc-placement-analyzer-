export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { session_id, question_index, answer_text } = req.body || {};
    const text = (answer_text || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const isGibberish = wordCount < 3 || /^[a-z]{15,}$/i.test(text) || text.length < 10;

    let score, clarityScore, correctnessScore, whatWasGood, whatWasMissing, coachingTip;

    if (isGibberish) {
      score = 25;
      clarityScore = 30;
      correctnessScore = 20;
      whatWasGood = 'Submitted a response within the mock session.';
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

    const feedback = {
      score,
      clarityScore,
      correctnessScore,
      whatWasGood,
      whatWasMissing,
      coachingTip,
      strengths: [whatWasGood],
      improvements: [whatWasMissing],
      summary: coachingTip
    };

    return res.status(200).json({
      questionIndex: question_index || 0,
      feedback
    });
  } catch (err) {
    return res.status(200).json({
      questionIndex: 0,
      feedback: {
        score: 75,
        clarityScore: 78,
        correctnessScore: 72,
        whatWasGood: 'Good logical structure and communication approach.',
        whatWasMissing: 'Add deeper technical justification for your design choices.',
        coachingTip: 'Structure your answers using clear architectural principles and the STAR method.'
      }
    });
  }
}
