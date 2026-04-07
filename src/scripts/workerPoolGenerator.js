import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKey1 = process.env.VITE_GROQ_KEY_1 || process.env.VITE_GROQ_KEY;
const groqKey2 = process.env.VITE_GROQ_KEY_2 || null;
const groqKey3 = process.env.VITE_GROQ_KEY_3 || null;
const groqKey4 = process.env.VITE_GROQ_KEY_4 || null;
const groqKey5 = process.env.VITE_GROQ_KEY_5 || null;
const GROQ_KEYS = [groqKey1, groqKey2, groqKey3, groqKey4, groqKey5].filter(Boolean);

if (!supabaseUrl || !supabaseKey || !groqKey1) {
  console.error("Missing required credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FAST_CHUNK_SIZE = 8;
const FAST_RETRY_WAIT_MS = 45000;
const FAST_BETWEEN_SET_WAIT_MS = 2000;
const FAST_BETWEEN_CHAPTER_WAIT_MS = 3000;
const MAX_SET_ATTEMPTS = 6;
const TARGET_SETS = 8;

const MODEL_CANDIDATES = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

// ============================================
// TASK QUEUE
// ============================================
class TaskQueue {
  constructor() {
    this.tasks = [];
    this.processing = false;
  }

  addTask(chapter, subject, setsNeeded) {
    for (let i = 0; i < setsNeeded; i++) {
      this.tasks.push({
        id: `${subject}_${chapter}_set${i + 1}`,
        chapter,
        subject,
        setNumber: i + 1,
        totalSets: setsNeeded,
        status: 'pending',
        createdAt: Date.now()
      });
    }
  }

  getNextTask() {
    return this.tasks.find(t => t.status === 'pending');
  }

  updateTaskStatus(taskId, status, result = null) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.result = result;
      task.updatedAt = Date.now();
    }
  }

  getStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      processing: this.tasks.filter(t => t.status === 'processing').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      failed: this.tasks.filter(t => t.status === 'failed').length
    };
  }
}

// ============================================
// WORKER (API HANDLER)
// ============================================
class Worker {
  constructor(id, apiKey) {
    this.id = id;
    this.apiKey = apiKey;
    this.status = 'idle';
    this.currentTask = null;
    this.processed = 0;
  }

  async fetchContent(prompt, maxTokens = 2500, temperature = 0.4) {
    let lastError = 'No model returned a valid response';

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`   ⏳ W${this.id} rate limited on ${model}, waiting 60s...`);
            await new Promise(r => setTimeout(r, 60000));
            continue;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        if (!text) {
          lastError = `Empty response from ${model}`;
          continue;
        }

        return text;
      } catch (err) {
        lastError = `Model ${model} failed: ${err.message}`;
      }
    }

    throw new Error(lastError);
  }

  async processTask(task) {
    this.status = 'processing';
    this.currentTask = task;
    const questions = [];
    const seenQuestions = new Set();

    for (let attempt = 0; attempt < MAX_SET_ATTEMPTS; attempt++) {
      try {
        const remaining = 30 - questions.length;
        const chunkSize = Math.min(FAST_CHUNK_SIZE, remaining);

        const prompt = `Generate ${chunkSize} quiz questions for CBSE Class 12.
Chapter: "${task.chapter}" (${task.subject})

Return ONLY valid JSON array of ${chunkSize} objects.
Each object must have:
- q: question text
- opts: exactly 4 options
- ans: correct option index 0..3
- exp: short explanation (at least 12 words)

Keep questions unique and directly relevant to the chapter.
No markdown. No extra text.`;

        const text = await this.fetchContent(prompt, 1800, 0.35);
        let cleaned = text.replace(/```(json)?\s*\n?/g, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');

        if (start === -1 || end === -1) throw new Error('No valid JSON found');

        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        if (!Array.isArray(parsed)) throw new Error('Invalid JSON structure');

        for (const q of parsed) {
          if (questions.length >= 30) break;
          if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || typeof q.ans !== 'number') continue;
          
          const key = String(q.q).toLowerCase();
          if (seenQuestions.has(key)) continue;
          seenQuestions.add(key);

          questions.push({
            q: String(q.q).trim(),
            opts: q.opts.map(o => String(o).trim()),
            ans: q.ans,
            exp: String(q.exp || 'Chapter concept based explanation').trim()
          });
        }

        if (questions.length < 30) {
          console.log(`   [W${this.id}] Chunk: ${questions.length}/30 questions`);
          await new Promise(r => setTimeout(r, FAST_RETRY_WAIT_MS));
          continue;
        }

        break;
      } catch (err) {
        console.log(`   [W${this.id}] Attempt ${attempt + 1}/${MAX_SET_ATTEMPTS}: ${err.message}`);
        await new Promise(r => setTimeout(r, FAST_RETRY_WAIT_MS));
      }
    }

    if (questions.length < 30) {
      throw new Error(`Only ${questions.length}/30 questions after ${MAX_SET_ATTEMPTS} attempts`);
    }

    this.processed++;
    this.status = 'idle';
    this.currentTask = null;

    return questions.slice(0, 30);
  }
}

// ============================================
// WORKER POOL
// ============================================
class WorkerPool {
  constructor(apiKeys, concurrency = 5) {
    this.workers = apiKeys.map((key, i) => new Worker(i + 1, key));
    this.taskQueue = new TaskQueue();
    this.results = [];
    this.concurrency = Math.min(concurrency, this.workers.length);
  }

  addChapter(chapter, subject, setsNeeded) {
    this.taskQueue.addTask(chapter, subject, setsNeeded);
  }

  async processQueue() {
    console.log(`\n🚀 WORKER POOL STARTED`);
    console.log(`   Workers: ${this.workers.length}`);
    console.log(`   Tasks: ${this.taskQueue.tasks.length}`);
    console.log(`   Concurrency: ${this.concurrency}\n`);

    const processingPromises = [];

    for (let i = 0; i < this.concurrency; i++) {
      processingPromises.push(this.runWorker(this.workers[i]));
    }

    await Promise.all(processingPromises);

    return {
      total: this.taskQueue.tasks.length,
      completed: this.taskQueue.tasks.filter(t => t.status === 'completed').length,
      failed: this.taskQueue.tasks.filter(t => t.status === 'failed').length,
      results: this.results
    };
  }

  async runWorker(worker) {
    while (true) {
      const task = this.taskQueue.getNextTask();
      if (!task) break;

      this.taskQueue.updateTaskStatus(task.id, 'processing');
      process.stdout.write(`\r[W${worker.id}] Task: ${task.id}... `);

      try {
        const questions = await worker.processTask(task);
        this.taskQueue.updateTaskStatus(task.id, 'completed', questions);

        this.results.push({
          taskId: task.id,
          chapter: task.chapter,
          subject: task.subject,
          questions: questions,
          workerId: worker.id,
          timestamp: Date.now()
        });

        console.log(`✓ [W${worker.id}] ${task.id}`);
        await new Promise(r => setTimeout(r, FAST_BETWEEN_SET_WAIT_MS));
      } catch (err) {
        this.taskQueue.updateTaskStatus(task.id, 'failed', err.message);
        console.log(`✗ [W${worker.id}] ${task.id}: ${err.message}`);
        await new Promise(r => setTimeout(r, FAST_BETWEEN_SET_WAIT_MS));
      }
    }
  }
}

// ============================================
// RESULT AGGREGATOR
// ============================================
class ResultAggregator {
  constructor(supabase) {
    this.supabase = supabase;
    this.stored = 0;
    this.failed = 0;
  }

  async storeResults(results) {
    console.log(`\n💾 STORING ${results.length} QUIZ SETS\n`);

    for (const result of results) {
      try {
        const { error } = await this.supabase
          .from('quiz_sets')
          .insert({
            chapter: result.chapter,
            subject: result.subject,
            questions: result.questions,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.log(`   ✗ ${result.taskId}: ${error.message}`);
          this.failed++;
        } else {
          console.log(`   ✓ ${result.taskId} stored`);
          this.stored++;
        }
      } catch (err) {
        console.log(`   ✗ ${result.taskId}: ${err.message}`);
        this.failed++;
      }
    }

    console.log(`\n✅ Storage Summary: ${this.stored} saved, ${this.failed} failed\n`);
    return { stored: this.stored, failed: this.failed };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log(`
╔════════════════════════════════════════╗
║  WORKER POOL QUIZ GENERATOR v2         ║
║  Pattern: Queue → Workers → Aggregator ║
╚════════════════════════════════════════╝
`);

  const pool = new WorkerPool(GROQ_KEYS, 5);
  const aggregator = new ResultAggregator(supabase);

  // Get existing chapter progress
  const { data: allSets } = await supabase
    .from('quiz_sets')
    .select('chapter, subject');

  const existingMap = {};
  if (allSets && Array.isArray(allSets)) {
    allSets.forEach(set => {
      const key = `${set.subject}_${set.chapter}`;
      existingMap[key] = (existingMap[key] || 0) + 1;
    });
  }

  // Queue tasks for chapters needing more sets
  let totalQueued = 0;
  for (const subject of Object.keys(CURRICULUM)) {
    const subjectData = CURRICULUM[subject];
    const units = Array.isArray(subjectData.units) ? subjectData.units : [];
    
    for (const unit of units) {
      const chapters = Array.isArray(unit.chapters) ? unit.chapters : [];
      for (const chapter of chapters) {
        const key = `${subject}_${chapter}`;
        const existing_count = existingMap[key] || 0;
        const needed = Math.max(0, TARGET_SETS - existing_count);

        if (needed > 0) {
          pool.addChapter(chapter, subject, needed);
          totalQueued += needed;
        }
      }
    }
  }

  console.log(`📋 TASK QUEUE INITIALIZED`);
  console.log(`   Chapters needing sets: ${Object.keys(existingMap).length}`);
  console.log(`   Total tasks queued: ${totalQueued}\n`);

  // Process queue
  const poolResult = await pool.processQueue();

  // Store results
  const storageResult = await aggregator.storeResults(pool.results);

  console.log(`
╔════════════════════════════════════════╗
║  GENERATION COMPLETE                   ║
╚════════════════════════════════════════╝

Processing Summary:
  Total Tasks: ${poolResult.total}
  Completed: ${poolResult.completed}
  Failed: ${poolResult.failed}
  
Storage Summary:
  Stored: ${storageResult.stored}
  Failed: ${storageResult.failed}

Workers Used: ${GROQ_KEYS.length}
Start Time: ${new Date().toLocaleString()}
`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
