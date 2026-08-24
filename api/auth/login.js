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

    const isCompanyEmail = cleanEmail.includes('hr') || cleanEmail.includes('company') || cleanEmail.includes('recruiter') || cleanEmail.includes('gsfclimited');
    const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('tpc');
    const isFacultyEmail = cleanEmail.includes('faculty') || cleanEmail.includes('neeshuchaudhary') || cleanEmail.includes('prof') || cleanEmail.includes('dr');
    const isAlumniEmail = cleanEmail.includes('alumni') || cleanEmail.includes('alum');

    const detectedRole = isAdminEmail ? 'admin' : (isFacultyEmail ? 'faculty' : (isCompanyEmail ? 'company' : (isAlumniEmail ? 'alumni' : 'student')));

    // Role cross validation
    if (selectedRole && selectedRole !== detectedRole && !(selectedRole === 'admin' && detectedRole === 'superadmin')) {
      const actualLabel = detectedRole === 'company' ? 'company recruiter' : detectedRole;
      const article = ['a', 'e', 'i', 'o', 'u'].includes(actualLabel[0]) ? 'an' : 'a';
      return res.status(403).json({
        error: `Access Denied: This account is registered as ${article} ${actualLabel}. Please use the ${actualLabel} portal.`
      });
    }

    // TPC Admin Student Authorization Gatekeeping
    if (selectedRole === 'student' || detectedRole === 'student') {
      const authorizedDefaultPrefixes = [
        '24bt04171',
        'thakkar_om',
        'student',
        'tanvi.j',
        'arav.sharma',
        'rahul.verma',
        '21bce045',
        '21bce042',
        '22bce108',
        '22bch012',
        '21bme034',
        'omthakkar'
      ];

      const prefix = cleanEmail.split('@')[0];
      const isPreAuthorized = authorizedDefaultPrefixes.some(p => cleanEmail.includes(p) || prefix === p);

      if (!isPreAuthorized && !cleanEmail.endsWith('@gsfcuniversity.ac.in') && !cleanEmail.endsWith('@student.gsfc.ac.in')) {
        return res.status(403).json({
          error: 'Access Denied: Your enrollment/email has not been registered by TPC Admin. Only students added by TPC can access the portal. Please contact GSFC University Training & Placement Cell (TPC) to get enrolled.'
        });
      }
    }

    const token = 'jwt_token_' + Date.now();
    const emailPrefix = cleanEmail.split('@')[0].toUpperCase();

    let userPayload = {
      id: 'u_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      role: selectedRole || detectedRole,
      name: selectedRole === 'admin' ? 'TPC Director' : (selectedRole === 'faculty' ? 'Dr. Neeshu Chaudhary' : (selectedRole === 'company' ? 'Corporate Recruiter' : (selectedRole === 'alumni' ? 'GSFC Alumni Mentor' : 'Om Thakkar'))),
      owner_id: 's_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      profile: {
        id: 's_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: 'Om Thakkar',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.9,
        roll_number: emailPrefix.startsWith('24') || emailPrefix.startsWith('23') || emailPrefix.startsWith('22') ? emailPrefix : '24BT04171',
        phone: '+91 95584 13347'
      }
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
