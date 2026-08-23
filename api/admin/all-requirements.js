export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const requirements = [
    {
      id: 'req_gsfc_sde_2026',
      company_id: 'c_gsfc_limited',
      company_name: 'GSFC Limited',
      title: 'Graduate Engineer Trainee — Software & Systems',
      department: 'Computer Science & IT',
      location: 'Vadodara Campus / Plant Tech HQ',
      ctc_stipend: '7.5 LPA CTC',
      ctc_numeric: 7.5,
      role_type: 'Full-Time + PPO',
      deadline: '2026-09-30',
      min_cgpa: 6.5,
      applications_count: 42
    },
    {
      id: 'req_tcs_digital_2026',
      company_id: 'c_tcs',
      company_name: 'Tata Consultancy Services',
      title: 'Digital Systems Engineer (AI/Cloud)',
      department: 'Computer Science & IT',
      location: 'Gandhinagar / Ahmedabad',
      ctc_stipend: '9.0 LPA CTC',
      ctc_numeric: 9.0,
      role_type: 'Full-Time',
      deadline: '2026-10-15',
      min_cgpa: 7.0,
      applications_count: 58
    }
  ];
  return res.status(200).json(requirements);
}
