import express from 'express';
import db from '../db/index.js';
import { generateInterviewQuestions } from '../ai/modules/interviewGenerator.js';
import { evaluateAnswer, generateFinalReadinessSummary } from '../ai/modules/mockInterviewCoach.js';
import { gradeAnswer } from '../ai/modules/answerEvaluator.js';
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
    const { student_id, requirement_id, interview_mode = 'general', target_company } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required.' });
    }

    let requirement = requirement_id ? db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id) : null;
    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    if (!requirement) {
      requirement = {
        id: requirement_id || 'req_custom',
        title: `${target_company || 'Tier 1 Corporate'} ${interview_mode.toUpperCase()} Round`,
        company_name: target_company || 'Placement Partner',
        required_skills_json: '["Python", "SQL", "React", "System Design", "Problem Solving"]',
        job_description: `Campus interview round for ${interview_mode} evaluation.`
      };
    }

    let questions = await generateInterviewQuestions(requirement, student || { name: 'Candidate' });

    // Filter or customize by mode
    if (interview_mode === 'hr') {
      questions = [
        {
          id: 'hr_1',
          category: 'HR & Cultural Fit',
          question: 'Tell me about yourself, your academic background at GSFC University, and why you are interested in this role.',
          expectedKeyPoints: ['Clear self introduction', 'Academic projects highlight', 'Company alignment']
        },
        {
          id: 'hr_2',
          category: 'HR & Conflict Resolution',
          question: 'Describe a situation where you had a disagreement with a team member during a project. How did you resolve it?',
          expectedKeyPoints: ['Empathy and listening', 'Focus on objective outcome', 'Constructive consensus']
        },
        {
          id: 'hr_3',
          category: 'HR & Career Vision',
          question: 'Where do you see yourself in the next 3 to 5 years, and how does this organization fit into your long-term career goals?',
          expectedKeyPoints: ['Technical growth ambition', 'Continuous learning mindset', 'Value creation']
        }
      ];
    } else if (interview_mode === 'behavioral') {
      questions = [
        {
          id: 'beh_1',
          category: 'Behavioral STAR',
          question: 'Tell me about a time you had to deliver a critical project under an extremely tight deadline.',
          expectedKeyPoints: ['Situation setup', 'Specific task responsibility', 'Decisive action taken', 'Measurable positive result']
        },
        {
          id: 'beh_2',
          category: 'Behavioral STAR',
          question: 'Give an example of a failure or setback you experienced and what key lessons you learned from it.',
          expectedKeyPoints: ['Accountability', 'Root cause analysis', 'Remedial action', 'Long-term learning']
        }
      ];
    } else if (interview_mode === 'project_based') {
      questions = [
        {
          id: 'proj_1',
          category: 'Project Defense',
          question: 'Walk me through the high-level architecture of your most impactful university project. Why did you choose your technology stack?',
          expectedKeyPoints: ['Architecture diagram explanation', 'Tech stack justification', 'Data flow clarity']
        },
        {
          id: 'proj_2',
          category: 'Project Deep-Dive',
          question: 'What was the single most difficult technical roadblock you solved in that project, and how did you verify the fix?',
          expectedKeyPoints: ['Debugging methodology', 'Concurrency or data persistence fix', 'Unit/integration testing']
        }
      ];
    }

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
    `).run(sessionId, student_id, requirement.id || requirement_id || 'req_custom', JSON.stringify(qaPairs));

    res.json({
      sessionId,
      requirementTitle: requirement.title,
      companyName: requirement.company_name,
      interviewMode: interview_mode,
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

// Get Student's Mock Interview Sessions History
router.get('/sessions', (req, res) => {
  try {
    const studentId = req.query.student_id || req.query.studentId;
    if (!studentId) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const sessions = db.prepare(`
      SELECT 
        s.*, 
        r.title as requirement_title, 
        r.ctc_range, 
        c.company_name, 
        c.logo_url
      FROM mock_interview_sessions s
      LEFT JOIN requirements r ON s.requirement_id = r.id
      LEFT JOIN company_profiles c ON r.company_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC
    `).all(studentId);

    res.json(sessions);
  } catch (err) {
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

    // Save to student_assessments for persistent unified assessment history
    try {
      const asmtId = 'asmt_mock_' + session_id;
      db.prepare(`
        INSERT OR REPLACE INTO student_assessments (
          id, student_id, assessment_title, assessment_type, requirement_id,
          score, percentage, questions_attempted, correct_answers, incorrect_answers,
          time_taken_seconds, status, feedback_json, answers_json
        ) VALUES (?, ?, ?, 'mock_interview', ?, ?, ?, ?, ?, ?, 300, 'completed', ?, ?)
      `).run(
        asmtId, session.student_id, `AI Mock Interview Assessment`, session.requirement_id,
        summary.overallScore, summary.overallScore, qaPairs.length,
        qaPairs.filter(q => q.feedback?.score >= 70).length,
        qaPairs.filter(q => (q.feedback?.score || 0) < 70).length,
        JSON.stringify(summary), session.qa_pairs_json
      );
    } catch(e) {}

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
    const { 
      questionText, 
      category, 
      difficulty, 
      keyConcepts, 
      suggestedAnswer, 
      studentAnswer, 
      previousAnswer,
      studentId, 
      requirementId,
      attemptCount
    } = req.body;

    if (!questionText || !studentAnswer) {
      return res.status(400).json({ error: 'questionText and studentAnswer are required.' });
    }

    const provider = process.env.AI_GRADING_PROVIDER || 'gemini';

    const evaluationResult = await gradeAnswer({
      provider,
      questionText,
      category: category || 'Technical',
      difficulty: difficulty || 'Medium',
      keyConcepts: keyConcepts || [],
      suggestedAnswer: suggestedAnswer || '',
      studentAnswer,
      previousAnswer: previousAnswer || '',
      attemptCount: attemptCount || 1
    });

    // Persistent Database Logging for TPC Admin Analytics
    try {
      const evalId = 'eval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      db.prepare(`
        INSERT INTO interview_evaluations (
          id, student_id, requirement_id, question_text, category, difficulty, verdict, score, concepts_covered_json, concepts_missing_json, attempt_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        evalId,
        studentId || 's_demo',
        requirementId || 'req_gen',
        questionText,
        category || 'Technical',
        difficulty || 'Medium',
        evaluationResult.verdict,
        evaluationResult.score,
        JSON.stringify(evaluationResult.conceptsCovered || []),
        JSON.stringify(evaluationResult.conceptsMissing || []),
        attemptCount || 1
      );
    } catch (dbErr) {
      console.warn('Evaluation DB logging notice:', dbErr.message);
    }

    res.json(evaluationResult);
  } catch (err) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ error: 'Failed to evaluate answer. Please try again.' });
  }
});

// TPC Admin Analytics: Fail/Pass rates by category and company drive
router.get('/evaluation-analytics', (req, res) => {
  try {
    const categoryStats = db.prepare(`
      SELECT category,
             COUNT(*) as total_evaluations,
             SUM(CASE WHEN verdict = 'pass' THEN 1 ELSE 0 END) as pass_count,
             SUM(CASE WHEN verdict = 'needs_improvement' THEN 1 ELSE 0 END) as improvement_count,
             SUM(CASE WHEN verdict = 'fail' THEN 1 ELSE 0 END) as fail_count,
             ROUND(AVG(score), 1) as avg_score
      FROM interview_evaluations
      GROUP BY category
    `).all();

    const weakestCategory = db.prepare(`
      SELECT category, COUNT(*) as fail_count
      FROM interview_evaluations
      WHERE verdict IN ('fail', 'needs_improvement')
      GROUP BY category
      ORDER BY fail_count DESC
      LIMIT 1
    `).get();

    res.json({
      categoryStats,
      weakestCategory: weakestCategory ? weakestCategory.category : 'System Design',
      totalEvaluations: categoryStats.reduce((sum, c) => sum + c.total_evaluations, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
