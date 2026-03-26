import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// The static anon token used by the previous powershell scripts
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbnN4c2xjbWx5eHptbGN0a3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTI2NzYsImV4cCI6MjA4OTgyODY3Nn0.3OQ9jOyJwAwaDUkrdUkAFfTX5H9Jxq5kasujiOaLRsM"; 

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const baseUrl = "https://winsxslcmlyxzmlctkzt.functions.supabase.co/seed-quiz-sets";

async function run() {
  console.log("🔍 Fetching database to identify chapters with < 5 sets...");
  let allRows = [];
  let from = 0, to = 999, hasMore = true;

  while(hasMore) {
    const { data, error } = await supabase.from('quiz_sets').select('subject, chapter').range(from, to);
    if (error) { console.error("Error:", error); return; }
    if (data.length > 0) {
      allRows.push(...data);
      from += 1000; to += 1000;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  const chapterCounts = {};
  allRows.forEach(row => {
    const key = `${row.subject} --- ${row.chapter}`;
    if (!chapterCounts[key]) chapterCounts[key] = { subject: row.subject, chapter: row.chapter, count: 0 };
    chapterCounts[key].count += 1;
  });

  const below5 = Object.values(chapterCounts).filter(item => item.count < 5);
  console.log(`Found ${below5.length} chapters that need to be topped up to at least 5 sets.\n`);

  for (let i = 0; i < below5.length; i++) {
    const item = below5[i];
    console.log(`[${i+1}/${below5.length}] Processing ${item.subject} - ${item.chapter} (Currently has ${item.count} sets)`);
    
    const url = `${baseUrl}?subject=${encodeURIComponent(item.subject)}&chapter=${encodeURIComponent(item.chapter)}`;
    
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      const result = await res.json();
      if (result.success) {
        console.log(`  ✅ OK (${result.setsGenerated || 'unknown'} sets generated on this run)`);
      } else {
        console.log(`  ❌ FAIL:`, result);
      }
    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message}`);
    }

    if (i < below5.length - 1) {
      console.log(`  ⏳ Waiting 120 seconds to prevent Groq API rate limits...`);
      await new Promise(r => setTimeout(r, 120000));
    }
  }
  console.log("\n🎉 ALL DONE! The chapters have been topped up.");
}

run();
