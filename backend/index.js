import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthRateLimiter } from './middleware/security.js';
import { verifyCsrfToken } from './middleware/authMiddleware.js';
import { wafShieldMiddleware } from './middleware/wafShield.js';

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
import intelligenceRoutes from './routes/intelligence.js';
import facultyRoutes from './routes/faculty.js';
import auditRoutes from './routes/audit.js';
import eventsRoutes from './routes/events.js';
import meetingsRoutes from './routes/meetings.js';
import gamificationRoutes from './routes/gamification.js';
import blockchainRoutes from './routes/blockchainVerification.js';
import subscriptionRoutes from './routes/subscriptions.js';
import adminSubscriptionRoutes from './routes/adminSubscriptions.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// CORS Allowed Origins & Validator
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [])
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith('capacitor://') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
  if (origin.includes('gsfcuniversity') || origin.includes('onrender.com')) return true;
  return false;
};

// Socket.IO Server Configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by Socket.IO CORS policy'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

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
      connectSrc: ["'self'", "http://localhost:5001", "ws://localhost:5001", "ws://localhost:5173", "http://localhost:5173", "https://*.vercel.app", "wss://*.onrender.com", "https://*.onrender.com", "https://generativelanguage.googleapis.com"]
    }
  },
  xContentTypeOptions: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// Body parser & Cookie parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Global General Rate Limiting, CSRF Checks & WAF Layer-7 Threat Shield
app.use('/api', AuthRateLimiter.generalApiLimiter);
app.use('/api', verifyCsrfToken);
app.use('/api', wafShieldMiddleware);

// Static uploads & frontend build directory
const uploadsDir = process.env.DB_DIR
  ? path.join(process.env.DB_DIR, 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch(e) {}
}
app.use('/uploads', express.static(uploadsDir));
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
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CampusHire AI Platform API Server', timestamp: new Date().toISOString() });
});

// Real-Time Socket.IO WebRTC Signaling & Anti-Cheating Hub
io.on('connection', (socket) => {
  // 1. Join Meeting Room
  socket.on('join-room', ({ roomId, userId, userName, userRole, studentId }) => {
    if (!roomId) return;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    socket.userName = userName;
    socket.userRole = userRole;
    socket.studentId = studentId;

    // Get list of other sockets in room
    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .filter(id => id !== socket.id)
      .map(id => {
        const s = io.sockets.sockets.get(id);
        return {
          socketId: id,
          userId: s?.userId,
          userName: s?.userName,
          userRole: s?.userRole,
          studentId: s?.studentId
        };
      });

    // Send existing room participants to the newly joined peer
    socket.emit('room-peers', clientsInRoom);

    // Broadcast new user arrival to existing peers
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
      userRole,
      studentId
    });

    // If recruiter or admin joins, update meeting status to 'live'
    if (userRole === 'company' || userRole === 'admin' || userRole === 'superadmin') {
      try {
        db.prepare("UPDATE meetings SET status = 'live' WHERE room_id = ? AND status = 'scheduled'").run(roomId);
        io.to(roomId).emit('meeting-status-changed', { status: 'live' });
      } catch (e) {}
    }
  });

  // 2. WebRTC Signaling: Offer
  socket.on('signal-offer', ({ targetSocketId, offer, callerInfo }) => {
    io.to(targetSocketId).emit('signal-offer', {
      callerSocketId: socket.id,
      offer,
      callerInfo: callerInfo || {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole
      }
    });
  });

  // 3. WebRTC Signaling: Answer
  socket.on('signal-answer', ({ targetSocketId, answer, responderInfo }) => {
    io.to(targetSocketId).emit('signal-answer', {
      responderSocketId: socket.id,
      answer,
      responderInfo: responderInfo || {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole
      }
    });
  });

  // 4. WebRTC Signaling: ICE Candidate
  socket.on('signal-ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('signal-ice-candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  // 5. In-Meeting Real-Time Chat
  socket.on('chat-message', ({ roomId, message, senderId, senderName, senderRole }) => {
    if (!roomId || !message) return;
    try {
      const msgId = 'msg_' + Date.now();
      const meet = db.prepare('SELECT id FROM meetings WHERE room_id = ?').get(roomId);
      if (meet) {
        db.prepare(`
          INSERT INTO meeting_chat_messages (id, meeting_id, sender_id, sender_name, sender_role, message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(msgId, meet.id, senderId, senderName, senderRole, message);
      }

      const chatPayload = {
        id: msgId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        message,
        created_at: new Date().toISOString()
      };

      io.to(roomId).emit('new-chat-message', chatPayload);
    } catch (e) {
      console.error('Chat message socket error:', e.message);
    }
  });

  // 6. Anti-Cheating Violation Alert & Automatic Disqualification
  socket.on('student-violation', ({ roomId, studentId, studentName, studentEmail, violationType, details }) => {
    if (!roomId) return;
    try {
      const meet = db.prepare('SELECT id FROM meetings WHERE room_id = ?').get(roomId);
      if (meet) {
        const violId = 'viol_' + Date.now();
        db.prepare(`
          INSERT INTO meeting_violations (id, meeting_id, student_id, student_name, student_email, violation_type, details)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(violId, meet.id, studentId || 'unknown', studentName || 'Candidate', studentEmail || '', violationType, details);

        db.prepare(`
          UPDATE meeting_participants
          SET join_status = 'ejected',
              left_at = CURRENT_TIMESTAMP,
              outcome_status = 'rejected',
              interviewer_notes = ?
          WHERE meeting_id = ? AND (student_id = ? OR user_id = ?)
        `).run(`[FLAGGED & DISQUALIFIED]: ${violationType} - ${details}`, meet.id, studentId, socket.userId);
      }

      // Broadcast alert to room participants (recruiters/admins will display instant banner)
      io.to(roomId).emit('student-violation-alert', {
        socketId: socket.id,
        studentId,
        studentName,
        studentEmail,
        violationType,
        details,
        occurredAt: new Date().toISOString()
      });

      // Notify the student that they have been ejected
      socket.emit('you-are-ejected', {
        violationType,
        details,
        occurredAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Violation socket error:', e.message);
    }
  });

  // 7. End Meeting for All
  socket.on('end-meeting-all', ({ roomId, endedByName }) => {
    if (!roomId) return;
    try {
      db.prepare("UPDATE meetings SET status = 'completed', ended_at = CURRENT_TIMESTAMP WHERE room_id = ?").run(roomId);
    } catch (e) {}
    io.to(roomId).emit('meeting-ended', {
      roomId,
      endedByName: endedByName || 'Interviewer',
      timestamp: new Date().toISOString()
    });
  });

  // 8. Disconnect
  socket.on('disconnect', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-left', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName
      });
    }
  });
});

// Fallback to index.html for SPA client-side routing on page reload
app.get('*', (req, res) => {
  const distIndexHtml = path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(distIndexHtml, (err) => {
    if (err) {
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

const isMain = process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1] || process.argv[1].endsWith('backend/index.js') || process.argv[1].endsWith('index.js'));
if (isMain && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 CampusHire AI Backend Server running with WebRTC Signaling Hub at http://localhost:${PORT}`);
  });
}

export default app;

