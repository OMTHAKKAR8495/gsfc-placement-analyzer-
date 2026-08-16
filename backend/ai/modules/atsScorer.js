import { callLLM } from '../llm.js';

export async function computeATSScore(parsedJson, rawText = '', targetRequirement = null) {
  const schemaDescription = `{
    "atsScore": number (0 to 100 integer score),
    "feedback": ["array of specific, actionable improvement bullet points"]
  }`;

  let targetInfoPrompt = '';
  if (targetRequirement) {
    let reqSkills = [];
    try {
      reqSkills = typeof targetRequirement.required_skills_json === 'string' 
        ? JSON.parse(targetRequirement.required_skills_json) 
        : (targetRequirement.required_skills_json || []);
    } catch(e) {}
    targetInfoPrompt = `\nTARGET COMPANY & JOB DRIVE CRITERIA:
Target Company: "${targetRequirement.company_name || 'Tech Company'}"
Target Role: "${targetRequirement.title || 'Software Engineer'}"
Required Skills to Match: "${reqSkills.join(', ')}"
Min CGPA Cutoff: ${targetRequirement.min_cgpa || 0.0}`;
  }

  const prompt = `Evaluate the following parsed resume for ATS (Applicant Tracking System) friendliness, keyword matching, and target role suitability.
Check for:
1. Keyword density & clear technical/soft skill sectioning.
2. Presence of quantifiable achievement metrics (percentages, numbers, outcomes).
3. Section completeness (Contact info, Education, CGPA, Projects, Work/Internship history).
4. Standard ATS formatting structure (no weird characters, tables, missing headings).${targetInfoPrompt}

Structured Resume Data:
${JSON.stringify(parsedJson, null, 2)}

Provide an overall ATS Score (0-100) and 3 to 5 clear actionable suggestions specific to landing this candidate's target company placement drive.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateATSScoreFallback(parsedJson, targetRequirement)
  });

  return {
    atsScore: Math.min(100, Math.max(0, Math.round(result.atsScore || 85))),
    feedback: Array.isArray(result.feedback) ? result.feedback : [
      "Include quantifiable metrics in project descriptions (e.g. 'improved latency by 35%').",
      "Ensure technical skills are explicitly tagged with standard framework names.",
      "Add a dedicated LinkedIn/GitHub portfolio URL in header section."
    ]
  };
}

function generateATSScoreFallback(parsedJson, targetRequirement = null) {
  let score = 70;
  const feedback = [];

  const techSkills = parsedJson.skills?.technical || [];
  if (techSkills.length >= 5) {
    score += 10;
  } else {
    feedback.push("Add more core technical skills to match standard ATS parser filters.");
  }

  // Target company specific skill match check
  if (targetRequirement) {
    let reqSkills = [];
    try {
      reqSkills = typeof targetRequirement.required_skills_json === 'string'
        ? JSON.parse(targetRequirement.required_skills_json)
        : (targetRequirement.required_skills_json || []);
    } catch(e) {}

    const matched = reqSkills.filter(s => techSkills.some(ts => ts.toLowerCase().includes(s.toLowerCase())));
    const missing = reqSkills.filter(s => !matched.includes(s));

    if (matched.length > 0) {
      score += 10;
      feedback.push(`Matched ${matched.length} key required skills for ${targetRequirement.company_name} (${matched.join(', ')}).`);
    }

    if (missing.length > 0) {
      feedback.push(`Target Company Tip (${targetRequirement.company_name}): Add missing required skills like ${missing.join(', ')} to boost ATS rank.`);
    }

    if (targetRequirement.min_cgpa && parsedJson.cgpa < targetRequirement.min_cgpa) {
      feedback.push(`CGPA Warning: Candidate CGPA (${parsedJson.cgpa}) is below ${targetRequirement.company_name}'s minimum cutoff (${targetRequirement.min_cgpa}).`);
    }
  }

  const projects = parsedJson.projects || [];
  if (projects.length >= 2) {
    score += 5;
  } else {
    feedback.push("Add at least 2 detailed technical or domain projects.");
  }

  const internships = parsedJson.internships || [];
  if (internships.length > 0) {
    score += 5;
  }

  return {
    atsScore: Math.min(100, score),
    feedback
  };
}
