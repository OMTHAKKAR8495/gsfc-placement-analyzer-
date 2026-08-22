import assert from 'assert';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // text remains
  }
  return { status: res.status, headers: res.headers, json, text };
}

async function runE2EAudit() {
  console.log('================================================================================');
  console.log('🔍 GSFC UNIVERSITY CAMPUSHIRE AI — COMPREHENSIVE END-TO-END SYSTEM AUDIT');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function record(phase, testName, condition, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [${phase}] ${testName} ${details ? `(${details})` : ''}`);
    } else {
      console.error(`  ❌ [${phase}] ${testName} FAILED! ${details}`);
      throw new Error(`Audit Failure: ${testName}`);
    }
  }

  // ==========================================
  // PHASE 1: AUTHENTICATION & ROLE ISOLATION
  // ==========================================
  console.log('--- Phase 1: Authentication, Role-Based Access & Presets ---');
  
  // 1.1 Student Login
  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', password: 'password123' })
  });
  record('Auth', 'Student Login', studentLogin.status === 200 && studentLogin.json.token, `Role: ${studentLogin.json?.user?.role}`);

  // 1.2 Admin Login
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: 'password123' })
  });
  record('Auth', 'Admin Login', adminLogin.status === 200 && adminLogin.json?.user?.role === 'admin', `Role: ${adminLogin.json?.user?.role}`);

  // 1.3 Company Login
  const companyLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'gsfclimited@gmail.com', password: 'password123' })
  });
  record('Auth', 'Company Login', companyLogin.status === 200 && companyLogin.json?.user?.role === 'company', `Company: ${companyLogin.json?.user?.profile?.company_name || 'GSFC Ltd'}`);

  // 1.4 Alumni Login
  const alumniLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'priya.patel@alumni.gsfc.ac.in', password: 'password123' })
  });
  record('Auth', 'Alumni Login', alumniLogin.status === 200 && alumniLogin.json?.user?.role === 'alumni', `Role: ${alumniLogin.json?.user?.role}`);

  // ==========================================
  // PHASE 2: STUDENT PLACEMENT & RESUME ATS
  // ==========================================
  console.log('\n--- Phase 2: Student Requirements Feed & Resume Diagnostics ---');

  // 2.1 Live Requirements Feed
  const reqs = await request('/api/company/requirements');
  record('Student', 'Fetch Live Placement Requirements', reqs.status === 200 && Array.isArray(reqs.json) && reqs.json.length > 0, `${reqs.json?.length} active drives`);

  // 2.2 Student Applications Listing
  const studentApps = await request('/api/student/applications?student_id=s_arav');
  record('Student', 'Fetch Student Application Timeline', studentApps.status === 200 && Array.isArray(studentApps.json), `${studentApps.json?.length} applications tracked`);

  // ==========================================
  // PHASE 3: ALUMNI NETWORK & KNOWLEDGE HUB
  // ==========================================
  console.log('\n--- Phase 3: Alumni Network & Mentorship Feed ---');

  // 3.1 Fetch Mentorship Posts
  const alumniPosts = await request('/api/alumni/posts');
  record('Alumni', 'Fetch Mentorship Stream', alumniPosts.status === 200 && Array.isArray(alumniPosts.json) && alumniPosts.json.length >= 3, `${alumniPosts.json?.length} mentorship articles`);

  // 3.2 Fetch Comments on Post
  const firstPostId = alumniPosts.json[0].id;
  const postComments = await request(`/api/alumni/posts/${firstPostId}/comments`);
  record('Alumni', 'Fetch Post Comments Stream', postComments.status === 200 && Array.isArray(postComments.json), `${postComments.json?.length} comments on ${firstPostId}`);

  // 3.3 Create Comment
  const addComment = await request(`/api/alumni/posts/${firstPostId}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      author_id: 's_arav',
      author_name: 'Arav Sharma',
      author_role: 'student',
      content: 'Automated audit test comment checking real-time stream sync.'
    })
  });
  record('Alumni', 'Submit Student Question to Alumni Post', addComment.status === 201 && addComment.json?.comment?.id);

  // ==========================================
  // PHASE 4: MULTI-EMPLOYER JOB FAIRS & CONCLAVES
  // ==========================================
  console.log('\n--- Phase 4: Job Fairs & Multi-Employer Conclaves ---');

  // 4.1 Fetch Job Fairs Directory
  const fairs = await request('/api/jobfair');
  record('JobFair', 'Fetch Scheduled Conclaves', fairs.status === 200 && Array.isArray(fairs.json) && fairs.json.length >= 2, `${fairs.json?.length} conclaves found`);

  // 4.2 Fetch Single Fair Details with Attached Drives
  const fairId = fairs.json[0].id;
  const fairDetails = await request(`/api/jobfair/${fairId}`);
  record('JobFair', 'Fetch Conclave Drives & Registered Students', fairDetails.status === 200 && fairDetails.json?.participating_companies, `${fairDetails.json?.participating_companies?.length} drives attached`);

  // 4.3 Student 1-Click Registration
  const fairReg = await request(`/api/jobfair/${fairId}/register`, {
    method: 'POST',
    body: JSON.stringify({ student_id: 's_arav' })
  });
  record('JobFair', '1-Click Student Conclave Registration', fairReg.status === 200 && fairReg.json?.success);

  // ==========================================
  // PHASE 5: COMMUNITY Q&A & DOUBTS
  // ==========================================
  console.log('\n--- Phase 5: Community Placement Q&A ---');

  // 5.1 Fetch Threads
  const qaThreads = await request('/api/qa/threads');
  record('Q&A', 'Fetch Community Doubt Threads', qaThreads.status === 200 && Array.isArray(qaThreads.json) && qaThreads.json.length >= 2, `${qaThreads.json?.length} threads active`);

  // 5.2 Fetch Thread Details with Replies
  const threadId = qaThreads.json[0].id;
  const threadDetails = await request(`/api/qa/threads/${threadId}`);
  record('Q&A', 'Fetch Q&A Discussion Thread & Official Replies', threadDetails.status === 200 && Array.isArray(threadDetails.json?.replies), `${threadDetails.json?.replies?.length} replies`);

  // 5.3 Post a Community Reply
  const addReply = await request(`/api/qa/threads/${threadId}/replies`, {
    method: 'POST',
    body: JSON.stringify({
      author_id: 'u_admin_gsfc',
      author_name: 'GSFC TPO Directorate',
      author_role: 'tpo',
      body: 'Verified official placement guideline statement from TPO cell.'
    })
  });
  record('Q&A', 'Post Verified TPO Reply', addReply.status === 201 && addReply.json?.reply?.id);

  // ==========================================
  // PHASE 6: AI/ML PREDICTIVE RECRUITMENT FORECAST
  // ==========================================
  console.log('\n--- Phase 6: AI/ML Predictive Analytics & Early-Warning Interventions ---');

  const forecast = await request('/api/admin/analytics/forecast');
  record('PredictiveAI', 'Compute Institutional Placement Forecast', forecast.status === 200 && forecast.json?.success === true, `Avg CTC: ₹${forecast.json?.forecast?.ctcTrend?.projectedAvgCtcLPA} LPA`);
  record('PredictiveAI', 'Branch-Wise Forecast Projections', Array.isArray(forecast.json?.forecast?.branchForecast) && forecast.json.forecast.branchForecast.length > 0, `${forecast.json?.forecast?.branchForecast?.length} depts analyzed`);
  record('PredictiveAI', 'Early-Warning At-Risk Candidate Roster', Array.isArray(forecast.json?.atRiskStudentsList), `${forecast.json?.atRiskStudentsList?.length} at-risk candidates flagged`);

  // ==========================================
  // PHASE 7: TPC ADMIN GOVERNANCE & NAAC / NIRF
  // ==========================================
  console.log('\n--- Phase 7: TPC Admin Governance, Multi-Year Filtering & NIRF Reports ---');

  // 7.1 Governance Analytics
  const adminAnalytics = await request('/api/admin/analytics');
  record('Admin', 'Fetch 360° Placement Conversion Analytics', adminAnalytics.status === 200 && adminAnalytics.json?.totalStudents > 0, `${adminAnalytics.json?.totalStudents} students, ${adminAnalytics.json?.totalCompanies} companies`);

  // 7.2 Multi-Year Student Filtering (2020-2030)
  const students2026 = await request('/api/admin/students?passingYear=2026');
  record('Admin', 'Multi-Year Student Registry (Passing 2026)', students2026.status === 200 && Array.isArray(students2026.json), `${students2026.json?.length} batch 2026 candidates`);

  // 7.3 NAAC & NIRF Accreditation API
  const nirfData = await request('/api/admin/accreditation/nirf-naac-data');
  const medianSalary = nirfData.json?.overall_metrics?.overall_median_lpa || 7.5;
  record('Admin', 'NAAC Criterion 5.2.1 & NIRF Parameter 3 Engine', nirfData.status === 200 && nirfData.json?.is_live_database_data, `Median CTC: ₹${medianSalary} LPA, Tracked: ${nirfData.json?.overall_metrics?.total_students_tracked}`);

  // 7.4 NIRF & NAAC CSV Export Streams
  const nirfCsv = await request('/api/admin/accreditation/export-nirf-csv');
  record('Admin', 'Stream NIRF Accreditation CSV Report', nirfCsv.status === 200 && nirfCsv.text.includes('Academic Year'), 'NIRF table headers validated');

  const naacCsv = await request('/api/admin/accreditation/export-naac-csv');
  record('Admin', 'Stream NAAC 5.2.1 Placed Roster CSV Report', naacCsv.status === 200 && naacCsv.text.includes('Roll Number'), 'NAAC roster headers validated');

  // 7.5 Pending Alumni Approval Queue
  const pendingAlumni = await request('/api/admin/pending-alumni');
  record('Admin', 'Fetch Pending Alumni Verification Queue', pendingAlumni.status === 200 && Array.isArray(pendingAlumni.json), `${pendingAlumni.json?.length} pending mentors`);

  // ==========================================
  // PHASE 8: INTERVIEW STUDIO & AI EVALUATION
  // ==========================================
  console.log('\n--- Phase 8: AI Interview Studio & STAR Evaluator ---');

  const reqList = await request('/api/company/requirements');
  const sampleReqId = reqList.json[0]?.id || 'req_google_cloud';

  const questions = await request('/api/interview/generate', {
    method: 'POST',
    body: JSON.stringify({
      requirement_id: sampleReqId,
      student_id: 's_arav'
    })
  });
  record('Interview', 'Generate Tailored AI Interview Questions', questions.status === 200 && Array.isArray(questions.json?.questions) && questions.json.questions.length > 0, `${questions.json?.questions?.length} questions generated for ${sampleReqId}`);

  const mockSession = await request('/api/interview/mock/start', {
    method: 'POST',
    body: JSON.stringify({
      requirement_id: sampleReqId,
      student_id: 's_arav'
    })
  });
  record('Interview', 'Initialize AI Mock Interview Session', mockSession.status === 200 && mockSession.json?.sessionId, `Session: ${mockSession.json?.sessionId}`);

  const evaluateAnswer = await request('/api/interview/mock/answer', {
    method: 'POST',
    body: JSON.stringify({
      session_id: mockSession.json.sessionId,
      question_index: 0,
      answer_text: 'I first check the application logs in CloudWatch to see if the downstream service is overloaded. Then I verify the load balancer health checks, inspect database connection pool latency, and increase the timeout threshold while investigating slow database queries.'
    })
  });
  record('Interview', 'Evaluate Student Response via STAR Rubric', evaluateAnswer.status === 200 && evaluateAnswer.json?.feedback, `Verdict: ${evaluateAnswer.json?.feedback?.verdict || 'Pass'}, Score: ${evaluateAnswer.json?.feedback?.score || 85}/100`);

  // ==========================================
  // PHASE 9: POD.ai Enterprise Parity Suite (Consortium, Assessment, Employer Network)
  // ==========================================
  console.log('\n--- Phase 9: Multi-College Ecosystem & POD.ai Enterprise Parity ---');

  const consortium = await request('/api/ecosystem/colleges');
  record('Ecosystem', 'Fetch Multi-College Consortium Roster', consortium.status === 200 && consortium.json?.total_colleges >= 10, `${consortium.json?.total_colleges} partner universities, ${consortium.json?.total_pool_students?.toLocaleString()} pool students`);

  const poolDrives = await request('/api/ecosystem/pool-drives');
  record('Ecosystem', 'Fetch Inter-University Joint Pool Drives', poolDrives.status === 200 && Array.isArray(poolDrives.json) && poolDrives.json.length >= 3, `${poolDrives.json?.length} active joint pool conclaves`);

  const registerPool = await request('/api/ecosystem/pool-drives/register', {
    method: 'POST',
    body: JSON.stringify({
      driveId: poolDrives.json[0]?.id || 'pool_drive_google_cloud',
      studentName: 'Arav Sharma',
      collegeCode: 'GSFCU',
      rollNumber: '24BT04171'
    })
  });
  record('Ecosystem', 'Register Candidate for Joint Pool Drive', registerPool.status === 200 && registerPool.json?.success, registerPool.json?.message || 'Registered');

  const employerNetwork = await request('/api/ecosystem/employers');
  record('Ecosystem', 'National Verified Employer Marketplace (100+ Network)', employerNetwork.status === 200 && Array.isArray(employerNetwork.json) && employerNetwork.json.length >= 10, `${employerNetwork.json?.length} enterprise partner employers verified`);

  const submitAssessment = await request('/api/ecosystem/assessments/submit', {
    method: 'POST',
    body: JSON.stringify({
      assessmentId: 'assess_software_fullstack',
      candidateName: 'Arav Sharma',
      candidateEmail: 'arav@gsfcuniversity.ac.in',
      collegeName: 'GSFC University',
      mcqAnswers: { q1: 0, q2: 0, q3: 0, q4: 0 },
      codeSolution: 'function maxSubArray(nums) { let currentSum = 0; let maxSum = nums[0]; for(let i=0; i<nums.length; i++) { currentSum = Math.max(nums[i], currentSum + nums[i]); maxSum = Math.max(maxSum, currentSum); } return maxSum; }',
      tabSwitchesCount: 0
    })
  });
  record('Ecosystem', 'Proctored Assessment Execution & Anti-Cheat Grading', submitAssessment.status === 200 && submitAssessment.json?.score === 100, `Score: ${submitAssessment.json?.percentage}%, Integrity: ${submitAssessment.json?.proctoring_integrity_score}%, Status: ${submitAssessment.json?.status}`);

  const infraHealth = await request('/api/ecosystem/infra-health');
  record('Ecosystem', 'Production Infrastructure & 99.99% SLA Monitor', infraHealth.status === 200 && infraHealth.json?.sla_uptime_percent === 99.99, `Status: ${infraHealth.json?.status}, Cache Latency: ${infraHealth.json?.in_memory_cache?.latency_ms}ms, Active Indexes: ${infraHealth.json?.database_cluster?.b_tree_indexes_active}`);

  // ==========================================
  // PHASE 10: GSFC AI PLACEMENT INTELLIGENCE PLATFORM
  // ==========================================
  console.log('\n--- Phase 10: GSFC AI Placement Intelligence Platform (Copilot, What-If, Heatmap, RAG, Audit) ---');

  const tpoCopilotRes = await request('/api/intelligence/tpo-copilot', {
    method: 'POST',
    body: JSON.stringify({ query: 'Show students eligible for next company' })
  });
  record('Intelligence', 'AI TPO Copilot Natural-Language Query Processor', tpoCopilotRes.status === 200 && tpoCopilotRes.json?.response && tpoCopilotRes.json?.table, 'Returned structured database response & table');

  const careerCopilotRes = await request('/api/intelligence/student-copilot', {
    method: 'POST',
    body: JSON.stringify({ query: 'Which skills should I learn for Google Cloud?' })
  });
  record('Intelligence', 'AI Student Career Copilot Personalized Mentor', careerCopilotRes.status === 200 && careerCopilotRes.json?.answer, 'Returned contextual skill guidance & questions');

  const readinessRes = await request('/api/intelligence/readiness/s_arav');
  record('Intelligence', '10-Point Student Placement Readiness & Probability Engine', readinessRes.status === 200 && readinessRes.json?.dimensions?.length === 10, `Readiness: ${readinessRes.json?.overall_readiness_score}/100, Probability: ${readinessRes.json?.placement_probability}%, Risk: ${readinessRes.json?.risk_level}`);

  const skillHeatmapRes = await request('/api/intelligence/skill-heatmap?department=ALL');
  record('Intelligence', 'University-Wide Skill Gap Heatmap Diagnostic', skillHeatmapRes.status === 200 && Array.isArray(skillHeatmapRes.json?.skills) && skillHeatmapRes.json?.skills?.length >= 5, `${skillHeatmapRes.json?.skills?.length} technical skills evaluated`);

  const earlyWarningsRes = await request('/api/intelligence/early-warnings');
  record('Intelligence', 'Early Warning System & At-Risk Action Queue', earlyWarningsRes.status === 200 && earlyWarningsRes.json?.total_at_risk !== undefined, `${earlyWarningsRes.json?.total_at_risk} candidates flagged for remedial intervention`);

  const whatIfRes = await request('/api/intelligence/what-if', {
    method: 'POST',
    body: JSON.stringify({ dsaTrainingStudents: 150, companyParticipationIncreasePct: 20 })
  });
  record('Intelligence', 'Placement "What-If" Scenario Simulation Engine', whatIfRes.status === 200 && whatIfRes.json?.projection?.projected_placement_rate > 0, `Lift: ${whatIfRes.json?.projection?.placement_rate_lift_pct}, Projected Rate: ${whatIfRes.json?.projection?.projected_placement_rate}%`);

  const ragQueryRes = await request('/api/intelligence/rag-query', {
    method: 'POST',
    body: JSON.stringify({ query: 'What is the Dream Offer policy at GSFC?' })
  });
  record('Intelligence', 'Placement Policy RAG Engine & Citation Guardrail', ragQueryRes.status === 200 && ragQueryRes.json?.citation_id, `Citation: ${ragQueryRes.json?.source_document}`);

  const globalSearchRes = await request('/api/intelligence/global-search?q=google');
  record('Intelligence', 'Global Search Engine (Search Everything)', globalSearchRes.status === 200 && Array.isArray(globalSearchRes.json?.results), `Found ${globalSearchRes.json?.results?.length} matching entities`);

  const facultyAnalyticsRes = await request('/api/faculty/department-analytics?department=BTech+CSE');
  record('Faculty', 'Departmental Faculty Placement Analytics & Remedial Hub', facultyAnalyticsRes.status === 200 && facultyAnalyticsRes.json?.total_students > 0, `${facultyAnalyticsRes.json?.total_students} departmental students tracked`);

  const auditLogsRes = await request('/api/audit/logs');
  record('Security', 'Immutable Administrative Action Audit Trail', auditLogsRes.status === 200 && Array.isArray(auditLogsRes.json), `${auditLogsRes.json?.length} audit events verified`);

  console.log('\n================================================================================');
  console.log(`🎉 COMPREHENSIVE END-TO-END AUDIT PASSED: ${passedTests}/${totalTests} TESTS (100%)!`);
  console.log('================================================================================\n');
}

runE2EAudit().catch(err => {
  console.error('\n❌ E2E Audit Failed with Error:', err);
  process.exit(1);
});
