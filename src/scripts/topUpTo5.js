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
  console.error("Missing credentials in .env.local");
  console.error("Required:");
  console.error("  VITE_SUPABASE_URL");
  console.error("  VITE_SUPABASE_ANON_KEY");
  console.error("  VITE_GROQ_KEY_1 (required)");
  console.error("Optional:");
  console.error("  VITE_GROQ_KEY_2 through VITE_GROQ_KEY_5 (for multi-account generation)");
  process.exit(1);
}

let keyIndex = 0; // Round-robin index for alternating between API keys
function getNextGroqKey() {
  const key = GROQ_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % GROQ_KEYS.length;
  return key;
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FAST_MODE = !process.argv.includes('--strict');
const chunkSizeArg = process.argv.find((arg) => arg.startsWith('--chunk-size='));
const FAST_CHUNK_SIZE = Math.max(5, Math.min(15, Number(chunkSizeArg?.split('=')[1] || 8)));
const retryWaitArg = process.argv.find((arg) => arg.startsWith('--retry-wait-ms='));
const setDelayArg = process.argv.find((arg) => arg.startsWith('--set-delay-ms='));
const chapterDelayArg = process.argv.find((arg) => arg.startsWith('--chapter-delay-ms='));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const subjectArg = process.argv.find((arg) => arg.startsWith('--subject='));
const maxSetAttemptsArg = process.argv.find((arg) => arg.startsWith('--max-set-attempts='));
const maxChapterRoundsArg = process.argv.find((arg) => arg.startsWith('--max-chapter-rounds='));
const targetSetsArg = process.argv.find((arg) => arg.startsWith('--target-sets='));

const FAST_RETRY_WAIT_MS = Math.max(1000, Number(retryWaitArg?.split('=')[1] || 2500));
const FAST_BETWEEN_SET_WAIT_MS = Math.max(0, Number(setDelayArg?.split('=')[1] || 1200));
const FAST_BETWEEN_CHAPTER_WAIT_MS = Math.max(0, Number(chapterDelayArg?.split('=')[1] || 2000));
const LIMIT = Number.isFinite(Number(limitArg?.split('=')[1])) ? Number(limitArg.split('=')[1]) : Infinity;
const SUBJECT_FILTER = subjectArg?.split('=')[1] || null;
const MAX_SET_ATTEMPTS = Math.max(2, Number(maxSetAttemptsArg?.split('=')[1] || 6));
const MAX_CHAPTER_ROUNDS = Math.max(2, Number(maxChapterRoundsArg?.split('=')[1] || 4));
const TARGET_SETS = Math.max(5, Number(targetSetsArg?.split('=')[1] || 8));

function normalizeQuestion(q) {
  if (!q || typeof q !== 'object') return null;

  const question = typeof q.q === 'string' ? q.q.trim() : '';
  const opts = Array.isArray(q.opts) ? q.opts.map((option) => String(option).trim()) : [];
  const ans = Number.isInteger(q.ans) ? q.ans : -1;
  const exp = typeof q.exp === 'string' ? q.exp.trim() : '';

  if (!question || opts.length !== 4 || ans < 0 || ans > 3) return null;

  return {
    q: question,
    opts,
    ans,
    exp: exp || 'Use the chapter concept and eliminate incorrect options logically.',
  };
}

async function fetchGroqContent(prompt, maxTokens = 2500, temperature = 0.4) {
  const currentKey = getNextGroqKey(); // Rotate through available API keys
  const MODEL_CANDIDATES = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  let lastError = 'No model returned a valid response';

  for (let m = 0; m < MODEL_CANDIDATES.length; m++) {
    const model = MODEL_CANDIDATES[m];
    const requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let err;
      try {
        err = JSON.parse(responseText);
      } catch {
        err = { message: responseText };
      }

      const errMsg = err.error?.message || err.message || responseText || `Groq API error ${response.status}`;
      lastError = `Model ${model} API ${response.status}: ${errMsg}`;

      if (response.status === 429) {
        console.log(`     ⏳ Rate limited on ${model}, waiting 60s...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
      continue;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) {
      lastError = `Model ${model} returned empty content`;
      continue;
    }

    return text;
  }

  throw new Error(lastError);
}

async function generateQuizSetsLocally(chapter, subject, numSetsToGenerate) {
  const allSets = [];

  if (FAST_MODE) {
    for (let setNum = 0; setNum < numSetsToGenerate; setNum++) {
      const targetSet = [];
      const seenQuestions = new Set();
      let attempts = 0;

      while (targetSet.length < 30 && attempts < MAX_SET_ATTEMPTS) {
        const remaining = 30 - targetSet.length;
        const chunkSize = Math.min(FAST_CHUNK_SIZE, remaining);
        const prompt = `Generate ${chunkSize} quiz questions for CBSE Class 12.
Chapter: "${chapter}" (${subject})

Return ONLY valid JSON array of ${chunkSize} objects.
Each object must have:
- q: question text
- opts: exactly 4 options
- ans: correct option index 0..3
- exp: short explanation, at least 12 words

Keep questions unique, practical, and directly relevant to the chapter.
No markdown. No extra text.`;

        try {
          const text = await fetchGroqContent(prompt, 1800, 0.35);
          let cleaned = text.replace(/```(json)?\s*\n?/g, '').replace(/```/g, '').trim();
          const start = cleaned.indexOf('[');
          const end = cleaned.lastIndexOf(']');
          if (start === -1 || end === -1 || start >= end) {
            throw new Error('No valid JSON found');
          }

          cleaned = cleaned.slice(start, end + 1);
          let parsed = JSON.parse(cleaned);
          if (!Array.isArray(parsed)) throw new Error('Invalid questions array');

          const cleanedChunk = parsed
            .map(normalizeQuestion)
            .filter(Boolean)
            .filter((q) => {
              const key = q.q.toLowerCase();
              if (seenQuestions.has(key)) return false;
              seenQuestions.add(key);
              return true;
            });

          for (const q of cleanedChunk) {
            if (targetSet.length < 30) {
              targetSet.push(q);
            }
          }

          console.log(`     ✓ Fast chunk added ${cleanedChunk.length} questions (${targetSet.length}/30)`);
        } catch (err) {
          attempts++;
          console.log(`     ⏳ Fast chunk retry ${attempts}/${MAX_SET_ATTEMPTS}: ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, FAST_RETRY_WAIT_MS));
        }
      }

      if (targetSet.length < 30) {
        console.log(`     ❌ Skipping set ${setNum + 1}/${numSetsToGenerate}: only ${targetSet.length} questions assembled`);
        continue;
      }

      allSets.push(targetSet.slice(0, 30));
    }

    return allSets;
  }

  for (let setNum = 0; setNum < numSetsToGenerate; setNum++) {
    const prompt = `Generate 1 quiz set for CBSE Class 12.
Chapter: "${chapter}" (${subject})

Create exactly 30 MCQs: 10 Easy, 10 Medium, 10 Hard.
Output ONLY valid JSON array with 30 question objects:
[{"q":"What is...","opts":["A text","B text","C text","D text"],"ans":0,"exp":"2-3 line explanation"},...30 total]

Rules:
- "opts" must have exactly 4 options.
- "ans" must be 0, 1, 2, or 3.
- "exp" is mandatory and at least 12 words.

No markdown, no extra text. ONLY JSON.`;

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      try {
        const text = await fetchGroqContent(prompt, 2500, 0.4);
        if (!text) throw new Error("Empty response");

        // Remove markdown
        text = text.replace(/```(json)?\s*\n?/g, "").replace(/```/g, "").trim();

        // Extract JSON strictly
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");

        if (start === -1 || end === -1 || start >= end) {
          throw new Error("No valid JSON found");
        }

        let json = text.slice(start, end + 1);

        // Parse JSON
        let questions = null;
        try {
          questions = JSON.parse(json);
        } catch (e) {
          // Try simple truncation fix
          const lastObj = json.lastIndexOf("}");
          if (lastObj > -1) {
            json = json.slice(0, lastObj + 1) + "]";
            questions = JSON.parse(json);
          } else {
            throw e;
          }
        }

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Invalid questions array");
        }

        const cleaned = questions.map(normalizeQuestion).filter(Boolean);

        if (cleaned.length < 30) {
          throw new Error(`Only ${cleaned.length} schema-valid questions returned`);
        }

        allSets.push(cleaned.slice(0, 30));
        success = true;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.log(`     ❌ Skipping set ${setNum + 1}/${numSetsToGenerate}: ${err.message}`);
          break;
        }
        console.log(`     ⏳ Retrying set ${setNum + 1}/${numSetsToGenerate} in ${FAST_RETRY_WAIT_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, FAST_RETRY_WAIT_MS));
      }
    }

    // Keep delays short in fast mode, longer in strict mode.
    if (setNum < numSetsToGenerate - 1) {
      await new Promise(r => setTimeout(r, FAST_MODE ? FAST_BETWEEN_SET_WAIT_MS : 60000));
    }
  }

  return allSets;
}

async function run() {
  console.log(`\n🎯 SMART LEVELING ALGORITHM - Water-Filling Strategy`);
  console.log(`Mode: ${FAST_MODE ? 'FAST' : 'STRICT'}`);
  console.log(`🔑 API Keys: ${GROQ_KEYS.length} Groq account(s) loaded (round-robin rotation enabled)`);
  console.log(`Target sets per chapter: ${TARGET_SETS}`);
  console.log(`Retry wait: ${FAST_RETRY_WAIT_MS}ms | set delay: ${FAST_BETWEEN_SET_WAIT_MS}ms | chapter delay: ${FAST_BETWEEN_CHAPTER_WAIT_MS}ms\n`);

  // Fetch all chapters
  let allRows = [], from = 0, to = 999, hasMore = true;
  while(hasMore) {
    const { data, error } = await supabase.from('quiz_sets').select('subject, chapter, set_number, questions').range(from, to);
    if (error) { console.error("Error:", error); return; }
    if (data.length > 0) {
      allRows.push(...data);
      from += 1000; to += 1000;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  const chapterData = {};
  allRows.forEach(row => {
    const key = `${row.subject}|||${row.chapter}`;
    if (!chapterData[key]) chapterData[key] = { subject: row.subject, chapter: row.chapter, validSets: new Set() };
    if (Array.isArray(row.questions) && row.questions.length === 30) {
      chapterData[key].validSets.add(row.set_number);
    }
  });

  // Include chapters with zero rows
  Object.entries(CURRICULUM).forEach(([subject, subjectData]) => {
    subjectData.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        const key = `${subject}|||${chapter}`;
        if (!chapterData[key]) {
          chapterData[key] = { subject, chapter, validSets: new Set() };
        }
      });
    });
  });

  // Filter by subject and limit if needed
  let allChapters = Object.values(chapterData);
  if (SUBJECT_FILTER) {
    allChapters = allChapters.filter((item) => item.subject.toLowerCase() === SUBJECT_FILTER.toLowerCase());
  }
  if (Number.isFinite(LIMIT)) {
    allChapters = allChapters.slice(0, LIMIT);
  }

  console.log(`📊 Total chapters to level: ${allChapters.length}`);
  console.log(`🎯 Target level: ${TARGET_SETS} sets per chapter\n`);

  // Smart leveling: water-filling algorithm
  let levelStep = 1;
  while (true) {
    // Find current min level across all chapters
    const minLevel = Math.min(...allChapters.map(ch => ch.validSets.size));
    const maxLevel = Math.max(...allChapters.map(ch => ch.validSets.size));

    if (minLevel >= TARGET_SETS) {
      console.log(`\n✅ ALL CHAPTERS COMPLETE! All ${allChapters.length} chapters have ${TARGET_SETS}+ sets.`);
      break;
    }

    // Find next level (first level above min)
    const nextLevel = Math.min(
      minLevel + 1,
      Math.min(...allChapters.filter(ch => ch.validSets.size > minLevel).map(ch => ch.validSets.size)),
      TARGET_SETS
    );

    // Find all chapters at min level
    const chaptersAtMin = allChapters.filter(ch => ch.validSets.size === minLevel);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 LEVEL STEP ${levelStep}: Raising ${chaptersAtMin.length} chapter(s) from ${minLevel} → ${nextLevel} sets`);
    console.log(`Chapters: ${chaptersAtMin.map(ch => `${ch.subject}-${ch.chapter}(${ch.validSets.size})`).join(', ')}`);
    console.log(`${'='.repeat(80)}`);

    // Generate sets ONLY for chapters at min level, until they reach nextLevel
    let levelSetsGenerated = 0;
    let levelSetsFailed = 0;

    for (let chapterIdx = 0; chapterIdx < chaptersAtMin.length; chapterIdx++) {
      const chapter = chaptersAtMin[chapterIdx];

      while (chapter.validSets.size < nextLevel) {
        // Assign next sequential set number (1, 2, 3, ...)
        const nextSetNum = chapter.validSets.size + 1;

        try {
          const setLabel = `${chapter.subject} - ${chapter.chapter} [Set #${nextSetNum}]`;
          console.log(`  [${chapterIdx + 1}/${chaptersAtMin.length}] ${setLabel} (${chapter.validSets.size}/${nextLevel})`);

          const sets = await generateQuizSetsLocally(chapter.chapter, chapter.subject, 1);
          
          if (!Array.isArray(sets) || sets.length === 0) {
            console.log(`    ⏭️ Skipped: generator returned empty`);
            levelSetsFailed++;
            await new Promise(r => setTimeout(r, FAST_BETWEEN_SET_WAIT_MS));
            continue;
          }

          const { error } = await supabase.from('quiz_sets').insert({
            subject: chapter.subject,
            chapter: chapter.chapter,
            set_number: nextSetNum,
            questions: sets[0],
            created_at: new Date().toISOString()
          });

          if (!error) {
            chapter.validSets.add(nextSetNum);
            levelSetsGenerated++;
            console.log(`    ✅ [Set #${nextSetNum}] Generated 30 questions with explanations`);
          } else {
            levelSetsFailed++;
            console.log(`    ❌ DB Error: ${error.message}`);
          }

          // Delay between sets
          await new Promise(r => setTimeout(r, FAST_BETWEEN_SET_WAIT_MS));
        } catch (err) {
          levelSetsFailed++;
          console.log(`    ⚠️ Failed: ${err.message}`);
          await new Promise(r => setTimeout(r, FAST_BETWEEN_SET_WAIT_MS));
        }
      }

      // Delay between chapters being worked on
      if (chapterIdx < chaptersAtMin.length - 1) {
        console.log(`  ⏳ Chapter gap wait...`);
        await new Promise(r => setTimeout(r, FAST_BETWEEN_CHAPTER_WAIT_MS));
      }
    }

    console.log(`Level ${levelStep} complete: ${levelSetsGenerated} generated, ${levelSetsFailed} failed`);
    levelStep++;
  }

  console.log(`\n🎉 Generation completed successfully!`);
  console.log(`All ${allChapters.length} chapters now have ${TARGET_SETS}+ sets each.`);
}

run();
