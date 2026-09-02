import { callLLM } from '../llm.js';

/**
 * Enterprise Adaptive AI Interview Question Generator
 * Generates personalized, company-benchmarked interview streams with dynamic difficulty scaling.
 */

// Canonical company question repository database
const COMPANY_QUESTION_BANKS = {
  'google': [
    { category: 'System Architecture', question: 'How would you design a distributed, low-latency key-value store with eventual consistency across multi-region data centers?', difficulty: 'Hard', expectedKeyPoints: ['Consistent hashing', 'Quorum reads/writes (N, W, R)', 'Vector clocks / conflict resolution', 'SSTables and LSM Trees'] },
    { category: 'Algorithms & Data Structures', question: 'Given a continuous stream of incoming integer events, how would you compute the running median in O(1) time with minimal space overhead?', difficulty: 'Hard', expectedKeyPoints: ['Two heaps (Max-Heap + Min-Heap balance)', 'Insertion rebalancing O(log N)', 'Space complexity analysis'] }
  ],
  'microsoft': [
    { category: 'Cloud Systems', question: 'Explain how you would design an asynchronous event-driven microservices architecture using Azure Service Bus or Kafka with dead-letter queue handling.', difficulty: 'Medium', expectedKeyPoints: ['Idempotency keys', 'At-least-once vs exactly-once delivery', 'Exponential backoff retry policy', 'Consumer group partition rebalancing'] },
    { category: 'System Concurrency', question: 'How do you diagnose and prevent race conditions and thread deadlocks in high-throughput transactional services?', difficulty: 'Hard', expectedKeyPoints: ['Resource hierarchy ordering', 'Mutex vs Reader-Writer locks', 'Atomic operations / CAS (Compare-And-Swap)'] }
  ],
  'gsfc': [
    { category: 'Industrial Systems & IoT', question: 'How would you design a secure telemetry pipeline collecting sensor metrics from plant SCADA controllers into a central real-time analytics database?', difficulty: 'Medium', expectedKeyPoints: ['MQTT / CoAP protocols', 'Edge gateway buffering & store-and-forward', 'Time-series database optimization', 'TLS mutual authentication'] },
    { category: 'Process Optimization', question: 'Describe how automated predictive maintenance algorithms analyze sensor anomalies to prevent unplanned machinery downtime.', difficulty: 'Medium', expectedKeyPoints: ['Vibration/temperature threshold baselines', 'Moving average / Fourier transform anomaly detection', 'Alert deduplication'] }
  ],
  'tcs': [
    { category: 'Enterprise Web Architecture', question: 'Walk me through the lifecycle of a high-volume REST and GraphQL API request from DNS resolution through load balancer, API gateway, caching layer, down to SQL database transaction.', difficulty: 'Medium', expectedKeyPoints: ['DNS round-robin / Anycast', 'TLS handshake & termination', 'JWT auth validation at gateway', 'Database connection pooling & isolation levels'] },
    { category: 'Database Optimization', question: 'What strategies do you employ when a relational SQL query begins degrading under 10 million rows?', difficulty: 'Medium', expectedKeyPoints: ['Composite index design', 'EXPLAIN query execution plan', 'Table partitioning / Sharding', 'Materialized views'] }
  ]
};

export async function generateInterviewQuestions(requirement, studentProfile = null, options = {}) {
  const reqSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json)
    : requirement.required_skills_json || [];

  const studentData = studentProfile && studentProfile.parsed_resume_json
    ? (typeof studentProfile.parsed_resume_json === 'string' ? JSON.parse(studentProfile.parsed_resume_json) : studentProfile.parsed_resume_json)
    : null;

  const targetCompanyKey = (requirement.company_name || requirement.title || '').toLowerCase();
  let matchedBankQuestions = [];
  
  Object.keys(COMPANY_QUESTION_BANKS).forEach(key => {
    if (targetCompanyKey.includes(key)) {
      matchedBankQuestions = COMPANY_QUESTION_BANKS[key];
    }
  });

  const schemaDescription = `{
    "questions": [
      {
        "id": "string",
        "category": "Technical | Resume-based | Behavioral | System Design",
        "question": "string",
        "expectedKeyPoints": ["array of key points expected in answer"],
        "difficulty": "Easy | Medium | Hard",
        "difficultyLevel": number (1, 2, or 3)
      }
    ]
  }`;

  const prompt = `You are a Principal Technical Interviewer for ${requirement.company_name || 'Tier-1 Enterprise'}.
Generate a structured 5-question interview pipeline for:
Role: ${requirement.title}
Job Type: ${requirement.job_type || 'Full-time Engineering'}
Required Skills: ${reqSkills.join(', ')}
Job Description: ${requirement.job_description || 'Production engineering deliverables'}
${studentData ? `Candidate Background: Name: ${studentData.name}, Program: ${studentData.program}, Projects: ${JSON.stringify(studentData.projects || [])}` : 'Candidate: General Engineering Graduate'}

Rules:
1. Progress difficulty smoothly: Q1 (Diagnostic/Foundations, Level 1), Q2-Q3 (Core Applied Architecture, Level 2), Q4 (Resume/Project Deep Dive, Level 2), Q5 (Complex System Design / Edge Cases, Level 3).
2. Ensure expectedKeyPoints contains 3-4 concrete technical evaluation criteria.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateQuestionFallback(requirement, studentData, matchedBankQuestions)
  });

  const questions = Array.isArray(result.questions) && result.questions.length >= 3
    ? result.questions
    : generateQuestionFallback(requirement, studentData, matchedBankQuestions).questions;

  return questions;
}

/**
 * Generates an adaptive next question based on candidate rolling performance
 */
export async function generateAdaptiveNextQuestion({ requirement, previousScore, rollingAvg, questionIndex, currentCategory = 'Technical' }) {
  let targetDifficulty = 'Medium';
  let targetLevel = 2;

  if (rollingAvg >= 85 || previousScore >= 85) {
    targetDifficulty = 'Hard';
    targetLevel = 3;
  } else if (rollingAvg < 60 || previousScore < 55) {
    targetDifficulty = 'Easy';
    targetLevel = 1;
  }

  const prompt = `Generate a single adaptive ${targetDifficulty} (Level ${targetLevel}) interview question for ${requirement.title || 'Software Engineer'}.
Previous question score: ${previousScore}/100.
Candidate rolling performance: ${rollingAvg}/100.
Category: ${currentCategory}.
Make the question test real engineering trade-offs suitable for Level ${targetLevel}.`;

  const schemaDescription = `{
    "question": {
      "id": "q_adaptive_${questionIndex}",
      "category": "${currentCategory}",
      "question": "string",
      "expectedKeyPoints": ["array of expected points"],
      "difficulty": "${targetDifficulty}",
      "difficultyLevel": ${targetLevel}
    }
  }`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => ({
      question: {
        id: `q_adaptive_${questionIndex}`,
        category: currentCategory,
        question: targetLevel === 3
          ? `In a distributed system handling 50,000 requests/sec, how do you handle cascading failures and implement circuit-breaking with fallback degradations?`
          : targetLevel === 1
          ? `Explain the difference between synchronous and asynchronous processing, and when you would choose a message queue over direct HTTP calls.`
          : `How do you ensure data consistency between your cache (Redis) and primary relational database during high-frequency writes?`,
        expectedKeyPoints: targetLevel === 3
          ? ['Circuit breaker thresholds (open/half-open)', 'Exponential backoff with jitter', 'Graceful degradation fallback']
          : ['Cache-aside pattern', 'Write-through vs Write-behind trade-offs', 'TTL expiry strategy'],
        difficulty: targetDifficulty,
        difficultyLevel: targetLevel
      }
    })
  });

  return result.question || result;
}

function generateQuestionFallback(requirement, studentData, matchedBankQuestions = []) {
  const reqSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json)
    : requirement.required_skills_json || ['Python', 'SQL', 'System Architecture'];

  const primarySkill = reqSkills[0] || 'Software Architecture';
  const secondarySkill = reqSkills[1] || 'Database Design';

  const questions = [
    {
      id: 'q1',
      category: 'Foundations & Architecture',
      question: `How would you design a scalable service using ${primarySkill} for ${requirement.title || 'Production Backend'}? Walk through your architectural components and failure-recovery mechanisms.`,
      expectedKeyPoints: [`Fundamentals of ${primarySkill}`, 'Stateless load balancing', 'Error handling & retry mechanisms', 'Database connection pooling'],
      difficulty: 'Medium',
      difficultyLevel: 2
    },
    {
      id: 'q2',
      category: 'Data Engineering & Scalability',
      question: `Walk me through your optimization strategy when handling high-concurrency queries and caching in ${secondarySkill}.`,
      expectedKeyPoints: ['B-Tree indexing and execution plans', 'Redis cache-aside pattern', 'Read replicas and connection pooling'],
      difficulty: 'Hard',
      difficultyLevel: 3
    }
  ];

  if (matchedBankQuestions && matchedBankQuestions.length > 0) {
    questions.push({
      id: 'q3',
      category: matchedBankQuestions[0].category,
      question: matchedBankQuestions[0].question,
      expectedKeyPoints: matchedBankQuestions[0].expectedKeyPoints,
      difficulty: matchedBankQuestions[0].difficulty,
      difficultyLevel: 3
    });
  } else if (studentData && studentData.projects && studentData.projects.length > 0) {
    const proj = studentData.projects[0];
    questions.push({
      id: 'q3',
      category: 'Project Defense',
      question: `In your project '${proj.title || 'Core Engineering Project'}', what was the most difficult technical bottleneck you solved, and how did you verify the resolution?`,
      expectedKeyPoints: ['Clear problem statement', 'Architecture trade-offs analyzed', 'Quantifiable latency/throughput outcome'],
      difficulty: 'Medium',
      difficultyLevel: 2
    });
  } else {
    questions.push({
      id: 'q3',
      category: 'System Implementation',
      question: `Describe a hands-on project where you implemented automated CI/CD testing, containerization (Docker), or observability.`,
      expectedKeyPoints: ['Containerization benefits', 'Test suite coverage strategy', 'Logging and metrics telemetry'],
      difficulty: 'Medium',
      difficultyLevel: 2
    });
  }

  questions.push({
    id: 'q4',
    category: 'Behavioral & Leadership',
    question: `Describe a situation where a technical roadblock or shifting requirement threatened a critical project deadline. How did you prioritize and execute under pressure?`,
    expectedKeyPoints: ['STAR structure (Situation, Task, Action, Result)', 'Decisive triage', 'Collaborative stakeholder alignment'],
    difficulty: 'Easy',
    difficultyLevel: 1
  });

  questions.push({
    id: 'q5',
    category: 'Advanced Edge Cases',
    question: `If our production service suddenly experiences a 10x traffic spike and CPU utilization reaches 98%, outline your step-by-step incident response and triage plan.`,
    expectedKeyPoints: ['Telemetry inspection (APM, logs)', 'Horizontal auto-scaling trigger', 'Rate limiting and non-critical feature shedding', 'Postmortem RCA process'],
    difficulty: 'Hard',
    difficultyLevel: 3
  });

  return { questions };
}
