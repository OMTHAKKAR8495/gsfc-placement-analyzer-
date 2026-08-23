export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { role = '', search = '', page = 1, limit = 50 } = req.query;

  const history = [
    { id: 'log_01', user_id: 'u_student_24bt04171', role: 'student', email: '24bt04171@gsfcuniversity.ac.in', login_at: '2026-08-23 11:45:00', logout_at: null, session_status: 'active', ip_address: '192.168.1.42', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' },
    { id: 'log_02', user_id: 'u_faculty_neeshu', role: 'faculty', email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', login_at: '2026-08-23 08:30:00', logout_at: null, session_status: 'active', ip_address: '10.0.1.12', user_agent: 'Chrome 128 / macOS Sequoia', device_type: 'Desktop' },
    { id: 'log_03', user_id: 'u_student_vedant', role: 'student', email: 'vedant@gmail.com', login_at: '2026-08-23 10:15:00', logout_at: null, session_status: 'active', ip_address: '192.168.1.88', user_agent: 'Chrome 128 / Windows 11', device_type: 'Desktop' },
    { id: 'log_04', user_id: 'u_faculty_rajesh', role: 'faculty', email: 'rajesh.sharma@gsfcuniversityfaculty.ac.in', login_at: '2026-08-23 09:00:00', logout_at: '2026-08-23 10:30:00', session_status: 'ended', ip_address: '10.0.1.18', user_agent: 'Edge 128 / Windows 11', device_type: 'Desktop' },
    { id: 'log_05', user_id: 'u_student_arav', role: 'student', email: 'arav.sharma@gsfcuniversity.ac.in', login_at: '2026-08-23 09:30:00', logout_at: '2026-08-23 10:45:00', session_status: 'ended', ip_address: '192.168.1.105', user_agent: 'Safari / iPhone 15', device_type: 'Mobile' }
  ];

  let filtered = history;
  if (role) filtered = filtered.filter(h => h.role === role);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(h => h.email.toLowerCase().includes(s) || h.ip_address.includes(s));
  }

  return res.status(200).json({
    total: filtered.length,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: 1,
    history: filtered
  });
}
