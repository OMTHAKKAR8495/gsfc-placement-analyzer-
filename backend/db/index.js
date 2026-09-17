import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('FATAL: DATABASE_URL (or SUPABASE_DB_URL) is not set in environment. Refusing to boot without Supabase Postgres connection.');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.PG_MAX_CONNECTIONS || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('⚠️ [Postgres Pool Error]:', err.message);
});

/**
 * Automatically transform SQLite query syntax to PostgreSQL syntax:
 * 1. Convert ? placeholders to $1, $2, $3...
 * 2. Convert datetime('now', ...) / datetime('now') to PostgreSQL now() / now() +/- INTERVAL
 * 3. Convert DATETIME type to TIMESTAMPTZ
 * 4. Convert INSERT OR IGNORE INTO to INSERT INTO ... ON CONFLICT DO NOTHING
 */
export function transformSqliteToPostgres(sql, params = []) {
  if (!sql) return { sql: '', params: [] };

  let convertedSql = sql;

  // Transform SQLite datetime('now', '-7 days') -> (now() - INTERVAL '7 days')
  convertedSql = convertedSql.replace(/datetime\('now',\s*'\+?(-?\d+)\s*days?'\)/gi, (match, days) => {
    const num = parseInt(days, 10);
    return num >= 0 ? `(now() + INTERVAL '${num} days')` : `(now() - INTERVAL '${Math.abs(num)} days')`;
  });

  convertedSql = convertedSql.replace(/datetime\('now',\s*'\+?(-?\d+)\s*minutes?'\)/gi, (match, mins) => {
    const num = parseInt(mins, 10);
    return num >= 0 ? `(now() + INTERVAL '${num} minutes')` : `(now() - INTERVAL '${Math.abs(num)} minutes')`;
  });

  convertedSql = convertedSql.replace(/datetime\('now',\s*'\+?(-?\d+)\s*hours?'\)/gi, (match, hrs) => {
    const num = parseInt(hrs, 10);
    return num >= 0 ? `(now() + INTERVAL '${num} hours')` : `(now() - INTERVAL '${Math.abs(num)} hours')`;
  });

  convertedSql = convertedSql.replace(/datetime\('now'\)/gi, 'now()');
  convertedSql = convertedSql.replace(/\bDATETIME\s+DEFAULT\s+CURRENT_TIMESTAMP\b/gi, 'TIMESTAMPTZ DEFAULT now()');
  convertedSql = convertedSql.replace(/\bDATETIME\b/gi, 'TIMESTAMPTZ');

  // Convert INSERT OR IGNORE INTO -> INSERT INTO ... ON CONFLICT DO NOTHING
  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(convertedSql)) {
    convertedSql = convertedSql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(convertedSql)) {
      convertedSql = convertedSql.trim().replace(/;?$/, '') + ' ON CONFLICT DO NOTHING';
    }
  }

  // Convert INSERT OR REPLACE INTO -> INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...
  if (/INSERT\s+OR\s+REPLACE\s+INTO/i.test(convertedSql)) {
    convertedSql = convertedSql.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(convertedSql)) {
      const colMatch = convertedSql.match(/INSERT\s+INTO\s+[\w.]+\s*\(([^)]+)\)/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map(c => c.trim().replace(/['"`]/g, ''));
        const conflictCol = cols[0];
        const updateSets = cols.slice(1).map(c => `${c} = EXCLUDED.${c}`).join(', ');
        if (updateSets) {
          convertedSql = convertedSql.trim().replace(/;?$/, '') + ` ON CONFLICT (${conflictCol}) DO UPDATE SET ${updateSets}`;
        } else {
          convertedSql = convertedSql.trim().replace(/;?$/, '') + ` ON CONFLICT (${conflictCol}) DO NOTHING`;
        }
      } else {
        convertedSql = convertedSql.trim().replace(/;?$/, '') + ' ON CONFLICT (id) DO NOTHING';
      }
    }
  }

  // Convert positional ? to $1, $2, $3...
  let paramIndex = 1;
  convertedSql = convertedSql.replace(/\?/g, () => `$${paramIndex++}`);

  // Flatten params if passed as array or multiple args
  const flattenedParams = Array.isArray(params) && params.length === 1 && Array.isArray(params[0]) 
    ? params[0] 
    : params;

  return { sql: convertedSql, params: flattenedParams };
}

/**
 * Helper to translate raw database pool errors into HTTP 503 errors under peak load
 */
function handleDbError(err, context = 'Query') {
  const isExhaustionOrTimeout = 
    err.code === '57P01' || // admin_shutdown
    err.code === '53300' || // too_many_connections
    err.code === 'ETIMEDOUT' ||
    err.message?.includes('timeout') ||
    err.message?.includes('Connection terminated') ||
    err.message?.includes('pool is full');

  if (isExhaustionOrTimeout) {
    const customErr = new Error('Database service is experiencing high concurrency. Please retry shortly.');
    customErr.statusCode = 503;
    customErr.status = 503;
    customErr.originalMessage = err.message;
    throw customErr;
  }
  throw err;
}

/**
 * Standard Async Adapter exposing .get(), .all(), .run(), .exec(), and .prepare()
 */
export const db = {
  /**
   * Fetch single row
   */
  async get(sql, ...params) {
    try {
      const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const { sql: pgSql, params: pgParams } = transformSqliteToPostgres(sql, p);
      const res = await pool.query(pgSql, pgParams);
      return res.rows[0] || null;
    } catch (err) {
      handleDbError(err, 'db.get');
    }
  },

  /**
   * Fetch all matching rows
   */
  async all(sql, ...params) {
    try {
      const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const { sql: pgSql, params: pgParams } = transformSqliteToPostgres(sql, p);
      const res = await pool.query(pgSql, pgParams);
      return res.rows || [];
    } catch (err) {
      handleDbError(err, 'db.all');
    }
  },

  /**
   * Execute INSERT/UPDATE/DELETE query
   */
  async run(sql, ...params) {
    try {
      const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const { sql: pgSql, params: pgParams } = transformSqliteToPostgres(sql, p);
      const res = await pool.query(pgSql, pgParams);
      return {
        changes: res.rowCount,
        rowCount: res.rowCount,
        rows: res.rows,
        lastInsertRowid: res.rows[0]?.id || res.rows[0]?.block_number || null,
      };
    } catch (err) {
      handleDbError(err, 'db.run');
    }
  },

  /**
   * Execute raw multi-statement SQL
   */
  async exec(sql) {
    try {
      const { sql: pgSql } = transformSqliteToPostgres(sql, []);
      return await pool.query(pgSql);
    } catch (err) {
      handleDbError(err, 'db.exec');
    }
  },

  /**
   * Prepare statement proxy (allows db.prepare(sql).get/all/run call pattern seamlessly)
   */
  prepare(sql) {
    return {
      get: async (...params) => db.get(sql, ...params),
      all: async (...params) => db.all(sql, ...params),
      run: async (...params) => db.run(sql, ...params),
    };
  },

  /**
   * Transaction helper
   */
  async transaction(fn) {
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      handleDbError(err, 'pool.connect');
    }
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      handleDbError(err, 'transaction');
    } finally {
      if (client) client.release();
    }
  }
};

export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: parseInt(process.env.PG_MAX_CONNECTIONS || '20', 10),
  };
}

export function initDatabase() {
  console.log('🍃 [Supabase Postgres]: Database connection layer initialized with connection pooling.');
}

export default db;
