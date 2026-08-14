import { callLLM } from '../llm.js';

export async function generateInterviewQuestions(requirement, studentProfile = null) {
  const reqSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json)
    : requirement.required_skills_json || [];

  const studentData = studentProfile && studentProfile.parsed_resume_json
    ? (typeof studentProfile.parsed_resume_json === 'string' ? JSON.parse(studentProfile.parsed_resume_json) : studentProfile.parsed_resume_json)
    : null;

  const schemaDescription = `{
    "questions": [
      {
        "id": "q1",
        "category": "Technical | Resume-based | Behavioral",
        "question": "string",
        "expectedKeyPoints": ["array of key points expected in answer"],
        "difficulty": "Easy | Medium | Hard"
      }
    ]
  }`;

  const prompt = `Generate a set of 5 structured, highly relevant interview questions for the following hiring role:

Role Title: ${requirement.title}
Job Type: ${requirement.job_type}
Required Skills: ${reqSkills.join(', ')}
Job Description: ${requirement.job_description}

${studentData ? `Candidate Resume Background:
Name: ${studentData.name}
Program: ${studentData.program}
Projects: ${JSON.stringify(studentData.projects || [])}
Internships: ${JSON.stringify(studentData.internships || [])}
` : 'No candidate resume provided. Focus on role-specific technical and behavioral questions.'}

Generate 2 Technical/Role-Specific questions, 2 ${studentData ? 'Resume-Specific' : 'Domain/System Design'} questions, and 1 Behavioral question.`;

  const result = await callLLM({
    prompt,
    schemaDescription,
    fallbackGenerator: () => generateQuestionFallback(requirement, studentData)
  });

  return Array.isArray(result.questions) ? result.questions : generateQuestionFallback(requirement, studentData).questions;
}

function generateQuestionFallback(requirement, studentData) {
  const reqSkills = typeof requirement.required_skills_json === 'string'
    ? JSON.parse(requirement.required_skills_json)
    : requirement.required_skills_json || ['Python', 'SQL'];

  const primarySkill = reqSkills[0] || 'Software Architecture';
  const secondarySkill = reqSkills[1] || 'Database Design';

  const questions = [
    {
      id: 'q1',
      category: 'Technical',
      question: `How would you approach designing a scalable service using ${primarySkill} for ${requirement.title}? Explain key architectural trade-offs.`,
      expectedKeyPoints: [`Core fundamentals of ${primarySkill}`, 'Error handling & retry mechanisms', 'Performance scalability'],
      difficulty: 'Medium'
    },
    {
      id: 'q2',
      category: 'Technical',
      question: `Walk me through your optimization strategy when handling data queries and state management in ${secondarySkill}.`,
      expectedKeyPoints: ['Indexing / query execution plans', 'Caching mechanisms', 'Data integrity'],
      difficulty: 'Hard'
    }
  ];

  if (studentData && studentData.projects && studentData.projects.length > 0) {
    const proj = studentData.projects[0];
    questions.push({
      id: 'q3',
      category: 'Resume-based',
      question: `In your project '${proj.title}', what was the most technical challenge you faced and how did you resolve it?`,
      expectedKeyPoints: ['Problem statement clarity', 'Specific implementation steps taken', 'Quantifiable outcome or lesson learned'],
      difficulty: 'Medium'
    });
  } else {
    questions.push({
      id: 'q3',
      category: 'Resume-based',
      question: `Describe a hands-on project or internship deliverable where you implemented automated testing or performance tuning.`,
      expectedKeyPoints: ['Tools used', 'Test suite coverage', 'Bottleneck identification'],
      difficulty: 'Medium'
    });
  }

  questions.push({
    id: 'q4',
    category: 'Behavioral',
    question: `Tell me about a time when project specifications changed late in a production cycle. How did you prioritize tasks and communicate with team members?`,
    expectedKeyPoints: ['STAR method structure (Situation, Task, Action, Result)', 'Agile adaptability', 'Stakeholder communication'],
    difficulty: 'Easy'
  });

  return { questions };
}
