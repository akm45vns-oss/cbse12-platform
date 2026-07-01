import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { CURRICULUM } from '../src/constants/curriculum.js';
import { CURRICULUM_11 } from '../src/constants/curriculum11.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const NUM_TYPES = ALL_CONTENT_TYPES.length;

function getExpected(curriculum) {
  let expected = 0;
  for (const subject of Object.values(curriculum)) {
    for (const unit of subject.units) {
      expected += unit.chapters.length * NUM_TYPES;
    }
  }
  return expected;
}

const expected11 = getExpected(CURRICULUM_11);
const expected12 = getExpected(CURRICULUM);

const outDir = path.join(process.cwd(), 'cache', 'output');
let completed11 = 0;
let completed12 = 0;

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            scanDir(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.json')) {
            const relative = path.relative(outDir, path.join(dir, entry.name));
            const parts = relative.split(path.sep);
            if (parts.length === 4) {
                if (parts[0] === '11') completed11++;
                if (parts[0] === '12') completed12++;
            }
        }
    }
}

scanDir(outDir);

console.log(`Class 11: ${completed11} / ${expected11} (${((completed11/expected11)*100).toFixed(2)}%)`);
console.log(`Class 12: ${completed12} / ${expected12} (${((completed12/expected12)*100).toFixed(2)}%)`);
console.log(`Overall: ${completed11 + completed12} / ${expected11 + expected12} (${(((completed11 + completed12)/(expected11 + expected12))*100).toFixed(2)}%)`);
