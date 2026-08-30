import assert from 'assert';
import db, { initDatabase } from '../db/index.js';

console.log('🧪 Testing Master Database Explorer, Login History & User Signups...');

// Ensure DB is initialized
initDatabase();

// 1. Test Tables List
const rawTables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
    AND name NOT LIKE 'sqlite_%' 
    AND name NOT LIKE 'users_temp%'
    AND name NOT LIKE 'users_migrated%'
  ORDER BY name ASC
`).all();

assert(rawTables.length > 5, 'Must have multiple database tables');
console.log(`✅ [1/5] Found ${rawTables.length} SQLite tables in database.`);

// 2. Test User Table Structure & Row Count
const usersCount = db.prepare("SELECT count(*) as c FROM users").get()?.c || 0;
assert(usersCount > 0, 'Users table must have records');
console.log(`✅ [2/5] Users table row count verified: ${usersCount} users.`);

// 3. Test PRAGMA columns info
const userCols = db.prepare("PRAGMA table_info('users')").all();
const colNames = userCols.map(c => c.name);
assert(colNames.includes('id') && colNames.includes('email') && colNames.includes('role'), 'Users table must have required columns');
console.log(`✅ [3/5] Users table columns verified: [${colNames.join(', ')}]`);

// 4. Test Unified Signups Aggregation
const signups = db.prepare(`
  SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.created_at,
    COALESCE(s.name, c.company_name, f.name, a.name, sec.name, 'Registered User') as name
  FROM users u
  LEFT JOIN student_profiles s ON u.id = s.user_id
  LEFT JOIN company_profiles c ON u.id = c.user_id
  LEFT JOIN faculty_profiles f ON u.id = f.user_id
  LEFT JOIN alumni_profiles a ON u.id = a.user_id
  LEFT JOIN security_staff_profiles sec ON u.id = sec.user_id
  ORDER BY u.created_at DESC
  LIMIT 10
`).all();

assert(signups.length > 0, 'Signups query must return records');
console.log(`✅ [4/5] Unified signups query successful: Retrieved ${signups.length} preview records.`);

// 5. Test Login History Stats
const totalLogins = db.prepare("SELECT count(*) as c FROM user_login_history").get()?.c || 0;
console.log(`✅ [5/5] Login history table verified: ${totalLogins} persistent login events recorded.`);

console.log('🎉 ALL DATABASE EXPLORER & SIGNUPS TEST CASES PASSED!');
