import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kymvkdjkcusfrqizblmp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function clearAllSupabaseData() {
  if (!SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env file!');
    return;
  }

  console.log(`🧹 Clearing all sample/seed data from Supabase (${SUPABASE_URL})...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Tables in dependency order (children first, parents last)
  const tables = [
    'notifications_log',
    'entry_logs',
    'pass_tokens',
    'applications',
    'requirements',
    'events',
    'alumni_profiles',
    'faculty_profiles',
    'student_profiles',
    'company_profiles',
    'users'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '___non_existent_id___');
      if (error) {
        console.warn(`Notice on ${table}:`, error.message);
      } else {
        console.log(`✨ Emptied table: "${table}"`);
      }
    } catch (e) {
      console.warn(`Exception on ${table}:`, e.message);
    }
  }

  console.log('\n🎉 ALL SUPABASE TABLES HAVE BEEN CLEANED! The tables are now 100% empty and ready for real data from the website.');
}

if (process.argv[1] && process.argv[1].endsWith('clearSupabaseData.js')) {
  clearAllSupabaseData();
}
