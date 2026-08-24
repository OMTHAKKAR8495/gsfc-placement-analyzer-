async function testAdminAllApplications() {
  console.log('🧪 Testing /api/admin/all-applications endpoint...');
  const res = await fetch('http://localhost:5001/api/admin/all-applications');
  const data = await res.json();
  console.log(`✅ Loaded ${data.length} student applications for Master TPC Database:`);
  data.forEach((app, idx) => {
    console.log(` ${idx + 1}. [${app.student_name} (${app.roll_number})] -> ${app.job_title} @ ${app.company_name} | Match: ${app.match_score}% | Status: ${app.status}`);
  });
}

testAdminAllApplications().catch(console.error);
