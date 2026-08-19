import assert from 'assert';
import { parseResumeText } from '../ai/modules/resumeParser.js';

console.log('🧪 Running Suite 1: Unit Tests for Resume Parser & Skill Extraction...');

async function runResumeParserTests() {
  const sampleResumeText = `
    Thakkar Om
    Email: om.thakkar@gsfcuniversity.ac.in | Phone: +91 98765 43210
    Education: B.Tech in Computer Science and Engineering, GSFC University (2022 - 2026), CGPA: 8.9 / 10.0
    Technical Skills: Python, React.js, FastAPI, Node.js, PostgreSQL, Docker, Machine Learning, Git
    Experience: Full-Stack Developer Intern at GSFC Tech Labs (2025). Built scalable REST APIs and automated analytics pipelines.
    Projects: GSFC Placement Analyzer - AI-powered career portal with real-time matching and NIRF accreditation generator.
  `;

  const parsed = await parseResumeText(sampleResumeText);

  assert(parsed.name && parsed.name.toLowerCase().includes('om'), 'Failed to extract candidate name');
  assert(parsed.program && parsed.program.includes('BTech'), 'Failed to extract program');
  assert(parsed.cgpa >= 8.0, 'Failed to extract valid CGPA');
  assert(Array.isArray(parsed.skills?.technical) && parsed.skills.technical.length >= 4, 'Failed to extract technical skills');
  
  console.log('   ✅ Candidate name extracted correctly:', parsed.name);
  console.log('   ✅ Academic credentials parsed:', `${parsed.program} (${parsed.cgpa} CGPA)`);
  console.log('   ✅ Technical skills extracted count:', parsed.skills.technical.length);
  console.log('   ✅ Skills detected:', parsed.skills.technical.join(', '));
  console.log('🎉 Suite 1 (Resume Parser): ALL TESTS PASSED!\n');
}

runResumeParserTests().catch(err => {
  console.error('❌ Suite 1 Failed:', err);
  process.exit(1);
});
