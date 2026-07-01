import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { CURRICULUM } from '../src/constants/curriculum.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const outDir = path.join(process.cwd(), 'cache', 'output', '12');

console.log("==================================================");
console.log("   🏆 FULLY COMPLETED CLASS 12 CHAPTERS (15/15)   ");
console.log("==================================================\n");

let completedCount = 0;
let totalChapters = 0;

for (const [subject, data] of Object.entries(CURRICULUM)) {
  for (const unit of data.units) {
    for (const chapter of unit.chapters) {
      totalChapters++;
      let allFilesExist = true;
      let missingFiles = [];

      // Sanitize names like in cacheManager
      const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
      const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");

      for (const contentType of ALL_CONTENT_TYPES) {
        const filePath = path.join(outDir, safeSubject, safeChapter, `${contentType}.json`);
        if (!fs.existsSync(filePath)) {
          allFilesExist = false;
          missingFiles.push(contentType);
          break;
        }
      }

      if (allFilesExist) {
        completedCount++;
        console.log(`✅ [${subject}] ${chapter}`);
      }
    }
  }
}

console.log(`\n==================================================`);
console.log(`Total 100% Complete Chapters: ${completedCount} / ${totalChapters}`);
console.log(`==================================================`);
