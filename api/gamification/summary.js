export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    rank: 1,
    level: 3,
    level_title: 'Placement Champion',
    points_total: 680,
    current_streak: 7,
    highest_streak: 12,
    is_anonymous: false,
    student_name: 'Om Thakkar',
    nickname: 'Om T. (CSE)',
    badges: [
      { id: 'b1', name: 'ATS Overachiever', icon: '🚀', desc: 'Achieved > 95% ATS Compatibility score' },
      { id: 'b2', name: 'Algorithm Master', icon: '⚡', desc: 'Solved 10+ LeetCode Medium/Hard challenges' },
      { id: 'b3', name: 'Proctored Ready', icon: '🛡️', desc: 'Cleared full video mock interview bar' },
      { id: 'b4', name: 'Roadmap Pioneer', icon: '📅', desc: 'Completed 15+ daily preparation planner milestones' },
      { id: 'b5', name: 'Top Tier Aspirant', icon: '🏆', desc: 'Rank #1 in Computer Science Department' }
    ]
  });
}
