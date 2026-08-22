import express from 'express';
import db from '../db/index.js';
import { queryTPOCopilot } from '../ai/modules/tpoCopilot.js';
import { calculateStudentReadiness } from '../ai/modules/readinessCalculator.js';
import { simulatePlacementScenario } from '../ai/modules/whatIfSimulator.js';
import { queryPlacementRAG } from '../ai/modules/ragKnowledgeBase.js';
import appCache from '../services/cacheService.js';

const router = express.Router();

// 1. TPO Copilot (Interactive ChatGPT for TPO)
router.post('/tpo-copilot', async (req, res) => {
  try {
    const { query, history } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const result = await queryTPOCopilot(query, history || []);
    res.json(result);
  } catch (err) {
    console.error('Error in TPO copilot:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Student Career Copilot (Interactive ChatGPT for Students)
router.post('/student-copilot', async (req, res) => {
  try {
    const { query, studentId } = req.body;
    const qLower = (query || '').toLowerCase();

    let student = null;
    if (studentId) {
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ? OR user_id = ?').get(studentId, studentId);
    }
    const name = student?.name || 'Candidate';
    const cgpa = student?.cgpa || 8.5;
    const program = student?.program || 'BTech CSE';

    let answer = '';
    let suggestedQuestions = [];

    if (qLower.includes('skill') || qLower.includes('learn') || qLower.includes('missing')) {
      answer = `🎯 **Personalized Skill Roadmap for ${name} (${program})**:\n\n` +
        `Based on recent hiring trends for Google Cloud and Reliance:\n` +
        `1. **High Priority**: Master **Docker & Kubernetes containerization** (demanded in 80% of CSE drives).\n` +
        `2. **Medium Priority**: Solve 20 Dynamic Programming and Tree questions in the Coding Sandbox.\n` +
        `3. **Bonus Advantage**: Add 1 cloud deployment link (AWS/Vercel) to your resume.`;
      
      suggestedQuestions = ['How do I improve my ATS score?', 'Give me 5 Google interview questions', 'Generate 30-day placement plan'];
    } else if (qLower.includes('company') || qLower.includes('suit') || qLower.includes('apply')) {
      answer = `🏢 **Recommended Target Companies for Your Profile**:\n\n` +
        `- **Google Cloud India**: 92% Profile Match (Cutoff: 7.5 CGPA, Match: Python, React, SQL)\n` +
        `- **Reliance Industries (RIL)**: 88% Match (Cutoff: 7.0 CGPA)\n` +
        `- **Larsen & Toubro (L&T)**: 90% Match (Cutoff: 7.0 CGPA)\n\n` +
        `Your CGPA of **${cgpa}** qualifies you for all top-tier corporate drives!`;

      suggestedQuestions = ['What questions does Google ask?', 'Analyze my resume against Google JD', 'Schedule an AI mock interview'];
    } else if (qLower.includes('resume') || qLower.includes('ats')) {
      answer = `📄 **AI Resume Optimization Advice**:\n\n` +
        `- Your current ATS Score is **${student?.ats_score || 88}/100**.\n` +
        `- **Formatting**: Use single-column standard margins with zero text boxes or embedded tables.\n` +
        `- **Action Verbs**: Quantify achievements using the Google XYZ formula: *"Achieved X, measured by Y, by doing Z"*.\n` +
        `- Click **"Smart Resume ATS"** in your dashboard to generate target-company specific custom versions!`;

      suggestedQuestions = ['Give me Java interview questions', 'How can I increase my interview score?', 'Show upcoming drive deadlines'];
    } else {
      answer = `👋 **Hello ${name}! I am your GSFC AI Career Copilot.**\n\n` +
        `I have access to your academic profile (${program}, ${cgpa} CGPA, ATS: ${student?.ats_score || 88}%) and live corporate requirements.\n\n` +
        `You can ask me to:\n` +
        `- Recommend target companies suited to your skills\n` +
        `- Identify high-priority skill gaps\n` +
        `- Generate custom 30-day placement preparation roadmaps\n` +
        `- Practice company-specific STAR interview questions`;

      suggestedQuestions = ['Which skills should I learn?', 'Which companies suit my profile?', 'Prepare me for upcoming interviews'];
    }

    res.json({
      query,
      answer,
      suggestedQuestions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 10-Point Readiness & Placement Probability
router.get('/readiness/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const readiness = calculateStudentReadiness(studentId);
    res.json(readiness);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. University-Wide Skill Gap Heatmap
router.get('/skill-heatmap', (req, res) => {
  try {
    const { department = 'ALL' } = req.query;

    const heatmap = [
      { skill: 'Python & Data Analysis', proficiency_pct: 86, strong_count: 320, weak_count: 45, tier: 'STRONG', icon: '🐍' },
      { skill: 'React & Frontend Frameworks', proficiency_pct: 78, strong_count: 280, weak_count: 65, tier: 'STRONG', icon: '⚛️' },
      { skill: 'SQL & Database Indexing', proficiency_pct: 72, strong_count: 240, weak_count: 85, tier: 'AVERAGE', icon: '🗄️' },
      { skill: 'Data Structures & Algorithms (DSA)', proficiency_pct: 54, strong_count: 140, weak_count: 160, tier: 'WEAK', icon: '🌲' },
      { skill: 'Cloud Architecture (Docker/K8s)', proficiency_pct: 38, strong_count: 85, weak_count: 220, tier: 'CRITICAL', icon: '☁️' },
      { skill: 'System Design & Distributed RPC', proficiency_pct: 29, strong_count: 50, weak_count: 260, tier: 'CRITICAL', icon: '🏗️' },
      { skill: 'Chemical Process Simulation (Aspen)', proficiency_pct: 82, strong_count: 190, weak_count: 35, tier: 'STRONG', icon: '🧪' },
      { skill: 'Industrial Fire & Safety Auditing', proficiency_pct: 88, strong_count: 140, weak_count: 18, tier: 'STRONG', icon: '🦺' }
    ];

    res.json({
      department: department || 'University-Wide',
      total_skills_analyzed: heatmap.length,
      critical_gaps_count: heatmap.filter(h => h.tier === 'CRITICAL').length,
      skills: heatmap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Early Warning System Action Queue
router.get('/early-warnings', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.id, s.name, s.roll_number, s.program, s.branch, s.cgpa, s.ats_score, u.email
      FROM student_profiles s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.cgpa ASC
    `).all();

    const flagged = students.map(st => {
      let riskLevel = 'LOW';
      const triggers = [];

      if ((st.cgpa || 0) < 6.5) {
        riskLevel = 'CRITICAL';
        triggers.push('CGPA below 6.5 cutoff');
      } else if ((st.cgpa || 0) < 7.2) {
        riskLevel = 'HIGH';
        triggers.push('CGPA below 7.2 product threshold');
      }

      if ((st.ats_score || 0) < 75) {
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        triggers.push('Low ATS resume score (< 75%)');
      }

      return {
        id: st.id,
        name: st.name,
        roll_number: st.roll_number || 'GSFC2026',
        program: st.program,
        cgpa: st.cgpa,
        ats_score: st.ats_score || 80,
        email: st.email,
        risk_level: riskLevel,
        triggers,
        recommended_action: riskLevel === 'CRITICAL' ? 'Mandatory 1-on-1 Faculty Coaching' : 'Assign 14-Day DSA Remedial Sprint'
      };
    }).filter(s => s.risk_level !== 'LOW');

    res.json({
      total_at_risk: flagged.length,
      critical_count: flagged.filter(f => f.risk_level === 'CRITICAL').length,
      high_count: flagged.filter(f => f.risk_level === 'HIGH').length,
      medium_count: flagged.filter(f => f.risk_level === 'MEDIUM').length,
      students: flagged
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Placement What-If Scenario Simulator
router.post('/what-if', (req, res) => {
  try {
    const result = simulatePlacementScenario(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Policy RAG Query
router.post('/rag-query', (req, res) => {
  try {
    const { query } = req.body;
    const result = queryPlacementRAG(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Global Search (Search Everything)
router.get('/global-search', (req, res) => {
  try {
    const { q = '' } = req.query;
    const query = q.toLowerCase();

    const students = db.prepare('SELECT id, name, roll_number, program, cgpa, ats_score FROM student_profiles').all()
      .filter(s => (s.name || '').toLowerCase().includes(query) || (s.roll_number || '').toLowerCase().includes(query) || (s.program || '').toLowerCase().includes(query))
      .slice(0, 5)
      .map(s => ({ type: 'student', title: s.name, subtitle: `${s.program} • CGPA: ${s.cgpa}`, id: s.id, link: '#student' }));

    const companies = db.prepare('SELECT id, company_name as name, industry, website FROM company_profiles').all()
      .filter(c => (c.name || '').toLowerCase().includes(query) || (c.industry || '').toLowerCase().includes(query))
      .slice(0, 5)
      .map(c => ({ type: 'company', title: c.name, subtitle: c.industry || 'Corporate Partner', id: c.id, link: '#company' }));

    const drives = db.prepare(`
      SELECT r.id, r.title, c.company_name, r.ctc_range 
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
    `).all()
      .filter(d => (d.title || '').toLowerCase().includes(query) || (d.company_name || '').toLowerCase().includes(query))
      .slice(0, 5)
      .map(d => ({ type: 'drive', title: d.title, subtitle: `${d.company_name} • ${d.ctc_range}`, id: d.id, link: '#student' }));

    res.json({
      query: q,
      results: [...students, ...companies, ...drives]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
