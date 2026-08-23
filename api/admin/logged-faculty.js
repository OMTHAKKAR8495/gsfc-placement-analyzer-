export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { search = '', department = '', page = 1, limit = 50 } = req.query;

  const facultyList = [
    {
      id: 'f_neeshu',
      faculty_id: 'f_neeshu',
      user_id: 'u_faculty_neeshu',
      name: 'Dr. Neeshu Chaudhary',
      email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
      role: 'faculty',
      phone: '+91 95584 13347',
      department: 'Computer Science & Engineering',
      designation: 'Faculty Placement Coordinator & Assistant Professor',
      assigned_batches: 'BTech CSE & IT (2022-2026, 2023-2027)',
      photo_url: '',
      status: 'Active Verified',
      registered_at: '2026-08-20 09:00:00',
      total_logins: 19,
      last_login_time: '2026-08-23 08:30:00',
      last_logout_time: 'Active Session',
      active_session_status: 'active',
      last_seen_time: new Date().toISOString(),
      mentorship_replies_count: 12
    },
    {
      id: 'f_rajesh',
      faculty_id: 'f_rajesh',
      user_id: 'u_faculty_rajesh',
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@gsfcuniversityfaculty.ac.in',
      role: 'faculty',
      phone: '+91 98888 77777',
      department: 'Chemical Engineering',
      designation: 'Senior Faculty Placement Advisor',
      assigned_batches: 'BTech Chemical & Mechanical (2022-2026)',
      photo_url: '',
      status: 'Active Verified',
      registered_at: '2026-08-21 10:00:00',
      total_logins: 9,
      last_login_time: '2026-08-23 09:00:00',
      last_logout_time: '2026-08-23 10:30:00',
      active_session_status: 'ended',
      last_seen_time: '2026-08-23 10:30:00',
      mentorship_replies_count: 8
    }
  ];

  let filtered = facultyList;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(f => f.name.toLowerCase().includes(s) || f.email.toLowerCase().includes(s) || f.department.toLowerCase().includes(s));
  }
  if (department) {
    filtered = filtered.filter(f => f.department.toLowerCase().includes(department.toLowerCase()));
  }

  return res.status(200).json({
    total: filtered.length,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: 1,
    faculty: filtered
  });
}
