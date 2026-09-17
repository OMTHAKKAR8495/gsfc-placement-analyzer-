import express from 'express';
import db, { getPoolStats } from '../db/index.js';
import os from 'os';

const router = express.Router();
const startTime = Date.now();

/**
 * Liveness Probe: GET /api/health
 */
router.get('/', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();
  const poolStats = getPoolStats();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    service: 'GSFC University Placement Portal & AI Career Suite',
    version: '2.0.0-enterprise',
    environment: process.env.NODE_ENV || 'development',
    databasePool: {
      activeConnections: poolStats.totalCount - poolStats.idleCount,
      idleConnections: poolStats.idleCount,
      totalConnections: poolStats.totalCount,
      waitingRequests: poolStats.waitingCount,
      maxAllowed: poolStats.maxConnections
    },
    memoryUsageMB: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
      external: Math.round(mem.external / (1024 * 1024))
    }
  });
});

/**
 * Readiness Probe: GET /api/health/ready (Deep diagnostic)
 */
router.get('/ready', async (req, res) => {
  const mem = process.memoryUsage();
  const poolStats = getPoolStats();

  const checks = {
    database: 'down',
    memoryStatus: 'healthy',
    systemLoad: os.loadavg()[0],
    freeSystemMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
    totalSystemMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
    processMemoryMB: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heapUsed: Math.round(mem.heapUsed / (1024 * 1024))
    },
    databasePool: poolStats
  };

  try {
    const row = await db.prepare('SELECT 1 as test').get();
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
