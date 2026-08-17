/**
 * Module C: Cross-Domain Branch-Agnostic Skill/Requirement Matching Engine
 */

import { matchSkillSets, getBranchDomainBucket } from '../utils/taxonomyMatcher.js';

export function calculateMatchScore(studentProfile, requirement) {
  const eligiblePrograms = typeof requirement.eligible_programs_json === 'string'
    ? JSON.parse(requirement.eligible_programs_json || '[]')
    : requirement.eligible_programs_json || [];

  const requiredSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json || '[]')
    : requirement.required_skills_json || [];

  const preferredSkills = typeof requirement.preferred_skills_json === 'string'
    ? JSON.parse(requirement.preferred_skills_json || '[]')
    : requirement.preferred_skills_json || [];

  // Parse student parsed_resume_json
  const studentData = typeof studentProfile.parsed_resume_json === 'string'
    ? JSON.parse(studentProfile.parsed_resume_json || '{}')
    : studentProfile.parsed_resume_json || {};

  const studentProgram = studentProfile.program || studentData.program || '';
  const studentBranch = studentProfile.branch || studentData.branch || '';
  const studentCgpa = parseFloat(studentProfile.cgpa || studentData.cgpa || 0.0);

  // 1. HARD FILTERS (Program & Min CGPA)
  const isProgramEligible = eligiblePrograms.length === 0 || eligiblePrograms.some(prog => {
    const pClean = prog.toLowerCase();
    const sProgClean = studentProgram.toLowerCase();
    const sBranchClean = studentBranch.toLowerCase();
    return sProgClean.includes(pClean) || pClean.includes(sProgClean) || sBranchClean.includes(pClean) || pClean.includes(sBranchClean);
  });

  const isCgpaEligible = studentCgpa >= (requirement.min_cgpa || 0.0);

  if (!isProgramEligible || !isCgpaEligible) {
    let reason = '';
    if (!isProgramEligible && !isCgpaEligible) reason = `Branch/Program (${studentProgram} / ${studentBranch}) & CGPA (${studentCgpa} < ${requirement.min_cgpa}) criteria not met.`;
    else if (!isProgramEligible) reason = `Branch (${studentProgram} / ${studentBranch}) is not in eligible list (${eligiblePrograms.join(', ')}).`;
    else reason = `CGPA (${studentCgpa}) is below required minimum of ${requirement.min_cgpa}.`;

    return {
      matchScore: 0,
      eligible: false,
      reason,
      matchedSkills: [],
      missingSkills: requiredSkills,
      strengthSummary: `Candidate from ${studentProgram} does not satisfy minimum academic/branch eligibility for ${requirement.title}.`,
      improvementTips: [`Focus on roles open to ${studentProgram} or upgrade CGPA to meet company cutoff (${requirement.min_cgpa}).`],
      breakdown: {
        skillFitScore: 0,
        experienceScore: 0,
        academicScore: 0
      }
    };
  }

  // 2. SKILL OVERLAP CALCULATION USING TAXONOMY MATCHING
  const studentTechSkills = Array.isArray(studentData.skills?.technical) ? studentData.skills.technical : [];
  const studentSoftSkills = Array.isArray(studentData.skills?.soft) ? studentData.skills.soft : [];
  const allStudentSkills = [...studentTechSkills, ...studentSoftSkills];

  const skillMatchResult = matchSkillSets(allStudentSkills, requiredSkills, preferredSkills);
  const skillFitScore = skillMatchResult.skillMatchPercentage;

  // 3. EXPERIENCE & PROJECT DOMAIN RELEVANCE
  const studentSummaryText = `
    Candidate ${studentProfile.name}. Program: ${studentProgram} Branch: ${studentBranch}. Skills: ${allStudentSkills.join(', ')}.
    Projects: ${(studentData.projects || []).map(p => `${p.title} ${p.description}`).join('. ')}.
    Internships: ${(studentData.internships || []).map(i => `${i.role} at ${i.company} ${i.summary}`).join('. ')}.
  `.toLowerCase();

  const reqSummaryText = `
    Role: ${requirement.title}. Description: ${requirement.job_description || ''}.
    Required Skills: ${requiredSkills.join(', ')}. Preferred: ${preferredSkills.join(', ')}.
  `.toLowerCase();

  const experienceScore = computeTextCosineSim(studentSummaryText, reqSummaryText);

  // 4. ACADEMIC FIT & CGPA MARGIN SCORE
  const cgpaMargin = studentCgpa - (requirement.min_cgpa || 0.0);
  const academicScore = Math.min(100, Math.max(50, Math.round(70 + cgpaMargin * 15)));

  // 5. WEIGHTED FINAL COMBINATION
  // Weights: Skill Score (45%), Experience & Projects (35%), Academic Fit (20%)
  const rawFinalScore = Math.round((skillFitScore * 0.45) + (experienceScore * 0.35) + (academicScore * 0.20));
  const finalMatchScore = Math.min(99, Math.max(30, rawFinalScore));

  // AI Strength Summary & Improvement Tips Generation
  const matchedSkills = skillMatchResult.matchedRequired;
  const missingSkills = skillMatchResult.missingRequired;

  let strengthSummary = `Strong domain alignment in ${studentProgram} with solid overlap in ${matchedSkills.slice(0, 3).join(', ') || 'core fundamentals'}.`;
  if (finalMatchScore < 50) {
    strengthSummary = `Partial domain overlap detected between ${studentProgram} candidate and ${requirement.title} drive requirements.`;
  }

  const improvementTips = [];
  if (missingSkills.length > 0) {
    improvementTips.push(`Acquire or add project proof for missing key skills: ${missingSkills.slice(0, 3).join(', ')}.`);
  }
  if (studentCgpa < (requirement.min_cgpa + 0.5)) {
    improvementTips.push(`Maintain strong academic performance to remain competitive above ${requirement.min_cgpa} CGPA cutoff.`);
  }
  if ((studentData.projects || []).length < 2) {
    improvementTips.push(`Add 1-2 domain-specific capstone projects to demonstrate hands-on experience.`);
  }
  if (improvementTips.length === 0) {
    improvementTips.push(`Highlight your relevant internship experience in your interview response.`);
  }

  return {
    matchScore: finalMatchScore,
    eligible: true,
    reason: 'Eligible candidate with domain score computed',
    matchedSkills,
    missingSkills,
    strengthSummary,
    improvementTips,
    breakdown: {
      skillFitScore,
      experienceScore,
      academicScore
    }
  };
}

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

  if (magA === 0 || magB === 0) return 50;
  const sim = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  return Math.min(100, Math.max(30, Math.round(sim * 100 + 20)));
}
