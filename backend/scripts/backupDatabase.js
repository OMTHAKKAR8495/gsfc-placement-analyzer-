import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || path.join(__dirname, '../db');
const sourceDb = path.join(dbDir, 'campushire.db');
const backupDir = path.join(dbDir, 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetBackup = path.join(backupDir, `campushire_pre_cleanup_backup_${timestamp}.db`);
const targetStandard = path.join(backupDir, 'campushire_pre_cleanup_backup.db');

if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, targetBackup);
  fs.copyFileSync(sourceDb, targetStandard);
  console.log(`✅ [Database Backup]: Successfully created pre-cleanup snapshot at:\n   ${targetBackup}\n   ${targetStandard}`);
} else {
  console.warn(`⚠️ [Database Backup]: Source database ${sourceDb} does not exist yet.`);
}
