import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKey1 = process.env.VITE_GROQ_KEY_1 || process.env.VITE_GROQ_KEY;
const groqKey2 = process.env.VITE_GROQ_KEY_2 || null;
const groqKey3 = process.env.VITE_GROQ_KEY_3 || null;
const groqKey4 = process.env.VITE_GROQ_KEY_4 || null;
const groqKey5 = process.env.VITE_GROQ_KEY_5 || null;
const GROQ_KEYS = [groqKey1, groqKey2, groqKey3, groqKey4, groqKey5].filter(Boolean);

if (!supabaseUrl || !supabaseKey || GROQ_KEYS.length === 0) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_SETS = 1454;
const TARGET_SETS_PER_CHAPTER = 8;
const TOTAL_CHAPTERS = 182;

// FAST OPTIMIZATIONS
const FAST_CHUNK_SIZE = 4; // Smaller chunks = faster requests
const FAST_MODEL_PRIMARY = 'llama-3.1-8b-instant'; // Faster model first
const FALLBACK_MODEL = 'llama-3.3-70b-versatile'; // Quality fallback
const CONCURRENT_WORKERS = 5; // Use all 5 API keys in parallel
const TASK_QUEUE_DEPTH = 15; // Keep 15 tasks queued for workers
const RATE_LIMIT_WAIT = 30000; // 30s instead of 60s
const DELAY_BETWEEN_SETS = 500; // Minimal delay
const DELAY_BETWEEN_CHAPTERS = 1000; // Minimal delay

// ============================================
// FAST TASK QUEUE
// ============================================
class FastTaskQueue {
  constructor() {
    this.queue = [];
    this.processing = new Set();
  }

  add(chapter, subject, setNum) {
    this.queue.push({
      id: `${subject}_${chapter}_set${setNum}`,
      chapter,
      subject,
      setNum,
      status: 'pending',
      addedAt: Date.now()
    });
  }

  getNext() {
    while (this.queue.length > 0 && this.processing.size < CONCURRENT_WORKERS) {
      const task = this.queue.shift();
      this.processing.add(task.id);
      return task;
    }
    return null;
  }

  markComplete(taskId) {
    this.processing.delete(taskId);
  }

  allDone() {
    return this.queue.length === 0 && this.processing.size === 0;
  }

  getPendingCount() {
    return this.queue.length + this.processing.size;
  }
}

// ============================================
// FAST GROQ API CALLER
// ============================================
class FastGroqCaller {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
    this.keyIndex = 0;
  }

  getNextKey() {
    const key = this.apiKeys[this.keyIndex % this.apiKeys.length];
    this.keyIndex++;
    return key;
  }

  async callAPI(prompt, model) {
    let lastError;
    
    for (let keyIdx = 0; keyIdx < this.apiKeys.length; keyIdx++) {
      const key = this.getNextKey();
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
          }),
          timeout: 15000,
        });

        if (!response.ok) {
          if (response.status === 429) {
            lastError = '429-rate-limited';
            continue;
          }
          lastError = `HTTP ${response.status}`;
          continue;
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (err) {
        lastError = err.message;
      }
    }

    if (lastError === '429-rate-limited') {
      throw new Error('ALL_KEYS_RATE_LIMITED');
    }
    throw new Error(`API_FAILED: ${lastError}`);
  }
}

// ============================================
// FAST QUESTION GENERATOR
// ============================================
async function generateQuestions(chapter, subject, groqCaller, attemptsLeft = 5) {
  if (attemptsLeft <= 0) return [];

  const prompt = `Generate exactly ${FAST_CHUNK_SIZE} unique multiple-choice questions for CBSE Class 12 ${subject} Chapter "${chapter}".

Format each as:
Q: [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Ans: [A/B/C/D]
Explain: [Brief explanation]

Each question must be distinct, relevant, and exam-level difficulty.`;

  try {
    // Try fast model first
    let response = await groqCaller.callAPI(prompt, FAST_MODEL_PRIMARY);
    if (!response) {
      // Fallback to quality model
      response = await groqCaller.callAPI(prompt, FALLBACK_MODEL);
    }

    const questions = parseQuestions(response);
    return questions;
  } catch (err) {
    if (err.message === 'ALL_KEYS_RATE_LIMITED') {
      console.log(`      ⏳ Rate limited, waiting ${RATE_LIMIT_WAIT / 1000}s...`);
      await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT));
      return generateQuestions(chapter, subject, groqCaller, attemptsLeft - 1);
    }
    console.log(`      ✗ API error: ${err.message}`);
    return [];
  }
}

function parseQuestions(text) {
  const questions = [];
  const blocks = text.split('\n\n');

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 7) continue;

    const question = lines[0]?.replace(/^Q:\s*/, '')?.trim();
    const optA = lines[1]?.replace(/^A\)\s*/, '')?.trim();
    const optB = lines[2]?.replace(/^B\)\s*/, '')?.trim();
    const optC = lines[3]?.replace(/^C\)\s*/, '')?.trim();
    const optD = lines[4]?.replace(/^D\)\s*/, '')?.trim();
    const answer = lines[5]?.match(/[A-D]/)?.[0];
    const explain = lines[6]?.replace(/^Explain:\s*/, '')?.trim();

    if (question && optA && optB && optC && optD && answer) {
      questions.push({
        question,
        options: [optA, optB, optC, optD],
        correct_answer: answer,
        explanation: explain || 'See explanation'
      });
    }
  }

  return questions;
}

// ============================================
// FAST GENERATOR MAIN
// ============================================
async function fastGenerate() {
  console.log(`
╔════════════════════════════════════════════╗
║  ⚡ FAST QUIZ GENERATOR v2 - TURBO MODE   ║
║  5 Parallel Workers + Optimized API Calls ║
╚════════════════════════════════════════════╝
`);

  const groqCaller = new FastGroqCaller(GROQ_KEYS);
  const taskQueue = new FastTaskQueue();
  const results = [];
  let generated = 0;

  // Get existing progress
  const { data: allSets } = await supabase.from('quiz_sets').select('chapter, subject');
  const existingMap = {};
  if (allSets) {
    allSets.forEach(set => {
      const key = `${set.subject}_${set.chapter}`;
      existingMap[key] = (existingMap[key] || 0) + 1;
    });
  }

  // Build task queue
  let totalTasks = 0;
  for (const subject of Object.keys(CURRICULUM)) {
    const subjectData = CURRICULUM[subject];
    const units = Array.isArray(subjectData.units) ? subjectData.units : [];
    
    for (const unit of units) {
      const chapters = Array.isArray(unit.chapters) ? unit.chapters : [];
      for (const chapter of chapters) {
        const key = `${subject}_${chapter}`;
        const existing = existingMap[key] || 0;
        const needed = Math.max(0, TARGET_SETS_PER_CHAPTER - existing);
        
        for (let i = 0; i < needed; i++) {
          taskQueue.add(chapter, subject, i + 1 + existing);
          totalTasks++;
        }
      }
    }
  }

  console.log(`📋 Task queue created: ${totalTasks} sets needed`);
  console.log(`⚡ Starting ${CONCURRENT_WORKERS} parallel workers...\n`);

  const startTime = Date.now();

  // Process task queue with parallel workers
  while (!taskQueue.allDone()) {
    const workers = [];

    // Launch up to CONCURRENT_WORKERS tasks
    for (let i = 0; i < CONCURRENT_WORKERS; i++) {
      const task = taskQueue.getNext();
      if (!task) break;

      const worker = (async () => {
        try {
          const questions = await generateQuestions(task.chapter, task.subject, groqCaller);
          
          if (questions.length >= FAST_CHUNK_SIZE) {
            results.push({
              chapter: task.chapter,
              subject: task.subject,
              set_number: task.setNum,
              questions,
              created_at: new Date().toISOString()
            });
            generated++;
            console.log(`✓ [W${i + 1}] ${task.subject} - ${task.chapter} (set ${task.setNum})`);
          } else {
            console.log(`⚠ [W${i + 1}] ${task.subject} - ${task.chapter}: only ${questions.length} qs`);
          }
        } catch (err) {
          console.log(`✗ [W${i + 1}] ${task.id}: ${err.message}`);
        } finally {
          taskQueue.markComplete(task.id);
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_SETS));
        }
      })();

      workers.push(worker);
    }

    // Wait for workers to complete
    if (workers.length > 0) {
      await Promise.all(workers);

      // Store completed results
      for (const result of results) {
        const { error } = await supabase
          .from('quiz_sets')
          .insert({
            chapter: result.chapter,
            subject: result.subject,
            set_number: result.set_number,
            questions: result.questions,
            created_at: result.created_at
          });

        if (error) {
          console.log(`DB Error: ${error.message}`);
        }
      }
      results.length = 0;

      // Log progress every 10 sets
      if (generated % 10 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = (generated / elapsed).toFixed(2);
        console.log(`\n📊 Progress: ${generated} sets in ${(elapsed / 60).toFixed(1)}m @ ${rate} sets/sec\n`);
      }
    }

    // Small delay before next batch
    if (!taskQueue.allDone()) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalRate = (generated / totalTime).toFixed(2);

  console.log(`
╔════════════════════════════════════════════╗
║         ✅ GENERATION COMPLETE            ║
╚════════════════════════════════════════════╝

Generated: ${generated} new sets
Time: ${(totalTime / 60).toFixed(1)} minutes
Rate: ${finalRate} sets/sec
Speed improvement: ${(finalRate / 2.46).toFixed(1)}x vs slow version
`);

  process.exit(0);
}

fastGenerate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
