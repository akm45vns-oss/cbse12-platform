/**
 * Ultra-Detailed Notes Generator - Dual API Parallel Processing
 *
 * Strategy:
 * - Gemini 2.0 Flash (Primary): Chapters 0-90 (91 chapters) - BULK/SPEED
 * - Groq Llama 4 Scout (Backup/Parallel): Chapters 91-181 (91 chapters)
 * - Both running in PARALLEL for maximum speed
 * - Ultra-detailed notes with all board exam focus
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CURRICULUM } from '../constants/curriculum.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_KEY;
const groqKey = process.env.VITE_GROQ_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey || !groqKey) {
  console.error("❌ Missing API credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM - All 182 chapters dynamically extracted
// ═══════════════════════════════════════════════════════════════════════════

// Extract all chapters from CURRICULUM
const CHAPTERS = [];
Object.entries(CURRICULUM).forEach(([subject, data]) => {
  data.units.forEach(unit => {
    unit.chapters.forEach(chapter => {
      CHAPTERS.push({ subject, chapter });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI 2.0 FLASH - Ultra-Detailed Notes Generator
// ═══════════════════════════════════════════════════════════════════════════
async function generateWithGemini(subject, chapter) {
  const prompt = `Generate ULTRA-DETAILED, comprehensive study notes for CBSE Class 12 Board Exams.

Subject: ${subject}
Chapter: ${chapter}

Create COMPLETE notes with ALL of the following sections in structured Markdown format:

## 📚 Chapter Overview
- Complete chapter summary (3-4 paragraphs)
- Importance in board exams
- Real-world applications

## 🎯 Key Concepts & Definitions
- Define all important terms (15-20 definitions)
- Provide context for each concept
- Link concepts to broader topics

## 📐 Important Formulas & Laws
- List all essential formulas/equations relevant to this chapter
- Explain each formula with variables
- Show practical applications
- Include SI units where applicable

## 💡 Real-World Examples & Applications
- 5-7 practical examples from daily life
- Industrial applications
- Medical/health implications where relevant
- Environmental significance

## ⚠️ Common Exam Mistakes & Solutions
- 3-4 common errors students make
- Why they make these mistakes
- Correct approach with examples
- Memory tricks to avoid mistakes

## 🏆 Board Exam Tips & Shortcuts
- Quick problem-solving methods
- Shortcut formulas
- Common question patterns
- How to score maximum marks
- Time management strategies

## 📝 Practice Questions
- 5 short answer questions (2-3 marks each)
- 3 detailed analytical questions (5 marks each)
- 2 numerical/calculation problems (with solutions)

## 🔄 Revision Notes (Quick Recall)
- Bullet-point summary of all key points
- Important diagrams/illustrations (describe how to draw)
- Mind map structure (in text format)

## 📊 Chapter Connections
- Link to previous chapters
- Connection to next chapters
- Cross-subject applications

## 🎓 Board Exam Value
- Estimated marks in board exam
- Question patterns (MCQ, Short Answer, Long Answer)
- Expected number of questions

Make notes ULTRA-DETAILED, well-structured, student-friendly, and board-focused. Use Markdown formatting.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (err) {
    console.error(`❌ Gemini error for ${subject} - ${chapter}:`, err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GROQ LLAMA 4 SCOUT - Ultra-Detailed Notes Generator (Backup)
// ═══════════════════════════════════════════════════════════════════════════
async function generateWithGroq(subject, chapter) {
  const prompt = `Generate ULTRA-DETAILED, comprehensive study notes for CBSE Class 12 Board Exams.

Subject: ${subject}
Chapter: ${chapter}

Create COMPLETE notes with ALL of the following sections in structured Markdown format:

## 📚 Chapter Overview
- Complete chapter summary (3-4 paragraphs)
- Importance in board exams
- Real-world applications

## 🎯 Key Concepts & Definitions
- Define all important terms (15-20 definitions)
- Provide context for each concept
- Link concepts to broader topics

## 📐 Important Formulas & Laws
- List all essential formulas/equations relevant to this chapter
- Explain each formula with variables
- Show practical applications
- Include SI units where applicable

## 💡 Real-World Examples & Applications
- 5-7 practical examples from daily life
- Industrial applications
- Medical/health implications where relevant
- Environmental significance

## ⚠️ Common Exam Mistakes & Solutions
- 3-4 common errors students make
- Why they make these mistakes
- Correct approach with examples
- Memory tricks to avoid mistakes

## 🏆 Board Exam Tips & Shortcuts
- Quick problem-solving methods
- Shortcut formulas
- Common question patterns
- How to score maximum marks
- Time management strategies

## 📝 Practice Questions
- 5 short answer questions (2-3 marks each)
- 3 detailed analytical questions (5 marks each)
- 2 numerical/calculation problems (with solutions)

## 🔄 Revision Notes (Quick Recall)
- Bullet-point summary of all key points
- Important diagrams/illustrations (describe how to draw)
- Mind map structure (in text format)

## 📊 Chapter Connections
- Link to previous chapters
- Connection to next chapters
- Cross-subject applications

## 🎓 Board Exam Value
- Estimated marks in board exam
- Question patterns (MCQ, Short Answer, Long Answer)
- Expected number of questions

Make notes ULTRA-DETAILED, well-structured, student-friendly, and board-focused. Use Markdown formatting.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 8000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error(`❌ Groq error for ${subject} - ${chapter}:`, err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE NOTES TO DATABASE
// ═══════════════════════════════════════════════════════════════════════════
async function saveNotesToDB(subject, chapter, content) {
  try {
    const { error } = await supabase.from('notes').insert({
      subject,
      chapter,
      content,
      created_at: new Date().toISOString(),
      word_count: content.split(/\s+/).length
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`❌ DB save error for ${subject} - ${chapter}:`, err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PARALLEL PROCESSING
// ═══════════════════════════════════════════════════════════════════════════
async function generateAllNotes() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🚀 ULTRA-DETAILED NOTES GENERATOR - DUAL API PARALLEL');
  console.log(`${'═'.repeat(70)}\n`);

  const geminiChapters = CHAPTERS.slice(0, Math.ceil(CHAPTERS.length / 2)); // First 91 (rounded)
  const groqChapters = CHAPTERS.slice(Math.ceil(CHAPTERS.length / 2)); // Remaining 91

  let geminiSuccess = 0, geminiFail = 0;
  let groqSuccess = 0, groqFail = 0;

  // Process Gemini chapters
  async function processGeminiChapters() {
    console.log(`\n📘 GEMINI 2.0 FLASH: Processing ${geminiChapters.length} chapters...`);
    for (let i = 0; i < geminiChapters.length; i++) {
      const { subject, chapter } = geminiChapters[i];
      const idx = `[${i + 1}/${geminiChapters.length}]`;

      try {
        process.stdout.write(`${idx} ${subject} - ${chapter}... `);
        const content = await generateWithGemini(subject, chapter);
        const saved = await saveNotesToDB(subject, chapter, content);
        if (saved) {
          console.log(`✅ (${(content.length / 1024).toFixed(1)}KB)`);
          geminiSuccess++;
        } else {
          console.log(`❌ DB error`);
          geminiFail++;
        }
      } catch (err) {
        console.log(`❌ ${err.message}`);
        geminiFail++;
      }

      // Rate limiting
      if (i < geminiChapters.length - 1) {
        await new Promise(r => setTimeout(r, 2000)); // 2s between requests
      }
    }
  }

  // Process Groq chapters
  async function processGroqChapters() {
    console.log(`\n🦜 GROQ LLAMA 4 SCOUT: Processing ${groqChapters.length} chapters...`);
    for (let i = 0; i < groqChapters.length; i++) {
      const { subject, chapter } = groqChapters[i];
      const idx = `[${i + 1}/${groqChapters.length}]`;

      try {
        process.stdout.write(`${idx} ${subject} - ${chapter}... `);
        const content = await generateWithGroq(subject, chapter);
        const saved = await saveNotesToDB(subject, chapter, content);
        if (saved) {
          console.log(`✅ (${(content.length / 1024).toFixed(1)}KB)`);
          groqSuccess++;
        } else {
          console.log(`❌ DB error`);
          groqFail++;
        }
      } catch (err) {
        console.log(`❌ ${err.message}`);
        groqFail++;
      }

      // Rate limiting
      if (i < groqChapters.length - 1) {
        await new Promise(r => setTimeout(r, 3000)); // 3s between requests (Groq has stricter limits)
      }
    }
  }

  // Run BOTH in PARALLEL
  console.log('\n⚡ Starting PARALLEL processing...\n');
  const startTime = Date.now();

  try {
    await Promise.all([
      processGeminiChapters(),
      processGroqChapters()
    ]);
  } catch (err) {
    console.error('⚠️ Parallel processing error:', err.message);
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('📊 GENERATION COMPLETE');
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n📘 GEMINI 2.0 FLASH:`);
  console.log(`   ✅ Success: ${geminiSuccess}/${geminiChapters.length}`);
  console.log(`   ❌ Failed:  ${geminiFail}/${geminiChapters.length}`);
  console.log(`\n🦜 GROQ LLAMA 4 SCOUT:`);
  console.log(`   ✅ Success: ${groqSuccess}/${groqChapters.length}`);
  console.log(`   ❌ Failed:  ${groqFail}/${groqChapters.length}`);
  console.log(`\n📈 TOTAL:`);
  console.log(`   ✅ Total Success: ${geminiSuccess + groqSuccess}/${CHAPTERS.length}`);
  console.log(`   ❌ Total Failed:  ${geminiFail + groqFail}/${CHAPTERS.length}`);
  console.log(`   ⏱️  Time Taken: ${duration} minutes`);
  console.log(`\n${'═'.repeat(70)}\n`);
}

// Run
generateAllNotes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
