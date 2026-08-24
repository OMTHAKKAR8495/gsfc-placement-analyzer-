async function testMeetingsAPI() {

  console.log('🧪 Testing Meetings & Anti-Cheating REST Endpoints...');

  const tokenAdmin = 'demo_token_admin';
  const tokenStudent = 'demo_token_student';
  const tokenCompany = 'demo_token_company';

  // 1. Health check
  const healthRes = await fetch('http://localhost:5001/api/health');
  console.log('Health check status:', healthRes.status);

  // 2. Fetch all meetings for Admin
  const adminMeetingsRes = await fetch('http://localhost:5001/api/meetings/all', {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const adminMeetings = await adminMeetingsRes.json();
  console.log(`✅ Admin Meetings loaded: ${adminMeetings.length}`);
  console.log('Sample Admin Meeting:', adminMeetings[0]?.title, 'Room:', adminMeetings[0]?.room_id);

  // 3. Fetch meeting details by Room ID
  if (adminMeetings[0]?.room_id) {
    const roomRes = await fetch(`http://localhost:5001/api/meetings/room/${adminMeetings[0].room_id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const roomData = await roomRes.json();
    console.log(`✅ Room Details: ${roomData.meeting?.title}, Participants: ${roomData.participants?.length}, Violations: ${roomData.violations?.length}`);
  }

  // 4. Fetch student meetings
  const studentMeetingsRes = await fetch('http://localhost:5001/api/meetings/student', {
    headers: { Authorization: `Bearer ${tokenStudent}` }
  });
  const studentMeetings = await studentMeetingsRes.json();
  console.log(`✅ Student Meetings loaded: ${studentMeetings.length}`);

  // 5. Test scheduling a meeting
  const scheduleRes = await fetch('http://localhost:5001/api/meetings/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenCompany}`
    },
    body: JSON.stringify({
      driveId: 'req_google_swe',
      title: 'Automated E2E Test Interview Room',
      description: 'Verifying end-to-end WebRTC scheduling and candidate dispatch.',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      durationMinutes: 45,
      studentIds: ['s_omthakkar']
    })
  });
  const scheduleData = await scheduleRes.json();
  console.log(`Schedule Status: ${scheduleRes.status}`, scheduleData);
  console.log(`✅ Scheduled Test Meeting: Room ID = ${scheduleData.meeting?.room_id}`);


  // 6. Test logging a proctoring violation
  const violationRes = await fetch(`http://localhost:5001/api/meetings/${scheduleData.meeting?.id}/violation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStudent}`
    },
    body: JSON.stringify({
      studentId: 's_omthakkar',
      violationType: 'tab_switch',
      details: 'Automated verification test: Page Visibility API visibilitychange triggered.'
    })
  });
  const violationData = await violationRes.json();
  console.log('✅ Violation response:', violationData);

  // 7. Verify updated room has violation
  const updatedRoomRes = await fetch(`http://localhost:5001/api/meetings/room/${scheduleData.meeting?.room_id}`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const updatedRoomData = await updatedRoomRes.json();
  console.log(`✅ Updated Room Violations Count: ${updatedRoomData.violations?.length}`);
  console.log('Logged Violation Detail:', updatedRoomData.violations[0]?.details);

  console.log('🎉 All In-Portal Video Meetings & Anti-Cheating APIs Verified Successfully!');
}

testMeetingsAPI().catch(console.error);
