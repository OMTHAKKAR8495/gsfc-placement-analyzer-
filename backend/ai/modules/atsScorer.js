import { callLLM } from '../llm.js';

export async function computeATSScore(parsedJson, rawText = '') {
  const schemaDescription = `{
    "atsScore": number (0 to 100 integer score),
    "feedback": ["array of specific, actionable improvement bullet points"]
  }`;

  const prompt = `Evaluate the following parsed resume for ATS (Applicant Tracking System) friendliness and readability.
Check for:
1. Keyword density & clear technical/soft skill sectioning.
2. Presence of quantifiable achievement metrics (percentages, numbers, outcomes).
3. Section completeness (Contact info, Education, CGPA, Projects, Work/Internship history).
4. Standard ATS formatting structure (no weird characters, tables, missing headings).

Structured Resume Data:
${JSON.stringify(parsedJson, null, 2)}

Provide an overall ATS Score (0-100) and 3 to 5 clear actionable suggestions.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateATSScoreFallback(parsedJson)
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

function generateATSScoreFallback(parsedJson) {
  let score = 70;
  const feedback = [];

  const techSkills = parsedJson.skills?.technical || [];
  if (techSkills.length >= 5) {
    score += 10;
  } else {
    feedback.push("Add more core technical skills to match standard ATS parser filters.");
  }

  const projects = parsedJson.projects || [];
  if (projects.length >= 2) {
    score += 10;
  } else {
    feedback.push("Add at least 2 detailed technical or domain projects.");
  }

  const internships = parsedJson.internships || [];
  if (internships.length > 0) {
    score += 10;
  } else {
    feedback.push("Include internship or practical hands-on experience to stand out to recruiters.");
  }

  if (parsedJson.cgpa >= 8.0) {
    score += 5;
  }

  const hasMetrics = JSON.stringify(parsedJson).match(/\d+%/);
  if (hasMetrics) {
    score += 5;
  } else {
    feedback.push("Include quantifiable outcome metrics (e.g., 'reduced render time by 30%', 'managed 500+ users').");
  }

  if (feedback.length === 0) {
    feedback.push("Excellent ATS formatting! High keyword density and clear section hierarchy.");
    feedback.push("Maintain updated repository links for all listed software projects.");
  }

  return {
    atsScore: score,
    feedback
  };
}
