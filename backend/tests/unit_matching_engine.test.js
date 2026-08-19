import assert from 'assert';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';

console.log('🧪 Running Suite 2: Unit Tests for ATS Scoring & Hard Filter Matching Engine...');

function runMatchingEngineTests() {
  const eligibleStudent = {
    id: 's_test_1',
    name: 'Om Thakkar',
    program: 'BTech CSE',
    branch: 'Computer Science',
    cgpa: 8.9,
    parsed_resume_json: {
      skills: { technical: ['Python', 'React', 'FastAPI', 'SQL', 'Docker', 'Machine Learning'] }
    }
  };

  const lowCgpaStudent = {
    id: 's_test_2',
    name: 'Test Candidate',
    program: 'BTech CSE',
    branch: 'Computer Science',
    cgpa: 6.2,
    parsed_resume_json: {
      skills: { technical: ['Python', 'React', 'SQL'] }
    }
  };

  const highTierRequirement = {
    id: 'req_google_swe',
    title: 'Software Development Engineer - AI',
    min_cgpa: 7.5,
    eligible_programs_json: ['BTech CSE', 'BTech IT'],
    required_skills_json: ['Python', 'React', 'SQL'],
    preferred_skills_json: ['FastAPI', 'Docker']
  };

  // Test 1: Eligible Student Matching
  const matchResult = calculateMatchScore(eligibleStudent, highTierRequirement);
  assert(matchResult.eligible === true, 'Eligible candidate was incorrectly marked ineligible');
  assert(matchResult.matchScore >= 70, `Match score should be >= 70%, got ${matchResult.matchScore}%`);
  console.log(`   ✅ Eligible Candidate match score: ${matchResult.matchScore}% (Eligible: ${matchResult.eligible})`);

  // Test 2: Hard CGPA Cutoff Filter
  const cutoffResult = calculateMatchScore(lowCgpaStudent, highTierRequirement);
  assert(cutoffResult.eligible === false, 'Candidate below min CGPA should be rejected');
  assert(cutoffResult.matchScore === 0, 'Ineligible candidate match score should be 0');
  console.log(`   ✅ Hard Cutoff Enforcement: Ineligible candidate blocked: "${cutoffResult.reason}"`);

  console.log('🎉 Suite 2 (Matching Engine & ATS Cutoffs): ALL TESTS PASSED!\n');
}

runMatchingEngineTests();
