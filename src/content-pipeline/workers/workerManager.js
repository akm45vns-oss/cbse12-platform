/**
 * workerManager.js — Manages 5 Parallel Subject Workers
 *
 * - Spawns 5 subject workers (Physics, Chemistry, Maths, Biology, Rest)
 * - All workers pull from the same shared task queue (dynamic load balancing)
 * - Tracks aggregate progress and writes progress.json every 10s
 * - Graceful shutdown on SIGINT (saves checkpoint)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SubjectWorker } from "./subjectWorker.js";
import { taskQueue } from "../queue.js";
import { printKeyStatus } from "../keyPool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.resolve(__dirname, "../../../cache/pipeline_progress.json");
const PROGRESS_WRITE_INTERVAL_MS = 10_000; // write progress.json every 10s
const STATUS_PRINT_INTERVAL_MS   = 1000; // refresh dashboard every 1s

// Worker identities — all pull from same queue; names are just for logging
const WORKER_IDS = ["Worker-Physics", "Worker-Chemistry", "Worker-Maths", "Worker-Biology", "Worker-Other"];

export class WorkerManager {
  constructor() {
    this.workers  = [];
    this.events   = [];  // rolling log of last 100 progress events
    this.startTime = null;
    this._progressTimer = null;
    this._statusTimer   = null;
  }

  /**
   * Start all 5 workers in parallel.
   * Returns a Promise that resolves when ALL workers finish.
   */
  async start() {
    this.startTime = Date.now();
    console.log(`\n🚀 Starting ${WORKER_IDS.length} workers...\n`);

    // Register graceful shutdown
    process.on("SIGINT",  () => this._gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => this._gracefulShutdown("SIGTERM"));

    // Start progress reporting timers
    this._progressTimer = setInterval(() => this._writeProgress(), PROGRESS_WRITE_INTERVAL_MS);
    this._statusTimer   = setInterval(() => this._printStatus(),   STATUS_PRINT_INTERVAL_MS);

    // Create and start all workers
    const workerPromises = WORKER_IDS.map(id => {
      const worker = new SubjectWorker(id, (event) => this._handleEvent(event));
      this.workers.push(worker);
      return worker.run();
    });

    // Wait for all to complete
    await Promise.allSettled(workerPromises);

    // Cleanup
    clearInterval(this._progressTimer);
    clearInterval(this._statusTimer);

    this._writeProgress();
    taskQueue.saveCheckpoint();

    console.log("\n✅ All workers finished!\n");
    this._printFinalStats();
  }

  _handleEvent(event) {
    // Keep rolling log for TUI
    this.events.unshift(event);
    if (this.events.length > 20) this.events.pop();
  }

  _writeProgress() {
    const qSummary = taskQueue.getSummary();
    const elapsed  = Math.round((Date.now() - this.startTime) / 1000);
    const rate     = elapsed > 0 ? (qSummary.completed / elapsed).toFixed(2) : "0";

    const progress = {
      updated_at: new Date().toISOString(),
      elapsed_seconds: elapsed,
      rate_per_second: parseFloat(rate),
      queue: qSummary,
      workers: this.workers.map(w => w.stats),
      recent_events: this.events.slice(0, 20),
    };

    try {
      fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch {}
  }

  _printStatus() {
    process.stdout.write('\x1Bc'); // Clear screen
    const q = taskQueue.getSummary();
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const rate = elapsed > 0 ? (q.completed / elapsed).toFixed(2) : "0";

    console.log("═".repeat(60));
    console.log(`  GENERATION DASHBOARD (${elapsed}s elapsed) | Rate: ${rate}/s`);
    console.log("═".repeat(60));
    console.log(`  ✅ Done: ${q.completed}   ⏳ Pending: ${q.pending}   ❌ Failed: ${q.failed}   🔄 Retry: ${q.retrying}`);
    console.log("");
    console.log("  [Queue By Priority]");
    console.log(`    Notes:       ${q.byPriority.notes}`);
    console.log(`    MCQs:        ${q.byPriority.mcqs}`);
    console.log(`    Revision:    ${q.byPriority.revision}`);
    console.log(`    Long Ans:    ${q.byPriority.longAnswers}`);
    console.log("═".repeat(60));
    console.log("  [Recent Worker Activity]");
    
    // print last 10 events (in chronological order)
    const recent = this.events.slice(0, 10).reverse();
    recent.forEach(e => {
        let emoji = "ℹ️ ";
        if (e.status === "done") emoji = "✅";
        if (e.status === "skip") emoji = "⏭️ ";
        if (e.status === "error") emoji = "❌";
        if (e.status === "warn") emoji = "⚠️ ";
        if (e.status === "generating") emoji = "🔄";
        console.log(`  [${e.workerId}] ${emoji} ${e.message}`);
    });

    console.log("═".repeat(60));
    console.log(`  💾 Output Directory: ${path.resolve(__dirname, "../../../cache/output")}`);
    printKeyStatus();
  }

  _printFinalStats() {
    const q = taskQueue.getSummary();
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    console.log("═".repeat(60));
    console.log("  PIPELINE COMPLETE");
    console.log("═".repeat(60));
    console.log(`  Time elapsed:  ${mins}m ${secs}s`);
    console.log(`  ✅ Generated:  ${q.completed}`);
    console.log(`  ⏩ Skipped:    ${this.workers.reduce((a, w) => a + w.stats.skipped, 0)}`);
    console.log(`  ❌ Failed:     ${q.failed}`);
    console.log("  Worker stats:");
    this.workers.forEach(w => {
      const s = w.stats;
      console.log(`    ${s.workerId}: done=${s.processed} skip=${s.skipped} fail=${s.failed}`);
    });
    console.log("═".repeat(60));
  }

  async _gracefulShutdown(signal) {
    console.log(`\n⚠️  Received ${signal} — saving checkpoint and shutting down...`);
    this.workers.forEach(w => w.stop());
    taskQueue.saveCheckpoint();
    this._writeProgress();
    clearInterval(this._progressTimer);
    clearInterval(this._statusTimer);
    console.log("✅ Checkpoint saved. Run again to resume.\n");
    process.exit(0);
  }
}
