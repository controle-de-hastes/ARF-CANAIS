
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['servers', 'plans', 'customers', 'renewals', 'manual_additions', 'settings', 'profiles'];
  
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error checking ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Columns for ${table}:`, Object.keys(data[0]).join(', '));
      if ('user_id' in data[0]) {
        console.log(`  [OK] user_id exists in ${table}`);
      } else {
        console.log(`  [MISSING] user_id NOT FOUND in ${table}`);
      }
    } else {
      console.log(`No records found in ${table} to check columns.`);
    }
  }
}

check().catch(console.error);
