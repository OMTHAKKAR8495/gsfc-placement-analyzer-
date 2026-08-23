export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auditLogs = [
    { id: 'aud_01', admin_user_id: 'u_admin_01', admin_email: 'admin@gsfcuniversity.ac.in', action: 'VIEW_STUDENT_DOSSIER', target_entity_type: 'student', target_entity_id: 's_omthakkar', details_json: '{"student_name":"Om Thakkar","roll_number":"24BT04171"}', created_at: '2026-08-23 11:50:00' },
    { id: 'aud_02', admin_user_id: 'u_admin_01', admin_email: 'admin@gsfcuniversity.ac.in', action: 'VIEW_FACULTY_PROFILE', target_entity_type: 'faculty', target_entity_id: 'f_neeshu', details_json: '{"faculty_name":"Dr. Neeshu Chaudhary"}', created_at: '2026-08-23 11:30:00' },
    { id: 'aud_03', admin_user_id: 'u_admin_01', admin_email: 'admin@gsfcuniversity.ac.in', action: 'APPROVE_COMPANY', target_entity_type: 'company', target_entity_id: 'c_gsfc_limited', details_json: '{"company_name":"GSFC Limited"}', created_at: '2026-08-23 10:00:00' }
  ];

  return res.status(200).json({
    total: auditLogs.length,
    page: 1,
    limit: 50,
    totalPages: 1,
    auditLogs
  });
}
