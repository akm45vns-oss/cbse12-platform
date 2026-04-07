import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKeys = [
  process.env.VITE_GROQ_KEY_1,
  process.env.VITE_GROQ_KEY_2,
  process.env.VITE_GROQ_KEY_3,
  process.env.VITE_GROQ_KEY_4,
  process.env.VITE_GROQ_KEY_5
].filter(Boolean);

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_SETS_PER_CHAPTER = 8;
const FAST_CHUNK_SIZE = 4;

async function generateQuestion(chapter, subject, groqKeys, keyIndex = 0) {
  const key = groqKeys[keyIndex % groqKeys.length];
  
  const prompt = `Generate exactly ${FAST_CHUNK_SIZE} unique multiple-choice questions for CBSE Class 12 ${subject} Chapter "${chapter}".

Format each as:
Q: [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Ans: [A/B/C/D]
Explain: [Brief explanation]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
      timeout: 15000,
    });

    if (!response.ok) {
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 30000));
        return generateQuestion(chapter, subject, groqKeys, keyIndex + 1);
      }
      return null;
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    
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
          explanation: explain || ''
        });
      }
    }
    
    return questions.length > 0 ? questions : null;
  } catch (err) {
    console.log(`⚠ API error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║  🎯 SMART TARGETED GENERATOR - FINAL PUSH  ║
║  Only generates missing sets               ║
╚════════════════════════════════════════════╝
`);

  // Get existing sets
  const { data: existing } = await supabase.from('quiz_sets').select('subject, chapter, set_number');
  const existingMap = {};
  if (existing) {
    existing.forEach(s => {
      const key = `${s.subject}_${s.chapter}_${s.set_number}`;
      existingMap[key] = true;
    });
  }

  // Build list of ONLY NEEDED sets
  const neededSets = [];
  for (const subject of Object.keys(CURRICULUM)) {
    const subjectData = CURRICULUM[subject];
    const units = Array.isArray(subjectData.units) ? subjectData.units : [];
    
    for (const unit of units) {
      const chapters = Array.isArray(unit.chapters) ? unit.chapters : [];
      for (const chapter of chapters) {
        for (let setNum = 1; setNum <= TARGET_SETS_PER_CHAPTER; setNum++) {
          const key = `${subject}_${chapter}_${setNum}`;
          if (!existingMap[key]) {
            neededSets.push({ subject, chapter, setNum });
          }
        }
      }
    }
  }

  console.log(`📋 Target: ${neededSets.length} specific sets needed\n`);

  let generated = 0;
  let failed = 0;
  const startTime = Date.now();

  // Generate only the needed sets
  for (const task of neededSets) {
    const questions = await generateQuestion(task.chapter, task.subject, groqKeys);
    
    if (!questions || questions.length < FAST_CHUNK_SIZE) {
      failed++;
      console.log(`⚠ [${task.subject}_${task.chapter}_set${task.setNum}] incomplete (${questions?.length || 0}/4 qs)`);
      continue;
    }

    // Store to database
    const { error } = await supabase.from('quiz_sets').insert({
      subject: task.subject,
      chapter: task.chapter,
      set_number: task.setNum,
      questions,
      created_at: new Date().toISOString()
    });

    if (error) {
      if (!error.message.includes('duplicate')) {
        console.log(`DB Error: ${error.message}`);
        failed++;
      }
    } else {
      generated++;
      console.log(`✓ ${task.subject} - ${task.chapter} (set ${task.setNum})`);
      
      if (generated % 50 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = (generated / elapsed).toFixed(2);
        console.log(`\n📊 Progress: ${generated} generated @ ${rate} sets/sec\n`);
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  const totalTime = (Date.now() - startTime) / 1000;
  
  // Get final count
  const { data: allSets } = await supabase.from('quiz_sets').select('*');
  const finalCount = allSets ? allSets.length : 0;

  console.log(`
╔════════════════════════════════════════════╗
║            ✅ GENERATION COMPLETE          ║
╚════════════════════════════════════════════╝

Generated: ${generated} new sets
Failed: ${failed}
Time: ${(totalTime / 60).toFixed(1)} minutes
Final total: ${finalCount} / 1,454
Progress: ${((finalCount / 1454) * 100).toFixed(1)}%
`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
