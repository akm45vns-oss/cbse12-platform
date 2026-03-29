/**
 * Ultra-Detailed Notes Generator - Groq API
 *
 * Uses Groq's fast llama-3.1-8b-instant model
 * Generates comprehensive notes for all 182 chapters
 * Smart rate limiting and batching
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKey = process.env.VITE_GROQ_KEY;

if (!supabaseUrl || !supabaseKey || !groqKey) {
  console.error("❌ Missing credentials in .env.local");
  console.error("Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GROQ_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract all chapters from CURRICULUM
const CHAPTERS = [];
Object.entries(CURRICULUM).forEach(([subject, data]) => {
  data.units.forEach(unit => {
    unit.chapters.forEach(chapter => {
      CHAPTERS.push({ subject, chapter });
    });
  });
});

console.log(`📚 Total chapters to generate: ${CHAPTERS.length}`);

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE ULTRA-DETAILED NOTES WITH GROQ
// ═══════════════════════════════════════════════════════════════════════════
async function generateWithGroq(subject, chapter) {
  const prompt = `You are an expert CBSE Class 12 educator. Create ULTRA-DETAILED comprehensive study notes.

Subject: ${subject}
Chapter: ${chapter}

Generate complete notes with ALL sections:

## 📚 Chapter Overview & Importance
- Detailed 3-4 paragraph summary
- Importance for board exams
- Real-world applications
- Connections to other chapters

## 🎯 Key Concepts & Definitions
- 15-20 important terms with detailed explanations
- Context and practical applications
- Relationships between concepts

## 📐 Formulas, Laws & Equations
- ALL essential formulas with:
  - Variable explanations
  - SI units
  - Application conditions
  - Derivations if important
  - Practical examples

## 💡 Real-World Examples
- 7-10 detailed practical examples
- Industrial/medical applications
- Step-by-step solved examples

## ⚠️ Common Mistakes & Solutions
- 5-6 student errors
- Why these mistakes happen
- Correct approaches
- Memory tricks

## 🏆 Board Exam Tips & Shortcuts
- Quick problem-solving methods
- Common question patterns
- Time management strategies
- High-frequency topics

## 📝 Practice Questions
- 5 Short Answer (2-3 marks each)
- 4 Long Answer (5 marks each)
- 3 Numerical Problems (with solutions)

## 🔄 Quick Revision Notes
- Bullet-point summaries
- Important diagrams (describe)
- Mind maps and flowcharts (text format)
- Key classifications

## 🔗 Chapter Connections
- Links to previous chapters
- Connections to next chapters
- Cross-subject applications

## 📊 Board Exam Strategy
- Estimated marks in exam
- Question distribution (MCQ/Short/Long)
- High-frequency vs low-frequency topics
- Expected question patterns

Make notes comprehensive, well-structured, 4000-5000 words, focused on board exam success.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 4000,
        temperature: 0.6,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 429) {
        throw new Error(`Rate limit (429): ${error.substring(0, 100)}`);
      }
      throw new Error(`Groq API ${response.status}: ${error.substring(0, 100)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE TO SUPABASE
// ═══════════════════════════════════════════════════════════════════════════
async function saveNotesToDB(subject, chapter, content) {
  try {
    const { error } = await supabase.from('notes').insert({
      subject,
      chapter,
      content,
      created_at: new Date().toISOString(),
      word_count: content.split(/\s+/).length,
      api_used: 'groq-llama-3.1-8b'
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`❌ DB error: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATION LOOP
// ═══════════════════════════════════════════════════════════════════════════
async function generateAllNotes() {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('🚀 ULTRA-DETAILED NOTES GENERATOR - GROQ API');
  console.log(`${'═'.repeat(80)}\n`);

  let success = 0;
  let failed = 0;
  let rateLimited = 0;
  const failedChapters = [];

  const startTime = Date.now();

  for (let i = 0; i < CHAPTERS.length; i++) {
    const { subject, chapter } = CHAPTERS[i];
    const idx = `[${i + 1}/${CHAPTERS.length}]`;

    let retries = 0;
    let generated = false;

    while (retries < 3 && !generated) {
      try {
        process.stdout.write(`${idx} ${subject} - ${chapter}... `);

        const content = await generateWithGroq(subject, chapter);
        const wordCount = content.split(/\s+/).length;

        const saved = await saveNotesToDB(subject, chapter, content);

        if (saved) {
          console.log(`✅ (${wordCount} words)`);
          success++;
          generated = true;
        } else {
          console.log(`❌ DB error`);
          failed++;
          failedChapters.push({ subject, chapter });
          generated = true;
        }
      } catch (err) {
        if (err.message.includes('429')) {
          rateLimited++;
          console.log(`⏳ Rate limited (429)`);

          // Wait longer on rate limit
          const waitTime = (retries + 1) * 60000; // 1min, 2min, 3min
          console.log(`   Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(r => setTimeout(r, waitTime));
          retries++;
        } else {
          console.log(`❌ ${err.message.substring(0, 50)}`);
          failed++;
          failedChapters.push({ subject, chapter });
          generated = true;
        }
      }
    }

    // Rate limiting between chapters (3 seconds to be safe)
    if (i < CHAPTERS.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 GENERATION COMPLETE');
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n✅ Success: ${success}/${CHAPTERS.length}`);
  console.log(`⏳ Rate Limited: ${rateLimited}`);
  console.log(`❌ Failed:  ${failed}/${CHAPTERS.length}`);
  console.log(`⏱️  Total Time: ${duration} minutes`);
  console.log(`📈 Average: ${(duration * 60 / CHAPTERS.length).toFixed(1)}s per chapter`);

  if (failedChapters.length > 0 && failedChapters.length < 20) {
    console.log(`\n⚠️  Failed Chapters:`);
    failedChapters.forEach(({ subject, chapter }) => {
      console.log(`   - ${subject}: ${chapter}`);
    });
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

// Run
generateAllNotes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
