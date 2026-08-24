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
    const { student_id, requirement_id, target_company } = req.body || {};
    const sessionId = 'mock_' + Date.now();
    const cName = target_company || 'Corporate Partner';

    const qaPairs = [
      {
        questionId: 'q_1',
        category: 'System Architecture & Tech Fundamentals',
        question: `For the engineering role at ${cName}, how would you architect a scalable, fault-tolerant backend service handling high concurrent user requests?`,
        expectedKeyPoints: ['Stateless application tier', 'Database indexing and caching strategies (Redis)', 'Load balancing and horizontal scaling', 'Resilience and circuit breaker patterns'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_2',
        category: 'Applied Problem Solving & Optimization',
        question: `Can you explain a complex data structure or algorithm optimization you implemented in a real project, and how you measured its latency/throughput improvement?`,
        expectedKeyPoints: ['Concrete project context', 'Time and space complexity analysis (Big-O)', 'Benchmarking methodology', 'Trade-offs considered'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_3',
        category: 'Project Defense & Troubleshooting',
        question: `Describe the most difficult technical bug or production failure you encountered in your university/internship work and your systematic debugging process.`,
        expectedKeyPoints: ['Reproducing the bug', 'Log analysis and observability', 'Root cause identification', 'Preventive regression tests'],
        candidateAnswer: null,
        feedback: null
      },
      {
        questionId: 'q_4',
        category: 'Behavioral & Leadership Fit',
        question: `Tell us about a time you had to quickly learn an unfamiliar technology or tool to deliver a project on time. What was your learning strategy?`,
        expectedKeyPoints: ['Self-directed learning', 'Practical prototyping', 'Asking mentor guidance effectively', 'Successful delivery outcome'],
        candidateAnswer: null,
        feedback: null
      }
    ];

    return res.status(200).json({
      sessionId,
      requirementTitle: `${cName} Technical Interview`,
      companyName: cName,
      interviewMode: 'technical',
      totalQuestions: qaPairs.length,
      currentQuestionIndex: 0,
      qaPairs
    });
  } catch (err) {
    return res.status(200).json({
      sessionId: 'mock_' + Date.now(),
      totalQuestions: 4,
      qaPairs: []
    });
  }
}
