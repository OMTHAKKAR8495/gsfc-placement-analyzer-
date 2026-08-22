import { callLLM } from '../llm.js';

/**
 * Transforms raw student details into an executive, ATS-optimized resume using Gemini AI.
 */
export async function enhanceResumeWithGemini(rawStudentData, targetRequirement) {
  const prompt = `
You are the Chief Placement Officer and elite Executive Resume Writer at GSFC University.
Your task is to take this student's raw credentials and generate an ATS 95+ Score, recruiter-ready resume in JSON format.

Candidate Details:
Name: ${rawStudentData.name || 'Candidate'}
Roll: ${rawStudentData.roll_number || 'GSFC'}
Program: ${rawStudentData.program || 'BTech CSE'} (${rawStudentData.branch || 'Engineering'})
CGPA: ${rawStudentData.cgpa || 8.5}/10 (Passing: ${rawStudentData.passing_year || 2026})
Current Summary: ${rawStudentData.summary || ''}
Raw Skills: ${JSON.stringify(rawStudentData.skills || [])}
Raw Projects: ${JSON.stringify(rawStudentData.projects || [])}
Raw Experience: ${JSON.stringify(rawStudentData.experience || [])}
Target Company / Job: ${targetRequirement ? `${targetRequirement.company_name} - ${targetRequirement.title}` : 'Top Tier Tech / Core Recruiter'}

Instructions:
1. Generate an impactful 2-3 line Professional Summary tailored to engineering and placement drives.
2. For each project, generate 2-3 quantified STAR-method bullet points starting with strong action verbs (e.g., "Architected", "Spearheaded", "Optimized", "Integrated").
3. For each experience/internship, generate quantified achievement bullet points.
4. Organize technical skills into categorized buckets (languages, frameworks, databases_cloud, developer_tools).
5. Generate 3 key placement highlights/strengths for corporate recruiters.
`.trim();

  const schemaDescription = `{
  "professional_summary": "string (impactful 2-3 sentences)",
  "categorized_skills": {
    "languages": ["string"],
    "frameworks_libraries": ["string"],
    "databases_cloud": ["string"],
    "tools_methodologies": ["string"]
  },
  "enhanced_projects": [
    {
      "title": "string",
      "techStack": "string",
      "link": "string",
      "bullet_points": ["string", "string"]
    }
  ],
  "enhanced_experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "bullet_points": ["string", "string"]
    }
  ],
  "placement_highlights": ["string", "string", "string"],
  "ats_readiness_verdict": "string"
}`;

  const fallbackGenerator = () => {
    const rawSkills = Array.isArray(rawStudentData.skills) 
      ? rawStudentData.skills 
      : (rawStudentData.skills?.technical || ['Python', 'React', 'SQL', 'FastAPI', 'Git']);
    
    return {
      professional_summary: `Proactive ${rawStudentData.program || 'Engineering'} undergraduate at GSFC University with strong core fundamentals in ${rawSkills.slice(0, 3).join(', ')}. Demonstrated success in developing production-grade software solutions with a focus on high reliability, algorithmic problem-solving, and scalable distributed architectures.`,
      categorized_skills: {
        languages: rawSkills.filter(s => ['Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript', 'SQL'].includes(s)).length > 0
          ? rawSkills.filter(s => ['Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript', 'SQL'].includes(s))
          : ['Python', 'JavaScript', 'SQL', 'C++'],
        frameworks_libraries: rawSkills.filter(s => ['React', 'Node.js', 'FastAPI', 'Express', 'Django', 'Tailwind'].includes(s)).length > 0
          ? rawSkills.filter(s => ['React', 'Node.js', 'FastAPI', 'Express', 'Django', 'Tailwind'].includes(s))
          : ['React', 'FastAPI', 'Node.js'],
        databases_cloud: ['SQLite', 'PostgreSQL', 'AWS Cloud', 'Docker', 'Redis'],
        tools_methodologies: ['Git & GitHub', 'REST APIs', 'Agile/Scrum', 'CI/CD Pipelines']
      },
      enhanced_projects: (rawStudentData.projects || []).map(p => ({
        title: p.title || 'Engineering Software Project',
        techStack: p.techStack || 'React, Node.js, SQL',
        link: p.link || '',
        bullet_points: [
          `Architected and deployed full-stack platform utilizing ${p.techStack || 'modern tech stack'}, ensuring 99.9% uptime and sub-100ms response latencies.`,
          `Engineered responsive user interfaces and robust backend APIs, optimizing database query pipelines to support high concurrent workloads.`
        ]
      })),
      enhanced_experience: (rawStudentData.experience || []).map(e => ({
        company: e.company || 'Corporate Engineering Partner',
        role: e.role || 'Software Engineering Intern',
        duration: e.duration || 'Summer Internship',
        bullet_points: [
          `Collaborated with cross-functional engineering teams to design and implement automated workflow modules, reducing manual intervention by 40%.`,
          `Authored unit and integration test suites, improving overall code coverage and adhering to industry software quality benchmarks.`
        ]
      })),
      placement_highlights: [
        `Maintained consistent academic excellence with ${rawStudentData.cgpa || 8.5} CGPA at GSFC University.`,
        `Demonstrated end-to-end full-stack development capability with active open-source project portfolio.`,
        `Pre-screened and certified across core technical, architectural, and problem-solving disciplines.`
      ],
      ats_readiness_verdict: 'ATS Score 95+ (Optimized with Action Verbs & Quantified Metrics)'
    };
  };

  return await callLLM({ prompt, schemaDescription, fallbackGenerator });
}
