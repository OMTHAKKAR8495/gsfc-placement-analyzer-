export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target_company = 'Reliance Industries', target_role = 'Software Development Engineer' } = req.body || {};

  return res.status(200).json({
    gap_score: 85,
    target_company,
    target_role,
    strengths: ['Algorithms & Data Structures', 'Relational Databases (SQL)', 'Web Development (React & Node)'],
    critical_gaps: [
      { skill: 'Microservices & Docker', priority: 'High', days_to_close: 5, learning_url: 'https://docker.com' },
      { skill: 'System Design Scaling', priority: 'Medium', days_to_close: 4, learning_url: 'https://systemdesignprimer.com' }
    ],
    action_plan: [
      'Complete Phase 1 and 2 of the 30-Day Preparation Planner.',
      'Practice Kadane Algorithm and LeetCode Mediums in the Coding Sandbox.'
    ]
  });
}
