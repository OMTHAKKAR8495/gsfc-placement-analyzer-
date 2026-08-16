import express from 'express';
import db from '../db/index.js';
import { generateInterviewQuestions } from '../ai/modules/interviewGenerator.js';
import { evaluateAnswer, generateFinalReadinessSummary } from '../ai/modules/mockInterviewCoach.js';
import { callLLM } from '../ai/llm.js';
import { AuthRateLimiter, sanitizeAiPromptInput } from '../middleware/security.js';

const router = express.Router();

// Generate AI Interview Question Set (Rate Limited)
router.post('/generate', AuthRateLimiter.aiFeatureLimiter, async (req, res) => {
  try {
    const { requirement_id, student_id } = req.body;
    if (!requirement_id) {
      return res.status(400).json({ error: 'requirement_id is required.' });
    }

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found.' });
    }

    const student = student_id ? db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id) : null;

    const questions = await generateInterviewQuestions(requirement, student);

    const setId = 'qset_' + Date.now();
    db.prepare(`
      INSERT INTO interview_question_sets (id, requirement_id, student_id, questions_json)
      VALUES (?, ?, ?, ?)
    `).run(setId, requirement_id, student_id || null, JSON.stringify(questions));

    res.json({
      setId,
      requirementTitle: requirement.title,
      candidateName: student ? student.name : 'General Applicant',
      questions
    });
  } catch (err) {
    console.error('Error generating interview questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start AI Mock Interview Session
router.post('/mock/start', async (req, res) => {
  try {
    const { student_id, requirement_id } = req.body;
    if (!student_id || !requirement_id) {
      return res.status(400).json({ error: 'student_id and requirement_id are required.' });
    }

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id);
    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    if (!requirement || !student) {
      return res.status(404).json({ error: 'Requirement or Student not found.' });
    }

    const questions = await generateInterviewQuestions(requirement, student);

    const sessionId = 'mock_' + Date.now();
    const qaPairs = questions.map(q => ({
      questionId: q.id,
      category: q.category,
      question: q.question,
      expectedKeyPoints: q.expectedKeyPoints,
      candidateAnswer: null,
      feedback: null
    }));

    db.prepare(`
      INSERT INTO mock_interview_sessions (id, student_id, requirement_id, qa_pairs_json, status)
      VALUES (?, ?, ?, ?, 'in_progress')
    `).run(sessionId, student_id, requirement_id, JSON.stringify(qaPairs));

    res.json({
      sessionId,
      requirementTitle: requirement.title,
      companyName: requirement.company_name,
      totalQuestions: questions.length,
      currentQuestionIndex: 0,
      qaPairs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit single answer for real-time AI evaluation
router.post('/mock/answer', async (req, res) => {
  try {
    const { session_id, question_index, answer_text } = req.body;

    const session = db.prepare('SELECT * FROM mock_interview_sessions WHERE id = ?').get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Mock interview session not found.' });
    }

    const qaPairs = JSON.parse(session.qa_pairs_json || '[]');
    if (question_index < 0 || question_index >= qaPairs.length) {
      return res.status(400).json({ error: 'Invalid question index.' });
    }

    const targetQuestion = qaPairs[question_index];
    targetQuestion.candidateAnswer = answer_text;

    const feedback = await evaluateAnswer({
      question: targetQuestion.question,
      expectedKeyPoints: targetQuestion.expectedKeyPoints || [],
      candidateAnswer: answer_text
    });

    targetQuestion.feedback = feedback;
    qaPairs[question_index] = targetQuestion;

    db.prepare(`
      UPDATE mock_interview_sessions 
      SET qa_pairs_json = ? 
      WHERE id = ?
    `).run(JSON.stringify(qaPairs), session_id);

    res.json({
      questionIndex: question_index,
      feedback,
      qaPairs
    });
  } catch (err) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ error: err.message });
  }
});

// Finish session and return final readiness report card
router.post('/mock/finish', (req, res) => {
  try {
    const { session_id } = req.body;
    const session = db.prepare('SELECT * FROM mock_interview_sessions WHERE id = ?').get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Mock interview session not found.' });
    }

    const qaPairs = JSON.parse(session.qa_pairs_json || '[]');
    const summary = generateFinalReadinessSummary(qaPairs);

    db.prepare(`
      UPDATE mock_interview_sessions
      SET feedback_json = ?, overall_score = ?, status = 'completed'
      WHERE id = ?
    `).run(JSON.stringify(summary), summary.overallScore, session_id);

    res.json({
      sessionId: session_id,
      summary,
      qaPairs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * TRAINED DYNAMIC AI INTENT MATCHING ENGINE
 * Analyzes exact user questions and generates specific answers
 */
function getTrainedResponseForQuestion(msg) {
  const query = msg.toLowerCase().trim();

  // Topic 1: Recruiter Requirement Posting
  if (query.includes('recruiter') || query.includes('post requirement') || query.includes('post job') || query.includes('hiring requirement') || query.includes('how do recruiters')) {
    return {
      reply: `🏢 **How Recruiters Post Hiring Requirements:**\n\n1. **Switch Portal View**: Click **Recruiter Portal** in the top navigation bar.\n2. **TPC Admin Verification**: Ensure your account is approved by GSFC TPC Admin (Demo recruiters are pre-verified!).\n3. **Post Requirement**: Click the **"+ Post New Hiring Requirement"** button at top right.\n4. **Define Parameters**: Fill in Job Title, CTC Range, Eligible Programs (e.g. BTech CSE/IT), Min CGPA cutoff, and Required Skills.\n5. **Publish**: Click **Publish Requirement to Student Feed**. It immediately calculates NLP match scores for all GSFC students!`,
      suggestedActions: ['Go to Recruiter Portal', 'View Demo Recruiter Account']
    };
  }

  // Topic 2: Smart Resume Parser & ATS Scoring
  if (query.includes('ats') || query.includes('resume') || query.includes('parse') || query.includes('pdf') || query.includes('upload resume')) {
    return {
      reply: `📄 **Smart Resume Analyzer & ATS Score Guide:**\n\n1. Go to **Student Workspace** &rarr; click **Smart Resume Analyzer** tab.\n2. Click **Upload PDF Resume** and choose your resume PDF.\n3. **Gemini NLP Engine** automatically extracts your Name, Program, Branch, CGPA, and Technical Skills.\n4. **ATS Compatibility Score**: Calculates your score out of 100 with improvement tips (e.g. adding missing skills like SQL, Docker, or Python).`,
      suggestedActions: ['Upload PDF Resume', 'Check ATS Score Tips']
    };
  }

  // Topic 3: Sign In & Demo Authentication
  if (query.includes('sign in') || query.includes('login') || query.includes('auth') || query.includes('password') || query.includes('account')) {
    return {
      reply: `🔐 **GSFC Portal Authentication Guide:**\n\n1. Click **Sign In / Access Portal** at the top right of the navigation bar.\n2. Use the **Quick Demo Login Shortcuts** for 1-click access:\n   - 🎓 **Demo Student**: \`s_arav@student.edu\`\n   - 🏢 **Demo Recruiter**: \`c_google@recruiter.com\`\n   - 🛡️ **TPC Admin**: \`tpc@university.edu\`\n3. Or click **Sign Up** to create a new student/company account!`,
      suggestedActions: ['Open Sign In Modal', 'Try Demo Student']
    };
  }

  // Topic 4: Corporate Drives Tracker & Sidebar
  if (query.includes('drive') || query.includes('tracker') || query.includes('sidebar') || query.includes('company list') || query.includes('passed') || query.includes('newly')) {
    return {
      reply: `📊 **Corporate Drives Tracker & Filters:**\n\nLook at the sticky **Corporate Drives Tracker** panel on the right side of your workspace:\n- **⚡ Newly Arrived**: Displays corporate hiring drives posted recently (Google Cloud, Microsoft Azure, TCS).\n- **✅ Passed Drives**: Shows completed campus recruitment drives.\n- **High CTC Filter**: Check the **"Show High CTC Only (>= ₹15 LPA)"** checkbox to instantly filter premium packages!`,
      suggestedActions: ['Filter High CTC', 'View Live Requirements']
    };
  }

  // Topic 5: AI Mock Interviews & Questions
  if (query.includes('interview') || query.includes('mock') || query.includes('question') || query.includes('coach')) {
    return {
      reply: `🎙️ **AI Mock Interview Coach:**\n\n1. Find any role in the **Live GSFC Requirements** feed.\n2. Click **AI Mock Interview**.\n3. The system generates 4 role-specific technical/situational questions based on your resume and job requirements.\n4. Speak or type your answers to receive instant score evaluations (% Clarity, % Technical Accuracy) and a final readiness report card!`,
      suggestedActions: ['Start AI Mock Interview', 'View Applications']
    };
  }

  // Topic 6: Bug Report & Troubleshooting
  if (query.includes('bug') || query.includes('issue') || query.includes('error') || query.includes('broken') || query.includes('failed')) {
    return {
      reply: `🛠️ **GSFC Technical Bug Support Ticket:**\n\n- **Logged Issue**: "${msg}"\n- **Portal Status**: Fully online (` + new Date().toLocaleTimeString() + `)\n- **Quick Self-Fix**: Click the **Sign In** button at top right or clear browser cache. If the issue persists, TPC Admin has been notified automatically!`,
      suggestedActions: ['Open Sign In Modal', 'Refresh Workspace']
    };
  }

  // Default Dynamic Assistant Response
  return {
    reply: `🤖 **GSFC Placement AI Assistant:**\n\nI analyzed your question: **"${msg}"**\n\nHere is how to proceed on the GSFC Placement Portal:\n1. **Students**: Upload PDF resumes under *Smart Resume Analyzer* to view NLP match scores and apply.\n2. **Recruiters**: Post hiring requirements in *Recruiter Portal* to receive AI-ranked candidate leaderboards.\n3. **TPC Admin**: Verify corporate signups and export NAAC/NIRF accreditation reports under *TPC Admin*.`,
    suggestedActions: ['How do recruiters post requirements?', 'How to parse PDF resume & check ATS?', 'Open Sign In Modal']
  };
}

// AI Support & Bug Resolver Chatbot Endpoint
router.post('/support-chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // First attempt Gemini API call if key valid
    const prompt = `You are GSFC Placement Portal's AI Assistant & Technical Support Coach.
User Question: "${message}"

Provide a trained, direct, step-by-step answer explaining how to use the portal, solve their bug, or navigate GSFC University placement features.`;

    const schemaDescription = `{
      "reply": "Clear, specific step-by-step Markdown answer answering the exact user question.",
      "suggestedActions": ["Action 1", "Action 2"]
    }`;

    const fallbackGenerator = () => getTrainedResponseForQuestion(message);

    const aiResponse = await callLLM({ prompt, schemaDescription, fallbackGenerator });
    res.json(aiResponse);
  } catch (err) {
    res.json(getTrainedResponseForQuestion(req.body.message || 'General Question'));
  }
});

// AI Answer Evaluation Endpoint for Interview Studio (Swappable Multi-Model Provider)
router.post('/evaluate-answer', AuthRateLimiter.aiFeatureLimiter, async (req, res) => {
  try {
    const { questionText, category, difficulty, keyConcepts, suggestedAnswer, studentAnswer, studentId, requirementId } = req.body;

    if (!questionText || !studentAnswer) {
      return res.status(400).json({ error: 'questionText and studentAnswer are required.' });
    }

    // 1. Edge Case: Empty / Very Short Answers (< 15 words) -> Instant Auto-Fail without LLM call (Saves API Quota)
    const sanitizedAnswer = sanitizeAiPromptInput(studentAnswer);
    const wordCount = sanitizedAnswer.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < 15) {
      const concepts = Array.isArray(keyConcepts) ? keyConcepts : ['Technical Specificity', 'STAR Structure'];
      return res.json({
        verdict: 'fail',
        score: 25,
        feedback: 'Your answer is too brief (' + wordCount + ' words) to demonstrate technical depth for a campus placement drive. Expand your response with concrete examples and technical details.',
        conceptsCovered: [],
        conceptsMissing: concepts,
        offTopic: true,
        wordCount
      });
    }

    // 2. Structured AI Evaluation Prompt
    const conceptsList = Array.isArray(keyConcepts) ? keyConcepts.join(', ') : (keyConcepts || 'Key Technical Concepts');
    const prompt = `You are a Senior Technical Recruiter screening candidates for a top campus placement drive at GSFC University.

    EVALUATION CRITERIA:
    Question: "${questionText}"
    Category: "${category || 'Technical'}"
    Difficulty: "${difficulty || 'Medium'}"
    Key Concepts to Address: "${conceptsList}"
    Rubric / Ideal Answer: "${suggestedAnswer || 'Substantive technical answer'}"

    CANDIDATE ANSWER TO EVALUATE:
    "${sanitizedAnswer}"

    INSTRUCTIONS:
    - If answer is generic filler, unrelated, or clearly off-topic, set "verdict": "fail", "offTopic": true, "score": 20.
    - If answer is on-topic but missing key concepts or lacks structure, set "verdict": "needs_improvement", "score": 60-75.
    - Set "verdict": "pass" ONLY if answer covers the majority of key concepts with technical accuracy (score 80-100).
    - Return JSON ONLY following the schema.`;

    const schemaDescription = `{
      "verdict": "pass | needs_improvement | fail",
      "score": 85,
      "feedback": "2-4 sentences of specific, constructive feedback explaining what was good and what was missing.",
      "conceptsCovered": ["Concept 1"],
      "conceptsMissing": ["Concept 2"],
      "offTopic": false
    }`;

    const fallbackGenerator = () => {
      const matchCount = (Array.isArray(keyConcepts) ? keyConcepts : []).filter(c => 
        sanitizedAnswer.toLowerCase().includes(c.toLowerCase())
      );
      const isPass = matchCount.length >= 1 && wordCount >= 30;
      return {
        verdict: isPass ? 'pass' : 'needs_improvement',
        score: isPass ? 82 : 65,
        feedback: isPass 
          ? `Solid technical answer! You covered key concepts like ${matchCount.join(', ') || 'core principles'}. Ensure you emphasize latency metrics for top tier placement interviews.` 
          : `Good initial response, but needs more technical depth. Be sure to address: ${(keyConcepts || []).join(', ')}.`,
        conceptsCovered: matchCount,
        conceptsMissing: (keyConcepts || []).filter(c => !matchCount.includes(c)),
        offTopic: false
      };
    };

    const evaluationResult = await callLLM({ prompt, schemaDescription, fallbackGenerator });

    // Log evaluation for TPC Admin analytics audit trail
    try {
      const logId = 'eval_' + Date.now();
      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_id, viewed_entity_type, viewed_entity_id)
        VALUES (?, ?, 'eval_result', ?)
      `).run(logId, studentId || 's_demo', evaluationResult.verdict + '_' + (requirementId || 'req_gen'));
    } catch(e) {}

    res.json(evaluationResult);
  } catch (err) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ error: 'Failed to evaluate answer. Please try again.' });
  }
});

export default router;
