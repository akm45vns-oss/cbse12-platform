import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_SETS = 1454;
const TARGET_SETS_PER_CHAPTER = 8;
const TOTAL_CHAPTERS = 182;
let lastTotal = 0;
let setsPerSecond = 0;
let startTime = Date.now();

function formatProgressBar(current, total, width = 50) {
  const percentage = current / total;
  const filledWidth = Math.round(percentage * width);
  const emptyWidth = width - filledWidth;
  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
  const percent = (percentage * 100).toFixed(1);
  return `${bar} ${percent}%`;
}

function getETA(current, total, setsSec) {
  if (setsSec <= 0) return "calculating...";
  const remaining = total - current;
  const secondsLeft = remaining / setsSec;
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = Math.floor(secondsLeft % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

async function monitorProgress() {
  try {
    const { data: allSets } = await supabase
      .from('quiz_sets')
      .select('chapter, subject');

    if (!Array.isArray(allSets)) {
      console.error('Invalid data from Supabase');
      return;
    }

    const total = allSets.length;
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - startTime) / 1000;

    // Calculate sets per second
    if (elapsedSeconds > 0) {
      setsPerSecond = total / elapsedSeconds;
    }

    // Analyze chapters
    const byChapter = {};
    allSets.forEach(q => {
      const key = `${q.subject}_${q.chapter}`;
      byChapter[key] = (byChapter[key] || 0) + 1;
    });

    const chaptersWithSets = Object.keys(byChapter).length;
    const chapter8Count = Object.values(byChapter).filter(c => c === 8).length;
    const chapterCounts = Object.values(byChapter).sort((a, b) => b - a);
    const avgPerChapter = (total / chaptersWithSets).toFixed(2);
    const minPerChapter = Math.min(...chapterCounts);
    const maxPerChapter = Math.max(...chapterCounts);

    // Calculate progress
    const progressPercent = ((total / TARGET_SETS) * 100).toFixed(1);
    const remaining = TARGET_SETS - total;
    const eta = getETA(total, TARGET_SETS, setsPerSecond);

    // Determine current phase
    const avgLevel = Math.floor(total / TOTAL_CHAPTERS);
    let phase = '';
    if (avgLevel === 1) phase = 'Level 1 (all chapters at 1+)';
    else if (avgLevel === 2) phase = 'Leveling → 2-3 sets/chapter';
    else if (avgLevel === 3) phase = 'Leveling → 3-4 sets/chapter';
    else if (avgLevel === 4) phase = 'Leveling → 4-5 sets/chapter';
    else if (avgLevel === 5) phase = 'Leveling → 5-6 sets/chapter';
    else if (avgLevel === 6) phase = 'Leveling → 6-7 sets/chapter';
    else if (avgLevel === 7) phase = 'Final leveling → 8 sets/chapter';

    // Clear screen and display
    console.clear();
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         📊 CBSE QUIZ GENERATION - LIVE MONITOR              ║
╚══════════════════════════════════════════════════════════════╝

⏱️  OVERALL PROGRESS
   ${formatProgressBar(total, TARGET_SETS, 55)}
   ${total} / ${TARGET_SETS} sets generated

📈 GENERATION RATE
   ⚡ Rate: ${setsPerSecond.toFixed(2)} sets/sec
   ⏳ ETA: ${eta}
   ⌚ Elapsed: ${(elapsedSeconds / 60).toFixed(1)} minutes

📚 CHAPTER STATUS
   ✓ Chapters with sets: ${chaptersWithSets} / ${TOTAL_CHAPTERS}
   ✓ Complete (8 sets): ${chapter8Count}
   📊 Average per chapter: ${avgPerChapter}
   🔢 Range: ${minPerChapter} - ${maxPerChapter} sets

🎯 CURRENT PHASE
   ${phase}

📋 REMAINING WORK
   Sets needed: ${remaining}
   
💾 PROCESS STATUS
   Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB
   PID: ${process.pid}

─────────────────────────────────────────────────────────────
Latest update: ${new Date().toLocaleTimeString()}
Refreshing every 5 seconds... (Press Ctrl+C to stop)
`);

  } catch (err) {
    console.error('Monitor error:', err.message);
  }
}

// Initial run
monitorProgress();

// Refresh every 5 seconds
setInterval(monitorProgress, 5000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✅ Monitor stopped');
  process.exit(0);
});
