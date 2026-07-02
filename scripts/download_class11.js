import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkCache } from '../src/content-pipeline/cache/pipelineCache.js';
import { CURRICULUM_11 } from '../src/constants/curriculum11.js';
import { ALL_CONTENT_TYPES } from '../src/content-pipeline/queue.js';

console.log("==================================================");
console.log("📥 DOWNLOADING CLASS 11 NOTES TO LOCAL CACHE");
console.log("==================================================\n");

// Flatten all required tasks for Class 11
const tasks = [];
for (const [subject, data] of Object.entries(CURRICULUM_11)) {
  for (const unit of data.units) {
    for (const chapter of unit.chapters) {
      for (const contentType of ALL_CONTENT_TYPES) {
        tasks.push({ subject, chapter, contentType });
      }
    }
  }
}

console.log(`📋 Total Class 11 files to sync: ${tasks.length}`);

// Chunk helper to run tasks in batches
async function runBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (indices ${i} to ${i + batch.length - 1})...`);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const downloadTask = async (task) => {
    try {
      const { subject, chapter, contentType } = task;
      
      // checkCache automatically pulls from DB and writes locally if missing locally!
      const result = await checkCache("11", subject, chapter, contentType);
      if (result) {
        downloadedCount++;
        return { success: true };
      } else {
        failedCount++;
        console.warn(`⚠️ Failed to find or write cache for ${subject} -> ${chapter} -> ${contentType}`);
        return { success: false };
      }
    } catch (err) {
      failedCount++;
      console.error(`❌ Exception:`, err.message);
      return { success: false };
    }
  };

  const startTime = Date.now();
  
  // Batch size of 100 to avoid overloading connection pool
  await runBatches(tasks, 100, downloadTask);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n==================================================");
  console.log("🏁 DOWNLOAD SYNC RUN COMPLETE!");
  console.log("==================================================");
  console.log(`⏱️ Duration:           ${durationSec}s`);
  console.log(`✅ Successfully Synced: ${downloadedCount}`);
  console.log(`❌ Failed/Missing:     ${failedCount}`);
  console.log("==================================================");
}

main().catch(console.error);
