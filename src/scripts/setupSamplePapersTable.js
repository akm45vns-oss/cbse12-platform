/**
 * Setup sample_papers table in Supabase
 * Run once to create the table structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("\n" + "═".repeat(80));
  console.log("🔧 SETTING UP SAMPLE_PAPERS TABLE");
  console.log("═".repeat(80) + "\n");

  try {
    // First check if table exists
    console.log("📋 Checking if table exists...");
    const { data: tableData, error: tableError } = await supabase
      .from('sample_papers')
      .select('id')
      .limit(1);

    if (!tableError) {
      console.log("✅ Table 'sample_papers' already exists!");
      return true;
    }

    // Table doesn't exist, create it using SQL
    console.log("📝 Creating table 'sample_papers'...");

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sample_papers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          subject text NOT NULL,
          set_number integer NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
          content text NOT NULL,
          total_marks integer NOT NULL,
          created_at timestamptz DEFAULT now(),
          UNIQUE(subject, set_number)
        );

        CREATE INDEX IF NOT EXISTS idx_sample_papers_subject
        ON sample_papers(subject);

        CREATE INDEX IF NOT EXISTS idx_sample_papers_set
        ON sample_papers(subject, set_number);
      `
    }).catch(() => ({ error: { message: 'RPC not available' } }));

    if (createError && !createError.message.includes('RPC not available')) {
      console.error("❌ Error creating table:", createError.message);
      return false;
    }

    // Alternative: Try direct SQL via API
    if (createError?.message.includes('RPC not available')) {
      console.log("\n⚠️  Direct table creation via RPC not available.");
      console.log("📌 Please create the table manually in Supabase:\n");
      console.log("Go to: SQL Editor in Supabase Dashboard");
      console.log("Run this SQL:\n");
      console.log(`
CREATE TABLE IF NOT EXISTS sample_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  set_number integer NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
  content text NOT NULL,
  total_marks integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, set_number)
);

CREATE INDEX IF NOT EXISTS idx_sample_papers_subject
ON sample_papers(subject);

CREATE INDEX IF NOT EXISTS idx_sample_papers_set
ON sample_papers(subject, set_number);
      `);
      return false;
    }

    console.log("✅ Table created successfully!");

    // Verify table
    console.log("🔍 Verifying table...");
    const { data: verifyData, error: verifyError } = await supabase
      .from('sample_papers')
      .select('*')
      .limit(1);

    if (!verifyError) {
      console.log("✅ Table verified and ready!");
      return true;
    }

  } catch (err) {
    console.error("❌ Setup error:", err.message);
  }

  console.log("\n" + "═".repeat(80) + "\n");
  return false;
}

async function main() {
  const success = await setupDatabase();

  if (!success) {
    console.log("⚠️  Please create the table manually (see instructions above)");
    console.log("Then run: node src/scripts/generateSamplePapers.js\n");
  } else {
    console.log("🎉 Database setup complete!");
    console.log("✅ Ready to generate sample papers!");
    console.log("🚀 Run: node src/scripts/generateSamplePapers.js\n");
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
