export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    placement_probability_pct: 92,
    ats_benchmark_score: 88,
    market_readiness_level: 'High Readiness',
    recommended_focus_area: 'System Design & Distributed Microservices Architecture',
    mock_interviews_completed: 3,
    technical_assessment_score: 86
  });
}
