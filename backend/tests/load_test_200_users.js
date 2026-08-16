import db from '../db/index.js';
import { parseResume } from '../ai/modules/resumeParser.js';
import { computeATSScore } from '../ai/modules/atsScorer.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';
import { gradeAnswer } from '../ai/modules/answerEvaluator.js';

console.log('🚀 Starting 500 Concurrent User Load & Concurrency Stress Test for GSFC Placement Portal...');

const start = Date.now();
const CONCURRENT_USERS = 500;
let successCount = 0;
let failCount = 0;

async function simulateStudentActivity(index) {
  try {
    // 1. Concurrent DB Query (Read requirement feeds & student profile)
    const reqs = db.prepare('SELECT * FROM requirements LIMIT 5').all();
    const student = db.prepare('SELECT * FROM student_profiles ORDER BY RANDOM() LIMIT 1').get();

    // 2. Resume Parsing & ATS Calculation under concurrency
    const atsResult = computeATSScore(
      JSON.stringify({ skills: { technical: ['Python', 'SQL', 'React', 'FastAPI'] }, cgpa: 8.4 }),
      JSON.stringify({ required_skills_json: '["Python", "SQL", "React"]', min_cgpa: 8.0 })
    );

    // 3. Hard Filter & Matching Engine Check
    const match = calculateMatchScore(
      { cgpa: 8.4, program: 'BTech CSE', parsed_resume_json: JSON.stringify({ skills: { technical: ['Python', 'SQL', 'React'] } }) },
      { min_cgpa: 8.0, eligible_programs_json: '["BTech CSE"]', required_skills_json: '["Python", "SQL"]' }
    );

    // 4. Instant AI Answer Evaluation Fallback Check
    const evalRes = await gradeAnswer({
      questionText: 'Explain FastAPI async endpoints and event loop handling.',
      category: 'Technical',
      difficulty: 'Medium',
      studentAnswer: 'FastAPI utilizes Python async def keywords with ASGI event loops like Uvicorn to process non-blocking asynchronous requests concurrently with zero thread overhead.',
      attemptCount: 1
    });

    if (reqs && atsResult && match && evalRes) {
      successCount++;
    } else {
      failCount++;
    }
  } catch (err) {
    console.error(`User ${index} failed:`, err.message);
    failCount++;
  }
}

async function runLoadTest() {
  const promises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(simulateStudentActivity(i));
  }

  await Promise.all(promises);
  const elapsed = Date.now() - start;

  console.log('\n======================================================');
  console.log(`📊 200 CONCURRENT USERS LOAD TEST RESULTS`);
  console.log('======================================================');
  console.log(`✅ Successful Requests: ${successCount} / ${CONCURRENT_USERS}`);
  console.log(`❌ Failed Requests:     ${failCount} / ${CONCURRENT_USERS}`);
  console.log(`⏱️ Total Time Elapsed:  ${elapsed} ms`);
  console.log(`⚡ Avg Latency / User:  ${(elapsed / CONCURRENT_USERS).toFixed(2)} ms`);
  console.log('======================================================\n');

  if (failCount === 0) {
    console.log('🎉 SYSTEM PASSED 200 CONCURRENT USER LOAD TEST WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('❌ LOAD TEST FAILED WITH ERRORS');
    process.exit(1);
  }
}

runLoadTest();
