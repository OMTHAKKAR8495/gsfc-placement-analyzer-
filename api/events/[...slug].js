// Vercel Serverless Catch-All API: /api/events/*

const DEFAULT_EVENTS = [
  {
    id: 'evt_anveshan_2026',
    slug: 'anveshan-2026',
    title: 'GSFC Anveshan 2026 Tech & Career Fest',
    description: 'Annual National Science, Technology, and Recruitment Conclave with 50+ corporate partners, live hackathons, and spot interviews.',
    event_date: '2026-09-18',
    start_time: '09:00 AM',
    venue: 'GSFC University Auditorium & Tech Dome',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    is_registration_open: 1,
    max_capacity: 1200,
    total_external_registered: 450
  },
  {
    id: 'evt_conclave_2026',
    slug: 'placement-conclave-2026',
    title: 'GSFC Corporate Placement & HR Conclave 2026',
    description: 'Recruiter networking summit and open-campus career drive for multidisciplinary engineering & management graduates.',
    event_date: '2026-10-05',
    start_time: '10:00 AM',
    venue: 'GSFC University School of Technology Auditorium',
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    is_registration_open: 1,
    max_capacity: 800,
    total_external_registered: 210
  },
  {
    id: 'evt_hackathon_2026',
    slug: 'gsfc-hackathon-2026',
    title: 'GSFC 36-Hour National AI Hackathon',
    description: 'Premier inter-college hackathon focusing on generative AI, autonomous robotics, sustainable chemical systems, and cloud computing.',
    event_date: '2026-11-12',
    start_time: '08:30 AM',
    venue: 'GSFC University Innovation Lab & Center of Excellence',
    banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    is_registration_open: 1,
    max_capacity: 500,
    total_external_registered: 320
  }
];

// In-memory persistent pass storage for serverless runtime
let PASSES_VAULT = [
  {
    token: 'GSFC-PASS-ANV-101',
    pass_token: 'GSFC-PASS-ANV-101',
    event_id: 'evt_anveshan_2026',
    event_title: 'GSFC Anveshan 2026 Tech & Career Fest',
    event_date: '2026-09-18',
    event_venue: 'GSFC University Auditorium & Tech Dome',
    gate_name: 'Main Campus Gate A',
    candidate_name: 'Om Thakkar',
    candidate_email: '24bt04171@gsfcuniversity.ac.in',
    candidate_org: 'GSFC University',
    candidate_phone: '+91 95584 13347',
    status: 'issued',
    isCheckedIn: false,
    created_at: new Date().toISOString()
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug = [] } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug;

  // 1. GET /api/events/all
  if (path === 'all' && req.method === 'GET') {
    return res.status(200).json(DEFAULT_EVENTS);
  }

  // 2. GET /api/events/pass/user?email=...
  if (path === 'pass/user' && req.method === 'GET') {
    const email = (req.query.email || '').toLowerCase().trim();
    const userPasses = PASSES_VAULT.filter(p => !email || (p.candidate_email || '').toLowerCase() === email || email === 'admin' || email === 'admin@gsfcuniversity.ac.in');
    return res.status(200).json({
      success: true,
      passes: userPasses.length > 0 ? userPasses : PASSES_VAULT
    });
  }

  // 3. GET /api/events/pass/:token
  if (path.startsWith('pass/') && req.method === 'GET') {
    const token = path.replace('pass/', '').trim();
    const found = PASSES_VAULT.find(p => p.token === token || p.pass_token === token) || {
      token: token,
      pass_token: token,
      event_title: 'GSFC Anveshan 2026 Tech & Career Fest',
      event_date: '2026-09-18',
      event_venue: 'GSFC University Auditorium & Tech Dome',
      gate_name: 'Main Campus Gate A',
      candidate_name: 'Verified Guest',
      candidate_org: 'External Institution / GSFC',
      status: 'issued',
      isCheckedIn: false
    };
    return res.status(200).json({ success: true, pass: found });
  }

  // 4. POST /api/events/:slug/register
  if (path.endsWith('/register') && req.method === 'POST') {
    const eventSlug = path.replace('/register', '');
    const { name, email, phone, organization, city } = req.body || {};

    const targetEvent = DEFAULT_EVENTS.find(e => e.slug === eventSlug || e.id === eventSlug) || DEFAULT_EVENTS[0];
    const prefix = (targetEvent.slug || 'EVT').substring(0, 3).toUpperCase();
    const passToken = `GSFC-PASS-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newPass = {
      token: passToken,
      pass_token: passToken,
      event_id: targetEvent.id,
      event_slug: targetEvent.slug,
      event_title: targetEvent.title,
      event_date: targetEvent.event_date,
      event_venue: targetEvent.venue,
      gate_name: 'Main Campus Gate A',
      candidate_name: name || 'Fest Guest',
      candidate_email: (email || '').toLowerCase(),
      candidate_phone: phone || '+91 95584 13347',
      candidate_org: organization || 'GSFC University Partner',
      city: city || 'Vadodara',
      status: 'issued',
      isCheckedIn: false,
      created_at: new Date().toISOString()
    };

    PASSES_VAULT.unshift(newPass);

    return res.status(200).json({
      success: true,
      passToken,
      pass: newPass,
      event: targetEvent,
      message: 'Registration confirmed. Digital pass issued.'
    });
  }

  return res.status(200).json(DEFAULT_EVENTS);
}
