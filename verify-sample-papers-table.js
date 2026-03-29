/**
 * Verify/Create sample_papers table via test insertion
 * This will either verify the table exists or show error for manual creation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAndSetupTable() {
  console.log("\n" + "═".repeat(80));
  console.log("🔧 VERIFYING SAMPLE_PAPERS TABLE");
  console.log("═".repeat(80) + "\n");

  try {
    // Test 1: Try to query the table
    console.log("📋 Checking if table exists...");
    const { data, error: queryError } = await supabase
      .from('sample_papers')
      .select('id')
      .limit(1);

    if (!queryError) {
      console.log("✅ Table 'sample_papers' EXISTS and is ready!\n");
      return true;
    }

    // Table might not exist or error occurred
    if (queryError.code === "PGRST116") {
      console.log("❌ Table 'sample_papers' DOES NOT EXIST");
      console.log("\n📝 Please create the table manually:");
      console.log("━".repeat(80));
      console.log(`
1. Go to: https://app.supabase.com/project/_/sql

2. Click "New query"

3. Paste this SQL:

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

4. Click "RUN"

5. Wait for ✓ success message

6. Come back and run: node src/scripts/generateSamplePapers.js
      `.trim());
      console.log("━".repeat(80));
      return false;
    }

    console.log("❌ Error:", queryError.message);
    return false;

  } catch (err) {
    console.error("❌ Error:", err.message);
    return false;
  }
}

async function createTestEntry() {
  console.log("\n📝 Testing table write access...");

  try {
    // Try to insert a test record
    const { data, error } = await supabase
      .from('sample_papers')
      .insert({
        subject: 'TEST_VERIFY',
        set_number: 1,
        content: 'Test entry - will be deleted',
        total_marks: 100
      })
      .select();

    if (error) {
      console.error("❌ Insert error:", error.message);
      return false;
    }

    // Delete test entry
    if (data && data[0]) {
      await supabase
        .from('sample_papers')
        .delete()
        .eq('subject', 'TEST_VERIFY');
    }

    console.log("✅ Table write access verified!\n");
    return true;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return false;
  }
}

async function main() {
  const tableExists = await verifyAndSetupTable();

  if (tableExists) {
    const writeOk = await createTestEntry();
    if (writeOk) {
      console.log("🎉 Database is ready!\n");
      console.log("━".repeat(80));
      console.log("Ready to generate 60 sample papers");
      console.log("Run: node src/scripts/generateSamplePapers.js");
      console.log("━".repeat(80) + "\n");
      process.exit(0);
    }
  }

  process.exit(1);
}

main();
