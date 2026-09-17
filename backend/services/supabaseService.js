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

let supabase = null;

export async function getSupabaseClient() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
  return supabase;
}

/**
 * Sync / Upsert a record directly into a Supabase table
 */
export async function syncToSupabase(tableName, record, onConflict = 'id') {
  try {
    const client = getSupabaseClient();
    if (!client) return false;

    const { data, error } = await client
      .from(tableName)
      .upsert(record, { onConflict });

    if (error) {
      console.warn(`⚠️ [Supabase Sync] (${tableName}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`⚠️ [Supabase Sync] Exception (${tableName}):`, err.message);
    return false;
  }
}

export default {
  getSupabaseClient,
  syncToSupabase,
};
