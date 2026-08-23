export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const companies = [
    { id: 'c_gsfc_limited', company_name: 'GSFC Limited', email: 'hr@gsfclimited.com', industry: 'Fertilizers, Chemicals & Tech', approved: 1, contact_phone: '+91 98989 89898' },
    { id: 'c_tcs', company_name: 'Tata Consultancy Services', email: 'campus@tcs.com', industry: 'Information Technology', approved: 1, contact_phone: '+91 98765 00001' },
    { id: 'c_reliance', company_name: 'Reliance Industries', email: 'recruitment@ril.com', industry: 'Petrochemicals & Digital', approved: 1, contact_phone: '+91 98765 00002' },
    { id: 'c_lnt', company_name: 'Larsen & Toubro', email: 'campus@lntecc.com', industry: 'Heavy Engineering & IT', approved: 1, contact_phone: '+91 98765 00003' }
  ];
  return res.status(200).json(companies);
}
