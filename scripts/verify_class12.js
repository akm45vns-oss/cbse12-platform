import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CURRICULUM } from '../src/constants/curriculum.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const cacheDir = path.join(process.cwd(), 'cache', 'output', '12');

console.log("==================================================");
console.log("🔍 CLASS 12 NOTES COMPLETION CHECKER");
console.log("==================================================\n");

if (!fs.existsSync(cacheDir)) {
  console.error("❌ Class 12 output directory not found at:", cacheDir);
  process.exit(1);
}

let totalChaptersChecked = 0;
let totalFilesChecked = 0;
let totalMissing = 0;
const report = [];

for (const [subject, data] of Object.entries(CURRICULUM)) {
  for (const unit of data.units) {
    for (const chapter of unit.chapters) {
      totalChaptersChecked++;
      
      const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
      const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");
      const chapterDir = path.join(cacheDir, safeSubject, safeChapter);
      
      let presentCount = 0;
      const missingFiles = [];
      
      for (const contentType of ALL_CONTENT_TYPES) {
        totalFilesChecked++;
        const filePath = path.join(chapterDir, `${contentType}.json`);
        
        if (fs.existsSync(filePath)) {
          presentCount++;
        } else {
          missingFiles.push(`${contentType}.json`);
          totalMissing++;
        }
      }
      
      report.push({
        subject,
        chapter,
        status: missingFiles.length === 0 ? "✅ 15/15 Present" : `❌ ${presentCount}/15 Present`,
        missing: missingFiles
      });
    }
  }
}

console.log("📊 SUMMARY REPORT");
console.log("==================================================");
console.log(`Total Chapters Checked: ${totalChaptersChecked}`);
console.log(`Total Files Checked:    ${totalFilesChecked}`);
console.log(`Total Missing Files:    ${totalMissing}`);
console.log("==================================================\n");

report.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.subject}] - ${r.chapter}: ${r.status}`);
  if (r.missing.length > 0) {
    console.log(`   ⚠️ Missing: ${r.missing.join(", ")}`);
  }
});

if (totalMissing === 0) {
  console.log("\n🎉 SUCCESS: All Class 12 chapters have all 15 JSON notes files generated!");
} else {
  console.log(`\n⚠️ WARNING: There are ${totalMissing} missing files across ${report.filter(r => r.missing.length > 0).length} chapters.`);
}
