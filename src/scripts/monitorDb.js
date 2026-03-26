import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  let allRows = [];
  let from = 0, to = 999, hasMore = true;

  while(hasMore) {
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('id, created_at, subject, chapter, set_number')
      .range(from, to);
      
    if (error) return null;
    
    if (data.length > 0) {
      allRows.push(...data);
      from += 1000; to += 1000;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  return allRows;
}

function calculateRemaining(rows) {
  const chapterCounts = {};
  rows.forEach(row => {
    const key = `${row.subject} --- ${row.chapter}`;
    if (!chapterCounts[key]) chapterCounts[key] = 0;
    chapterCounts[key] += 1;
  });
  
  let remaining = 0;
  // Count how many chapters are still dragging below 5 sets
  Object.values(chapterCounts).forEach(count => {
    if (count < 5) remaining++;
  });
  return remaining;
}

async function startMonitoring() {
  console.clear();
  console.log("======================================================");
  console.log("         📡 LIVE DATABASE GENERATION MONITOR          ");
  console.log("======================================================");
  console.log("Polling your Supabase Database every 10 seconds...\n");
  
  let previousCount = 0;
  
  while(true) {
    try {
      const rows = await checkDb();
      if (rows) {
        const currentCount = rows.length;
        const remainingChapters = calculateRemaining(rows);
        
        // Print live ticking clock on the same line, with spaces to prevent trailing text overlaps
        process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Total Sets: ${currentCount}  |  Chapters <5 Sets Remaining: ${remainingChapters}       `);
        
        // If the database successfully swelled since our last check!
        if (currentCount > previousCount && previousCount > 0) {
          const newSetsCount = currentCount - previousCount;
          const latestRows = rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, newSetsCount);
          
          console.log(`\n\n🎉 DETECTED +${newSetsCount} NEW SETS PUSHED BY EDGE FUNCTION!`);
          latestRows.forEach(r => {
            console.log(`  -> ${r.subject} | ${r.chapter} | (Set ${r.set_number})`);
          });
          console.log("------------------------------------------------------");
        }
        
        previousCount = currentCount;
      }
    } catch (e) {
      // Ignore network hangs
    }
    
    // Wait exactly 10 seconds before querying again
    await new Promise(r => setTimeout(r, 10000));
  }
}

startMonitoring();
