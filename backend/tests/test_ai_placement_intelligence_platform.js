import db from '../db/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';
const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('🧪 Starting Comprehensive AI Placement Intelligence Platform Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup authenticated student tokens
    let studentUser = db.prepare("SELECT * FROM users WHERE email = 's_arav@student.edu'").get();
    if (!studentUser) {
      studentUser = db.prepare("SELECT u.* FROM users u JOIN student_profiles s ON s.user_id = u.id LIMIT 1").get();
    }
    const studentProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentUser.id);
    const studentToken = jwt.sign({ userId: studentUser.id, role: 'student' }, JWT_SECRET);

    console.log(`[Test Suite 1] Authenticated Student Context: ${studentProfile.name} (${studentProfile.id})`);

    // 2. Test Student Copilot with real database context
    console.log('\n[Test Suite 2] Testing Grounded AI Student Placement Copilot');
    const copilotRes = await fetch(`${BASE_URL}/api/intelligence/student-copilot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        query: 'Which companies should I apply for based on my skills and CGPA?',
        studentId: studentProfile.id
      })
    });
    const copilotData = await copilotRes.json();
    assert(copilotRes.status === 200, 'Copilot endpoint returned status 200');
    assert(copilotData.answer && copilotData.answer.length > 50, 'Copilot returned rich grounded response');
    assert(Array.isArray(copilotData.suggestedQuestions) && copilotData.suggestedQuestions.length > 0, 'Copilot returned suggested follow-up questions');

    // 3. Test 0-100 Placement Readiness Score
    console.log('\n[Test Suite 3] Testing 0-100 Placement Readiness Scorecard Engine');
    const readinessRes = await fetch(`${BASE_URL}/api/intelligence/readiness/${studentProfile.id}`);
    const readinessData = await readinessRes.json();
    assert(readinessRes.status === 200, 'Readiness endpoint returned 200');
    assert(readinessData.overall_readiness_score >= 0 && readinessData.overall_readiness_score <= 100, `Overall readiness score is valid: ${readinessData.overall_readiness_score}%`);
    assert(Array.isArray(readinessData.dimensions) && readinessData.dimensions.length === 10, 'All 10 dimensions calculated');
    assert(Array.isArray(readinessData.positive_reasons) && readinessData.positive_reasons.length > 0, 'Positive drivers present');

    // 4. Test AI Company Matching Engine
    console.log('\n[Test Suite 4] Testing AI Company Matching Engine');
    const matchRes = await fetch(`${BASE_URL}/api/intelligence/match-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_id: studentProfile.id,
        custom_requirement: {
          company_name: 'Google Cloud India',
          title: 'Software Development Engineer',
          min_cgpa: 7.5,
          required_skills_json: JSON.stringify(['Python', 'SQL', 'Docker', 'System Design'])
        }
      })
    });
    const matchData = await matchRes.json();
    assert(matchRes.status === 200, 'Match company endpoint returned 200');
    assert(matchData.match_percentage >= 0 && matchData.match_percentage <= 100, `Match percentage computed: ${matchData.match_percentage}%`);
    assert(matchData.is_eligible === true, 'CGPA eligibility evaluated correctly');

    // 5. Test AI Skill Gap Analyzer
    console.log('\n[Test Suite 5] Testing AI Skill Gap Analyzer');
    const skillGapRes = await fetch(`${BASE_URL}/api/intelligence/skill-gap-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentProfile.id,
        target_company: 'Google Cloud India'
      })
    });
    const skillGapData = await skillGapRes.json();
    assert(skillGapRes.status === 200, 'Skill gap endpoint returned 200');
    assert(Array.isArray(skillGapData.high_priority_gaps), 'High priority gaps classified');
    assert(Array.isArray(skillGapData.learning_roadmap) && skillGapData.learning_roadmap.length === 3, '3-Phase remedial roadmap generated');

    // 6. Test AI Resume Optimizer
    console.log('\n[Test Suite 6] Testing AI Resume Optimizer');
    const resumeOptRes = await fetch(`${BASE_URL}/api/intelligence/resume-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentProfile.id,
        target_company: 'Google Cloud India'
      })
    });
    const resumeOptData = await resumeOptRes.json();
    assert(resumeOptRes.status === 200, 'Resume optimizer returned 200');
    assert(resumeOptData.potential_ats_score > resumeOptData.current_ats_score, 'Target ATS potential calculated higher');
    assert(Array.isArray(resumeOptData.bullet_point_improvements), 'Google XYZ bullet improvements generated');

    // 7. Test AI Coding Interviewer Sandbox & Submission
    console.log('\n[Test Suite 7] Testing AI Coding Sandbox & Test Evaluation');
    const codeEvalRes = await fetch(`${BASE_URL}/api/intelligence/evaluate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_id: studentProfile.id,
        problem_id: 'code_prob_01',
        problem_title: 'Longest Consecutive Elements Sequence',
        difficulty: 'Medium',
        company: 'Google Cloud India',
        language: 'javascript',
        code: 'function longestConsecutive(nums) { const set = new Set(nums); let max = 0; for (let n of set) { if (!set.has(n-1)) { let cur = n; let streak = 1; while (set.has(cur+1)) { cur++; streak++; } max = Math.max(max, streak); } } return max; }'
      })
    });
    const codeEvalData = await codeEvalRes.json();
    assert(codeEvalRes.status === 200, 'Evaluate code endpoint returned 200');
    assert(codeEvalData.status === 'ACCEPTED', 'Code solution evaluated and accepted');
    assert(codeEvalData.time_complexity === 'O(N)', 'Time complexity analysis detected O(N)');

    // 8. Test 30-Day Preparation Planner & Persistence
    console.log('\n[Test Suite 8] Testing 30-Day Preparation Planner & Database Checkoff');
    const planRes = await fetch(`${BASE_URL}/api/intelligence/preparation-planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_id: studentProfile.id,
        target_company: 'Google Cloud India',
        total_days: 30
      })
    });
    const planData = await planRes.json();
    assert(planRes.status === 200, 'Planner creation returned 200');
    assert(Array.isArray(planData.days) && planData.days.length === 30, '30 daily roadmap items generated');

    // Checkoff task in plan
    const checkoffRes = await fetch(`${BASE_URL}/api/intelligence/preparation-plans/${planData.id}/task`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: 'd1_t0', completed: true })
    });
    const checkoffData = await checkoffRes.json();
    assert(checkoffRes.status === 200 && checkoffData.success === true, 'Task checkoff persisted to database');

    // 9. Test Communication & GD Analyzer
    console.log('\n[Test Suite 9] Testing Communication & GD Speech/Text Analyzer');
    const commRes = await fetch(`${BASE_URL}/api/intelligence/analyze-communication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_id: studentProfile.id,
        practice_type: 'hr_question',
        topic_or_question: 'Describe a challenging bug you fixed.',
        student_response: 'In my final year placement analytics project, we faced a situation where concurrent database writes caused race conditions. My task was to optimize the locking mechanism. I took action by implementing SQLite WAL mode and composite indexing. As a result, query throughput improved by 40% with zero deadlocks.'
      })
    });
    const commData = await commRes.json();
    assert(commRes.status === 200, 'Communication analyzer returned 200');
    assert(commData.overall_score >= 80, `Strong STAR response scored high: ${commData.overall_score}%`);
    assert(commData.structure_score >= 80, 'STAR structure detected and scored well');

    // 10. Test AI Recruiter Candidate Matching System
    console.log('\n[Test Suite 10] Testing AI Recruiter Candidate Shortlisting');
    const recruiterRes = await fetch(`${BASE_URL}/api/intelligence/recruiter-match-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_description: 'Full-Stack Developer with Python, SQL, React',
        required_skills: ['Python', 'SQL', 'React'],
        min_cgpa: 7.0
      })
    });
    const recruiterData = await recruiterRes.json();
    assert(recruiterRes.status === 200, 'Recruiter candidate matcher returned 200');
    assert(Array.isArray(recruiterData.top_matches) && recruiterData.top_matches.length > 0, 'Ranked candidate list generated');
    assert(recruiterData.top_matches[0].match_percentage >= 70, 'Top match has strong compatibility');

    // 11. Test Placement Risk Alerts
    console.log('\n[Test Suite 11] Testing Placement Risk Alerts & TPC Queue');
    const risksRes = await fetch(`${BASE_URL}/api/intelligence/placement-risks`);
    const risksData = await risksRes.json();
    assert(risksRes.status === 200, 'Placement risk alerts returned 200');
    assert(Array.isArray(risksData) && risksData.length > 0, 'Active risk alerts retrieved');

    // 12. Test Gamification XP & Badges
    console.log('\n[Test Suite 12] Testing Gamification & Placement Streaks');
    const gamifyRes = await fetch(`${BASE_URL}/api/intelligence/gamification/${studentProfile.id}`);
    const gamifyData = await gamifyRes.json();
    assert(gamifyRes.status === 200, 'Gamification returned 200');
    assert(gamifyData.total_xp >= 100, `Total XP awarded and tracked: ${gamifyData.total_xp} XP`);
    assert(gamifyData.current_streak >= 1, `Current streak tracked: ${gamifyData.current_streak} days`);

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
