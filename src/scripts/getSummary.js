import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSummary() {
  console.log("Fetching all quiz_sets from database...");
  let allRows = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  while(hasMore) {
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('subject, chapter, set_number')
      .range(from, to);

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    if (data.length > 0) {
      allRows.push(...data);
      from += 1000;
      to += 1000;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  // Count sets per chapter
  const chapterCounts = {};
  allRows.forEach(row => {
    const key = `${row.subject} --- ${row.chapter}`;
    if (!chapterCounts[key]) {
      chapterCounts[key] = { subject: row.subject, chapter: row.chapter, count: 0 };
    }
    chapterCounts[key].count += 1;
  });

  const exact15 = [];
  const partial = [];

  Object.values(chapterCounts).forEach(item => {
    if (item.count >= 15) {
      exact15.push(item);
    } else {
      partial.push(item);
    }
  });

  console.log("\n==================================");
  console.log("📊 GENERATION SUMMARY");
  console.log("==================================");
  console.log(`TOTAL CHAPTERS SEEDED: ${Object.keys(chapterCounts).length}`);
  console.log(`✅ CHAPTERS WITH 15 SETS: ${exact15.length}`);
  console.log(`⚠️ CHAPTERS WITH <15 SETS: ${partial.length}`);
  console.log("==================================");
  
  if (partial.length > 0) {
    console.log("\n--- INCOMPLETE CHAPTERS ---");
    // Sort by lowest count first
    partial.sort((a,b) => a.count - b.count).forEach(item => {
      console.log(`[${item.count}/15] ${item.subject} - ${item.chapter}`);
    });
  }
}

checkSummary();
