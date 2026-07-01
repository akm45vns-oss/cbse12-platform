import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { CURRICULUM } from '../src/constants/curriculum.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const cacheDir = path.join(process.cwd(), 'cache', 'output');

let totalMissing = 0;
const missingList = [];

['11', '12'].forEach(classLevel => {
  const outDir = path.join(cacheDir, classLevel);
  
  for (const [subject, data] of Object.entries(CURRICULUM)) {
    // Only check if subject belongs to this class in real curriculum?
    // Actually CURRICULUM might not specify class 11/12 explicitly, let's just check folders that exist or assume CURRICULUM is for 12.
    // Wait, in this platform, Class 11 and Class 12 have their own curriculum definitions, or are they merged?
    // Let's scan the actual directories in cache/output instead of relying on CURRICULUM to be 100% accurate.
  }
});

// Better approach: Scan the output directory structure directly, as the DB cache did.
// Let's use the CURRICULUM definition since that's what the pipeline uses.

console.log(`Checking both Class 11 and Class 12 against CURRICULUM...`);

for (const classLevel of ['11', '12']) {
  const outDir = path.join(cacheDir, classLevel);
  if (!fs.existsSync(outDir)) {
      console.log(`Class ${classLevel} directory not found!`);
      continue;
  }

  for (const [subject, data] of Object.entries(CURRICULUM)) {
    for (const unit of data.units) {
      for (const chapter of unit.chapters) {
        
        const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
        const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");
        
        for (const contentType of ALL_CONTENT_TYPES) {
          const filePath = path.join(outDir, safeSubject, safeChapter, `${contentType}.json`);
          if (!fs.existsSync(filePath)) {
            missingList.push(`Class ${classLevel} / ${subject} / ${chapter} -> missing ${contentType}.json`);
            totalMissing++;
          }
        }
      }
    }
  }
}

console.log(`\n==================================================`);
console.log(`TOTAL MISSING FILES: ${totalMissing}`);
console.log(`==================================================\n`);

if (totalMissing > 0) {
  missingList.forEach(m => console.log(m));
} else {
  console.log("✅ ALL 15 JSON FILES ARE PRESENT FOR EVERY SINGLE CHAPTER IN CLASS 11 AND 12!");
}
