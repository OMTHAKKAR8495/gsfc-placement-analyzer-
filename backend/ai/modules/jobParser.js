import { callLLM } from '../llm.js';
import { normalizeSkill } from '../utils/taxonomyMatcher.js';

export async function parseJobRequirement(jobRequirementObj) {
  const title = jobRequirementObj.title || '';
  const description = jobRequirementObj.job_description || '';
  const requiredSkillsRaw = typeof jobRequirementObj.required_skills_json === 'string'
    ? JSON.parse(jobRequirementObj.required_skills_json || '[]')
    : jobRequirementObj.required_skills_json || [];

  const preferredSkillsRaw = typeof jobRequirementObj.preferred_skills_json === 'string'
    ? JSON.parse(jobRequirementObj.preferred_skills_json || '[]')
    : jobRequirementObj.preferred_skills_json || [];

  const prompt = `Analyze the following job description and extract all implied domain tools, methodologies, and skill requirements beyond the explicitly listed tags.

Job Title: ${title}
Job Description: ${description}
Explicit Required Skills: ${requiredSkillsRaw.join(', ')}
Explicit Preferred Skills: ${preferredSkillsRaw.join(', ')}`;

  const schemaDescription = `{
    "domainCategory": "string (e.g. Mechanical, Computer Science, Civil, Electrical, Chemical, Management, Science)",
    "impliedRequiredSkills": ["array of additional required skills mentioned in description text"],
    "impliedPreferredSkills": ["array of additional preferred/nice-to-have skills"],
    "summaryKeywords": ["array of key domain keywords"]
  }`;

  const fallbackGenerator = () => {
    const descLower = description.toLowerCase();
    const implied = [];
    if (descLower.includes('gd&t')) implied.push('GD&T');
    if (descLower.includes('six sigma')) implied.push('Six Sigma');
    if (descLower.includes('plc')) implied.push('PLC');
    if (descLower.includes('docker')) implied.push('Docker');
    if (descLower.includes('aspen')) implied.push('Aspen Plus');
    if (descLower.includes('cad')) implied.push('AutoCAD');

    return {
      domainCategory: title.toLowerCase().includes('mech') ? 'Mechanical' : title.toLowerCase().includes('civil') ? 'Civil' : 'Computer Science',
      impliedRequiredSkills: implied,
      impliedPreferredSkills: [],
      summaryKeywords: [title, ...requiredSkillsRaw]
    };
  };

  let parsedLLM = await callLLM({ prompt, schemaDescription, fallbackGenerator });

  const allRequired = Array.from(new Set([...requiredSkillsRaw, ...(parsedLLM.impliedRequiredSkills || [])]));
  const allPreferred = Array.from(new Set([...preferredSkillsRaw, ...(parsedLLM.impliedPreferredSkills || [])]));

  return {
    title,
    domainCategory: parsedLLM.domainCategory || 'General Engineering',
    requiredSkills: allRequired,
    preferredSkills: allPreferred,
    normalizedRequiredSkills: allRequired.map(s => normalizeSkill(s).canonical),
    normalizedPreferredSkills: allPreferred.map(s => normalizeSkill(s).canonical)
  };
}
