export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const students = [
    {
      id: 's_omthakkar',
      user_id: 'u_omthakkar',
      name: 'Om Thakkar',
      email: '24bt04171@gsfcuniversity.ac.in',
      phone: '+91 95584 13347',
      roll_number: '24BT04171',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      passing_year: 2026,
      admission_year: 2022,
      cgpa: 8.9,
      backlogs: 0,
      skills: 'React, Node.js, Python, Fast-API, ATS Tuning',
      ats_score: 92,
      placement_status: 'Shortlisted',
      photo_url: '',
      login_credential_hint: '24bt04171@gsfcuniversity.ac.in',
      password_status: 'Secured with Bcrypt Hash (10 rounds)',
      last_logged_in: 'Active Session (Online)'
    },
    {
      id: 's_vedant',
      user_id: 'u_vedant',
      name: 'Vedant Patel',
      email: 'vedant@gmail.com',
      phone: '+91 98251 67890',
      roll_number: '24BCE181',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      passing_year: 2028,
      admission_year: 2024,
      cgpa: 8.7,
      backlogs: 0,
      skills: 'Python, Machine Learning, React, PostgreSQL',
      ats_score: 91,
      placement_status: 'In Process',
      photo_url: '',
      login_credential_hint: 'vedant@gmail.com',
      password_status: 'Secured with Bcrypt Hash',
      last_logged_in: 'Today at 11:30 AM'
    },
    {
      id: 's_arav',
      user_id: 'u_arav',
      name: 'Arav Sharma',
      email: 'arav.sharma@gsfcuniversity.ac.in',
      phone: '+91 98765 43211',
      roll_number: '22BCE101',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      passing_year: 2026,
      admission_year: 2022,
      cgpa: 8.9,
      backlogs: 0,
      skills: 'Java, Spring Boot, AWS, Kubernetes',
      ats_score: 90,
      placement_status: 'Offer Received',
      photo_url: '',
      login_credential_hint: 'arav.sharma@gsfcuniversity.ac.in',
      password_status: 'Secured with Bcrypt Hash',
      last_logged_in: 'Today at 10:45 AM'
    }
  ];

  return res.status(200).json(students);
}
