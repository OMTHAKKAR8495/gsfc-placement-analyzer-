import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';
import { AuthRateLimiter } from './middleware/security.js';
import { verifyCsrfToken } from './middleware/authMiddleware.js';

import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import studentRoutes from './routes/student.js';
import interviewRoutes from './routes/interview.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import authenticityRoutes from './routes/authenticity.js';
import alumniRoutes from './routes/alumni.js';
import jobfairRoutes from './routes/jobfair.js';
import qaRoutes from './routes/qa.js';
import ecosystemRoutes from './routes/ecosystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Disable X-Powered-By framework fingerprinting header
app.disable('x-powered-by');

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "http://localhost:5001", "ws://localhost:5173", "http://localhost:5173", "https://generativelanguage.googleapis.com"]
    }
  },
  xContentTypeOptions: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS Configuration
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5001'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('capacitor://') || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global General Rate Limiting & CSRF Checks
app.use('/api', AuthRateLimiter.generalApiLimiter);
app.use('/api', verifyCsrfToken);

// Static uploads & frontend build directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize DB schema & seeds
initDatabase();

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/authenticity', authenticityRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/jobfair', jobfairRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/ecosystem', ecosystemRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CampusHire AI Platform API Server', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA client-side routing on page reload
app.get('*', (req, res) => {
  const distIndexHtml = path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(distIndexHtml, (err) => {
    if (err) {
      // If dist/index.html isn't built yet, send a clean HTML fallback
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>GSFC University Placement Portal</title></head>
          <body>
            <script>window.location.href = "http://localhost:5173" + window.location.pathname + window.location.hash;</script>
          </body>
        </html>
      `);
    }
  });
});

// Centralized Security Error Handler (Masks Internal Stack Traces)
app.use((err, req, res, next) => {
  console.error('🔒 [SECURITY AUDIT SERVER ERROR]:', err.stack || err.message || err);
  
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'An internal security error occurred. Our engineering team has been notified.' : err.message
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 CampusHire AI Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;
