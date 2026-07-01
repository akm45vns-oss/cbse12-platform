import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { CURRICULUM } from '../src/constants/curriculum.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const outDir = path.join(process.cwd(), 'cache', 'output', '12');

const stats = {};

for (const [subject, data] of Object.entries(CURRICULUM)) {
  stats[subject] = { total: 0, completed: 0, missing: 0 };
  
  for (const unit of data.units) {
    for (const chapter of unit.chapters) {
      stats[subject].total++;
      let allFilesExist = true;

      const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
      const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");

      for (const contentType of ALL_CONTENT_TYPES) {
        const filePath = path.join(outDir, safeSubject, safeChapter, `${contentType}.json`);
        if (!fs.existsSync(filePath)) {
          allFilesExist = false;
          break;
        }
      }

      if (allFilesExist) {
        stats[subject].completed++;
      } else {
        stats[subject].missing++;
      }
    }
  }
}

console.log("| Subject | Total Chapters | 100% Complete | Yet to Generate Fully |");
console.log("|---------|----------------|---------------|-----------------------|");
let totalAll = 0;
let totalComp = 0;
let totalMiss = 0;

for (const [subject, st] of Object.entries(stats)) {
  console.log(`| ${subject} | ${st.total} | ${st.completed} | ${st.missing} |`);
  totalAll += st.total;
  totalComp += st.completed;
  totalMiss += st.missing;
}
console.log(`| **TOTAL (Class 12)** | **${totalAll}** | **${totalComp}** | **${totalMiss}** |`);
