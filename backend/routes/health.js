import express from 'express';
import db from '../db/index.js';
import os from 'os';

const router = express.Router();
const startTime = Date.now();

/**
 * Liveness Probe: GET /api/health
 */
router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    service: 'GSFC University Placement Portal & AI Career Suite',
    version: '2.0.0-enterprise',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Readiness Probe: GET /api/health/ready (Deep diagnostic)
 */
router.get('/ready', (req, res) => {
  const checks = {
    database: 'down',
    memory: 'healthy',
    systemLoad: os.loadavg()[0],
    freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
    totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024))
  };

  try {
    const row = db.prepare('SELECT 1 as test').get();
    if (row && row.test === 1) {
      checks.database = 'connected';
    }
  } catch (err) {
    checks.database = `error: ${err.message}`;
  }

  const isReady = checks.database === 'connected';
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'unready',
    timestamp: new Date().toISOString(),
    checks
  });
});

export default router;
