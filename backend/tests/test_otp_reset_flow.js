// Built-in fetch available in Node 18+

async function testOtpResetFlow() {
  const baseUrl = 'http://localhost:5001';
  console.log('Testing OTP Password Reset Flow on ' + baseUrl);

  // 1. Request OTP
  const otpRes = await fetch(`${baseUrl}/api/auth/forgot-password-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '24bt04171@gsfcuniversity.ac.in', role: 'student' })
  });
  const otpData = await otpRes.json();
  console.log('1. OTP Request Response:', otpData);

  if (!otpData.success || !otpData.devOtp) {
    throw new Error('Failed to get OTP from endpoint');
  }

  // 2. Verify OTP & Reset Password
  const resetRes = await fetch(`${baseUrl}/api/auth/verify-otp-reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '24bt04171@gsfcuniversity.ac.in',
      otp: otpData.devOtp,
      newPassword: 'newSecretPassword123',
      role: 'student'
    })
  });
  const resetData = await resetRes.json();
  console.log('2. Reset Password Response:', resetData);

  if (!resetData.success) {
    throw new Error('Failed to verify OTP and reset password');
  }

  // 3. Login with New Password
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '24bt04171@gsfcuniversity.ac.in',
      password: 'newSecretPassword123',
      role: 'student'
    })
  });
  const loginData = await loginRes.json();
  console.log('3. Login with New Password Response:', loginData.message || loginData.user?.email);

  if (!loginRes.ok) {
    throw new Error('Login with new password failed');
  }

  console.log('\n✅ ALL OTP FORGOT PASSWORD AND VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

testOtpResetFlow().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
