export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const faculty = [
    {
      user_id: 'u_faculty_neeshu',
      name: 'Dr. Neeshu Chaudhary',
      email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
      password_credential: 'NEESHUCHAUDHARY@8495',
      password_status: 'NEESHUCHAUDHARY@8495 (Official Faculty Key)',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      designation: 'Faculty Placement Coordinator & Assistant Professor',
      phone: '+91 95584 13347',
      status: 'Active Verified',
      assigned_batches: 'BTech CSE & IT (2022-2026, 2023-2027)',
      mentorship_replies_count: 12,
      last_logged_in: 'Active Session (Online)',
      photo_url: ''
    }
  ];

  return res.status(200).json(faculty);
}
