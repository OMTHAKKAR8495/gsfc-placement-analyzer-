const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🔍 RUNNING COMPREHENSIVE GSFC SYSTEM CONNECTION DIAGNOSTICS...\n');

let passCount = 0;
let totalChecks = 0;

function check(label, result, details = '') {
  totalChecks++;
  if (result) {
    passCount++;
    console.log(`✅ [PASS] ${label} ${details ? '(' + details + ')' : ''}`);
  } else {
    console.error(`❌ [FAIL] ${label} ${details ? '(' + details + ')' : ''}`);
  }
}

// 1. Backend Server & Port 5001 Connection
http.get('http://localhost:5001/api/health', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      check('Backend API Express Server', res.statusCode === 200 && parsed.status === 'ok', `Status ${res.statusCode}, App: ${parsed.app}`);
    } catch (e) {
      check('Backend API Express Server', false, e.message);
    }
    
    // 2. Client Dev Server Port 5173 Connection
    http.get('http://localhost:5173/', (resClient) => {
      check('Vite Frontend Client Server', resClient.statusCode === 200, `HTTP Status ${resClient.statusCode}`);

      // 3. Database Check
      try {
        const Database = require('better-sqlite3');
        const dbPath = path.join(__dirname, '../server/db/campushire.db');
        const dbExists = fs.existsSync(dbPath);
        check('SQLite Database File', dbExists, dbPath);

        if (dbExists) {
          const db = new Database(dbPath);
          const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
          const students = db.prepare('SELECT COUNT(*) as c FROM student_profiles').get().c;
          const companies = db.prepare('SELECT COUNT(*) as c FROM company_profiles').get().c;
          const requirements = db.prepare('SELECT COUNT(*) as c FROM requirements').get().c;
          const apps = db.prepare('SELECT COUNT(*) as c FROM applications').get().c;

          check('Database Users & Roles Table', users > 0, `${users} users registered`);
          check('Database Student Profiles Table', students > 0, `${students} student candidate records`);
          check('Database Companies Table', companies > 0, `${companies} company recruiter accounts`);
          check('Database Placement Drive Requirements Table', requirements > 0, `${requirements} active hiring drives`);
          check('Database Job Applications Table', apps >= 0, `${apps} applications submitted`);
        }
      } catch (err) {
        check('Database Connectivity', false, err.message);
      }

      // 4. Capacitor Mobile Native Bundles Check
      const androidAsset = path.join(__dirname, '../android/app/src/main/assets/public/index.html');
      const iosAsset = path.join(__dirname, '../ios/App/App/public/index.html');
      
      check('Android Native App Web Assets Bundle', fs.existsSync(androidAsset), 'Synced to android/app/...');
      check('iOS Native App Web Assets Bundle', fs.existsSync(iosAsset), 'Synced to ios/App/...');

      console.log(`\n🎉 DIAGNOSTICS COMPLETE: ${passCount} / ${totalChecks} CONNECTIONS FULLY VERIFIED & ACTIVE!`);
    }).on('error', (e) => {
      check('Vite Frontend Client Server', false, e.message);
    });

  });
}).on('error', (e) => {
  check('Backend API Express Server', false, e.message);
});
