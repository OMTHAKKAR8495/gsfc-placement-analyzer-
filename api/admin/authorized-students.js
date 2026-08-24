export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const defaultList = [
      {
        id: 'auth_24bt04171',
        roll_number: '24BT04171',
        email: '24bt04171@gsfcuniversity.ac.in',
        name: 'Om Thakkar',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.9,
        passing_year: 2026,
        admission_year: 2024,
        phone: '+91 98765 43210',
        access_status: 'active',
        authorized_by: 'TPC Admin Governance',
        created_at: new Date().toISOString()
      },
      {
        id: 'auth_21bce045',
        roll_number: '21BCE045',
        email: 'thakkar_om@gmail.com',
        name: 'Thakkar Om',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.8,
        passing_year: 2026,
        admission_year: 2022,
        phone: '+91 98765 43210',
        access_status: 'active',
        authorized_by: 'TPC Admin Governance',
        created_at: new Date().toISOString()
      },
      {
        id: 'auth_21bce042',
        roll_number: '21BCE042',
        email: 'student@gsfcuniversity.ac.in',
        name: 'Priya Patel',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.6,
        passing_year: 2026,
        admission_year: 2022,
        phone: '+91 98765 43210',
        access_status: 'active',
        authorized_by: 'TPC Admin Governance',
        created_at: new Date().toISOString()
      },
      {
        id: 'auth_22bce108',
        roll_number: '22BCE108',
        email: 'tanvi.j@gsfcuniversity.ac.in',
        name: 'Tanvi Joshi',
        program: 'BTech CSE',
        branch: 'AI & Data Science',
        cgpa: 9.1,
        passing_year: 2026,
        admission_year: 2022,
        phone: '+91 98765 43210',
        access_status: 'active',
        authorized_by: 'TPC Admin Governance',
        created_at: new Date().toISOString()
      },
      {
        id: 'auth_22bch012',
        roll_number: '22BCH012',
        email: 'arav.sharma@student.gsfc.ac.in',
        name: 'Arav Sharma',
        program: 'BTech Chemical',
        branch: 'Chemical Engineering',
        cgpa: 8.4,
        passing_year: 2026,
        admission_year: 2022,
        phone: '+91 98765 43210',
        access_status: 'active',
        authorized_by: 'TPC Admin Governance',
        created_at: new Date().toISOString()
      }
    ];

    return res.status(200).json(defaultList);
  }

  if (req.method === 'POST') {
    const { roll_number, email, name } = req.body || {};
    return res.status(200).json({
      success: true,
      message: `Student ${name || 'Candidate'} (${roll_number || 'ID'}) successfully authorized for portal access!`
    });
  }

  if (req.method === 'PUT') {
    const { status } = req.body || {};
    return res.status(200).json({
      success: true,
      message: `Student access status updated to ${(status || 'active').toUpperCase()}!`
    });
  }

  if (req.method === 'DELETE') {
    return res.status(200).json({
      success: true,
      message: 'Student authorization removed successfully!'
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
