import assert from 'assert';
import { generateInterviewQuestions, generateAdaptiveNextQuestion } from '../ai/modules/interviewGenerator.js';
import { evaluateAnswer, generateFinalReadinessSummary, generatePersonalizedStudyPlan } from '../ai/modules/mockInterviewCoach.js';

console.log('🧪 Running Phase 2: Adaptive AI Interview & Multi-Dimensional Scorecard Test Suite...\n');

async function runInterviewTests() {
  // 1. Test Question Generation with Company Bank Integration
  console.log('1️⃣ Testing Question Generation with Company Question Bank (Google)...');
  const googleReq = {
    title: 'Software Development Engineer - AI & Cloud',
    company_name: 'Google Cloud India',
    required_skills_json: '["Python", "Distributed Systems", "Kubernetes", "SQL"]',
    job_description: 'Building high-throughput scalable cloud infrastructure.'
  };

  const questions = await generateInterviewQuestions(googleReq);
  assert(Array.isArray(questions), 'Questions must be an array');
  assert(questions.length >= 3, 'Must generate at least 3 structured questions');
  console.log(`   ✅ Generated ${questions.length} questions. Sample: "${questions[0].question.slice(0, 70)}..."`);

  // 2. Test Adaptive Next Question Generation
  console.log('\n2️⃣ Testing Adaptive Question Scaling...');
  const adaptiveHard = await generateAdaptiveNextQuestion({
    requirement: googleReq,
    previousScore: 92,
    rollingAvg: 90,
    questionIndex: 3,
    currentCategory: 'Distributed Systems'
  });
  assert(adaptiveHard.difficulty === 'Hard' || adaptiveHard.difficultyLevel === 3, 'High scoring candidate must scale to Hard/Level 3');
  console.log(`   ✅ High-score branch generated Level ${adaptiveHard.difficultyLevel} (${adaptiveHard.difficulty}) question.`);

  const adaptiveEasy = await generateAdaptiveNextQuestion({
    requirement: googleReq,
    previousScore: 40,
    rollingAvg: 45,
    questionIndex: 4,
    currentCategory: 'Systems Fundamentals'
  });
  assert(adaptiveEasy.difficulty === 'Easy' || adaptiveEasy.difficultyLevel === 1, 'Low scoring candidate must scale to Easy/Level 1 diagnostic');
  console.log(`   ✅ Low-score branch generated Level ${adaptiveEasy.difficultyLevel} (${adaptiveEasy.difficulty}) question.`);

  // 3. Test Multi-Dimensional Answer Evaluation & Speech Analytics
  console.log('\n3️⃣ Testing Multi-Dimensional Answer Evaluation with Speech Metrics...');
  const evaluation = await evaluateAnswer({
    question: 'How do you design a high-throughput backend?',
    expectedKeyPoints: ['Stateless microservices', 'Redis caching', 'Database indexing'],
    candidateAnswer: 'In our university capstone project, our situation was handling 10,000 requests per minute. My task was scaling the API. I implemented stateless Node.js microservices with Redis caching and PostgreSQL read replicas. As a result, our latency dropped by 45%.',
    speechMetrics: { durationSeconds: 25, wpm: 135, fillerCount: 1 }
  });

  assert(evaluation.score >= 70, 'Detailed STAR answer must score >= 70');
  assert(evaluation.starScore >= 75, 'STAR score must recognize Situation, Task, Action, Result elements');
  assert(evaluation.speechAnalytics.pacingGrade.includes('Optimal') || evaluation.speechAnalytics.wpm > 0, 'Speech analytics must grade WPM');
  console.log(`   ✅ Evaluated answer: Overall=${evaluation.score}%, STAR=${evaluation.starScore}%, Depth=${evaluation.technicalDepthScore}%, WPM=${evaluation.speechAnalytics.wpm}`);

  // 4. Test Final Scorecard & 3-Day Personalized Study Sprint
  console.log('\n4️⃣ Testing Final Scorecard & 3-Day Study Sprint Generator...');
  const mockQaPairs = [
    {
      questionId: 'q1',
      question: 'Explain Redis caching strategies',
      candidateAnswer: 'We used Redis cache-aside with 1hr TTL.',
      feedback: { score: 85, clarityScore: 88, correctnessScore: 85, starScore: 80, technicalDepthScore: 85, speechAnalytics: { wpm: 130, fillerCount: 0 } }
    },
    {
      questionId: 'q2',
      question: 'How do you handle database deadlocks?',
      candidateAnswer: 'We set timeouts.',
      feedback: { score: 60, clarityScore: 65, correctnessScore: 55, starScore: 50, technicalDepthScore: 55, speechAnalytics: { wpm: 120, fillerCount: 2 } }
    }
  ];

  const finalSummary = generateFinalReadinessSummary(mockQaPairs, { target_company: 'Google Cloud India' });
  assert(finalSummary.overallScore > 0, 'Must have valid overall score');
  assert(finalSummary.scorecardDimensions.technicalDepth > 0, 'Scorecard must contain technicalDepth');
  assert(finalSummary.scorecardDimensions.starCoverage > 0, 'Scorecard must contain starCoverage');
  assert(finalSummary.personalizedStudyPlan.sprintSchedule.length === 3, 'Must generate 3-day sprint schedule');
  console.log(`   ✅ Final Scorecard: Overall=${finalSummary.overallScore}%, Grade="${finalSummary.readinessGrade}"`);
  console.log(`   ✅ 3-Day Sprint generated with ${finalSummary.personalizedStudyPlan.sprintSchedule.length} days of targeted tasks.`);

  console.log('\n🎉 Phase 2 Test Suite Passed with 100% Assertion Success!\n');
}

runInterviewTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
