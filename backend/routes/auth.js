import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { validatePasswordPolicy, AuthRateLimiter } from '../middleware/security.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

// Register User (Rate Limited + Password Policy Enforced)
router.post('/register', AuthRateLimiter.registerLimiter, async (req, res) => {
  try {
    const { email, password, role, name, program, branch, cgpa, roll_number, company_name, industry, website } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    // Password Policy Check
    const passCheck = validatePasswordPolicy(password, email);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    // Cost Factor 12 for strong bcrypt hashing
    const passwordHash = bcrypt.hashSync(password, 12);

    db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(userId, email, passwordHash, role);

    let ownerId = userId;
    if (role === 'student') {
      const studentId = 's_' + Date.now();
      ownerId = studentId;
      db.prepare(`
        INSERT INTO student_profiles (id, user_id, roll_number, name, program, branch, cgpa)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(studentId, userId, roll_number || '21BCE001', name || 'New Student', program || 'BTech CSE', branch || 'Computer Science', parseFloat(cgpa || 8.0));
    } else if (role === 'company') {
      const companyId = 'c_' + Date.now();
      ownerId = companyId;
      db.prepare(`
        INSERT INTO company_profiles (id, user_id, company_name, industry, website, approved)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(companyId, userId, company_name || 'Recruiter Company', industry || 'Technology', website || 'https://company.com');
    }

    const token = jwt.sign({ userId, email, role, owner_id: ownerId }, JWT_SECRET, { expiresIn: '7d' });
    const csrfToken = 'csrf_' + Math.random().toString(36).substring(2);

    // Set Secure httpOnly Cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Registration successful', token, csrfToken, user: { id: userId, email, role, owner_id: ownerId } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login User (Rate Limited + Secure Cookie)
router.post('/login', AuthRateLimiter.loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let profile = null;
    let ownerId = user.id;
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
      ownerId = profile?.id || user.id;
    } else if (user.role === 'company') {
      profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(user.id);
      ownerId = profile?.id || user.id;
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, owner_id: ownerId }, JWT_SECRET, { expiresIn: '7d' });
    const csrfToken = 'csrf_' + Math.random().toString(36).substring(2);

    // Set Secure httpOnly Cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ token, csrfToken, user: { id: user.id, email: user.email, role: user.role, owner_id: ownerId, profile } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Current User Details
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'company') {
      profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(user.id);
    }

    res.json({ user: { ...user, profile } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

export default router;
