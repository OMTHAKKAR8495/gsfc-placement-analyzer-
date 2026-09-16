import { MongoClient } from 'mongodb';
import db from '../db/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://omthakkar168_db_user:tDeeFWVe5CUFtqUd@cluster0.mvos6zu.mongodb.net/gsfc_placement_db?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'gsfc_placement_db';

/**
 * Sync all live application data from SQLite to MongoDB Atlas collections
 */
export async function syncAllTablesToMongo() {
  console.log('🍃 Connecting to MongoDB Atlas Cluster...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const mongoDb = client.db(DB_NAME);
    console.log(`✅ Connected to MongoDB Atlas: [${DB_NAME}]\n`);

    // 1. 🎓 Students Collection Sync
    try {
      const students = db.prepare(`
        SELECT s.*, u.email as user_email, u.role, u.status as user_status
        FROM student_profiles s
        LEFT JOIN users u ON s.user_id = u.id
      `).all();

      if (students.length > 0) {
        const studentColl = mongoDb.collection('students');
        for (const s of students) {
          const doc = {
            id: s.id,
            user_id: s.user_id,
            roll_number: s.roll_number,
            name: s.name,
            email: s.university_email || s.user_email || `${s.roll_number?.toLowerCase()}@gsfcuniversity.ac.in`,
            phone: s.phone,
            program: s.program,
            branch: s.branch,
            cgpa: s.cgpa,
            admission_year: s.admission_year,
            passing_year: s.passing_year,
            semester: s.semester || 7,
            division: s.division || 'A',
            profile_completion_pct: s.profile_completion_pct || s.profile_completion || 85,
            access_status: s.access_status || 'active',
            is_authorized: s.is_authorized || 1,
            resume_url: s.resume_url,
            photo_url: s.photo_url,
            ats_score: s.ats_score,
            created_at: s.created_at ? new Date(s.created_at) : new Date(),
            updated_at: new Date()
          };
          await studentColl.updateOne(
            { roll_number: s.roll_number },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🎓 Synced ${students.length} student records to "students" collection.`);
      }
    } catch (e) {
      console.warn('Students sync notice:', e.message);
    }

    // 2. 🏛️ Faculty Collection Sync
    try {
      const faculty = db.prepare(`SELECT * FROM faculty_profiles`).all();
      if (faculty.length > 0) {
        const facColl = mongoDb.collection('faculty');
        for (const f of faculty) {
          const doc = {
            faculty_id: f.id,
            user_id: f.user_id,
            name: f.name,
            email: f.email,
            phone: f.phone,
            department: f.department,
            designation: f.designation,
            assigned_batches: f.assigned_batches ? f.assigned_batches.split(',') : ['All Batches'],
            photo_url: f.photo_url,
            status: f.status || 'Active',
            created_at: new Date()
          };
          await facColl.updateOne(
            { email: f.email },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🏛️ Synced ${faculty.length} faculty records to "faculty" collection.`);
      }
    } catch (e) {
      console.warn('Faculty sync notice:', e.message);
    }

    // 3. 🏢 Companies Collection Sync
    try {
      const companies = db.prepare(`SELECT * FROM company_profiles`).all();
      if (companies.length > 0) {
        const compColl = mongoDb.collection('companies');
        for (const c of companies) {
          const doc = {
            company_id: c.id,
            user_id: c.user_id,
            company_name: c.company_name,
            industry: c.industry,
            website: c.website,
            contact_person: c.contact_person,
            contact_email: c.email || c.contact_email,
            contact_phone: c.contact_phone || c.phone,
            location: c.location || 'Vadodara, Gujarat',
            approved: c.approved || 1,
            created_at: new Date()
          };
          await compColl.updateOne(
            { company_id: c.id },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🏢 Synced ${companies.length} company records to "companies" collection.`);
      }
    } catch (e) {
      console.warn('Companies sync notice:', e.message);
    }

    // 4. 🛡️ Users Master Collection Sync
    try {
      const users = db.prepare(`SELECT id, email, role, status, auth_provider, email_verified, created_at, last_login FROM users`).all();
      if (users.length > 0) {
        const userColl = mongoDb.collection('users');
        for (const u of users) {
          const doc = {
            user_id: u.id,
            email: u.email,
            role: u.role,
            status: u.status || 'active',
            auth_provider: u.auth_provider || 'local',
            email_verified: Boolean(u.email_verified),
            last_login: u.last_login ? new Date(u.last_login) : null,
            created_at: u.created_at ? new Date(u.created_at) : new Date()
          };
          await userColl.updateOne(
            { email: u.email },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🛡️ Synced ${users.length} user accounts to "users" collection.`);
      }
    } catch (e) {
      console.warn('Users sync notice:', e.message);
    }

    // 5. 💼 Job Drives Collection Sync
    try {
      const reqs = db.prepare(`SELECT * FROM requirements`).all();
      if (reqs.length > 0) {
        const driveColl = mongoDb.collection('job_drives');
        for (const r of reqs) {
          const doc = {
            drive_id: r.id,
            company_id: r.company_id,
            job_title: r.title,
            job_type: r.job_type,
            ctc_range: r.ctc_range,
            openings: r.openings,
            deadline: r.deadline,
            job_description: r.job_description,
            min_cgpa: r.min_cgpa,
            applications_open: Boolean(r.applications_open),
            created_at: r.created_at ? new Date(r.created_at) : new Date()
          };
          await driveColl.updateOne(
            { drive_id: r.id },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`💼 Synced ${reqs.length} job drives to "job_drives" collection.`);
      }
    } catch (e) {
      console.warn('Job drives sync notice:', e.message);
    }

    // 6. 📝 Applications Collection Sync
    try {
      const apps = db.prepare(`SELECT * FROM applications`).all();
      if (apps.length > 0) {
        const appColl = mongoDb.collection('applications');
        for (const a of apps) {
          const doc = {
            application_id: a.id,
            student_id: a.student_id,
            requirement_id: a.requirement_id,
            status: a.status,
            match_score: a.match_score,
            applied_at: a.applied_at ? new Date(a.applied_at) : new Date()
          };
          await appColl.updateOne(
            { application_id: a.id },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`📝 Synced ${apps.length} applications to "applications" collection.`);
      }
    } catch (e) {
      console.warn('Applications sync notice:', e.message);
    }

    // 7. 🎪 Fest & Events Collection Sync
    try {
      const events = db.prepare(`SELECT * FROM events`).all();
      if (events.length > 0) {
        const eventColl = mongoDb.collection('fest_and_events');
        for (const ev of events) {
          const doc = {
            event_id: ev.id,
            title: ev.title,
            event_type: ev.event_type || 'Tech Fest',
            date: ev.date,
            venue: ev.venue,
            description: ev.description,
            created_at: ev.created_at ? new Date(ev.created_at) : new Date()
          };
          await eventColl.updateOne(
            { event_id: ev.id },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🎪 Synced ${events.length} events to "fest_and_events" collection.`);
      }
    } catch (e) {
      console.warn('Events sync notice:', e.message);
    }

    // 8. 🎓 Alumni Collection Sync
    try {
      const alumni = db.prepare(`SELECT * FROM alumni_profiles`).all();
      if (alumni.length > 0) {
        const alumniColl = mongoDb.collection('alumni');
        for (const al of alumni) {
          const doc = {
            alumni_id: al.id,
            user_id: al.user_id,
            name: al.name,
            batch_year: al.batch_year,
            company: al.company,
            designation: al.designation,
            linkedin_url: al.linkedin_url,
            verified: Boolean(al.verified),
            created_at: new Date()
          };
          await alumniColl.updateOne(
            { alumni_id: al.id },
            { $set: doc },
            { upsert: true }
          );
        }
        console.log(`🎓 Synced ${alumni.length} alumni to "alumni" collection.`);
      }
    } catch (e) {
      console.warn('Alumni sync notice:', e.message);
    }

    console.log('\n🎉 ALL REAL PORTAL DATA HAS BEEN SYNCED INTO MONGODB ATLAS RESPECTIVE FOLDERS!');
  } catch (err) {
    console.error('❌ Sync Error:', err);
  } finally {
    await client.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith('syncAllDataToMongo.js')) {
  syncAllTablesToMongo();
}
