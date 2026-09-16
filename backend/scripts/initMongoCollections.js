import { MongoClient } from 'mongodb';
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
 * All Organized MongoDB Collections ("Folders / Tables")
 */
const COLLECTIONS_SCHEMA = [
  // 1. 🎓 Student Candidates & Placement Portfolio
  {
    name: 'students',
    description: 'Student candidates, enrollment credentials, academic records, and career preferences',
    indexes: [
      { key: { roll_number: 1 }, unique: true },
      { key: { email: 1 }, unique: true },
      { key: { passing_year: 1 } },
      { key: { branch: 1 } }
    ],
    sampleDoc: {
      roll_number: '24BT04171',
      email: '24bt04171@gsfcuniversity.ac.in',
      name: 'Om Thakkar',
      phone: '+91 95584 13347',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.85,
      admission_year: 2022,
      passing_year: 2026,
      semester: 7,
      division: 'A',
      profile_completion_pct: 92,
      target_career_stream: 'Software Engineering & AI Systems',
      access_status: 'active',
      is_authorized: 1,
      skills: ['React', 'Node.js', 'Python', 'AI/ML', 'MongoDB', 'Cloud DevOps'],
      created_at: new Date()
    }
  },

  // 2. 🏛️ Faculty Placement Coordinators & Mentors
  {
    name: 'faculty',
    description: 'Faculty coordinators, academic departments, batch assignments, and approvals',
    indexes: [
      { key: { email: 1 }, unique: true },
      { key: { department: 1 } }
    ],
    sampleDoc: {
      faculty_id: 'f_neeshu_01',
      name: 'Dr. Neeshu Chaudhary',
      email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
      phone: '+91 95584 13347',
      school: 'School of Technology (SOT)',
      department: 'School of Technology — Computer Science & Engineering',
      designation: 'Faculty Placement Coordinator & Assistant Professor',
      assigned_batches: ['BTech CSE (2022-2026)', 'BTech IT (2023-2027)'],
      status: 'active',
      created_at: new Date()
    }
  },

  // 3. 🎪 Campus Fest, Events & Visitor Guest Passes
  {
    name: 'fest_and_events',
    description: 'Campus fest attendees, visitor entry passes, event schedules, and security verification',
    indexes: [
      { key: { pass_code: 1 }, unique: true },
      { key: { guest_email: 1 } },
      { key: { event_name: 1 } },
      { key: { status: 1 } }
    ],
    sampleDoc: {
      pass_code: 'FEST-GSFC-2026-001',
      event_name: 'Anvesh Tech Fest & Innovation Summit 2026',
      guest_name: 'Fest Visitor Guest',
      guest_email: 'fest.guest@gsfcuniversity.ac.in',
      guest_phone: '+91 98765 43210',
      college_or_org: 'GSFC University Campus',
      entry_gate: 'Main Gate 1 & 2',
      valid_date: '2026-09-20',
      pass_status: 'Active / Verified',
      scanned_at_gate: false,
      created_at: new Date()
    }
  },

  // 4. 🏢 Corporate Recruitment Partners & Industry Companies
  {
    name: 'companies',
    description: 'Corporate recruiters, company profiles, HR contacts, industry domains, and approvals',
    indexes: [
      { key: { company_name: 1 } },
      { key: { contact_email: 1 }, unique: true },
      { key: { industry: 1 } }
    ],
    sampleDoc: {
      company_id: 'comp_gsfc_ltd',
      company_name: 'Gujarat State Fertilizers & Chemicals Ltd (GSFC)',
      industry: 'Chemicals, Petrochemicals & Industrial Materials',
      website: 'https://gsfclimited.com',
      contact_person: 'HR Recruitment Team',
      contact_email: 'recruiter.gsfc@gsfcuniversity.ac.in',
      contact_phone: '+91 265 2240240',
      location: 'Vadodara, Gujarat, India',
      verification_status: 'Approved & Verified Institutional Partner',
      tier: 'Tier-1 Core Partner',
      created_at: new Date()
    }
  },

  // 5. 💼 Placement Drives, Job Requirements & Internships
  {
    name: 'job_drives',
    description: 'Live placement drives, internship openings, CTC packages, eligibility, and deadlines',
    indexes: [
      { key: { company_id: 1 } },
      { key: { status: 1 } },
      { key: { deadline: 1 } }
    ],
    sampleDoc: {
      drive_id: 'drive_tcs_digital_2026',
      company_name: 'Tata Consultancy Services (TCS)',
      job_title: 'Digital Systems Engineer & Cloud Developer',
      job_type: 'Full-time / On-Campus Drive',
      ctc_range: '7.5 LPA - 11.0 LPA',
      eligible_branches: ['Computer Science & Engineering', 'Chemical Engineering', 'Mechanical Engineering'],
      min_cgpa: 7.0,
      openings: 25,
      drive_date: '2026-10-15',
      deadline: '2026-10-05',
      drive_status: 'Applications Open',
      job_description: 'Full-stack software engineering, AI deployment, cloud automation.',
      created_at: new Date()
    }
  },

  // 6. 📝 Student Job Applications & Selection Tracking
  {
    name: 'applications',
    description: 'Student applications submitted for campus placement drives and interview stages',
    indexes: [
      { key: { student_id: 1 } },
      { key: { drive_id: 1 } },
      { key: { student_id: 1, drive_id: 1 }, unique: true },
      { key: { status: 1 } }
    ],
    sampleDoc: {
      application_id: 'app_24bt04171_01',
      student_id: '24BT04171',
      student_name: 'Om Thakkar',
      student_email: '24bt04171@gsfcuniversity.ac.in',
      drive_id: 'drive_tcs_digital_2026',
      company_name: 'Tata Consultancy Services (TCS)',
      job_title: 'Digital Systems Engineer & Cloud Developer',
      ats_score: 92,
      status: 'Shortlisted for Technical Interview',
      rounds_completed: ['Online Aptitude Test (Cleared)'],
      current_round: 'Technical Interview Round 1',
      applied_at: new Date()
    }
  },

  // 7. 🛡️ User Authentication & System Roles Master
  {
    name: 'users',
    description: 'System-wide user accounts across all roles (Student, Faculty, Company, Admin, Alumni, Security, Fest)',
    indexes: [
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } }
    ],
    sampleDoc: {
      email: 'omthakkar168@gsfcuniversity.ac.in',
      role: 'student',
      auth_provider: 'google_and_local',
      email_verified: true,
      status: 'active',
      last_login_at: new Date(),
      created_at: new Date()
    }
  },

  // 8. 🎓 Alumni Mentors & Career Network
  {
    name: 'alumni',
    description: 'GSFC University alumni mentors, current corporate companies, and 1-on-1 mentorship slots',
    indexes: [
      { key: { email: 1 }, unique: true },
      { key: { batch_year: 1 } },
      { key: { current_company: 1 } }
    ],
    sampleDoc: {
      alumni_id: 'alumni_01',
      name: 'GSFC Alumni Mentor',
      email: 'alumni.mentor@gmail.com',
      batch_year: '2020-2024',
      current_company: 'Google Cloud / Microsoft',
      designation: 'Senior Cloud Solutions Architect',
      skills_mentored: ['Cloud Architecture', 'System Design', 'Interview Strategies'],
      verified: true,
      created_at: new Date()
    }
  },

  // 9. 🛡️ Campus Security Desk & Gate Check-in Logs
  {
    name: 'security_desk',
    description: 'Gate entry logs, QR code badge scans for drives and campus events',
    indexes: [
      { key: { gate_number: 1 } },
      { key: { entry_timestamp: 1 } }
    ],
    sampleDoc: {
      scan_id: 'gate_scan_1001',
      gate_number: 'Gate 1 (Main Entrance)',
      visitor_name: 'Om Thakkar',
      visitor_type: 'Student Candidate',
      event_or_drive: 'TCS Placement Drive',
      verification_status: 'QR Verified Access Granted',
      entry_timestamp: new Date()
    }
  },

  // 10. 📬 System Notifications & Mailbox Logs
  {
    name: 'notifications',
    description: 'Welcome messages, credentials notifications, drive alerts, and interview invites',
    indexes: [
      { key: { recipient_email: 1 } },
      { key: { is_read: 1 } },
      { key: { created_at: 1 } }
    ],
    sampleDoc: {
      notification_id: 'notif_welcome_01',
      recipient_email: '24bt04171@gsfcuniversity.ac.in',
      type: 'welcome_credentials',
      title: '🎓 Welcome to GSFC University Digital Campus System',
      message: 'Your official placement account credentials have been provisioned.',
      is_read: false,
      created_at: new Date()
    }
  }
];

export async function initializeMongoDatabase() {
  console.log('🍃 Connecting to MongoDB Atlas Cluster...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`✅ Connected to MongoDB Atlas! Initializing database: [${DB_NAME}]...\n`);
    const db = client.db(DB_NAME);

    // Get existing collections in this database
    const existingColls = (await db.listCollections().toArray()).map(c => c.name);

    for (const schema of COLLECTIONS_SCHEMA) {
      console.log(`📁 Provisioning Collection Folder: [${schema.name}]`);
      console.log(`   Description: ${schema.description}`);

      // Create collection if not exists
      if (!existingColls.includes(schema.name)) {
        await db.createCollection(schema.name);
        console.log(`   ✨ Created new collection: "${schema.name}"`);
      } else {
        console.log(`   ✓ Collection "${schema.name}" already exists.`);
      }


      if (count === 0 && schema.sampleDoc) {
        await collection.insertOne(schema.sampleDoc);
        console.log(`   📄 Inserted initial seed document.`);
      } else {
        console.log(`   📊 Existing documents count: ${count}`);
      }
      console.log('');
    }

    console.log('🎉 ALL MONGODB ATLAS COLLECTIONS ("FOLDERS") INITIALIZED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error initializing MongoDB collections:', err);
  } finally {
    await client.close();
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('initMongoCollections.js')) {
  initializeMongoDatabase();
}
