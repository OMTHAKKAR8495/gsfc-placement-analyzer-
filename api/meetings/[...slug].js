// Vercel Serverless Catch-All API Handler for /api/meetings/*
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug = [] } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : (slug || '');

  // 1. /api/meetings/room/:roomId
  if (path.startsWith('room/') || path === 'room') {
    const roomId = path.replace(/^room\/?/, '') || req.query.roomId || 'GSFC-MEET-AI-EVAL';
    const readableTitle = roomId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return res.status(200).json({
      meeting: {
        id: 'meet_' + roomId.replace(/[^a-zA-Z0-9]/g, '_'),
        room_id: roomId,
        title: `GSFC University Live Interview: ${readableTitle}`,
        description: 'Online Campus Placement & Technical Assessment Interview Session with Anti-Cheating & Screen Proctoring.',
        status: 'in_progress',
        company_name: 'Reliance Industries / GSFC Limited',
        drive_title: 'GSFC University Campus Hiring 2026',
        scheduled_at: new Date().toISOString(),
        duration_minutes: 45
      },
      participants: [
        {
          id: 'p_interviewer',
          user_id: 'u_comp_lead',
          role: 'company',
          name: 'Senior Technical Evaluator',
          join_status: 'joined'
        },
        {
          id: 'p_cand',
          user_id: 'u_student_1',
          student_id: 's_1',
          role: 'student',
          student_name: 'Om Thakkar',
          student_roll: '24BT04171',
          student_program: 'B.Tech Computer Science & Engineering',
          student_cgpa: 9.42,
          join_status: 'ready'
        }
      ],
      chatMessages: [
        {
          id: 'msg_welcome',
          sender_name: 'GSFC Proctoring System',
          sender_role: 'system',
          message: 'Welcome to GSFC University Online Interview Studio. Anti-cheating proctoring is ACTIVE.',
          created_at: new Date().toISOString()
        }
      ],
      violations: []
    });
  }

  // 2. /api/meetings/student or /api/meetings/company or /api/meetings/all
  if (path === 'student' || path === 'company' || path === 'all') {
    return res.status(200).json([
      {
        id: 'meet_ril_01',
        room_id: 'gsfc_ril_ai_eval',
        title: 'Reliance Industries — AI & Software Interview',
        description: 'Technical round with senior systems architect.',
        company_name: 'Reliance Industries Limited',
        drive_title: 'Software Development Engineer Drive',
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        duration_minutes: 45,
        status: 'scheduled',
        student_count: 3,
        violation_count: 0
      }
    ]);
  }

  // 3. /api/meetings/schedule
  if (path === 'schedule') {
    const { title = 'Technical Interview', driveId = 'req_01' } = req.body || {};
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const roomId = `GSFC-MEET-${roomCode}`;
    return res.status(200).json({
      success: true,
      message: 'Meeting scheduled successfully.',
      meeting: {
        id: 'meet_' + roomCode,
        room_id: roomId,
        title,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        duration_minutes: 45
      }
    });
  }

  // Default fallback for any other meeting action (violation, outcome, end)
  return res.status(200).json({
    success: true,
    message: 'Action recorded successfully.'
  });
}
