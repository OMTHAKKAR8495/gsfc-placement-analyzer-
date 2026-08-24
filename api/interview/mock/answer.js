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
    const { session_id, question_index, answer_text, question, expected_key_points, category } = req.body || {};
    const text = (answer_text || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Technical concept dictionary for matching
    const technicalKeywords = [
      'stateless', 'redis', 'cache', 'caching', 'load balancer', 'load balancing', 'nginx',
      'horizontal', 'scaling', 'scale', 'microservice', 'microservices', 'replica', 'replicas',
      'index', 'indexing', 'queue', 'kafka', 'rabbitmq', 'circuit breaker', 'latency', 'throughput',
      'big-o', 'complexity', 'hashmap', 'tree', 'graph', 'dynamic programming', 'binary search',
      'benchmark', 'profiling', 'memory', 'cpu', 'concurrency', 'deadlock', 'mutex',
      'debugging', 'reproduce', 'logs', 'logger', 'observability', 'grafana', 'prometheus', 'sentry',
      'unit test', 'integration test', 'regression', 'postmortem', 'star', 'situation', 'task',
      'action', 'result', 'prototype', 'documentation', 'mentor', 'docker', 'kubernetes', 'sql', 'nosql'
    ];

    const lowerText = text.toLowerCase();
    const matchedKeywords = technicalKeywords.filter(k => lowerText.includes(k));
    
    // Check if input is gibberish, spam, or totally unrelated
    const isSingleLongWord = /^[a-z]{12,}$/i.test(text);
    const hasNoSpaces = !text.includes(' ') && text.length > 8;
    const isVeryShort = wordCount < 3;
    const hasZeroTechKeywords = matchedKeywords.length === 0;

    let score, clarityScore, correctnessScore, whatWasGood, whatWasMissing, coachingTip, verdict;

    if (isSingleLongWord || hasNoSpaces || isVeryShort || (wordCount < 6 && hasZeroTechKeywords)) {
      // 🔴 1. WRONG / GIBBERISH / UNRELATED RESPONSE
      score = 15;
      clarityScore = 20;
      correctnessScore = 10;
      verdict = '❌ Incorrect & Unrelated Response';
      whatWasGood = '❌ Inadequate Response: The answer provided does not address the technical problem asked in this interview question.';
      whatWasMissing = '🔴 Critical Gaps: Expected core architectural concepts, structured reasoning, and relevant technical terminology.';
      coachingTip = '💡 Recommended Answer: "To build a high-concurrency scalable backend, I would deploy stateless microservices behind an NGINX load balancer, implement Redis caching for frequent queries, optimize DB indices with read replicas, and use message queues (RabbitMQ/Kafka) for asynchronous task processing."';
    } else if (matchedKeywords.length < 2 && wordCount < 18) {
      // ⚠️ 2. PARTIALLY RELATED / SUPERFICIAL ANSWER
      score = 55;
      clarityScore = 62;
      correctnessScore = 50;
      verdict = '⚠️ Partially Correct — Needs More Technical Depth';
      whatWasGood = 'Identified basic high-level intent, but lacks detailed engineering specifics and depth.';
      whatWasMissing = 'Missing key architectural layers: caching strategies (Redis), connection pooling, rate limiting, and concrete database trade-offs.';
      coachingTip = '💡 Pro Tip: Frame your answers using the STAR framework. Name specific tools (e.g. Redis, Docker, PostgreSQL) and explain why you chose them over alternatives.';
    } else if (matchedKeywords.length >= 4 || (matchedKeywords.length >= 2 && wordCount >= 30)) {
      // ✅ 3. STRONG & ACCURATE TECHNICAL ANSWER
      score = Math.min(96, Math.max(86, 75 + matchedKeywords.length * 4));
      clarityScore = Math.min(98, score + 2);
      correctnessScore = Math.min(95, score - 1);
      verdict = '✅ Strong Technical Answer — Highly Relevant';
      whatWasGood = `✅ Excellent Technical Depth: Successfully covered ${matchedKeywords.slice(0, 4).join(', ')} with clear logical structure.`;
      whatWasMissing = 'To make this a 100/100 response, mention quantitative system metrics (e.g. reduced P99 latency from 450ms to 40ms) and automated rollback plans.';
      coachingTip = '💡 Interview Edge: Conclude your answer by discussing how you monitor production health using telemetry (Prometheus/Grafana) and automated alerts.';
    } else {
      // 🔵 4. ACCEPTABLE ANSWER
      score = 74;
      clarityScore = 78;
      correctnessScore = 70;
      verdict = '🔵 Satisfactory Answer — Good Foundation';
      whatWasGood = `Addressed key aspects of the problem with relevant context (${matchedKeywords.join(', ')}).`;
      whatWasMissing = 'Could elaborate on failover handling, scalability bottlenecks, and concrete benchmarking results.';
      coachingTip = '💡 Next Step: Discuss real-world constraints such as network latency, database lock contention, and cache invalidation strategies.';
    }

    const feedback = {
      score,
      clarityScore,
      correctnessScore,
      verdict,
      whatWasGood,
      whatWasMissing,
      coachingTip,
      strengths: [whatWasGood],
      improvements: [whatWasMissing],
      summary: coachingTip
    };

    return res.status(200).json({
      questionIndex: question_index || 0,
      feedback
    });
  } catch (err) {
    return res.status(200).json({
      questionIndex: 0,
      feedback: {
        score: 25,
        clarityScore: 30,
        correctnessScore: 20,
        verdict: '❌ Needs Revision',
        whatWasGood: 'Response recorded.',
        whatWasMissing: 'Provide detailed architectural and problem-solving explanation.',
        coachingTip: 'Use technical keywords and explain step-by-step logic.'
      }
    });
  }
}
