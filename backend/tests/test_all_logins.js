import http from 'http';
import app from '../index.js';

console.log('🧪 Starting End-to-End Live HTTP Login Verification for All Portal Accounts & Roles...\n');

const testAccounts = [
  // --- STUDENTS ---
  { label: 'Student Roll Number (24BT04171)', email: '24bt04171', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Roll Number Upper (24BT04171)', email: '24BT04171', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Email (24bt04171@gsfcuniversity.ac.in)', email: '24bt04171@gsfcuniversity.ac.in', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Email (thakkar_om@gmail.com)', email: 'thakkar_om@gmail.com', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Roll Number (21BCE045 - Arav)', email: '21bce045', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Email (arav.sharma@student.edu)', email: 'arav.sharma@student.edu', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Roll Number (22BCE108 - Tanvi)', email: '22bce108', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Roll Number (22BCH012 - Arav)', email: '22bch012', pass: 'password123', expectedRole: 'student' },
  { label: 'Student Roll Number (21BME034 - Rahul)', email: '21bme034', pass: 'password123', expectedRole: 'student' },

  // --- TPO / ADMIN ---
  { label: 'TPC Admin Username (admin)', email: 'admin', pass: 'password123', expectedRole: 'admin' },
  { label: 'TPC Admin Email (admin@gsfcuniversity.ac.in)', email: 'admin@gsfcuniversity.ac.in', pass: 'password123', expectedRole: 'admin' },
  { label: 'TPC Admin Email (tpc@university.edu)', email: 'tpc@university.edu', pass: 'password123', expectedRole: 'admin' },
  { label: 'Superadmin Username (superadmin)', email: 'superadmin', pass: 'password123', expectedRole: 'superadmin' },
  { label: 'Superadmin Email (superadmin@gsfcuniversity.ac.in)', email: 'superadmin@gsfcuniversity.ac.in', pass: 'password123', expectedRole: 'superadmin' },

  // --- FACULTY ---
  { label: 'Faculty Username (faculty.cse)', email: 'faculty.cse', pass: 'password123', expectedRole: 'faculty' },
  { label: 'Faculty Email (faculty.cse@gsfcuniversity.ac.in)', email: 'faculty.cse@gsfcuniversity.ac.in', pass: 'password123', expectedRole: 'faculty' },
  { label: 'Faculty Email (neeshuchaudhary@gsfcuniversityfaculty.ac.in)', email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', pass: 'password123', expectedRole: 'faculty' },

  // --- COMPANY / RECRUITER ---
  { label: 'GSFC Limited Partner (gsfclimited@gmail.com)', email: 'gsfclimited@gmail.com', pass: 'password123', expectedRole: 'company' },
  { label: 'Google Recruiter (recruiter.google@company.com)', email: 'recruiter.google@company.com', pass: 'password123', expectedRole: 'company' },
  { label: 'Google Cloud India (c_google@recruiter.com)', email: 'c_google@recruiter.com', pass: 'password123', expectedRole: 'company' },
  { label: 'Microsoft Azure (c_microsoft@recruiter.com)', email: 'c_microsoft@recruiter.com', pass: 'password123', expectedRole: 'company' },
  { label: 'TCS Recruiter (c_tcs@recruiter.com)', email: 'c_tcs@recruiter.com', pass: 'password123', expectedRole: 'company' },

  // --- ALUMNI ---
  { label: 'Alumni Mentor (priya.patel@alumni.gsfc.ac.in)', email: 'priya.patel@alumni.gsfc.ac.in', pass: 'password123', expectedRole: 'alumni' },

  // --- SECURITY ---
  { label: 'Security Officer Username (security)', email: 'security', pass: 'password123', expectedRole: 'security' },
  { label: 'Security Officer Email (security@gsfcuniversity.ac.in)', email: 'security@gsfcuniversity.ac.in', pass: 'password123', expectedRole: 'security' },

  // --- FEST ATTENDEE ---
  { label: 'Fest Guest Attendee (fest_attendee@msu.ac.in)', email: 'fest_attendee@msu.ac.in', pass: 'password123', expectedRole: 'student' }
];

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  
  let passed = 0;
  let failed = 0;

  for (const acc of testAccounts) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pass, selectedRole: acc.expectedRole })
      });

      const body = await res.json();

      if (res.status === 200 && (body.token || body.user)) {
        console.log(`✅ [PASS] ${acc.label}`);
        console.log(`   └─ Email: ${body.user?.email || acc.email} | Role: ${body.user?.role} | Token: ${body.token ? 'JWT OK' : 'Cookie OK'}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${acc.label} -> HTTP ${res.status}: ${JSON.stringify(body)}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${acc.label} -> ${err.message}`);
      failed++;
    }
  }

  server.close(() => {
    console.log(`\n======================================================`);
    console.log(`📊 LIVE HTTP LOGIN TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 100% OF PORTAL LOGINS SUCCEEDED WITH 0 ERRORS!');
      process.exit(0);
    }
  });
});
