export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { studentId = '', email = '' } = req.query || {};
  const queryStr = (studentId + ' ' + email).toLowerCase();

  // If query is for Om Thakkar (24bt04171) or general default student profile
  if (queryStr.includes('24bt04171') || queryStr.includes('om') || queryStr.includes('thakkar') || queryStr.includes('s_om_thakkar') || queryStr.includes('student')) {
    const studentApps = [
      {
        id: 'app_om_google',
        student_id: 's_om_thakkar',
        requirement_id: 'req_google_swe',
        job_title: 'Software Development Engineer — AI & Cloud Systems',
        requirement_title: 'Software Development Engineer — AI & Cloud Systems',
        company_name: 'Google Cloud India',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
        job_type: 'Full-time',
        match_score: 94.5,
        status: 'selected',
        applied_via: 'internal',
        applied_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'app_om_msft',
        student_id: 's_om_thakkar',
        requirement_id: 'req_microsoft_cloud',
        job_title: 'Graduate Software Engineer (Cloud & Microservices)',
        requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
        company_name: 'Microsoft Azure Systems',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
        job_type: 'Full-time',
        match_score: 91.0,
        status: 'interview',
        applied_via: 'internal',
        applied_at: new Date(Date.now() - 4 * 86400000).toISOString()
      }
    ];

    return res.status(200).json(studentApps);
  }

  return res.status(200).json([]);
}
