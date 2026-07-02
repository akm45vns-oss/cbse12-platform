import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

import { CURRICULUM_11 } from '../src/constants/curriculum11.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const localCacheDir = path.join(process.cwd(), 'cache', 'output', '11');

console.log("==================================================");
console.log("🔍 CLASS 11 NOTES COMPLETION CHECKER (DB & Local)");
console.log("==================================================\n");

async function fetchAllCompletedFromDb() {
  console.log("⏳ Fetching all Class 11 generated content records from Supabase...");
  const completedKeys = new Set();
  try {
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("content_library")
        .select("subject, chapter, content_type")
        .eq("class_level", "11")
        .eq("is_valid", true)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(r => {
          completedKeys.add(`${r.subject.trim()}::${r.chapter.trim()}::${r.content_type.trim()}`);
        });
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }
    console.log(`✅ Loaded ${completedKeys.size} valid notes records from database.`);
  } catch (err) {
    console.error("❌ Failed to query database:", err.message);
  }
  return completedKeys;
}

async function main() {
  const dbCompleted = await fetchAllCompletedFromDb();
  
  let totalChaptersChecked = 0;
  let totalFilesChecked = 0;
  let totalMissingDb = 0;
  let totalMissingLocal = 0;
  
  const report = [];

  for (const [subject, data] of Object.entries(CURRICULUM_11)) {
    for (const unit of data.units) {
      for (const chapter of unit.chapters) {
        totalChaptersChecked++;
        
        const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
        const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");
        const chapterLocalDir = path.join(localCacheDir, safeSubject, safeChapter);
        
        const missingDb = [];
        const missingLocal = [];
        
        for (const contentType of ALL_CONTENT_TYPES) {
          totalFilesChecked++;
          
          // Check DB
          const dbKey = `${subject}::${chapter}::${contentType}`;
          if (!dbCompleted.has(dbKey)) {
            missingDb.push(contentType);
            totalMissingDb++;
          }
          
          // Check Local
          const localFilePath = path.join(chapterLocalDir, `${contentType}.json`);
          if (!fs.existsSync(localFilePath)) {
            missingLocal.push(contentType);
            totalMissingLocal++;
          }
        }
        
        report.push({
          subject,
          chapter,
          missingDb,
          missingLocal
        });
      }
    }
  }

  console.log("\n==================================================");
  console.log("📊 SUMMARY REPORT FOR CLASS 11");
  console.log("==================================================");
  console.log(`Total Chapters Checked:      ${totalChaptersChecked}`);
  console.log(`Total Files Checked:         ${totalFilesChecked}`);
  console.log(`Total Missing in Database:   ${totalMissingDb}`);
  console.log(`Total Missing Locally:       ${totalMissingLocal}`);
  console.log("==================================================\n");

  report.forEach((r, idx) => {
    const dbStatus = r.missingDb.length === 0 ? "DB: ✅ 15/15" : `DB: ❌ ${15 - r.missingDb.length}/15`;
    const localStatus = r.missingLocal.length === 0 ? "Local: ✅ 15/15" : `Local: ❌ ${15 - r.missingLocal.length}/15`;
    console.log(`${idx + 1}. [${r.subject}] - ${r.chapter}: ${dbStatus} | ${localStatus}`);
    
    if (r.missingDb.length > 0) {
      console.log(`   ⚠️ Missing in DB: ${r.missingDb.join(", ")}`);
    }
    if (r.missingLocal.length > 0 && r.missingLocal.length < 15) {
      console.log(`   ⚠️ Missing locally: ${r.missingLocal.join(", ")}`);
    }
  });

  if (totalMissingDb === 0) {
    console.log("\n🎉 SUCCESS: All Class 11 notes files are successfully generated in the Supabase Database!");
  } else {
    console.log(`\n⚠️ WARNING: Database is missing ${totalMissingDb} files.`);
  }
}

main().catch(console.error);
