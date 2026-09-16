#!/usr/bin/env node
/**
 * ==============================================================================
 * GSFC UNIVERSITY PLACEMENT MANAGEMENT PORTAL
 * AUTOMATED & SCHEDULED ATOMIC DATABASE BACKUP UTILITY
 * ==============================================================================
 * Usage:
 *   1. Single Snapshot:
 *      node backend/scripts/backupDatabase.js
 *
 *   2. Scheduled Daemon (e.g. every 12 hours):
 *      BACKUP_INTERVAL_HOURS=12 node backend/scripts/backupDatabase.js --daemon
 *
 * Render Production Setup:
 *   Add a Render Cron Job:
 *   - Name: gsfc-db-backup
 *   - Schedule: 0 2 * * * (Daily at 02:00 AM UTC)
 *   - Command: node backend/scripts/backupDatabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || path.join(__dirname, '../db');
const sourceDbPath = path.join(dbDir, 'campushire.db');
const backupDir = process.env.BACKUP_DIR || path.join(dbDir, 'backups');
const MAX_BACKUPS_TO_KEEP = Number(process.env.MAX_BACKUPS_RETAINED) || 14;

export async function performAtomicBackup() {
  if (!fs.existsSync(sourceDbPath)) {
    console.warn(`⚠️ [Database Backup]: Source database does not exist at: ${sourceDbPath}`);
    return null;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = path.join(backupDir, `campushire_backup_${timestamp}.db`);
  const latestFile = path.join(backupDir, `campushire_backup_latest.db`);

  console.log(`📦 [Database Backup]: Initiating online atomic backup from ${sourceDbPath}...`);

  const db = new Database(sourceDbPath);
  try {
    // Online atomic backup (safe even during concurrent WAL writes)
    await db.backup(targetFile);
    fs.copyFileSync(targetFile, latestFile);
    
    console.log(`✅ [Database Backup]: Atomic snapshot completed successfully:\n   -> ${targetFile}\n   -> ${latestFile}`);

    // Automatic Retention Rotation (Clean old backups beyond MAX_BACKUPS_TO_KEEP)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('campushire_backup_20') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS_TO_KEEP) {
      const toDelete = files.slice(MAX_BACKUPS_TO_KEEP);
      for (const item of toDelete) {
        fs.unlinkSync(path.join(backupDir, item.name));
        console.log(`   🗑️ Purged aged backup: ${item.name}`);
      }
    }

    return targetFile;
  } catch (err) {
    console.error('❌ [Database Backup Error]:', err.message);
    throw err;
  } finally {
    db.close();
  }
}

// CLI Execution & Daemon Runner
const isDirectRun = process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1] || process.argv[1].endsWith('backupDatabase.js'));

if (isDirectRun) {
  const isDaemon = process.argv.includes('--daemon') || process.argv.includes('-d');
  const intervalHours = Number(process.env.BACKUP_INTERVAL_HOURS) || 12;

  performAtomicBackup().then(() => {
    if (isDaemon) {
      console.log(`⏰ [Database Backup Daemon]: Active. Scheduled to run every ${intervalHours} hours.`);
      setInterval(() => {
        performAtomicBackup().catch(e => console.error('Daemon backup cycle error:', e.message));
      }, intervalHours * 60 * 60 * 1000);
    }
  }).catch((err) => {
    console.error('Backup script failed:', err);
    process.exit(1);
  });
}
