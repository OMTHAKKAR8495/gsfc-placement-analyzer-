import express from 'express';
import db from '../db/index.js';
import { generateInterviewQuestions } from '../ai/modules/interviewGenerator.js';
import { evaluateAnswer, generateFinalReadinessSummary } from '../ai/modules/mockInterviewCoach.js';
import { callLLM } from '../ai/llm.js';

const router = express.Router();

// Generate AI Interview Question Set (Company View or Mock Mode)
router.post('/generate', async (req, res) => {
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

    // AI Evaluation
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

// AI Support & Bug Resolver Chatbot Endpoint
router.post('/support-chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const prompt = `You are GSFC Placement Portal's AI Assistant & Technical Bug Resolver.
The user is asking: "${message}"

Help them troubleshoot any bug, explain how to upload PDF resumes, ATS score calculation, recruiter requirement postings, or student application steps. Be encouraging, clear, and concise.`;

    const schemaDescription = `{
      "reply": "Clear, helpful Markdown string addressing user question or bug report.",
      "suggestedActions": ["Action 1", "Action 2"]
    }`;

    const fallbackGenerator = () => ({
      reply: `🤖 **GSFC AI Support Bot Response:**\n\nThank you for reaching out! Regarding your inquiry ("${message}"):\n\n- **Resume Parsing & ATS**: Make sure to upload a text-readable PDF under the *Smart Resume Analyzer* tab.\n- **Sign In & Auth**: Click the **Sign In** button at the top right to use Quick Demo Login shortcuts (Student / Recruiter / TPC Admin).\n- **Corporate Drives**: Check the sticky *Corporate Drives Tracker* panel on the right to filter newly arrived and past placement companies.\n- **Reported Issue**: Your feedback has been logged for TPC Admin review!`,
      suggestedActions: ['Try Demo Sign In', 'Upload PDF Resume', 'Filter High CTC Companies']
    });

    const aiResponse = await callLLM({ prompt, schemaDescription, fallbackGenerator });
    res.json(aiResponse);
  } catch (err) {
    res.status(500).json({
      reply: `🤖 **GSFC AI Support Assistant:** I received your query ("${req.body.message}"). Please try clicking the **Sign In** button at top right or check your resume upload status in the Smart Resume Analyzer tab.`,
      suggestedActions: ['Try Sign In', 'Check Dashboard']
    });
  }
});

export default router;
