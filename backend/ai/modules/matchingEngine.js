/**
 * Module C: Skill/Requirement Matching Engine
 */

export function calculateMatchScore(studentProfile, requirement) {
  const eligiblePrograms = typeof requirement.eligible_programs_json === 'string'
    ? JSON.parse(requirement.eligible_programs_json)
    : requirement.eligible_programs_json || [];

  const requiredSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json)
    : requirement.required_skills_json || [];

  const preferredSkills = typeof requirement.preferred_skills_json === 'string'
    ? JSON.parse(requirement.preferred_skills_json)
    : requirement.preferred_skills_json || [];

  // Parse student parsed_resume_json
  const studentData = typeof studentProfile.parsed_resume_json === 'string'
    ? JSON.parse(studentProfile.parsed_resume_json || '{}')
    : studentProfile.parsed_resume_json || {};

  const studentProgram = studentProfile.program || studentData.program || '';
  const studentCgpa = studentProfile.cgpa || studentData.cgpa || 0.0;

  // 1. HARD FILTERS (Program & Min CGPA)
  const isProgramEligible = eligiblePrograms.length === 0 || eligiblePrograms.some(prog => 
    studentProgram.toLowerCase().includes(prog.toLowerCase()) || prog.toLowerCase().includes(studentProgram.toLowerCase())
  );

  const isCgpaEligible = studentCgpa >= (requirement.min_cgpa || 0.0);

  if (!isProgramEligible || !isCgpaEligible) {
    let reason = '';
    if (!isProgramEligible && !isCgpaEligible) reason = `Program (${studentProgram}) & CGPA (${studentCgpa} < ${requirement.min_cgpa}) criteria not met.`;
    else if (!isProgramEligible) reason = `Program (${studentProgram}) is not in eligible list (${eligiblePrograms.join(', ')}).`;
    else reason = `CGPA (${studentCgpa}) is below required minimum of ${requirement.min_cgpa}.`;

    return {
      matchScore: 0,
      eligible: false,
      reason,
      breakdown: {
        semanticScore: 0,
        skillFitScore: 0,
        cgpaFitScore: 0,
        matchedSkills: []
      }
    };
  }

  // 2. SKILL OVERLAP CALCULATION
  const studentTechSkills = (studentData.skills?.technical || []).map(s => s.toLowerCase());
  const studentSoftSkills = (studentData.skills?.soft || []).map(s => s.toLowerCase());
  const allStudentSkills = [...studentTechSkills, ...studentSoftSkills];

  let reqSkillMatches = 0;
  const matchedRequired = [];
  requiredSkills.forEach(reqSkill => {
    const isMatch = allStudentSkills.some(sSkill => 
      sSkill.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(sSkill)
    );
    if (isMatch) {
      reqSkillMatches++;
      matchedRequired.push(reqSkill);
    }
  });

  const requiredSkillPct = requiredSkills.length > 0 ? (reqSkillMatches / requiredSkills.length) * 100 : 100;

  let prefSkillMatches = 0;
  const matchedPreferred = [];
  preferredSkills.forEach(prefSkill => {
    const isMatch = allStudentSkills.some(sSkill => 
      sSkill.includes(prefSkill.toLowerCase()) || prefSkill.toLowerCase().includes(sSkill)
    );
    if (isMatch) {
      prefSkillMatches++;
      matchedPreferred.push(prefSkill);
    }
  });

  const prefBonus = preferredSkills.length > 0 ? (prefSkillMatches / preferredSkills.length) * 15 : 0;
  const skillFitScore = Math.min(100, requiredSkillPct + prefBonus);

  // 3. SEMANTIC SIMILARITY
  const studentSummaryText = `
    Candidate ${studentProfile.name}. Program: ${studentProgram}. Skills: ${allStudentSkills.join(', ')}.
    Projects: ${(studentData.projects || []).map(p => `${p.title} ${p.description}`).join('. ')}.
    Internships: ${(studentData.internships || []).map(i => `${i.role} at ${i.company} ${i.summary}`).join('. ')}.
  `.toLowerCase();

  const reqSummaryText = `
    Role: ${requirement.title}. Description: ${requirement.job_description}.
    Skills: ${requiredSkills.join(', ')}. Preferred: ${preferredSkills.join(', ')}.
  `.toLowerCase();

  const semanticScore = computeTextCosineSim(studentSummaryText, reqSummaryText);

  // 4. CGPA FIT SCORE
  const cgpaMargin = studentCgpa - requirement.min_cgpa;
  const cgpaFitScore = Math.min(100, 70 + cgpaMargin * 15);

  // 5. WEIGHTED COMBINATION
  const finalScore = Math.round(0.50 * semanticScore + 0.35 * skillFitScore + 0.15 * cgpaFitScore);
  const boundedScore = Math.min(99, Math.max(45, finalScore)); // realistic 45-99 score for eligible candidate

  return {
    matchScore: boundedScore,
    eligible: true,
    reason: 'Eligible candidate',
    breakdown: {
      semanticScore: Math.round(semanticScore),
      skillFitScore: Math.round(skillFitScore),
      cgpaFitScore: Math.round(cgpaFitScore),
      matchedSkills: [...matchedRequired, ...matchedPreferred]
    }
  };
}

/**
 * Token-based Cosine Similarity calculation for fallback vector comparison
 */
function computeTextCosineSim(textA, textB) {
  const getTokens = (t) => t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const tokensA = getTokens(textA);
  const tokensB = getTokens(textB);

  const freqA = {};
  const freqB = {};
  const vocab = new Set();

  tokensA.forEach(w => { freqA[w] = (freqA[w] || 0) + 1; vocab.add(w); });
  tokensB.forEach(w => { freqB[w] = (freqB[w] || 0) + 1; vocab.add(w); });

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  vocab.forEach(w => {
    const a = freqA[w] || 0;
    const b = freqB[w] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 60;
  const sim = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  return Math.min(100, Math.max(50, Math.round(sim * 100 + 40)));
}
