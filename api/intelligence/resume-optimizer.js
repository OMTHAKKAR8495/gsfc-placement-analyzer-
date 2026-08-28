export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target_company = 'Reliance Industries' } = req.body || {};

  return res.status(200).json({
    original_ats_score: 84,
    optimized_ats_score: 95,
    target_company,
    keyword_matches: ['Full Stack Development', 'Python', 'PostgreSQL', 'Cloud Deployments', 'REST APIs'],
    suggested_bullet_points: [
      'Engineered scalable microservices architecture reducing API latency by 35% across 10k+ daily users.',
      `Spearheaded core backend telemetry pipeline aligned with ${target_company} technical bar, improving reliability to 99.9%.`
    ],
    formatting_recommendations: [
      'Maintain clean single-column structure for maximum ATS readability.',
      'Quantify results using metric-driven STAR format.'
    ]
  });
}
