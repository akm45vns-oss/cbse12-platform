/**
 * scheduler.js — Main Content Pipeline Entry Point
 *
 * Usage:
 *   node src/content-pipeline/scheduler.js                     # Generate all Class 11 content
 *   node src/content-pipeline/scheduler.js --retry-only        # Retry failed tasks only
 *   node src/content-pipeline/scheduler.js --dry-run           # List tasks without generating
 *   node src/content-pipeline/scheduler.js --subject Physics   # Only one subject
 *   node src/content-pipeline/scheduler.js --chapters 1        # Limit chapters per subject
 *
 * Workflow:
 * 1. Load Class 11 curriculum
 * 2. Fetch already-generated task IDs from DB/cache
 * 3. Build task list skipping existing content
 * 4. Resume from checkpoint if it exists
 * 5. Populate priority queue
 * 6. Start WorkerManager (5 workers)
 * 7. On completion: save checkpoint & print stats
 */

import * as dotenv from "dotenv";
dotenv.config();

import { getAllChapters11, CURRICULUM_11 } from "../constants/curriculum11.js";
import { getAllChapters12, CURRICULUM } from "../constants/curriculum.js";
import { taskQueue, makeTask, ALL_CONTENT_TYPES } from "./queue.js";
import { getCompletedTaskIds } from "./cache/pipelineCache.js";
import { WorkerManager } from "./workers/workerManager.js";
import { printKeyStatus } from "./keyPool.js";
import { clearSeenHashes } from "./validators/contentValidator.js";

// CLASS_LEVEL is dynamic now based on arguments

// ── Parse CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun    = args.includes("--dry-run");
const isRetryOnly = args.includes("--retry-only");
const isForce     = args.includes("--force");
const subjectFilter = (() => {
  const i = args.indexOf("--subject");
  return i !== -1 ? args[i + 1] : null;
})();
const chapterFilter = (() => {
  const i = args.indexOf("--chapter");
  return i !== -1 ? args[i + 1] : null;
})();
const classFilter = (() => {
  const i = args.indexOf("--class");
  return i !== -1 ? args[i + 1] : "12,11"; // Default to 12 first, then 11
})();
const chapterLimit = (() => {
  const i = args.indexOf("--chapters");
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity;
})();

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("═".repeat(60));
  console.log("  CBSE CONTENT GENERATION PIPELINE (Class 11 & 12)");
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log("═".repeat(60));

  // Load all chapters based on classFilter
  let allChapters = [];
  if (classFilter.includes("12")) {
    allChapters = allChapters.concat(getAllChapters12().map(c => ({ ...c, classLevel: "12" })));
  }
  if (classFilter.includes("11") || classFilter === "all") {
    allChapters = allChapters.concat(getAllChapters11().map(c => ({ ...c, classLevel: "11" })));
  }

  // Apply subject filter
  if (subjectFilter) {
    allChapters = allChapters.filter(c => c.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
    console.log(`\n🔍 Subject filter: "${subjectFilter}" → ${allChapters.length} chapters`);
  }

  // Apply chapter filter
  if (chapterFilter) {
    allChapters = allChapters.filter(c => c.chapter.toLowerCase().includes(chapterFilter.toLowerCase()));
    console.log(`\n🔍 Chapter filter: "${chapterFilter}" → ${allChapters.length} chapters`);
  }

  // Apply chapter limit per subject
  if (isFinite(chapterLimit)) {
    const countBySubject = {};
    allChapters = allChapters.filter(c => {
      countBySubject[c.subject] = (countBySubject[c.subject] || 0) + 1;
      return countBySubject[c.subject] <= chapterLimit;
    });
    console.log(`\n📏 Chapter limit: ${chapterLimit} per subject → ${allChapters.length} chapters`);
  }

  // Count total tasks
  const totalTasks = allChapters.length * ALL_CONTENT_TYPES.length;
  console.log(`\n📋 Total chapters:     ${allChapters.length}`);
  console.log(`📋 Content types each: ${ALL_CONTENT_TYPES.length}`);
  console.log(`📋 Total tasks:        ${totalTasks}`);

  // ── Dry run ────────────────────────────────────────────────────
  if (isDryRun) {
    console.log("\n🔍 DRY RUN — showing task breakdown:\n");
    const bySubject = {};
    allChapters.forEach(c => {
      if (!bySubject[c.subject]) bySubject[c.subject] = [];
      bySubject[c.subject].push(c.chapter);
    });

    for (const [subject, chapters] of Object.entries(bySubject)) {
      const d = CURRICULUM_11[subject];
      console.log(`  ${d?.emoji || "📚"} ${subject}: ${chapters.length} chapters × ${ALL_CONTENT_TYPES.length} types = ${chapters.length * ALL_CONTENT_TYPES.length} tasks`);
      chapters.forEach(ch => console.log(`      • ${ch}`));
    }

    console.log(`\n✅ Dry run complete. Total tasks that would run: ${totalTasks}`);
    process.exit(0);
  }

  // ── Check already completed ────────────────────────────────────
  console.log("\n⏳ Checking database for already-generated content...");
  const completedIds11 = classFilter.includes("11") || classFilter === "all" ? await getCompletedTaskIds("11") : new Set();
  const completedIds12 = classFilter.includes("12") ? await getCompletedTaskIds("12") : new Set();
  const completedIds = new Set([...completedIds11, ...completedIds12]);
  
  if (isForce) {
    console.log(`✅ ${completedIds.size} tasks already complete — IGNORED (--force enabled)`);
  } else {
    console.log(`✅ ${completedIds.size} tasks already complete — will skip`);
  }

  // ── Try to resume from checkpoint ─────────────────────────────
  let resumed = taskQueue.resume();

  // Detect stale checkpoint: resumed but queue has nothing pending/retrying
  // while DB shows we haven't finished everything yet.
  if (resumed && !isRetryOnly) {
    const qSummary = taskQueue.getSummary();
    const pendingInQueue = qSummary.pending + qSummary.retrying;
    const stillNeeded = totalTasks - completedIds.size;

    if (pendingInQueue === 0 && stillNeeded > 0) {
      console.log(`\n⚠️  Stale checkpoint detected (0 pending, but ${stillNeeded} tasks not in DB yet).`);
      console.log(`   Discarding checkpoint and building fresh queue...`);
      taskQueue.clearCheckpoint();
      resumed = false; // fall through to fresh build
    }
  }

  if (!resumed || isRetryOnly) {
    // Fresh run — build full task list
    clearSeenHashes();

    if (isRetryOnly) {
      console.log("\n🔄 Retry-only mode — loading failed tasks from checkpoint...");
      if (!resumed) {
        console.log("No checkpoint found. Nothing to retry.");
        process.exit(0);
      }
      // Only retry queue is used; clear main queues
      Object.values(taskQueue.queues).forEach(q => { q.length = 0; });
    } else {
      if (taskQueue.isEmpty) {
        if (!resumed) {
          // Clean build
          let enqueued = 0;
          let skipped  = 0;

          for (const { subject, chapter, classLevel } of allChapters) {
            for (const contentType of ALL_CONTENT_TYPES) {
              const task = makeTask(classLevel, subject, chapter, contentType);

              if (completedIds.has(task.id) && !isForce) {
                skipped += 1;
                taskQueue.completedCount += 1; // count pre-existing as done
                continue;
              }

              taskQueue.enqueue(task);
              enqueued += 1;
            }
          }

          console.log(`\n📥 Enqueued: ${enqueued} tasks`);
          console.log(`⏩ Pre-skipped (already done): ${skipped} tasks`);
        }
      }
    }
  }

  // ── Show initial queue summary ────────────────────────────────
  const qSummary = taskQueue.getSummary();
  console.log(`\n📊 Queue summary:`);
  console.log(`   Notes:       ${qSummary.byPriority.notes}`);
  console.log(`   MCQs:        ${qSummary.byPriority.mcqs}`);
  console.log(`   Revision:    ${qSummary.byPriority.revision}`);
  console.log(`   Long Ans:    ${qSummary.byPriority.longAnswers}`);
  console.log(`   Retry:       ${qSummary.retrying}`);

  if (qSummary.pending === 0 && qSummary.retrying === 0) {
    console.log("\n🎉 All content already generated! Nothing to do.");
    process.exit(0);
  }

  // ── Print initial key status ──────────────────────────────────
  printKeyStatus();

  // ── Start workers ────────────────────────────────────────────
  const manager = new WorkerManager();

  console.log(`\n🚀 Starting generation pipeline at ${new Date().toLocaleTimeString()}...\n`);

  try {
    await manager.start();
  } catch (err) {
    console.error("Pipeline error:", err);
    taskQueue.saveCheckpoint();
    process.exit(1);
  }

  // Final checkpoint clear if everything succeeded
  if (taskQueue.isEmpty && taskQueue.failedTasks.length === 0) {
    taskQueue.clearCheckpoint();
    console.log("\n🎉 Pipeline complete! All content generated successfully.");
    process.exit(0);
  } else if (taskQueue.isEmpty && taskQueue.failedTasks.length > 0) {
    console.log(`\n⚠️ Pipeline finished but ${taskQueue.failedTasks.length} tasks permanently failed.`);
    console.log(`   Clearing checkpoint so a fresh run can scoop them up.`);
    taskQueue.clearCheckpoint();
    process.exit(2);
  } else {
    console.log(`\n⚠️  Pipeline finished with ${taskQueue.pending} tasks remaining. Run again to continue.`);
    process.exit(1);
  }

}

main().catch(err => {
  console.error("Fatal pipeline error:", err);
  process.exit(1);
});
