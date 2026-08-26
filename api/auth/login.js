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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email = '', password = '', selectedRole = 'student' } = req.body || {};
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const finalRole = selectedRole || 'company';

    const token = 'jwt_token_' + Date.now();
    const formattedCompanyName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const emailPrefix = cleanEmail.split('@')[0].toUpperCase();
    const isOmThakkar = cleanEmail.includes('24bt04171') || cleanEmail.includes('thakkar_om');
    let userPayload = {
      id: 'u_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      role: finalRole,
      name: finalRole === 'admin' ? 'TPC Director' : (finalRole === 'faculty' ? 'Dr. Neeshu Chaudhary' : (finalRole === 'company' ? `${formattedCompanyName} Recruiter` : (finalRole === 'alumni' ? 'GSFC Alumni Mentor' : (isOmThakkar ? 'Om Thakkar' : 'Student Candidate')))),
      owner_id: (finalRole === 'company' ? 'c_' : 's_') + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      profile: finalRole === 'company' ? {
        id: 'c_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        company_name: `${formattedCompanyName} Technologies`,
        industry: 'Information Technology & Engineering Services',
        location: 'Vadodara / Pan-India Hybrid',
        contact_email: cleanEmail,
        phone: '',
        verified: 1,
        tier: 'Platinum Recruiter',
        logo_url: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?w=100&auto=format&fit=crop&q=60'
      } : (finalRole === 'admin' ? {
        id: 'a_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: 'GSFC TPC Director',
        department: 'Training & Placement Cell',
        phone: '+91 265 309 3700'
      } : (finalRole === 'faculty' ? {
        id: 'f_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: 'Dr. Neeshu Chaudhary',
        department: 'Computer Science & Engineering',
        phone: '+91 265 309 3740'
      } : {
        id: 's_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: isOmThakkar ? 'Om Thakkar' : 'Student Candidate',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.9,
        roll_number: emailPrefix.startsWith('24') || emailPrefix.startsWith('23') || emailPrefix.startsWith('22') ? emailPrefix : '24BT04171',
        phone: isOmThakkar ? '+91 95584 13347' : ''
      }))
    };

    return res.status(200).json({
      success: true,
      token,
      user: userPayload
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
