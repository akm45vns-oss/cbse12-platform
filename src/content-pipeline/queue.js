/**
 * queue.js — Priority Task Queue with Checkpointing
 *
 * Priority levels (lower number = higher priority):
 *   NOTES = 1
 *   MCQS  = 2
 *   REVISION = 3
 *   LONG_ANSWERS = 4
 *
 * Features:
 * - Per-priority FIFO queues
 * - Retry queue for failed tasks
 * - Checkpoint: saves state to JSON every 25 completions
 * - Resume: reloads checkpoint file and rebuilds queue
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = path.resolve(__dirname, "../../cache/pipeline_checkpoint.json");
const CHECKPOINT_INTERVAL = 1; // save after every single completion to ensure immediate section persistence

// ===== PRIORITY LEVELS =====
export const PRIORITY = {
  NOTES: 1,
  MCQS: 2,
  REVISION: 3,
  LONG_ANSWERS: 4,
};

// Content types mapped to priority
export const CONTENT_TYPE_PRIORITY = {
  detailed_notes:      PRIORITY.NOTES,
  short_notes:         PRIORITY.REVISION,
  ncert_summary:       PRIORITY.REVISION,
  key_definitions:     PRIORITY.REVISION,
  formula_sheet:       PRIORITY.REVISION,
  important_concepts:  PRIORITY.REVISION,
  learning_objectives: PRIORITY.NOTES,
  estimated_study_time:PRIORITY.NOTES,
  mcqs:                PRIORITY.MCQS,
  assertion_reason:    PRIORITY.MCQS,
  case_based:          PRIORITY.MCQS,
  short_answer:        PRIORITY.MCQS,
  long_answer:         PRIORITY.LONG_ANSWERS,
  pyq_style:           PRIORITY.LONG_ANSWERS,
  difficulty_tags:     PRIORITY.REVISION,
};

export const ALL_CONTENT_TYPES = Object.keys(CONTENT_TYPE_PRIORITY);

class PriorityQueue {
  constructor() {
    // Map of priority → array of tasks (FIFO)
    this.queues = {
      [PRIORITY.NOTES]:        [],
      [PRIORITY.MCQS]:         [],
      [PRIORITY.REVISION]:     [],
      [PRIORITY.LONG_ANSWERS]: [],
    };
    this.retryQueue = [];
    this.completedCount = 0;
    this.failedTasks = [];
    this.inFlight = new Set(); // task IDs currently being processed
  }

  /**
   * Add a task to the appropriate priority queue.
   * @param {object} task — { id, classLevel, subject, chapter, contentType, attempt }
   */
  enqueue(task) {
    const priority = CONTENT_TYPE_PRIORITY[task.contentType] || PRIORITY.REVISION;
    const queue = this.queues[priority];
    if (!queue) return;
    // Skip duplicates (by task ID)
    if (queue.some(t => t.id === task.id) || this.inFlight.has(task.id)) return;
    task.attempt = task.attempt || 1;
    queue.push(task);
  }

  /**
   * Dequeue the next task in priority order.
   * Returns null if all queues are empty.
   */
  dequeue() {
    for (const priority of [PRIORITY.NOTES, PRIORITY.MCQS, PRIORITY.REVISION, PRIORITY.LONG_ANSWERS]) {
      const q = this.queues[priority];
      if (q.length > 0) {
        const task = q.shift();
        this.inFlight.add(task.id);
        return task;
      }
    }
    // Check retry queue last
    if (this.retryQueue.length > 0) {
      const task = this.retryQueue.shift();
      this.inFlight.add(task.id);
      return task;
    }
    return null;
  }

  /**
   * Peek at the next task without removing it.
   */
  peek() {
    for (const priority of [PRIORITY.NOTES, PRIORITY.MCQS, PRIORITY.REVISION, PRIORITY.LONG_ANSWERS]) {
      if (this.queues[priority].length > 0) return this.queues[priority][0];
    }
    if (this.retryQueue.length > 0) return this.retryQueue[0];
    return null;
  }

  /**
   * Mark task as completed successfully.
   */
  markDone(taskId) {
    this.inFlight.delete(taskId);
    this.completedCount += 1;

    // Save checkpoint every N completions
    if (this.completedCount % CHECKPOINT_INTERVAL === 0) {
      this.saveCheckpoint();
    }
  }

  /**
   * Mark task as failed. Pushes to retry queue if attempts < 3.
   */
  markFailed(task, error) {
    this.inFlight.delete(task.id);
    task.attempt = (task.attempt || 1) + 1;
    task.lastError = error?.message || String(error);

    if (task.attempt <= 3) {
      this.retryQueue.push(task);
    } else {
      this.failedTasks.push({ ...task, finalError: task.lastError });
      console.error(`[Queue] Task permanently failed after 3 attempts: ${task.id}`);
    }
  }

  /**
   * Total pending tasks (all queues + retry, excluding in-flight).
   */
  get pending() {
    return Object.values(this.queues).reduce((a, q) => a + q.length, 0)
      + this.retryQueue.length;
  }

  /**
   * Total items still to process (pending + in-flight).
   */
  get remaining() {
    return this.pending + this.inFlight.size;
  }

  get isEmpty() {
    return this.pending === 0 && this.inFlight.size === 0;
  }

  // ──────────────────────────────────────────────────────
  // CHECKPOINTING
  // ──────────────────────────────────────────────────────

  /**
   * Save current queue state to disk.
   */
  saveCheckpoint() {
    try {
      fs.mkdirSync(path.dirname(CHECKPOINT_FILE), { recursive: true });
      const state = {
        savedAt: new Date().toISOString(),
        completedCount: this.completedCount,
        queues: {
          [PRIORITY.NOTES]:        this.queues[PRIORITY.NOTES],
          [PRIORITY.MCQS]:         this.queues[PRIORITY.MCQS],
          [PRIORITY.REVISION]:     this.queues[PRIORITY.REVISION],
          [PRIORITY.LONG_ANSWERS]: this.queues[PRIORITY.LONG_ANSWERS],
        },
        retryQueue: this.retryQueue,
        failedTasks: this.failedTasks,
      };
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2));
      console.log(`[Queue] ✅ Checkpoint saved (${this.completedCount} done, ${this.pending} pending)`);
    } catch (e) {
      console.warn("[Queue] Failed to save checkpoint:", e.message);
    }
  }

  /**
   * Load checkpoint from disk and restore state.
   * @returns {boolean} true if checkpoint was loaded
   */
  resume() {
    try {
      if (!fs.existsSync(CHECKPOINT_FILE)) return false;
      const raw = fs.readFileSync(CHECKPOINT_FILE, "utf-8");
      const state = JSON.parse(raw);

      this.completedCount = state.completedCount || 0;
      for (const [p, tasks] of Object.entries(state.queues || {})) {
        this.queues[p] = tasks || [];
      }
      this.retryQueue = state.retryQueue || [];
      this.failedTasks = state.failedTasks || [];

      console.log(`[Queue] 🔄 Resumed from checkpoint — ${this.completedCount} already done, ${this.pending} remaining`);
      return true;
    } catch (e) {
      console.warn("[Queue] Could not load checkpoint:", e.message);
      return false;
    }
  }

  /**
   * Delete checkpoint file (call after full completion).
   */
  clearCheckpoint() {
    try {
      if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
      console.log("[Queue] Checkpoint cleared.");
    } catch {}
  }

  /**
   * Get a summary object for dashboard/display.
   */
  getSummary() {
    return {
      completed: this.completedCount,
      pending: this.pending,
      inFlight: this.inFlight.size,
      failed: this.failedTasks.length,
      retrying: this.retryQueue.length,
      byPriority: {
        notes:       this.queues[PRIORITY.NOTES].length,
        mcqs:        this.queues[PRIORITY.MCQS].length,
        revision:    this.queues[PRIORITY.REVISION].length,
        longAnswers: this.queues[PRIORITY.LONG_ANSWERS].length,
      },
    };
  }
}

// Singleton
export const taskQueue = new PriorityQueue();

/**
 * Build task ID from components.
 */
export function makeTaskId(classLevel, subject, chapter, contentType) {
  return `${classLevel}::${subject}::${chapter}::${contentType}`;
}

/**
 * Build a full task object.
 */
export function makeTask(classLevel, subject, chapter, contentType) {
  return {
    id: makeTaskId(classLevel, subject, chapter, contentType),
    classLevel,
    subject,
    chapter,
    contentType,
    attempt: 1,
  };
}
