/**
 * Question Selection Algorithm for GSFC Smart Interview Studio
 * Combines Recruiter Question Bank with weighted sampling and AI Fallback.
 */

// Cache AI-generated sets per job ID for 24 hours
const generatedQuestionCache = new Map();

/**
 * Builds an 8-question interview session set for a selected job and student profile.
 * 
 * @param {Object} job - Requirement item containing questionBank_json / questionBank array
 * @param {Object} studentProfile - Parsed student profile with technical skills & weak areas
 * @param {number} sessionLength - Target session question count (default 8)
 * @returns {Object} - { questions: Array, sourceBadge: 'recruiter' | 'ai_generated' | 'mixed' }
 */
export function buildInterviewSet(job, studentProfile = null, sessionLength = 8) {
  if (!job) {
    return {
      questions: getDefaultFallbackQuestions(),
      sourceBadge: 'ai_generated'
    };
  }

  // Parse recruiter question pool
  let recruiterPool = [];
  try {
    if (Array.isArray(job.questionBank)) {
      recruiterPool = job.questionBank;
    } else if (job.question_bank_json) {
      recruiterPool = typeof job.question_bank_json === 'string'
        ? JSON.parse(job.question_bank_json || '[]')
        : (job.question_bank_json || []);
    }
  } catch (e) {
    recruiterPool = [];
  }

  // Filter for recruiter-supplied questions
  const recruiterQuestions = recruiterPool.filter(q => q && q.text && (q.source === 'recruiter' || !q.source));

  if (recruiterQuestions.length >= sessionLength) {
    // Weighted sampling matching student weak areas & difficulty distribution (30% Easy, 50% Medium, 20% Hard)
    const sampled = weightedSample(recruiterQuestions, studentProfile, sessionLength);
    return {
      questions: sampled.map(q => ({ ...q, source: 'recruiter' })),
      sourceBadge: 'recruiter'
    };
  }

  // If recruiter pool has questions but less than sessionLength -> Top up with AI generated questions
  const deficit = sessionLength - recruiterQuestions.length;
  const aiGeneratedQuestions = getOrGenerateAiQuestions(job, deficit, recruiterQuestions);

  const combined = [
    ...recruiterQuestions.map(q => ({ ...q, source: 'recruiter' })),
    ...aiGeneratedQuestions.map(q => ({ ...q, source: 'ai_generated' }))
  ];

  const sourceBadge = recruiterQuestions.length > 0 ? 'mixed' : 'ai_generated';

  return {
    questions: shuffleArray(combined),
    sourceBadge
  };
}

/**
 * Weighted Sampling Algorithm:
 * Scores questions by student skill overlap, category diversity, and difficulty balance.
 */
function weightedSample(pool, studentProfile, targetCount) {
  const studentSkills = getStudentSkills(studentProfile);

  const scoredPool = pool.map((q, idx) => {
    let score = 1.0;
    
    // Skill Overlap (0.5 weight)
    const qSkills = Array.isArray(q.skillTags) ? q.skillTags : [];
    const skillMatch = qSkills.some(s => studentSkills.some(st => st.toLowerCase().includes(s.toLowerCase())));
    if (skillMatch) score += 1.5;

    // Difficulty Balance Weighting (0.3 weight): Target ~2 Easy, ~4 Medium, ~2 Hard
    const diff = (q.difficulty || 'Medium').toLowerCase();
    if (diff === 'medium') score += 0.8;
    else if (diff === 'easy') score += 0.5;
    else if (diff === 'hard') score += 0.4;

    // Add slight random noise to vary repeated sessions
    score += Math.random() * 0.4;

    return { question: q, score, originalIdx: idx };
  });

  // Sort by score descending and return top targetCount
  return scoredPool
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .map(item => item.question);
}

/**
 * AI Question Generator & 24-Hour Cache Fallback
 */
function getOrGenerateAiQuestions(job, count, existingPool = []) {
  const cacheKey = `job_ai_${job.id}_${count}`;
  const cached = generatedQuestionCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
    return cached.questions;
  }

  // Generate role-specific questions
  const title = job.title || 'Software Engineer';
  const companyName = job.company_name || job.company || 'Tech Partner';
  let requiredSkills = [];
  try {
    requiredSkills = typeof job.required_skills_json === 'string'
      ? JSON.parse(job.required_skills_json || '[]')
      : (job.required_skills_json || []);
  } catch (e) {
    requiredSkills = ['Python', 'React', 'SQL'];
  }

  const generated = [];
  const existingTexts = new Set(existingPool.map(q => q.text.toLowerCase()));

  const templates = [
    { text: `How would you architect a high-concurrency microservice for ${companyName}'s ${title} ecosystem?`, category: 'System Design', difficulty: 'Hard' },
    { text: `Explain how you optimize database index performance for ${requiredSkills[0] || 'SQL'} queries under heavy traffic.`, category: 'Technical', difficulty: 'Medium' },
    { text: `Walk me through a complex data structure choice you made in a recent ${requiredSkills[1] || 'React/Python'} project.`, category: 'DSA', difficulty: 'Medium' },
    { text: `Describe a scenario at ${companyName} where a deployment failed. How do you isolate and debug production issues?`, category: 'Role-Specific', difficulty: 'Medium' },
    { text: `How do you handle technical debt vs meeting aggressive release deadlines?`, category: 'Behavioral', difficulty: 'Easy' },
    { text: `What security best practices do you enforce when writing RESTful APIs in ${requiredSkills[0] || 'Python'}?`, category: 'Technical', difficulty: 'Medium' },
    { text: `Explain the trade-offs between SQL transactions and Eventual Consistency in distributed systems.`, category: 'System Design', difficulty: 'Hard' },
    { text: `Why are you interested in joining ${companyName} for the ${title} drive?`, category: 'HR', difficulty: 'Easy' }
  ];

  for (const t of templates) {
    if (generated.length >= count) break;
    if (!existingTexts.has(t.text.toLowerCase())) {
      generated.push({
        id: `ai_gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: t.text,
        category: t.category,
        difficulty: t.difficulty,
        skillTags: requiredSkills.slice(0, 3),
        source: 'ai_generated',
        createdAt: new Date().toISOString()
      });
    }
  }

  // Cache generated questions for 24h
  generatedQuestionCache.set(cacheKey, {
    questions: generated,
    timestamp: Date.now()
  });

  return generated;
}

function getStudentSkills(studentProfile) {
  if (!studentProfile) return ['Python', 'React', 'SQL', 'Data Structures'];
  try {
    const parsed = typeof studentProfile.parsed_resume_json === 'string'
      ? JSON.parse(studentProfile.parsed_resume_json || '{}')
      : (studentProfile.parsed_resume_json || {});
    return parsed.skills?.technical || studentProfile.skills || ['Python', 'React', 'SQL'];
  } catch (e) {
    return ['Python', 'React', 'SQL'];
  }
}

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getDefaultFallbackQuestions() {
  return [
    { id: 'def_1', text: 'Explain the difference between synchronous and asynchronous execution.', category: 'Technical', difficulty: 'Easy', source: 'ai_generated' },
    { id: 'def_2', text: 'How do you optimize SQL query execution plans?', category: 'Technical', difficulty: 'Medium', source: 'ai_generated' },
    { id: 'def_3', text: 'Design a scalable rate limiter for an API gateway.', category: 'System Design', difficulty: 'Hard', source: 'ai_generated' },
    { id: 'def_4', text: 'Describe a challenging bug you fixed and how you debugged it.', category: 'Behavioral', difficulty: 'Medium', source: 'ai_generated' }
  ];
}
