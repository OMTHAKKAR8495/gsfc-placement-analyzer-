export default function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target_company = 'Reliance Industries Limited', target_role = 'Software Development Engineer', total_days = 30 } = req.body || req.query || {};

  const days = [];
  const phases = [
    { title: 'Core Data Structures & Algorithms', start: 1, end: 7, tag: 'Phase 1: Core Algorithms' },
    { title: 'Advanced System Architecture & Databases', start: 8, end: 15, tag: 'Phase 2: System Architecture' },
    { title: 'Target Company Previous Papers & Drills', start: 16, end: 23, tag: 'Phase 3: Company Mastery' },
    { title: 'Full Mocks & Behavioral Readiness', start: 24, end: total_days, tag: 'Phase 4: Interview Ready' }
  ];

  const taskTemplates = [
    ['Master Sliding Window & Two-Pointers LeetCode Medium challenges', 'Review Time & Space complexity analysis and Big-O notation'],
    ['Solve 4 Array & Hash Map challenges (Two Sum, Group Anagrams)', 'Review Fast & Slow pointers for cycle detection'],
    ['Deep dive into Dynamic Programming: Kadane Algorithm & Fibonacci', 'Solve 0/1 Knapsack & Coin Change DP problems'],
    ['Study High-Level System Design: Load Balancers, Horizontal Scaling & CDN caching', 'Review Microservices architectures & RESTful API conventions'],
    [`Research ${target_company} tech stack and recent engineering problems`, `Solve 3 previous year questions for ${target_role}`],
    ['Conduct 1-on-1 AI Mock Interview on CampusHire AI Studio with audio proctoring', 'Review AI speech clarity score and feedback'],
    [`Placement Day: Deliver standout performance for ${target_company}!`, 'Celebrate milestone completion with certified badge']
  ];

  phases.forEach((ph, pIdx) => {
    for (let d = ph.start; d <= ph.end; d++) {
      const templateIdx = (d - 1) % taskTemplates.length;
      const tasksForDay = taskTemplates[templateIdx].map((taskText, tIdx) => ({
        id: `task_${d}_${tIdx + 1}`,
        text: taskText,
        completed: d === 1 && tIdx === 0
      }));

      days.push({
        day_number: d,
        phase: ph.tag,
        phase_title: ph.title,
        tasks: tasksForDay
      });
    }
  });

  const totalTasks = days.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = days.reduce((sum, d) => sum + d.tasks.filter(t => t.completed).length, 0);
  const progressPercentage = Math.round((completedTasks / (totalTasks || 1)) * 100);

  return res.status(200).json({
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    target_company: target_company,
    target_role: target_role,
    total_days: total_days,
    progress_percentage: progressPercentage,
    created_at: new Date().toISOString(),
    days
  });
}
