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
    const { email = '', role = 'student', name = '', roll_number = '', program = 'BTech CSE' } = req.body || {};
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (role === 'student') {
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
          error: 'Registration Blocked: Your enrollment number or email has not been registered by TPC Admin. Only students pre-authorized by TPC can access the portal.'
        });
      }
    }

    const token = 'jwt_token_' + Date.now();
    const emailPrefix = cleanEmail.split('@')[0].toUpperCase();

    let userPayload = {
      id: 'u_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      role: role,
      name: name || 'Student Candidate',
      owner_id: 's_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      profile: {
        id: 's_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: name || 'Student Candidate',
        program: program || 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.5,
        roll_number: roll_number || emailPrefix,
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
