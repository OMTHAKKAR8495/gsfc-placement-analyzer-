/**
 * 📅 CampusHire AI — Dynamic 30-Day Placement Roadmap Generator
 * Custom-tailored to specific target companies and roles with interactive day-by-day task schedules.
 */

export function generate30DayPlan(targetCompany = 'Reliance Industries Limited', targetRole = 'Software Development Engineer', totalDays = 30) {
  const days = [];
  const phases = [
    { title: 'Foundation & Core DSA', start: 1, end: 7, tag: 'Phase 1: Core Algorithms' },
    { title: 'Advanced Data Structures & System Architecture', start: 8, end: 15, tag: 'Phase 2: System Architecture' },
    { title: 'Company Target Drill & Previous Years Papers', start: 16, end: 23, tag: 'Phase 3: Company Mastery' },
    { title: 'Proctored Mocks & Behavioral Bar Raiser', start: 24, end: totalDays, tag: 'Phase 4: Interview Ready' }
  ];

  const taskTemplates = {
    p1: [
      ['Master Two-Pointers and Sliding Window techniques with 3 LeetCode Mediums', 'Review Time & Space complexity analysis and Big-O notation'],
      ['Solve 4 Array & Hash Map challenges (Two Sum, Group Anagrams, Subarray Sum)', 'Review Fast & Slow pointers for Linked List cycle detection'],
      ['Deep dive into Binary Search & Rotated Sorted Array search variants', 'Review Stack/Queue operations and Monotonic Stack implementation'],
      ['Implement Recursion & Backtracking for Subsets and Permutations', 'Solve 2 Matrix Traversal & Flood Fill BFS problems'],
      ['Implement Binary Tree Traversals (Inorder, Preorder, Postorder & Level-Order BFS)', 'Review Binary Search Tree (BST) validation and LCA'],
      ['Solve 3 LeetCode Graph BFS/DFS problems (Number of Islands, Clone Graph)', 'Review Topological Sort and Dijkstra Shortest Path basics'],
      ['Milestone Check: Timed 45-minute DSA Assessment (Arrays, Trees, Graphs)', 'Review all tricky edge cases & formulate code cheat sheet']
    ],
    p2: [
      ['Deep dive into Dynamic Programming: Kadane Algorithm & Fibonacci variants', 'Solve 0/1 Knapsack & Coin Change DP problems'],
      ['Solve Longest Increasing Subsequence & Longest Common Subsequence DP', 'Review Memoization vs Bottom-up Tabulation tradeoffs'],
      ['Study High-Level System Design: Load Balancers, Horizontal Scaling & CDN caching', 'Review Microservices vs Monolith architectures & RESTful API conventions'],
      ['Master Database Sharding, Replication, Indexing strategies & B-Trees in SQL/NoSQL', 'Design a scalable URL Shortener (Bitly) system architecture'],
      ['Study Asynchronous Message Queues (Kafka / RabbitMQ) & Event-Driven Systems', 'Design an In-Memory Rate Limiter (Token Bucket algorithm)'],
      ['Review Low-Level Object Oriented Design (SOLID Principles & Factory Pattern)', 'Design an LRU Cache with O(1) Get and Put operations in JavaScript'],
      ['Milestone Check: System Design Architecture Diagram presentation drill', 'Verify DB isolation levels, ACID properties & CAP theorem fundamentals']
    ],
    p3: [
      [`Research ${targetCompany} specific tech stack, recent engineering blogs & business core`, `Solve 3 previous year coding questions asked at ${targetCompany}`],
      [`Practice ${targetRole} specific system design requirements and data pipelines`, `Review ${targetCompany} core domain fundamentals and company values`],
      ['Complete 2 timed live coding speed runs in CampusHire AI Test Sandbox', 'Refine GitHub portfolio READMEs and live deployment demo links'],
      ['Optimize ATS Resume bullet points with quantifiable STAR metrics (X achieved by Y doing Z)', 'Conduct AI Resume Optimizer pass for target role keyword match > 90%'],
      ['Practice 5 behavioral questions using STAR method (Situation, Task, Action, Result)', `Prepare 3 thoughtful, domain-specific questions to ask the ${targetCompany} interviewer`],
      ['Perform full-length timed technical assessment for target domain', 'Review OS fundamentals: Multithreading, Deadlocks, Virtual Memory & Paging'],
      ['Milestone Check: Complete full company technical simulated round', 'Analyze mistakes & bookmark weak spots for rapid refresher']
    ],
    p4: [
      ['Conduct 1-on-1 AI Mock Interview on CampusHire AI Studio with audio proctoring', 'Review AI speech clarity score, filler words count & pacing metrics'],
      ['Practice Core Computer Science Fundamentals (Computer Networks: TCP/IP, DNS, HTTP/3, TLS)', 'Review SQL Joins, Window functions & Query Execution Plans'],
      ['Simulate high-pressure behavioral panel interview with tough situational queries', 'Practice conflict resolution and leadership scenario responses'],
      ['Review top 50 LeetCode Most Frequently Asked questions for target tier', 'Polish 2-minute elevator pitch and introduction narrative'],
      ['Complete full proctored dress-rehearsal interview session with camera/mic check', 'Verify test environment stability, room lighting & identity documents'],
      [`Final Placement Eve: Relax, review high-level cheat sheets & visualization`, `Confidence booster: Review all ${totalDays} completed milestones & achievements`],
      [`Placement Day Bar-Raiser: Deliver standout performance for ${targetCompany}!`, 'Celebrate milestone completion with placement readiness certified badge']
    ]
  };

  let dayCounter = 1;

  // Generate day-by-day structure
  phases.forEach((ph, pIdx) => {
    const pKey = `p${pIdx + 1}`;
    const pTemplates = taskTemplates[pKey] || taskTemplates.p1;

    for (let d = ph.start; d <= ph.end; d++) {
      const templateIdx = (d - ph.start) % pTemplates.length;
      const tasksForDay = pTemplates[templateIdx].map((taskText, tIdx) => ({
        id: `task_${d}_${tIdx + 1}`,
        text: taskText,
        completed: d === 1 && tIdx === 0 // Mark first task done as welcome preview
      }));

      days.push({
        day_number: d,
        phase: ph.tag,
        phase_title: ph.title,
        tasks: tasksForDay
      });
      dayCounter++;
    }
  });

  const totalTasks = days.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = days.reduce((sum, d) => sum + d.tasks.filter(t => t.completed).length, 0);
  const progressPercentage = Math.round((completedTasks / (totalTasks || 1)) * 100);

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    target_company: targetCompany,
    target_role: targetRole,
    total_days: totalDays,
    progress_percentage: progressPercentage,
    created_at: new Date().toISOString(),
    days
  };
}
