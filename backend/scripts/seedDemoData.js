import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'campushire.db');

export function seedDemoEnvironment() {
  console.log('🌱 [Demo Mode]: Seeding test/showcase demo records into isolated database environment...');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  const passwordHash = bcrypt.hashSync('DemoPass@GSFC2026', 10);

  // 1. Demo Companies
  const companies = [
    {
      userId: 'u_comp_gsfc_demo',
      email: 'recruiter@gsfclimited.demo',
      companyId: 'c_gsfc_demo',
      name: 'GSFC Limited (Demo Recruiter)',
      industry: 'Chemicals, Fertilizers & Industrial Tech',
      website: 'https://gsfclimited.com',
      contactPhone: '+91 265 2240151',
      description: 'Fertilizers and industrial chemicals manufacturing partner with GSFC University.'
    },
    {
      userId: 'u_comp_cloud_demo',
      email: 'recruiter@cloudtech.demo',
      companyId: 'c_cloud_demo',
      name: 'CloudScale Technologies (Demo Partner)',
      industry: 'Enterprise Cloud & AI Solutions',
      website: 'https://cloudscale.example.com',
      contactPhone: '+91 98765 00001',
      description: 'Next-generation cloud infrastructure and distributed microservices hiring partner.'
    }
  ];

  for (const c of companies) {
    db.prepare(`INSERT OR REPLACE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'company')`).run(c.userId, c.email, passwordHash);
    db.prepare(`
      INSERT OR REPLACE INTO company_profiles 
      (id, user_id, company_name, industry, website, approved, contact_phone)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(c.companyId, c.userId, c.name, c.industry, c.website, c.contactPhone);
  }

  // 2. Demo Requirement
  db.prepare(`
    INSERT OR REPLACE INTO requirements 
    (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'req_demo_swe_1',
    'c_cloud_demo',
    'Graduate Software Engineer (Demo Drive)',
    JSON.stringify(['BTech CSE', 'BTech IT']),
    7.5,
    JSON.stringify(['Python', 'JavaScript', 'SQL', 'Data Structures']),
    JSON.stringify(['React', 'Node.js', 'Docker']),
    'Full-time',
    '₹8,00,000 - ₹12,00,000 PA',
    5,
    '2026-12-31',
    'Demonstration campus hiring drive for software engineering graduate trainees.'
  );

  console.log('✅ [Demo Mode]: Demo records seeded successfully.');
  db.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDemoEnvironment();
}
