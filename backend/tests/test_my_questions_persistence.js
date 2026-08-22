import http from 'http';

const BASE_URL = 'http://localhost:5001';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 TESTING STUDENT Q&A "MY QUESTIONS" & DATABASE PERSISTENCE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate / Login as Student A (Arav Sharma)
    const studentALogin = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'arav.sharma@gsfcuniversity.ac.in',
      password: 'GsfcSecurePassword@2026',
      selectedRole: 'student'
    });

    if (studentALogin.status !== 200 || !studentALogin.data.token) {
      throw new Error(`Student A login failed: ${JSON.stringify(studentALogin.data)}`);
    }
    const tokenA = studentALogin.data.token;
    const studentAId = studentALogin.data.user.owner_id || studentALogin.data.user.id;
    console.log(`✅ [1/9] Authenticated Student A (${studentALogin.data.user.email}, ID: ${studentAId})`);

    // 2. Authenticate / Login as Student B (Rohan Patel)
    const studentBLogin = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'rohan.patel@gsfcuniversity.ac.in',
      password: 'GsfcSecurePassword@2026',
      selectedRole: 'student'
    });

    if (studentBLogin.status !== 200 || !studentBLogin.data.token) {
      throw new Error(`Student B login failed: ${JSON.stringify(studentBLogin.data)}`);
    }
    const tokenB = studentBLogin.data.token;
    const studentBId = studentBLogin.data.user.owner_id || studentBLogin.data.user.id;
    console.log(`✅ [2/9] Authenticated Student B (${studentBLogin.data.user.email}, ID: ${studentBId})`);

    // 3. Student A creates Question A
    const qA = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/threads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      }
    }, {
      title: 'How can I prepare for Google Cloud campus drive coding test?',
      body: 'I am in BTech CSE 7th semester. What specific DSA and system design concepts are emphasized in the GSFC Google round?',
      category: 'Interview Tips & Preparation'
    });

    if (qA.status !== 201 || !qA.data.thread) {
      throw new Error(`Student A failed to post question: ${JSON.stringify(qA.data)}`);
    }
    const threadAId = qA.data.thread.id;
    console.log(`✅ [3/9] Student A posted Question A in database (Thread ID: ${threadAId})`);

    // 4. Student B creates Question B
    const qB = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/threads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      }
    }, {
      title: 'Are core mechanical students eligible for IT analyst positions?',
      body: 'I have completed certifications in Python and SQL. Can I register for TCS Digital through the placement cell?',
      category: 'Eligibility & Drive Rules'
    });

    if (qB.status !== 201 || !qB.data.thread) {
      throw new Error(`Student B failed to post question: ${JSON.stringify(qB.data)}`);
    }
    const threadBId = qB.data.thread.id;
    console.log(`✅ [4/9] Student B posted Question B in database (Thread ID: ${threadBId})`);

    // 5. Test Student A "My Questions" Isolation
    const myQuestionsA = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/my-questions',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });

    const hasThreadA_in_A = myQuestionsA.data.some(t => t.id === threadAId);
    const hasThreadB_in_A = myQuestionsA.data.some(t => t.id === threadBId);

    if (!hasThreadA_in_A) throw new Error('Student A cannot see their own Question A in My Questions!');
    if (hasThreadB_in_A) throw new Error('SECURITY VIOLATION: Student A can see Student B Question B in My Questions!');
    console.log(`✅ [5/9] Student Isolation Verified: Student A My Questions contains Question A and NOT Question B (${myQuestionsA.data.length} total questions)`);

    // 6. Test Student B "My Questions" Isolation
    const myQuestionsB = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/my-questions',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    const hasThreadB_in_B = myQuestionsB.data.some(t => t.id === threadBId);
    const hasThreadA_in_B = myQuestionsB.data.some(t => t.id === threadAId);

    if (!hasThreadB_in_B) throw new Error('Student B cannot see their own Question B in My Questions!');
    if (hasThreadA_in_B) throw new Error('SECURITY VIOLATION: Student B can see Student A Question A in My Questions!');
    console.log(`✅ [6/9] Student Isolation Verified: Student B My Questions contains Question B and NOT Question A (${myQuestionsB.data.length} total questions)`);

    // 7. Community Questions Endpoint returns both questions
    const communityFeed = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/threads',
      method: 'GET'
    });

    const hasA_in_community = communityFeed.data.some(t => t.id === threadAId);
    const hasB_in_community = communityFeed.data.some(t => t.id === threadBId);

    if (!hasA_in_community || !hasB_in_community) {
      throw new Error('Community Questions feed is missing Question A or Question B!');
    }
    console.log(`✅ [7/9] Community Questions feed verified (${communityFeed.data.length} total public threads including Question A and B)`);

    // 8. Add Reply to Question A
    const replyRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/qa/threads/${threadAId}/replies`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      }
    }, {
      body: 'Official TPC Tip: Focus on Dynamic Programming, Graph algorithms, and containerization basics.'
    });

    if (replyRes.status !== 201 || !replyRes.data.reply) {
      throw new Error(`Failed to post reply: ${JSON.stringify(replyRes.data)}`);
    }
    console.log(`✅ [8/9] Reply added to Question A (Reply ID: ${replyRes.data.reply.id})`);

    // 9. Re-Login as Student A and verify persistent retrieval from Database with Replies
    const reLogin = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'arav.sharma@gsfcuniversity.ac.in',
      password: 'GsfcSecurePassword@2026',
      selectedRole: 'student'
    });

    const reTokenA = reLogin.data.token;
    const reFetchMyQuestions = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/qa/my-questions',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${reTokenA}` }
    });

    const targetThread = reFetchMyQuestions.data.find(t => t.id === threadAId);
    if (!targetThread) throw new Error('Question A was lost after re-login!');
    if (targetThread.replies_count !== 1) throw new Error(`Expected 1 reply on Question A, got: ${targetThread.replies_count}`);

    console.log(`✅ [9/9] Database Persistence Verified: Question A and its replies retrieved perfectly after Student A re-login!`);

    console.log('\n================================================================');
    console.log('🎉 ALL 9/9 "MY QUESTIONS" & DATA PERSISTENCE TESTS PASSED (100%)!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
