import http from 'http';
import assert from 'assert';

const BASE_URL = 'http://localhost:5001';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch(e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 GSFC PLACEMENT ANALYZER: COMPLETE ACCOUNT-BASED PERSISTENCE TEST SUITE');
  console.log('========================================================================\n');

  try {
    // 1. Authenticate Student A (Rahul Verma)
    console.log('1️⃣ Authenticating Student A (student@gsfcuniversity.ac.in)...');
    const authARes = await request('POST', '/api/auth/login', {
      email: 'student@gsfcuniversity.ac.in',
      password: 'password123'
    });
    assert.strictEqual(authARes.status, 200, 'Student A login failed');
    const tokenA = authARes.body.token;
    const studentAId = authARes.body.user.profile?.id || authARes.body.user.id;
    console.log(`   ✅ Student A Authenticated. ID: ${studentAId}, Name: ${authARes.body.user.profile?.name || authARes.body.user.name}`);

    // 2. Authenticate Student B (Vedant)
    console.log('\n2️⃣ Authenticating Student B (vedant@gsfc.ac.in)...');
    let authBRes = await request('POST', '/api/auth/login', {
      email: 'vedant@gsfc.ac.in',
      password: 'password123'
    });
    if (authBRes.status !== 200) {
      // Register Student B if not present
      await request('POST', '/api/auth/register', {
        name: 'Vedant Patel',
        email: 'vedant@gsfc.ac.in',
        password: 'password123',
        role: 'student',
        program: 'BTech CSE'
      });
      authBRes = await request('POST', '/api/auth/login', {
        email: 'vedant@gsfc.ac.in',
        password: 'password123'
      });
    }
    const tokenB = authBRes.body.token;
    const studentBId = authBRes.body.user.profile?.id || authBRes.body.user.id;
    console.log(`   ✅ Student B Authenticated. ID: ${studentBId}`);

    // 3. Test Student Profile & Dashboard Summary
    console.log('\n3️⃣ Testing Student A Profile & Dashboard Summary...');
    const profileRes = await request('GET', '/api/student/profile', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(profileRes.status, 200, 'Profile fetch failed');
    console.log(`   ✅ Profile fetched. Name: ${profileRes.body.name}, CGPA: ${profileRes.body.cgpa}, Completion: ${profileRes.body.profile_completion}%`);

    const summaryRes = await request('GET', '/api/student/dashboard-summary', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(summaryRes.status, 200, 'Dashboard summary fetch failed');
    console.log(`   ✅ Dashboard Summary fetched: Applications: ${summaryRes.body.metrics?.total_applications}, Bookmarks: ${summaryRes.body.metrics?.saved_drives}, Assessments: ${summaryRes.body.metrics?.assessments_completed}`);

    // 4. Test Live Requirements Feed with Match Calculation
    console.log('\n4️⃣ Testing Live Requirements Feed with JWT authentication...');
    const feedRes = await request('GET', '/api/student/requirements', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(feedRes.status, 200, 'Requirements feed failed');
    const targetReqId = feedRes.body.feed?.[0]?.id || 'req_001';
    console.log(`   ✅ Received ${feedRes.body.feed?.length || 0} campus drives. Target drive ID: ${targetReqId}, Title: ${feedRes.body.feed?.[0]?.title} (Match: ${feedRes.body.feed?.[0]?.matchScore}%)`);

    // 5. Test Bookmarks Persistence and Isolation
    console.log('\n5️⃣ Testing Drive Bookmarking & Isolation between Student A and Student B...');
    let bookmarkAddRes = await request('POST', '/api/student/bookmarks', {
      entity_id: targetReqId,
      entity_type: 'requirement'
    }, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual([200, 201].includes(bookmarkAddRes.status), true, 'Bookmark toggle failed');

    // If it was unbookmarked, toggle it back on so it's bookmarked for tests
    if (!bookmarkAddRes.body.is_bookmarked) {
      bookmarkAddRes = await request('POST', '/api/student/bookmarks', {
        entity_id: targetReqId,
        entity_type: 'requirement'
      }, { Authorization: `Bearer ${tokenA}` });
    }
    console.log(`   ✅ Student A toggled bookmark for ${targetReqId}: is_bookmarked = ${bookmarkAddRes.body.is_bookmarked}`);

    const bookmarksARes = await request('GET', '/api/student/bookmarks', null, { Authorization: `Bearer ${tokenA}` });
    const bookmarksBRes = await request('GET', '/api/student/bookmarks', null, { Authorization: `Bearer ${tokenB}` });
    assert.strictEqual(bookmarksARes.status, 200);
    assert.strictEqual(bookmarksBRes.status, 200);

    const hasTargetA = bookmarksARes.body.some(b => b.entity_id === targetReqId);
    const hasTargetB = bookmarksBRes.body.some(b => b.entity_id === targetReqId);
    assert.strictEqual(hasTargetA, true, 'Student A should have target bookmark');
    assert.strictEqual(hasTargetB, false, 'Student B should NOT have Student A bookmark');
    console.log(`   ✅ Student Isolation verified: Student A has ${bookmarksARes.body.length} bookmark(s), Student B has ${bookmarksBRes.body.length} bookmark(s).`);

    // 6. Test Application Submission and History
    console.log('\n6️⃣ Testing Placement Drive Application Submission & History...');
    const applyRes = await request('POST', '/api/student/apply', {
      requirement_id: targetReqId,
      applied_via: 'internal',
      override_data: { cover_note: 'Eager to join high impact engineering team' }
    }, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual([200, 201, 400].includes(applyRes.status), true, 'Application submit failed');
    console.log(`   ✅ Application processed. Status: ${applyRes.status}, Message: ${applyRes.body.message || applyRes.body.error}`);

    const appsARes = await request('GET', '/api/student/applications', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(appsARes.status, 200);
    const hasAppA = appsARes.body.some(a => a.requirement_id === targetReqId);
    assert.strictEqual(hasAppA, true, `Student A application list must include ${targetReqId}`);
    console.log(`   ✅ Student A has ${appsARes.body.length} active placement application(s) saved in DB.`);

    // 7. Test Proctored Assessment Results Persistence
    console.log('\n7️⃣ Testing Proctored Technical Assessment Result Persistence...');
    const assessSubmitRes = await request('POST', '/api/student/assessments', {
      assessment_title: 'National Cloud & AI Engineering Proctored Assessment',
      assessment_type: 'technical',
      requirement_id: targetReqId,
      score: 95,
      percentage: 95,
      questions_attempted: 10,
      correct_answers: 9,
      incorrect_answers: 1,
      time_taken_seconds: 480,
      status: 'completed',
      feedback: { integrity: 98, level: 'Advanced' }
    }, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual([200, 201].includes(assessSubmitRes.status), true, 'Assessment save failed');
    console.log(`   ✅ Assessment score saved in DB. Assessment ID: ${assessSubmitRes.body.id}`);

    const assessListRes = await request('GET', '/api/student/assessments', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(assessListRes.status, 200);
    assert.strictEqual(assessListRes.body.length > 0, true, 'Student A must have saved assessments');
    console.log(`   ✅ Student A has ${assessListRes.body.length} verified assessment records in database.`);

    // 8. Test AI Mock Interview Session & Readiness
    console.log('\n8️⃣ Testing AI Mock Interview Session Creation & History...');
    const mockStartRes = await request('POST', '/api/interview/mock/start', {
      student_id: studentAId,
      requirement_id: targetReqId
    });
    assert.strictEqual(mockStartRes.status, 200, 'Mock interview start failed');
    const sessionId = mockStartRes.body.sessionId;
    console.log(`   ✅ Mock interview started. Session ID: ${sessionId}, Questions: ${mockStartRes.body.totalQuestions}`);

    const mockFinishRes = await request('POST', '/api/interview/mock/finish', {
      session_id: sessionId
    });
    assert.strictEqual(mockFinishRes.status, 200, 'Mock interview finish failed');
    console.log(`   ✅ Mock interview completed. Overall Score: ${mockFinishRes.body.summary?.overallScore}%`);

    const intSessionsRes = await request('GET', `/api/interview/sessions?student_id=${studentAId}`);
    assert.strictEqual(intSessionsRes.status, 200);
    assert.strictEqual(intSessionsRes.body.length > 0, true, 'Student A must have mock interview sessions');
    console.log(`   ✅ Student A has ${intSessionsRes.body.length} mock interview session(s) archived.`);

    // 9. Test Community Q&A Question Raising and "My Questions"
    console.log('\n9️⃣ Testing Community Q&A Question Raising & "My Questions" Filter...');
    const qaPostRes = await request('POST', '/api/qa/threads', {
      student_id: studentAId,
      student_name: 'Rahul Verma',
      title: 'What is the required preparation for Google Cloud Campus Drive 2026?',
      body: 'Could seniors share their interview experiences and technical test topics?',
      category: 'Interview Preparation'
    }, { Authorization: `Bearer ${tokenA}` });
    const threadId = qaPostRes.body.thread?.id || qaPostRes.body.id;
    assert.strictEqual([200, 201].includes(qaPostRes.status), true, 'Q&A post failed');
    console.log(`   ✅ Question raised by Student A. Question ID: ${threadId}`);

    const myQRes = await request('GET', '/api/qa/my-questions', null, { Authorization: `Bearer ${tokenA}` });
    assert.strictEqual(myQRes.status, 200);
    const hasMyQ = myQRes.body.some(q => q.id === threadId);
    assert.strictEqual(hasMyQ, true, 'Student A raised question must appear in My Questions');
    console.log(`   ✅ "My Questions" verified: ${myQRes.body.length} question(s) found in Student A account.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL 9 ACCOUNT-BASED PERSISTENCE & ISOLATION TESTS PASSED 100%!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
