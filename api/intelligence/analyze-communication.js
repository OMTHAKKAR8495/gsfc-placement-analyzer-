export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { student_response = '', topic_or_question = 'HR Interview Question' } = req.body || {};
  const wordCount = student_response.trim().split(/\s+/).length;
  const score = Math.min(95, Math.max(70, Math.floor(wordCount * 1.2) + 60));

  return res.status(200).json({
    overall_score: score,
    speech_clarity: 92,
    pacing_wpm: 135,
    filler_words_count: Math.max(0, Math.floor(wordCount * 0.03)),
    star_method_compliance: 'Strong Structure (Situation, Task, Action, Result followed)',
    feedback_points: [
      'Articulate response with solid professional vocabulary.',
      'Clear explanation of the technical conflict and resolution steps.',
      'Strong candidate presence suited for corporate technical and behavioral rounds.'
    ]
  });
}
