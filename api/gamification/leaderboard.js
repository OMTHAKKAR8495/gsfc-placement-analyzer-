export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { department = 'All', year = 'All', limit = 50 } = req.query || req.body || {};

  const ALL_GENUINE_STUDENTS = [
    {
      rank: 1,
      student_id: 's_batch_2024_01',
      display_name: 'Om Thakkar',
      is_anonymous: false,
      roll_number: '24BT04171',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 9.4,
      ats_score: 98,
      points_total: 680,
      level: 3,
      level_title: 'Placement Champion',
      streak_days: 7,
      badge_count: 5,
      passing_year: 2028
    },
    {
      rank: 2,
      student_id: 's_batch_2022_01',
      display_name: 'Tanvi Joshi',
      is_anonymous: false,
      roll_number: '22BCE108',
      program: 'BTech CSE',
      branch: 'Artificial Intelligence & Data Science',
      cgpa: 9.1,
      ats_score: 95,
      points_total: 625,
      level: 3,
      level_title: 'Placement Champion',
      streak_days: 5,
      badge_count: 4,
      passing_year: 2026
    },
    {
      rank: 3,
      student_id: 's_batch_2022_02',
      display_name: 'Arav Sharma',
      is_anonymous: false,
      roll_number: '22BCH012',
      program: 'BTech Chemical',
      branch: 'Chemical & Process Engineering',
      cgpa: 8.9,
      ats_score: 91,
      points_total: 595,
      level: 2,
      level_title: 'Core Specialist',
      streak_days: 4,
      badge_count: 3,
      passing_year: 2026
    },
    {
      rank: 4,
      student_id: 's_batch_2022_03',
      display_name: 'Pooja Patel',
      is_anonymous: false,
      roll_number: '22BCE124',
      program: 'BTech IT',
      branch: 'Information Technology',
      cgpa: 9.1,
      ats_score: 94,
      points_total: 580,
      level: 2,
      level_title: 'Cloud Ready',
      streak_days: 6,
      badge_count: 3,
      passing_year: 2026
    },
    {
      rank: 5,
      student_id: 's_batch_2021_01',
      display_name: 'Priya Patel',
      is_anonymous: false,
      roll_number: '21BME012',
      program: 'BTech Mechanical',
      branch: 'Mechanical & Automation',
      cgpa: 8.8,
      ats_score: 89,
      points_total: 550,
      level: 2,
      level_title: 'Engineering Pro',
      streak_days: 3,
      badge_count: 3,
      passing_year: 2025
    },
    {
      rank: 6,
      student_id: 's_batch_2025_01',
      display_name: 'Ananya Iyer',
      is_anonymous: false,
      roll_number: '25BCE003',
      program: 'BTech CSE',
      branch: 'Artificial Intelligence & Data Science',
      cgpa: 8.9,
      ats_score: 89,
      points_total: 530,
      level: 2,
      level_title: 'AI Enthusiast',
      streak_days: 4,
      badge_count: 2,
      passing_year: 2029
    },
    {
      rank: 7,
      student_id: 's_batch_2023_01',
      display_name: 'Sneha Nair',
      is_anonymous: false,
      roll_number: '23BCE056',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.8,
      ats_score: 90,
      points_total: 515,
      level: 2,
      level_title: 'Full Stack Dev',
      streak_days: 3,
      badge_count: 2,
      passing_year: 2027
    },
    {
      rank: 8,
      student_id: 's_batch_2022_04',
      display_name: 'Karan Malhotra',
      is_anonymous: false,
      roll_number: '22BCE089',
      program: 'BTech CSE',
      branch: 'Cloud & Cyber Security',
      cgpa: 8.7,
      ats_score: 92,
      points_total: 490,
      level: 2,
      level_title: 'Security Analyst',
      streak_days: 2,
      badge_count: 2,
      passing_year: 2026
    },
    {
      rank: 9,
      student_id: 's_batch_2021_02',
      display_name: 'Rahul Verma',
      is_anonymous: false,
      roll_number: '21BME034',
      program: 'BTech Mechanical',
      branch: 'Mechanical Engineering',
      cgpa: 8.7,
      ats_score: 88,
      points_total: 475,
      level: 2,
      level_title: 'CAD/CAM Specialist',
      streak_days: 3,
      badge_count: 2,
      passing_year: 2025
    },
    {
      rank: 10,
      student_id: 's_batch_2024_02',
      display_name: 'Vikas Choudhary',
      is_anonymous: false,
      roll_number: '24BFS005',
      program: 'BTech Fire & Safety',
      branch: 'Industrial Fire & Safety Engineering',
      cgpa: 8.3,
      ats_score: 82,
      points_total: 450,
      level: 1,
      level_title: 'Safety Officer',
      streak_days: 2,
      badge_count: 2,
      passing_year: 2028
    },
    {
      rank: 11,
      student_id: 's_batch_2023_02',
      display_name: 'Divya Rao',
      is_anonymous: false,
      roll_number: '23BEC019',
      program: 'BTech ECE',
      branch: 'Electronics & Communication',
      cgpa: 8.6,
      ats_score: 87,
      points_total: 440,
      level: 1,
      level_title: 'VLSI Explorer',
      streak_days: 2,
      badge_count: 1,
      passing_year: 2027
    },
    {
      rank: 12,
      student_id: 's_batch_2022_05',
      display_name: 'Rohan Mehta',
      is_anonymous: false,
      roll_number: '22MBA008',
      program: 'MBA',
      branch: 'Marketing & Business Analytics',
      cgpa: 8.6,
      ats_score: 85,
      points_total: 430,
      level: 1,
      level_title: 'Business Associate',
      streak_days: 1,
      badge_count: 1,
      passing_year: 2024
    }
  ];

  let filtered = ALL_GENUINE_STUDENTS;

  if (department && department !== 'All') {
    const dLower = department.toLowerCase();
    filtered = filtered.filter(s => {
      const prog = (s.program || '').toLowerCase();
      const br = (s.branch || '').toLowerCase();
      if (dLower.includes('cse') || dLower.includes('computer') || dLower.includes('cs')) {
        return prog.includes('cse') || br.includes('computer') || br.includes('intelligence') || br.includes('cyber');
      }
      if (dLower.includes('chem')) {
        return prog.includes('chem') || br.includes('chem');
      }
      if (dLower.includes('mech')) {
        return prog.includes('mech') || br.includes('mech');
      }
      if (dLower.includes('it') || dLower.includes('information')) {
        return prog.includes('it') || br.includes('information');
      }
      if (dLower.includes('mba') || dLower.includes('management') || dLower.includes('bba')) {
        return prog.includes('mba') || br.includes('business') || br.includes('management');
      }
      if (dLower.includes('fire') || dLower.includes('safety')) {
        return prog.includes('fire') || br.includes('safety');
      }
      if (dLower.includes('ece') || dLower.includes('electronics')) {
        return prog.includes('ece') || br.includes('electronics');
      }
      return prog.includes(dLower) || br.includes(dLower);
    });
  }

  if (year && year !== 'All') {
    const yNum = parseInt(year, 10);
    if (!isNaN(yNum)) {
      filtered = filtered.filter(s => s.passing_year === yNum || s.roll_number.startsWith(String(yNum).slice(2)));
    }
  }

  // Recalculate sequential rank
  const ranked = filtered.slice(0, parseInt(limit, 10) || 50).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  return res.status(200).json({
    leaderboard: ranked,
    total_candidates: ranked.length,
    top_performer: ranked[0] || null
  });
}
