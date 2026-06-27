/**
 * subjectWorker.js — Individual Subject Worker
 *
 * A subject worker:
 * 1. Takes chapters from the shared task queue
 * 2. For each task: check cache → generate → validate → store
 * 3. Reports progress events via a callback
 * 4. Handles failures gracefully (push to retry, continue)
 */

import { taskQueue } from "../queue.js";
import { generateContent } from "../generators/contentGenerator.js";
import { validateContent, logValidation } from "../validators/contentValidator.js";
import { isAlreadyGenerated, storeContent } from "../cache/pipelineCache.js";

const IDLE_POLL_MS  = 2000;  // poll interval when queue is empty but not done
const MAX_IDLE_WAITS = 60;   // after 60 polls with no work, worker exits

export class SubjectWorker {
  /**
   * @param {string} workerId — e.g. "Physics", "Chemistry"
   * @param {Function} onProgress — callback({ workerId, taskId, status, message })
   */
  constructor(workerId, onProgress) {
    this.workerId  = workerId;
    this.onProgress = onProgress || (() => {});
    this.running   = false;
    this.processed = 0;
    this.skipped   = 0;
    this.failed    = 0;
    this.idleCount = 0;
  }

  /**
   * Start processing tasks from the queue until it is empty.
   */
  async run() {
    this.running = true;
    this.emit("info", `Worker started`);

    while (this.running) {
      const task = taskQueue.dequeue();

      if (!task) {
        // No task available right now
        if (taskQueue.isEmpty) {
          this.emit("info", `Queue empty — worker done`);
          break;
        }

        // Tasks may be in-flight by other workers — wait and poll
        this.idleCount += 1;
        if (this.idleCount > MAX_IDLE_WAITS) {
          this.emit("info", `Max idle time reached — worker exiting`);
          break;
        }

        await sleep(IDLE_POLL_MS);
        continue;
      }

      this.idleCount = 0; // reset idle counter on successful dequeue

      const { id, classLevel, subject, chapter, contentType } = task;

      // ── 1. Cache check ────────────────────────────────────────────
      try {
        const already = await isAlreadyGenerated(classLevel, subject, chapter, contentType);
        if (already) {
          this.skipped += 1;
          taskQueue.markDone(id);
          this.emit("skip", `Skipped (cached): ${subject}/${chapter}/${contentType}`);
          continue;
        }
      } catch (cacheErr) {
        this.emit("warn", `Cache check failed for ${id}: ${cacheErr.message} — will generate`);
      }

      // ── 2. Generate ───────────────────────────────────────────────
      this.emit("generating", `Generating ${contentType} for ${chapter} (${subject})`);

      let envelope;
      try {
        envelope = await generateContent(classLevel, subject, chapter, contentType);
      } catch (genErr) {
        this.failed += 1;
        taskQueue.markFailed(task, genErr);
        this.emit("error", `Generation failed: ${genErr.message}`);
        continue;
      }

      // ── 3. Validate ───────────────────────────────────────────────
      const validationResult = validateContent(envelope);
      logValidation(envelope, validationResult);

      if (!validationResult.valid) {
        this.failed += 1;
        taskQueue.markFailed(task, new Error(`Validation failed: ${validationResult.errors.join("; ")}`));
        this.emit("error", `Validation failed for ${id}: ${validationResult.errors.join("; ")}`);
        continue;
      }

      // ── 4. Store ──────────────────────────────────────────────────
      try {
        await storeContent(envelope);
      } catch (storeErr) {
        // Non-fatal — content is valid, just storage failed
        this.emit("warn", `Store failed for ${id}: ${storeErr.message}`);
      }

      // ── 5. Mark done ──────────────────────────────────────────────
      this.processed += 1;
      taskQueue.markDone(id);
      this.emit("done", `✅ ${subject}/${chapter}/${contentType}`);
    }

    this.running = false;
    this.emit("finished", `Worker finished — ${this.processed} done, ${this.skipped} skipped, ${this.failed} failed`);
  }

  stop() {
    this.running = false;
  }

  emit(status, message) {
    this.onProgress({
      workerId: this.workerId,
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  get stats() {
    return {
      workerId: this.workerId,
      processed: this.processed,
      skipped:   this.skipped,
      failed:    this.failed,
      running:   this.running,
    };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
