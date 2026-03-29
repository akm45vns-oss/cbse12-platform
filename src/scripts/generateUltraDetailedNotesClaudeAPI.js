/**
 * Ultra-Detailed Notes Generator - Claude API (Batch Processing)
 *
 * Strategy:
 * - Uses Claude API (faster, more reliable)
 * - Generates all 182 chapters
 * - Ultra-detailed notes (5000-7000 words per chapter)
 * - Smart batching to avoid rate limits
 * - Direct Supabase save
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { CURRICULUM } from '../constants/curriculum.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const claudeKey = process.env.VITE_CLAUDE_KEY;

if (!supabaseUrl || !supabaseKey || !claudeKey) {
  console.error("❌ Missing API credentials in .env.local");
  console.error("Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLAUDE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: claudeKey });

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
// GENERATE ULTRA-DETAILED NOTES WITH CLAUDE
// ═══════════════════════════════════════════════════════════════════════════
async function generateWithClaude(subject, chapter) {
  const prompt = `You are an expert CBSE Class 12 Board Exam educator. Generate ULTRA-DETAILED, comprehensive study notes for the following topic.

**Subject**: ${subject}
**Chapter**: ${chapter}

Create COMPLETE, in-depth notes with ALL of the following sections. Make it comprehensive, student-friendly, and focused on board exam success.

---

## 📚 Chapter Overview & Importance
- Detailed chapter summary (3-4 well-structured paragraphs covering all main topics)
- Why this chapter is important for CBSE board exams
- Real-world applications and relevance
- How this chapter connects to other chapters in the curriculum

## 🎯 Core Concepts & Comprehensive Definitions
- Define 15-20 important terms and concepts
- Provide detailed context for each concept
- Explain relationships between concepts
- Use examples to clarify abstract ideas
- Link concepts to practical applications

## 📐 Important Formulas, Laws & Equations
- List ALL essential formulas and equations for this chapter
- Explain each formula in detail with:
  - What each variable represents
  - Units and SI measurements
  - Conditions under which the formula applies
  - Derivation or proof (if important)
  - Common variations and special cases
- Include diagrams/illustrations (describe how to draw them)
- Practical applications of each formula

## 💡 Real-World Examples & Practical Applications
- 7-10 detailed real-world examples from daily life
- Industrial applications and uses
- Medical/health implications (where relevant)
- Environmental significance
- How to solve similar problems
- Step-by-step worked examples

## ⚠️ Common Student Mistakes & How to Avoid Them
- 5-6 common errors students make on board exams
- Why students make these mistakes (conceptual confusion)
- Correct approach with detailed explanations
- Quick memory tricks and mnemonics to avoid mistakes
- Common misconceptions and how to clarify them

## 🏆 Board Exam Tips, Tricks & Shortcuts
- Quick problem-solving methods for common question types
- Shortcut formulas and calculation techniques
- Common question patterns in board exams
- How to score maximum marks on exam questions
- Time management strategies
- Which topics are high-frequency in exams
- Bonus: Advanced problem-solving techniques

## 📝 Practice Questions with Complete Solutions
**Section A - Short Answer Questions (2-3 marks each):**
- 5 different short answer questions
- Complete solutions with step-by-step explanations
- Expected answer length and detail

**Section B - Long Answer Questions (5 marks each):**
- 4 detailed analytical/descriptive questions
- Full solutions with diagrams where needed
- How to structure answers for maximum marks
- Common follow-up questions

**Section C - Numerical Problems (with solutions):**
- 3 calculation-based problems
- Step-by-step solutions
- Alternative methods (if any)
- Common calculation mistakes

## 🔄 Quick Revision Notes (Bullet Points)
- Condensed bullet-point summary of ALL key concepts
- Step-by-step checklists for problem-solving
- Important diagrams (describe how to draw each)
- Mind map structure (in text format)
- Flowcharts for processes (in text format)
- Important classifications and categories

## 🔗 Chapter Connections & Integration
- How this chapter relates to PREVIOUS chapters
- Foundation concepts from earlier units
- Connection to NEXT chapters
- Cross-subject applications (Physics concepts in Chemistry, etc.)
- Overall topic importance in the subject

## 📊 Board Exam Strategy & Expected Questions
- Estimated marks allocation in board exams (out of 100)
- Question distribution: MCQ, Short Answer, Long Answer
- Expected number of questions from this chapter
- Which concepts are HIGH FREQUENCY on exams
- Which concepts are MODERATE/LOW frequency
- Likely question patterns and variations

## 🎓 Advanced Concepts & Beyond the Syllabus
- Extensions of concepts for deeper understanding
- Related topics not in the syllabus but helpful
- How this topic connects to competitors/entrance exams
- Advanced applications worth knowing

---

**Format Requirements:**
- Use clear Markdown formatting with proper headings
- Bold important terms and concepts
- Use bullet points for easy scanning
- Include numerical data, statistics, and facts where relevant
- Make it engaging and easy to read
- Aim for 5000-7000 words of high-quality content
- Every section should be substantial and thorough
- Focus on exam success and concept clarity

Generate ULTRA-DETAILED, comprehensive notes optimized for CBSE Class 12 board exam preparation.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    console.error(`❌ Claude error for ${subject} - ${chapter}:`, err.message);
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
      api_used: 'claude-3-5-sonnet'
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`❌ DB save error for ${subject} - ${chapter}:`, err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATION LOOP
// ═══════════════════════════════════════════════════════════════════════════
async function generateAllNotes() {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('🚀 ULTRA-DETAILED NOTES GENERATOR - CLAUDE API');
  console.log(`${'═'.repeat(80)}\n`);

  let success = 0;
  let failed = 0;
  const failedChapters = [];

  const startTime = Date.now();

  for (let i = 0; i < CHAPTERS.length; i++) {
    const { subject, chapter } = CHAPTERS[i];
    const idx = `[${i + 1}/${CHAPTERS.length}]`;

    try {
      process.stdout.write(`${idx} ${subject} - ${chapter}... `);

      const content = await generateWithClaude(subject, chapter);
      const wordCount = content.split(/\s+/).length;

      const saved = await saveNotesToDB(subject, chapter, content);

      if (saved) {
        console.log(`✅ (${wordCount} words, ${(content.length / 1024).toFixed(1)}KB)`);
        success++;
      } else {
        console.log(`❌ DB error`);
        failed++;
        failedChapters.push({ subject, chapter });
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
      failedChapters.push({ subject, chapter });
    }

    // Rate limiting: Claude is fast, but let's be respectful
    // Add 1 second delay between requests
    if (i < CHAPTERS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 GENERATION COMPLETE');
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n✅ Success: ${success}/${CHAPTERS.length}`);
  console.log(`❌ Failed:  ${failed}/${CHAPTERS.length}`);
  console.log(`⏱️  Time Taken: ${duration} minutes`);
  console.log(`📈 Average: ${(duration * 60 / CHAPTERS.length).toFixed(1)}s per chapter`);

  if (failedChapters.length > 0) {
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
