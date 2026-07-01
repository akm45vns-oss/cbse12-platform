import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { CURRICULUM as CURRICULUM_12 } from '../src/constants/curriculum.js';
import { CURRICULUM_11 } from '../src/constants/curriculum11.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

const cacheDir = path.join(process.cwd(), 'cache', 'output');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function heal() {
  console.log(`Scanning for missing local files and purging them from Supabase so they regenerate...\n`);

  for (const classLevel of ['11', '12']) {
    const outDir = path.join(cacheDir, classLevel);
    const curriculum = classLevel === '11' ? CURRICULUM_11 : CURRICULUM_12;

    for (const [subject, data] of Object.entries(curriculum)) {
      for (const unit of data.units) {
        for (const chapter of unit.chapters) {
          
          const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
          const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, "_");
          
          for (const contentType of ALL_CONTENT_TYPES) {
            const filePath = path.join(outDir, safeSubject, safeChapter, `${contentType}.json`);
            if (!fs.existsSync(filePath)) {
              console.log(`[MISSING] Class ${classLevel} / ${subject} / ${chapter} -> ${contentType}`);
              
              // Purge from database
              const { error } = await supabase
                .from("content_library")
                .delete()
                .eq("class_level", classLevel)
                .eq("subject", subject)
                .eq("chapter", chapter)
                .eq("content_type", contentType);

              if (error) {
                console.error(`  ❌ Failed to delete from DB: ${error.message}`);
              } else {
                console.log(`  ✅ Purged from DB successfully!`);
              }
            }
          }
        }
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Database healed! You can now run the pipeline again.`);
  console.log(`==================================================\n`);
}

heal();
