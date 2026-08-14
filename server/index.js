import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';

import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import studentRoutes from './routes/student.js';
import interviewRoutes from './routes/interview.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads & frontend build directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize DB schema & seeds
initDatabase();

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CampusHire AI Platform API Server', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA client-side routing on page reload
app.get('*', (req, res) => {
  const distIndexHtml = path.join(__dirname, '../dist/index.html');
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

app.listen(PORT, () => {
  console.log(`🚀 CampusHire AI Backend Server running at http://localhost:${PORT}`);
});
