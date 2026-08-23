export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { search = '', program = '', page = 1, limit = 50 } = req.query;

  const allStudents = [
    {
      id: 's_omthakkar',
      user_id: 'u_omthakkar',
      name: 'Om Thakkar',
      email: '24bt04171@gsfcuniversity.ac.in',
      user_email: '24bt04171@gsfcuniversity.ac.in',
      phone: '+91 95584 13347',
      roll_number: '24BT04171',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      current_semester: 7,
      current_division: 'A',
      passing_year: 2026,
      admission_year: 2022,
      batch_year: '2022-2026',
      cgpa: 8.9,
      backlogs: 0,
      skills: 'React, Node.js, Python, Fast-API, ATS Tuning',
      ats_score: 92,
      placement_status: 'Shortlisted',
      photo_url: '',
      total_logins: 14,
      last_login_time: '2026-08-23 11:45:00',
      last_logout_time: 'Active Session',
      active_session_status: 'active',
      last_seen_time: new Date().toISOString(),
      completion_percentage: 95,
      applications_count: 3
    },
    {
      id: 's_vedant',
      user_id: 'u_vedant',
      name: 'Vedant Patel',
      email: 'vedant@gmail.com',
      user_email: 'vedant@gmail.com',
      phone: '+91 98251 67890',
      roll_number: '24BCE181',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      current_semester: 5,
      current_division: 'B',
      passing_year: 2028,
      admission_year: 2024,
      batch_year: '2024-2028',
      cgpa: 8.7,
      backlogs: 0,
      skills: 'Python, Machine Learning, React, PostgreSQL',
      ats_score: 91,
      placement_status: 'In Process',
      photo_url: '',
      total_logins: 8,
      last_login_time: '2026-08-23 10:15:00',
      last_logout_time: '2026-08-23 11:30:00',
      active_session_status: 'active',
      last_seen_time: new Date().toISOString(),
      completion_percentage: 90,
      applications_count: 2
    },
    {
      id: 's_arav',
      user_id: 'u_arav',
      name: 'Arav Sharma',
      email: 'arav.sharma@gsfcuniversity.ac.in',
      user_email: 'arav.sharma@gsfcuniversity.ac.in',
      phone: '+91 98765 43211',
      roll_number: '22BCE101',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      current_semester: 7,
      current_division: 'A',
      passing_year: 2026,
      admission_year: 2022,
      batch_year: '2022-2026',
      cgpa: 8.9,
      backlogs: 0,
      skills: 'Java, Spring Boot, AWS, Kubernetes',
      ats_score: 90,
      placement_status: 'Offer Received',
      photo_url: '',
      total_logins: 22,
      last_login_time: '2026-08-23 09:30:00',
      last_logout_time: '2026-08-23 10:45:00',
      active_session_status: 'ended',
      last_seen_time: '2026-08-23 10:45:00',
      completion_percentage: 100,
      applications_count: 4
    }
  ];

  let filtered = allStudents;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(st => st.name.toLowerCase().includes(s) || st.roll_number.toLowerCase().includes(s) || st.email.toLowerCase().includes(s));
  }
  if (program) {
    filtered = filtered.filter(st => st.program.toLowerCase().includes(program.toLowerCase()));
  }

  return res.status(200).json({
    total: filtered.length,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: 1,
    students: filtered
  });
}
