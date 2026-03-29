/**
 * clearQuizSets.js
 * Deletes ALL rows from quiz_sets table.
 * Requires VITE_SUPABASE_SERVICE_KEY in .env.local (service role key, NOT anon key)
 * OR use the fallback SQL in Supabase Dashboard SQL Editor.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer service role key for DELETE; anon key won't have permission
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Prompt user for confirmation
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
  '\n⚠️  WARNING: This will DELETE ALL rows from quiz_sets (all ~102 seeded chapters).\n' +
  '   Type "DELETE ALL" to confirm: ',
  async (answer) => {
    rl.close();
    if (answer.trim() !== 'DELETE ALL') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }

    console.log('\n🗑️  Deleting all rows from quiz_sets...');

    // Count first
    const { count: before } = await supabase
      .from('quiz_sets')
      .select('*', { count: 'exact', head: true });

    console.log(`   Found ${before ?? 'unknown'} rows.`);

    const { error } = await supabase
      .from('quiz_sets')
      .delete()
      .not('subject', 'is', null); // match ALL rows

    if (error) {
      console.error('\n❌ Delete failed:', error.message);
      console.log('\n💡 FALLBACK: Run this SQL in Supabase Dashboard → SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/_/sql');
      console.log('\n   DELETE FROM quiz_sets;\n');
      console.log('   Then run seedAllChapters.js\n');
    } else {
      console.log('✅ All quiz_sets rows deleted successfully!');
      console.log('\n▶  Now run: node src/scripts/seedAllChapters.js\n');
    }
  }
);
