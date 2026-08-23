export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sampleStudents = [
    {
      id: 's_om_thakkar',
      user_id: 'u_om_thakkar',
      name: 'Om Thakkar',
      roll_number: '24BT04171',
      email: '24bt04171@gsfcuniversity.ac.in',
      phone: '+91 95584 13347',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.9,
      ats_score: 94,
      skills: ['Python', 'React.js', 'Node.js', 'SQL', 'FastAPI', 'Machine Learning', 'Docker', 'Kubernetes'],
      placement_status: 'Placed',
      applications_count: 3,
      mock_interview_score: 94,
      assessment_score: 96,
      applications: [
        {
          id: 'app_om_01',
          company_name: 'Google Cloud India',
          requirement_title: 'Software Development Engineer — AI & Cloud Systems',
          ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
          status: 'selected',
          match_score: 94.5,
          applied_at: '2026-08-20T10:30:00.000Z'
        },
        {
          id: 'app_om_02',
          company_name: 'Microsoft Azure Systems',
          requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
          ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
          status: 'interview',
          match_score: 91.0,
          applied_at: '2026-08-18T14:15:00.000Z'
        },
        {
          id: 'app_om_03',
          company_name: 'GSFC Limited',
          requirement_title: 'Graduate Engineer Trainee (IT & Software)',
          ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
          status: 'shortlisted',
          match_score: 96.0,
          applied_at: '2026-08-15T09:00:00.000Z'
        }
      ]
    },
    {
      id: 's_arav',
      user_id: 'u_arav',
      name: 'Arav Sharma',
      roll_number: '21BCE045',
      email: 'arav.sharma@gsfcuniversity.ac.in',
      phone: '+91 98765 43210',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.8,
      ats_score: 92,
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS', 'TensorFlow', 'REST APIs'],
      placement_status: 'Placed',
      applications_count: 2,
      mock_interview_score: 91,
      assessment_score: 93,
      applications: [
        {
          id: 'app_arav_01',
          company_name: 'Google Cloud India',
          requirement_title: 'Software Development Engineer — AI & Cloud Systems',
          ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
          status: 'selected',
          match_score: 93.0,
          applied_at: '2026-08-19T11:00:00.000Z'
        },
        {
          id: 'app_arav_02',
          company_name: 'Amazon Web Services',
          requirement_title: 'Cloud DevOps Trainee Engineer',
          ctc_range: '₹ 22,00,000 - ₹ 26,00,000 PA',
          status: 'interview',
          match_score: 89.5,
          applied_at: '2026-08-17T16:20:00.000Z'
        }
      ]
    },
    {
      id: 's_priya',
      user_id: 'u_priya',
      name: 'Priya Patel',
      roll_number: '21BCE088',
      email: 'priya.patel@gsfcuniversity.ac.in',
      phone: '+91 98222 33445',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.6,
      ats_score: 89,
      skills: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'GraphQL'],
      placement_status: 'In-Process',
      applications_count: 2,
      mock_interview_score: 86,
      assessment_score: 88,
      applications: [
        {
          id: 'app_priya_01',
          company_name: 'Microsoft Azure Systems',
          requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
          ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
          status: 'interview',
          match_score: 90.0,
          applied_at: '2026-08-18T13:45:00.000Z'
        },
        {
          id: 'app_priya_02',
          company_name: 'Tata Consultancy Services',
          requirement_title: 'Digital Systems & Full-Stack Engineer',
          ctc_range: '₹ 9,00,000 - ₹ 11,50,000 PA',
          status: 'shortlisted',
          match_score: 87.0,
          applied_at: '2026-08-16T10:00:00.000Z'
        }
      ]
    },
    {
      id: 's_vedant',
      user_id: 'u_vedant',
      name: 'Vedant Joshi',
      roll_number: '22BCE102',
      email: 'vedant.joshi@gsfcuniversity.ac.in',
      phone: '+91 97111 88990',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.4,
      ats_score: 86,
      skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'MySQL', 'Git'],
      placement_status: 'In-Process',
      applications_count: 2,
      mock_interview_score: 84,
      assessment_score: 86,
      applications: [
        {
          id: 'app_vedant_01',
          company_name: 'Google Cloud India',
          requirement_title: 'Software Development Engineer — AI & Cloud Systems',
          ctc_range: '₹ 28,00,000 - ₹ 34,00,000 PA',
          status: 'shortlisted',
          match_score: 86.5,
          applied_at: '2026-08-21T09:30:00.000Z'
        },
        {
          id: 'app_vedant_02',
          company_name: 'GSFC Limited',
          requirement_title: 'Enterprise ERP & Web Systems Analyst',
          ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
          status: 'applied',
          match_score: 88.0,
          applied_at: '2026-08-19T15:00:00.000Z'
        }
      ]
    },
    {
      id: 's_neha',
      user_id: 'u_neha',
      name: 'Neha Shah',
      roll_number: '21BCH012',
      email: 'neha.shah@gsfcuniversity.ac.in',
      phone: '+91 98450 11223',
      program: 'BTech Chemical',
      branch: 'Chemical Engineering',
      cgpa: 8.7,
      ats_score: 91,
      skills: ['Aspen Plus', 'MATLAB', 'Process Simulation', 'Chemical Reaction Engineering', 'Plant Safety', 'PLC'],
      placement_status: 'Placed',
      applications_count: 1,
      mock_interview_score: 92,
      assessment_score: 91,
      applications: [
        {
          id: 'app_neha_01',
          company_name: 'GSFC Limited',
          requirement_title: 'Chemical Process & Plant Automation Engineer',
          ctc_range: '₹ 9,50,000 - ₹ 12,00,000 PA',
          status: 'selected',
          match_score: 93.5,
          applied_at: '2026-08-16T11:20:00.000Z'
        }
      ]
    },
    {
      id: 's_rohan',
      user_id: 'u_rohan',
      name: 'Rohan Mehta',
      roll_number: '21BME034',
      email: 'rohan.mehta@gsfcuniversity.ac.in',
      phone: '+91 99000 44556',
      program: 'BTech Mechanical',
      branch: 'Mechanical Engineering',
      cgpa: 7.9,
      ats_score: 83,
      skills: ['AutoCAD', 'SolidWorks', 'FEA Analysis', 'Thermodynamics', 'Robotics', 'MATLAB'],
      placement_status: 'In-Process',
      applications_count: 1,
      mock_interview_score: 79,
      assessment_score: 82,
      applications: [
        {
          id: 'app_rohan_01',
          company_name: 'GSFC Limited',
          requirement_title: 'Mechanical Design & Plant Maintenance Trainee',
          ctc_range: '₹ 8,50,000 - ₹ 11,00,000 PA',
          status: 'interview',
          match_score: 83.0,
          applied_at: '2026-08-17T14:10:00.000Z'
        }
      ]
    },
    {
      id: 's_ananya',
      user_id: 'u_ananya',
      name: 'Ananya Desai',
      roll_number: '22BIT019',
      email: 'ananya.desai@gsfcuniversity.ac.in',
      phone: '+91 98333 77889',
      program: 'BTech IT',
      branch: 'Information Technology',
      cgpa: 8.5,
      ats_score: 88,
      skills: ['Python', 'SQL', 'Data Analytics', 'Power BI', 'Tableau', 'Cloud Basics'],
      placement_status: 'In-Process',
      applications_count: 2,
      mock_interview_score: 87,
      assessment_score: 89,
      applications: [
        {
          id: 'app_ananya_01',
          company_name: 'Microsoft Azure Systems',
          requirement_title: 'Graduate Software Engineer (Cloud & Microservices)',
          ctc_range: '₹ 24,00,000 - ₹ 28,00,000 PA',
          status: 'shortlisted',
          match_score: 88.0,
          applied_at: '2026-08-19T10:00:00.000Z'
        },
        {
          id: 'app_ananya_02',
          company_name: 'Tata Consultancy Services',
          requirement_title: 'Data Systems & Cloud Engineering Trainee',
          ctc_range: '₹ 9,00,000 - ₹ 11,50,000 PA',
          status: 'interview',
          match_score: 89.0,
          applied_at: '2026-08-18T16:00:00.000Z'
        }
      ]
    }
  ];

  const totalStudents = sampleStudents.length;
  const avgCgpa = (sampleStudents.reduce((acc, s) => acc + s.cgpa, 0) / totalStudents).toFixed(2);
  const avgAts = (sampleStudents.reduce((acc, s) => acc + s.ats_score, 0) / totalStudents).toFixed(1);
  const placedCount = sampleStudents.filter(s => s.placement_status === 'Placed').length;
  const placementRate = ((placedCount / totalStudents) * 100).toFixed(1);

  return res.status(200).json({
    department: 'ALL',
    total_students: totalStudents,
    avg_cgpa: avgCgpa,
    avg_ats_score: avgAts,
    placement_conversion_rate: placementRate,
    students: sampleStudents
  });
}
