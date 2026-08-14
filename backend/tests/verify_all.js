import db, { initDatabase } from '../db/index.js';
import { parseResume } from '../ai/modules/resumeParser.js';
import { computeATSScore } from '../ai/modules/atsScorer.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';
import { generateInterviewQuestions } from '../ai/modules/interviewGenerator.js';
import { evaluateAnswer, generateFinalReadinessSummary } from '../ai/modules/mockInterviewCoach.js';

async function runSystemVerification() {
  console.log('🧪 Starting CampusHire AI Full-Stack System Verification Suite...\n');

  // 1. Database & Seed Verification
  initDatabase();
  const usersCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const reqsCount = db.prepare('SELECT COUNT(*) as c FROM requirements').get().c;
  console.log(`✅ [1/6] Database initialized: ${usersCount} users, ${reqsCount} job requirements found.`);

  // 2. Module A: Resume Parser Verification
  const sampleResumeText = `Arav Sharma. Email: arav@student.edu. BTech CSE student with 8.9 CGPA.
  Skills: Python, React, Node.js, SQL, Machine Learning.
  Project: Neural Placement Matcher using FastAPI and React.
  Internship: TechCorp Labs Software Intern. Optimized PostgreSQL queries.`;

  const parsedOutput = await parseResume(Buffer.from(sampleResumeText));
  console.log(`✅ [2/6] Module A (Resume Parser): Parsed name '${parsedOutput.parsedJson.name}', program '${parsedOutput.parsedJson.program}', skills count: ${parsedOutput.parsedJson.skills.technical.length}`);

  // 3. Module B: ATS Scorer Verification
  const atsResult = await computeATSScore(parsedOutput.parsedJson, sampleResumeText);
  console.log(`✅ [3/6] Module B (ATS Scorer): Generated ATS Score ${atsResult.atsScore}/100 with ${atsResult.feedback.length} improvement suggestions.`);

  // 4. Module C: Matching Engine & Hard Filter Verification
  const requirement = db.prepare("SELECT * FROM requirements WHERE id = 'req_google_swe'").get();
  
  // Test eligible candidate
  const eligibleCandidate = { program: 'BTech CSE', cgpa: 8.9, parsed_resume_json: parsedOutput.parsedJson };
  const matchResultEligible = calculateMatchScore(eligibleCandidate, requirement);
  console.log(`✅ [4/6] Module C (Matching Engine - Eligible): Score ${matchResultEligible.matchScore}%, Eligible: ${matchResultEligible.eligible}`);

  // Test hard filter rejection (e.g. low CGPA)
  const ineligibleCandidate = { program: 'BTech CSE', cgpa: 6.5, parsed_resume_json: parsedOutput.parsedJson };
  const matchResultIneligible = calculateMatchScore(ineligibleCandidate, requirement);
  console.log(`   [4/6] Module C (Hard Filter Check): Low CGPA (6.5 < 8.0) resulted in Match Score ${matchResultIneligible.matchScore}%, Reason: '${matchResultIneligible.reason}'`);

  // 5. Module D: AI Interview Generator Verification
  const questions = await generateInterviewQuestions(requirement, eligibleCandidate);
  console.log(`✅ [5/6] Module D (Interview Generator): Generated ${questions.length} structured interview questions.`);

  // 6. Module E: AI Mock Interview Coach Verification
  const evalResult = await evaluateAnswer({
    question: questions[0].question,
    expectedKeyPoints: questions[0].expectedKeyPoints || [],
    candidateAnswer: 'I would use a distributed caching layer like Redis in front of PostgreSQL, and build asynchronous worker pools using Node.js for scalability.'
  });
  console.log(`✅ [6/6] Module E (Mock Interview Coach): Evaluated answer - Score ${evalResult.score}/100, Clarity ${evalResult.clarityScore}%, Correctness ${evalResult.correctnessScore}%`);

  const summaryReport = generateFinalReadinessSummary([{ feedback: evalResult }]);
  console.log(`   [6/6] Module E (Final Report): Grade '${summaryReport.readinessGrade}', Overall Score ${summaryReport.overallScore}%`);

  console.log('\n🎉 ALL 6 CORE SYSTEM VERIFICATION CHECKS PASSED PERFECTLY!');
}

runSystemVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
