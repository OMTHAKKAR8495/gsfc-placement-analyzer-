import { calculateMatchScore } from '../ai/modules/matchingEngine.js';

console.log('🧪 Running Cross-Domain AI Resume Analyzer & Matching Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Test Jobs Across Different GSFC Disciplines
const cseJob = {
  title: 'Software Development Engineer',
  job_description: 'Build enterprise microservices using Python, React, Node.js and SQL databases.',
  eligible_programs_json: JSON.stringify(['BTech CSE', 'BTech IT']),
  min_cgpa: 7.5,
  required_skills_json: JSON.stringify(['Python', 'React', 'SQL', 'Node.js']),
  preferred_skills_json: JSON.stringify(['Docker', 'FastAPI'])
};

const mechJob = {
  title: 'Mechanical Design Engineer',
  job_description: 'Design 3D mechanical components, perform FEA analysis and apply GD&T standards.',
  eligible_programs_json: JSON.stringify(['BTech Mechanical', 'Mechatronics']),
  min_cgpa: 7.0,
  required_skills_json: JSON.stringify(['SolidWorks', 'AutoCAD', 'GD&T', 'ANSYS']),
  preferred_skills_json: JSON.stringify(['Six Sigma', 'FEA'])
};

const civilJob = {
  title: 'Structural Design Engineer',
  job_description: 'Perform RCC and steel structural analysis using STAAD Pro and ETABS for industrial projects.',
  eligible_programs_json: JSON.stringify(['BTech Civil']),
  min_cgpa: 7.0,
  required_skills_json: JSON.stringify(['STAAD Pro', 'ETABS', 'Structural Analysis', 'AutoCAD Civil 3D']),
  preferred_skills_json: JSON.stringify(['Revit', 'Primavera'])
};

// 2. Test Candidates Across Branches
const cseStudent = {
  name: 'Aarav Patel',
  program: 'BTech CSE',
  branch: 'Computer Science',
  cgpa: 8.8,
  parsed_resume_json: JSON.stringify({
    name: 'Aarav Patel',
    program: 'BTech CSE',
    branch: 'Computer Science',
    cgpa: 8.8,
    skills: {
      technical: ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Git'],
      soft: ['Problem Solving']
    },
    projects: [{ title: 'AI Web Platform', description: 'React and Python REST API service.' }]
  })
};

const mechStudent = {
  name: 'Vikram Shah',
  program: 'BTech Mechanical',
  branch: 'Mechanical Engineering',
  cgpa: 8.2,
  parsed_resume_json: JSON.stringify({
    name: 'Vikram Shah',
    program: 'BTech Mechanical',
    branch: 'Mechanical Engineering',
    cgpa: 8.2,
    skills: {
      technical: ['SolidWorks', 'AutoCAD', 'GD&T', 'ANSYS', 'FEA', 'Thermodynamics'],
      soft: ['Team Leadership']
    },
    projects: [{ title: 'Automotive Chassis FEA', description: 'Thermal and structural ANSYS simulation.' }]
  })
};

const civilStudent = {
  name: 'Priya Joshi',
  program: 'BTech Civil',
  branch: 'Civil Engineering',
  cgpa: 8.5,
  parsed_resume_json: JSON.stringify({
    name: 'Priya Joshi',
    program: 'BTech Civil',
    branch: 'Civil Engineering',
    cgpa: 8.5,
    skills: {
      technical: ['STAAD Pro', 'ETABS', 'AutoCAD Civil 3D', 'Structural Analysis', 'Surveying'],
      soft: ['Project Planning']
    },
    projects: [{ title: 'High-Rise RCC Structure Design', description: 'Seismic and wind load analysis using ETABS.' }]
  })
};

// 3. Run Matching Tests
console.log('Test 1: CSE Student vs Software Engineer Job');
const res1 = calculateMatchScore(cseStudent, cseJob);
assert(res1.eligible === true, 'Candidate is eligible');
assert(res1.matchScore >= 75, `High match score achieved (${res1.matchScore}%)`);
assert(res1.matchedSkills.length >= 3, `Matched required skills (${res1.matchedSkills.join(', ')})`);

console.log('\nTest 2: Mechanical Student vs Mechanical Design Job');
const res2 = calculateMatchScore(mechStudent, mechJob);
assert(res2.eligible === true, 'Mechanical candidate eligible for Mechanical Job');
assert(res2.matchScore >= 75, `High match score achieved (${res2.matchScore}%)`);
assert(res2.matchedSkills.includes('SolidWorks'), 'SolidWorks canonical skill matched');

console.log('\nTest 3: Mechanical Student vs Software Engineer Job (Cross-Domain Mismatch Check)');
const res3 = calculateMatchScore(mechStudent, cseJob);
assert(res3.eligible === false, 'Mechanical student flagged ineligible or scored down for CSE-only job');
assert(res3.matchScore === 0 || res3.matchScore < 45, `Mismatch score properly low (${res3.matchScore}%)`);

console.log('\nTest 4: Civil Student vs Structural Design Job');
const res4 = calculateMatchScore(civilStudent, civilJob);
assert(res4.eligible === true, 'Civil candidate eligible');
assert(res4.matchScore >= 75, `High match score achieved (${res4.matchScore}%)`);
assert(res4.matchedSkills.includes('STAAD Pro'), 'STAAD Pro canonical skill matched');

console.log(`\n========================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
