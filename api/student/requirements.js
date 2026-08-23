export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sampleDrives = [
    {
      id: 'req_google_01',
      company_name: 'Google Cloud India',
      job_title: 'Software Development Engineer — AI & Cloud Systems',
      location: 'Bengaluru / Hyderabad (Hybrid)',
      employment_type: 'Full-time',
      ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
      min_cgpa: 7.5,
      eligible_branches: 'BTech CSE, BTech IT, MSc CS',
      deadline: '2026-11-30',
      openings: 12,
      applied_count: 48,
      status: 'active',
      is_new: true,
      description: 'Join Google Cloud engineering team building next-generation enterprise AI infrastructure, distributed cloud systems, and scalable Kubernetes backend microservices.',
      skills_required: 'Python, React, Node.js, SQL, Cloud Architecture, Docker, Kubernetes',
      external_apply_url: 'https://careers.google.com'
    },
    {
      id: 'req_msft_01',
      company_name: 'Microsoft Azure Systems',
      job_title: 'Graduate Software Engineer (Cloud & Microservices)',
      location: 'Noida / Hyderabad / Remote',
      employment_type: 'Full-time',
      ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
      min_cgpa: 7.0,
      eligible_branches: 'BTech CSE, BTech IT, MCA',
      deadline: '2026-11-15',
      openings: 8,
      applied_count: 35,
      status: 'active',
      is_new: true,
      description: 'Develop scalable cloud microservices, Kubernetes control planes, and enterprise AI orchestration pipelines on Azure cloud ecosystem.',
      skills_required: 'C#, Python, Azure, Distributed Systems, SQL, Microservices, CI/CD',
      external_apply_url: 'https://careers.microsoft.com'
    },
    {
      id: 'req_gsfc_01',
      company_name: 'GSFC Limited',
      job_title: 'Chemical Process & Plant Automation Engineer',
      location: 'Vadodara, Gujarat (On-site)',
      employment_type: 'Full-time',
      ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
      min_cgpa: 6.8,
      eligible_branches: 'BTech Chemical, BTech Mechanical, MSc Chemistry',
      deadline: '2026-12-05',
      openings: 15,
      applied_count: 52,
      status: 'active',
      is_new: false,
      description: 'Lead process automation, continuous fertilizer synthesis monitoring, and environmental safety protocols at GSFC state-of-the-art Vadodara industrial complex.',
      skills_required: 'Aspen Plus, MATLAB, Process Simulation, Chemical Reaction Engineering, Industrial Safety, PLC',
      external_apply_url: 'https://www.gsfclimited.com/careers'
    }
  ];

  return res.status(200).json({
    feed: sampleDrives,
    total: sampleDrives.length
  });
}
