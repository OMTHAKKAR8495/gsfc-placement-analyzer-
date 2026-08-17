import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const taxonomyPath = path.join(__dirname, '../config/skillTaxonomy.json');
let taxonomyData = { domains: {} };

try {
  const raw = fs.readFileSync(taxonomyPath, 'utf-8');
  taxonomyData = JSON.parse(raw);
} catch (err) {
  console.error('Error loading skillTaxonomy.json:', err);
}

/**
 * Normalizes a skill string or text against taxonomy canonical keys
 */
export function normalizeSkill(skillStr) {
  if (!skillStr || typeof skillStr !== 'string') return null;
  const clean = skillStr.trim().toLowerCase();

  for (const domainKey of Object.keys(taxonomyData.domains)) {
    const domain = taxonomyData.domains[domainKey];
    for (const [canonicalName, synonyms] of Object.entries(domain.skills)) {
      if (canonicalName.toLowerCase() === clean) {
        return { canonical: canonicalName, domain: domainKey };
      }
      if (synonyms.some(syn => syn.toLowerCase() === clean || clean.includes(syn.toLowerCase()))) {
        return { canonical: canonicalName, domain: domainKey };
      }
    }
  }

  // Fallback to title-cased clean string
  return { canonical: skillStr.trim(), domain: 'general' };
}

/**
 * Match a candidate's skill set against required & preferred job skills using taxonomy synonym logic
 */
export function matchSkillSets(candidateSkills = [], requiredSkills = [], preferredSkills = []) {
  const normalizedCandidate = candidateSkills.map(s => normalizeSkill(s)).filter(Boolean);
  const candidateCanonicalSet = new Set(normalizedCandidate.map(item => item.canonical.toLowerCase()));

  const matchedRequired = [];
  const missingRequired = [];

  requiredSkills.forEach(reqSkill => {
    const reqNorm = normalizeSkill(reqSkill);
    const reqCanonical = reqNorm ? reqNorm.canonical : reqSkill.trim();

    // Check exact or synonym match
    const isMatched = candidateCanonicalSet.has(reqCanonical.toLowerCase()) ||
      candidateSkills.some(cs => cs.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs.toLowerCase())) ||
      normalizedCandidate.some(c => c.canonical.toLowerCase().includes(reqCanonical.toLowerCase()) || reqCanonical.toLowerCase().includes(c.canonical.toLowerCase()));

    if (isMatched) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  });

  const matchedPreferred = [];
  preferredSkills.forEach(prefSkill => {
    const prefNorm = normalizeSkill(prefSkill);
    const prefCanonical = prefNorm ? prefNorm.canonical : prefSkill.trim();

    const isMatched = candidateCanonicalSet.has(prefCanonical.toLowerCase()) ||
      candidateSkills.some(cs => cs.toLowerCase().includes(prefSkill.toLowerCase()) || prefSkill.toLowerCase().includes(cs.toLowerCase())) ||
      normalizedCandidate.some(c => c.canonical.toLowerCase().includes(prefCanonical.toLowerCase()) || prefCanonical.toLowerCase().includes(c.canonical.toLowerCase()));

    if (isMatched) {
      matchedPreferred.push(prefSkill);
    }
  });

  return {
    matchedRequired,
    missingRequired,
    matchedPreferred,
    skillMatchPercentage: requiredSkills.length > 0
      ? Math.round((matchedRequired.length / requiredSkills.length) * 100)
      : 100
  };
}

export function getBranchDomainBucket(branchName = '') {
  const clean = String(branchName).toLowerCase();
  for (const [key, domain] of Object.entries(taxonomyData.domains)) {
    if (domain.branches.some(b => b.toLowerCase().includes(clean) || clean.includes(b.toLowerCase()))) {
      return key;
    }
  }
  if (clean.includes('mech')) return 'mechanical';
  if (clean.includes('electr') || clean.includes('ece') || clean.includes('eee')) return 'electrical_electronics';
  if (clean.includes('civil') || clean.includes('struct')) return 'civil';
  if (clean.includes('chem')) return 'chemical';
  if (clean.includes('bba') || clean.includes('mba')) return 'business';
  if (clean.includes('msc') || clean.includes('bsc') || clean.includes('bio')) return 'science';
  return 'cse';
}
