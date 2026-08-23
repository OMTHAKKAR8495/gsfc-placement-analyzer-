export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sampleNotifications = [
    {
      id: 'notif_1',
      title: '🎯 GSFC Placement Drive 2026 Active',
      message: 'New campus hiring drives for BTech CSE, IT & Chemical are live.',
      created_at: new Date().toISOString(),
      type: 'info',
      read: false
    },
    {
      id: 'notif_2',
      title: '🔑 Faculty Portal Active',
      message: 'Dr. Neeshu Chaudhary has verified student attendance and interview dossiers.',
      created_at: new Date().toISOString(),
      type: 'success',
      read: false
    }
  ];

  return res.status(200).json(sampleNotifications);
}
