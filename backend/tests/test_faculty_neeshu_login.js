// Native fetch in Node 18+

async function testFacultyLogin() {
  const baseUrl = 'http://localhost:5001';
  console.log('Testing Faculty Login for Dr. Neeshu Chaudhary on ' + baseUrl);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
      password: 'NEESHUCHAUDHARY@8495'
    })
  });

  const data = await loginRes.json();
  console.log('Faculty Login Status:', loginRes.status);
  console.log('Response:', data);

  if (!loginRes.ok || data.user?.role !== 'faculty') {
    throw new Error('Faculty login test failed!');
  }

  console.log('✅ Faculty login verified successfully for Dr. Neeshu Chaudhary (Role: ' + data.user.role + ')');
}

testFacultyLogin().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
