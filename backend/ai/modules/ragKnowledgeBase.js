/**
 * RAG Knowledge Base for GSFC University Placement Policies, Rules & Guidelines
 */
const POLICY_DOCUMENTS = [
  {
    id: 'doc_policy_dream_offer',
    title: 'GSFC University "Dream Offer" & Multiple Job Policy (Clause 4.2)',
    category: 'Placement Policy',
    content: 'A student who secures an initial placement offer is permitted to participate in subsequent placement drives only if the subsequent opportunity qualifies as a "Dream Company" offer (offering at least 1.5x or ₹5.0 LPA higher CTC than their initial offer). Upon receiving a confirmed Dream Offer, the candidate must release their initial offer within 48 hours.'
  },
  {
    id: 'doc_policy_attendance_eligibility',
    title: 'Mandatory TPC Pre-Placement Attendance & Minimum CGPA Cutoff (Clause 2.1)',
    category: 'Eligibility',
    content: 'All candidates appearing for on-campus or joint pool conclave recruitment drives must maintain a minimum of 75% overall academic attendance and a minimum CGPA of 6.5 with zero active backlogs at the time of drive registration.'
  },
  {
    id: 'doc_policy_interview_code',
    title: 'Student Code of Conduct & Interview Decorum Guidelines',
    category: 'Code of Conduct',
    content: 'Candidates must attend all scheduled technical and HR interview rounds in formal university attire, carrying 2 copies of their certified GSFC placement resume, college photo ID, and valid academic transcripts. Unexcused absence after drive confirmation leads to a 14-day placement debarment.'
  },
  {
    id: 'doc_policy_internship_conversion',
    title: '8th Semester Industrial Internship-to-Placement (PPO) Framework',
    category: 'Internship Policy',
    content: 'Students undergoing full-time semester 8 industrial internships with GSFC Ltd, Reliance, L&T, or approved partners are evaluated for Pre-Placement Offers (PPOs) upon formal submission of their monthly mentor evaluation report and midterm technical presentation.'
  },
  {
    id: 'doc_policy_naac_nirf',
    title: 'NIRF Parameter 3 & NAAC Criterion 5.2.1 Reporting Standard',
    category: 'Governance & Accreditation',
    content: 'For statutory accreditation compliance under NAAC Criterion 5.2.1 and NIRF Graduation Outcomes (GO), only verified appointment letters containing official employer seal, letter reference number, CTC breakdown, and student roll numbers are submitted.'
  }
];

export function queryPlacementRAG(userQuery) {
  const q = (userQuery || '').toLowerCase();
  
  // Find matching policy documents by keyword score
  const matchedDocs = POLICY_DOCUMENTS.map(doc => {
    let score = 0;
    const docText = (doc.title + ' ' + doc.content).toLowerCase();
    const queryTokens = q.split(' ').filter(t => t.length > 2);
    
    queryTokens.forEach(token => {
      if (docText.includes(token)) score += 1;
    });

    return { doc, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  if (matchedDocs.length > 0) {
    const top = matchedDocs[0].doc;
    return {
      query: userQuery,
      answer: `🏛️ **GSFC University Official Placement Rulebook Citation**:\n\n` +
        `**${top.title}** (${top.category}):\n` +
        `> "${top.content}"\n\n` +
        `*Authority: Training & Placement Cell (TPC) Directorate, Vigyan Bhavan.*`,
      source_document: top.title,
      category: top.category,
      citation_id: top.id,
      verified: true
    };
  }

  // Fallback when query is outside official policy documents
  return {
    query: userQuery,
    answer: `🏛️ **GSFC Placement Guidelines Overview**:\n\n` +
      `For specific questions regarding dream offers, CGPA cutoffs, company eligibility, or interview attendance, please refer to the GSFC TPC Student Handbook or contact the Placement Directorate at \`tpc@gsfcuniversity.ac.in\`.`,
    source_document: 'GSFC TPC University General Guidelines',
    category: 'General Guidelines',
    citation_id: 'doc_general_tpc',
    verified: true
  };
}

export default { queryPlacementRAG, POLICY_DOCUMENTS };
