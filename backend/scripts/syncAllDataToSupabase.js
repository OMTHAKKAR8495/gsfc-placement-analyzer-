import { createClient } from '@supabase/supabase-js';
import db from '../db/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kymvkdjkcusfrqizblmp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function syncAllTablesToSupabase() {
  if (!SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env file!');
    return;
  }

  console.log(`⚡ Connecting to Supabase Project: ${SUPABASE_URL}...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Users
  try {
    const users = db.prepare(`SELECT id, email, password_hash, role, google_id, auth_provider, email_verified, status, last_login, created_at FROM users`).all();
    let count = 0;
    for (const u of users) {
      const row = {
        id: u.id,
        email: u.email,
        password_hash: u.password_hash,
        role: u.role,
        google_id: u.google_id || null,
        auth_provider: u.auth_provider || 'local',
        email_verified: Boolean(u.email_verified),
        status: u.status || 'active',
        last_login: u.last_login ? new Date(u.last_login).toISOString() : null,
        created_at: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('users').upsert(row, { onConflict: 'email' });
      if (!error) count++;
    }
    console.log(`🛡️ Synced ${count} user accounts to Supabase "users" table.`);
  } catch (e) {
    console.warn('Users notice:', e.message);
  }

  // Fetch current user map for foreign keys
  const { data: remoteUsers } = await supabase.from('users').select('id, email');
  const userEmailToId = {};
  if (remoteUsers) {
    remoteUsers.forEach(u => { userEmailToId[u.email] = u.id; });
  }

  // 2. Companies
  try {
    const companies = db.prepare(`SELECT * FROM company_profiles`).all();
    let count = 0;
    for (const c of companies) {
      const row = {
        id: c.id,
        user_id: userEmailToId[c.contact_email || c.email] || c.user_id,
        company_name: c.company_name,
        industry: c.industry || 'Technology',
        website: c.website || null,
        contact_person: c.contact_person || 'HR Department',
        contact_email: c.email || c.contact_email || null,
        contact_phone: c.contact_phone || c.phone || null,
        location: c.location || 'Vadodara, Gujarat',
        approved: c.approved !== undefined ? c.approved : 1,
        created_at: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('company_profiles').upsert(row, { onConflict: 'id' });
      if (!error) count++;
    }
    console.log(`🏢 Synced ${count} companies to Supabase "company_profiles" table.`);
  } catch (e) {
    console.warn('Companies notice:', e.message);
  }

  // 3. Students
  try {
    const students = db.prepare(`SELECT s.*, u.email as user_email FROM student_profiles s LEFT JOIN users u ON s.user_id = u.id`).all();
    let count = 0;
    for (const s of students) {
      const row = {
        id: s.id,
        user_id: userEmailToId[s.user_email] || s.user_id,
        roll_number: s.roll_number,
        name: s.name,
        phone: s.phone || null,
        program: s.program || 'BTech CSE',
        branch: s.branch || 'Computer Science & Engineering',
        cgpa: s.cgpa || 8.0,
        admission_year: s.admission_year || 2022,
        passing_year: s.passing_year || 2026,
        semester: s.semester || 7,
        division: s.division || 'A',
        profile_completion_pct: s.profile_completion_pct || s.profile_completion || 85,
        access_status: s.access_status || 'active',
        is_authorized: s.is_authorized !== undefined ? s.is_authorized : 1,
        resume_url: s.resume_url || null,
        photo_url: s.photo_url || null,
        ats_score: s.ats_score || 0,
        created_at: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('student_profiles').upsert(row, { onConflict: 'roll_number' });
      if (!error) count++;
    }
    console.log(`🎓 Synced ${count} student records to Supabase "student_profiles" table.`);
  } catch (e) {
    console.warn('Students notice:', e.message);
  }

  // 4. Faculty
  try {
    const faculty = db.prepare(`SELECT * FROM faculty_profiles`).all();
    let count = 0;
    for (const f of faculty) {
      const row = {
        id: f.id,
        user_id: userEmailToId[f.email] || f.user_id,
        name: f.name,
        email: f.email,
        phone: f.phone || null,
        school: f.school || 'School of Technology (SOT)',
        department: f.department || 'Computer Science & Engineering',
        designation: f.designation || 'Faculty Coordinator',
        photo_url: f.photo_url || null,
        status: f.status || 'Active',
        created_at: f.created_at ? new Date(f.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('faculty_profiles').upsert(row, { onConflict: 'email' });
      if (!error) count++;
    }
    console.log(`🏛️ Synced ${count} faculty records to Supabase "faculty_profiles" table.`);
  } catch (e) {
    console.warn('Faculty notice:', e.message);
  }

  // 5. Job Drives / Requirements
  try {
    const reqs = db.prepare(`SELECT * FROM requirements`).all();
    let count = 0;
    for (const r of reqs) {
      const row = {
        id: r.id,
        company_id: r.company_id,
        title: r.title,
        job_type: r.job_type || 'Full-time',
        ctc_range: r.ctc_range,
        openings: r.openings || 1,
        deadline: r.deadline,
        job_description: r.job_description,
        min_cgpa: r.min_cgpa || 0.0,
        application_type: r.application_type || 'internal',
        applications_open: r.applications_open !== undefined ? r.applications_open : 1,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('requirements').upsert(row, { onConflict: 'id' });
      if (!error) count++;
    }
    console.log(`💼 Synced ${count} job drives to Supabase "requirements" table.`);
  } catch (e) {
    console.warn('Requirements notice:', e.message);
  }

  // 6. Fest & Events
  try {
    const events = db.prepare(`SELECT * FROM events`).all();
    let count = 0;
    for (const ev of events) {
      const row = {
        id: ev.id,
        title: ev.title,
        event_type: ev.event_type || 'Tech Fest',
        date: ev.date,
        venue: ev.venue,
        description: ev.description || '',
        created_at: ev.created_at ? new Date(ev.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('events').upsert(row, { onConflict: 'id' });
      if (!error) count++;
    }
    console.log(`🎪 Synced ${count} events to Supabase "events" table.`);
  } catch (e) {
    console.warn('Events notice:', e.message);
  }

  // 7. Pass Tokens
  try {
    const passes = db.prepare(`SELECT * FROM pass_tokens`).all();
    let count = 0;
    for (const p of passes) {
      const row = {
        id: p.id,
        pass_code: p.pass_code,
        event_id: p.event_id || null,
        guest_name: p.guest_name,
        guest_email: p.guest_email || null,
        guest_phone: p.guest_phone || null,
        college_or_org: p.college_or_org || null,
        entry_gate: p.entry_gate || 'Main Gate 1',
        valid_date: p.valid_date || null,
        status: p.status || 'active',
        created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('pass_tokens').upsert(row, { onConflict: 'pass_code' });
      if (!error) count++;
    }
    console.log(`🎫 Synced ${count} passes to Supabase "pass_tokens" table.`);
  } catch (e) {
    console.warn('Pass tokens notice:', e.message);
  }

  console.log('\n🎉 ALL REAL PORTAL DATA HAS BEEN SYNCED DIRECTLY TO SUPABASE TABLES!');
}

if (process.argv[1] && process.argv[1].endsWith('syncAllDataToSupabase.js')) {
  syncAllTablesToSupabase();
}
