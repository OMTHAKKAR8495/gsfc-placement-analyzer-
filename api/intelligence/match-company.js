export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { custom_requirement } = req.body || {};
  const compName = custom_requirement?.company_name || 'Target Company';
  const roleName = custom_requirement?.title || 'Software Development Engineer';

  return res.status(200).json({
    match_score: 92,
    fit_verdict: 'Excellent Match (Dream Tier)',
    role_fit_index: '92%',
    matched_skills: ['Python', 'SQL', 'React', 'Problem Solving', 'Data Structures', 'Git'],
    missing_skills: ['Distributed Systems', 'Kubernetes'],
    recommendations: [
      `Review ${compName} previous year placement questions and core values.`,
      `Highlight hands-on cloud and database projects on your resume for ${roleName}.`,
      'Complete 2 timed mock interview assessments in the Interview Studio.'
    ]
  });
}
