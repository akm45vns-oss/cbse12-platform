/**
 * Seed script to generate 15 quiz sets (30 MCQs each) per chapter
 * Each set has: 5 easy, 5 medium, 5 hard questions
 * Run from browser console or Node.js
 */

import { callClaude, extractJSON } from "../utils/api";
import { supabase } from "../utils/supabase";
import { CURRICULUM } from "../constants/curriculum";

export async function seedQuizSets() {
  console.log("🚀 Starting quiz sets generation...\n");

  const subjects = Object.keys(CURRICULUM);
  let totalSets = 0;
  let totalQuestions = 0;

  for (const subject of subjects) {
    const chapters = CURRICULUM[subject].chapters || [];
    console.log(`\n📚 ${subject} (${chapters.length} chapters)`);

    for (const chapter of chapters) {
      process.stdout.write(`  ✏️ ${chapter}...`);

      try {
        // Generate 15 sets for this chapter
        const sets = await generateQuizSets(subject, chapter);

        if (!sets || sets.length === 0) {
          console.log(" ❌ FAILED - No questions generated");
          continue;
        }

        // Save to database
        for (let i = 0; i < sets.length; i++) {
          const { error } = await supabase.from("quiz_sets").upsert(
            {
              subject,
              chapter,
              set_number: i + 1,
              questions: sets[i],
              created_at: new Date().toISOString()
            },
            { onConflict: "subject,chapter,set_number" }
          );

          if (error) {
            console.log(` ❌ SET ${i + 1} SAVE FAILED`);
            console.error(error);
            continue;
          }
        }

        totalSets += sets.length;
        totalQuestions += sets.reduce((sum, set) => sum + set.length, 0);
        console.log(` ✓ 15 sets saved (${sets[0]?.length || 0} Q each)`);
      } catch (err) {
        console.log(` ❌ ERROR: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ COMPLETE!\n📊 ${totalSets} sets | ${totalQuestions} total questions`);
  return { totalSets, totalQuestions };
}

/**
 * Generate 15 quiz sets for a chapter
 * Each set has 5 easy + 5 medium + 5 hard questions
 */
async function generateQuizSets(subject, chapter) {
  const prompt = `Generate 15 COMPLETELY DIFFERENT quiz sets for "${chapter}" in ${subject}.

IMPORTANT: Each set must have DIFFERENT questions (no repeats across sets).

For EACH of the 15 sets, generate exactly 30 multiple-choice questions with this structure:
- 5 EASY questions (direct concept application, straightforward)
- 5 MEDIUM questions (require understanding and basic analysis)
- 5 HARD questions (application, analysis, synthesis level - board exam standard)

Each question must follow this JSON format:
{
  "q": "Question text (clear and unambiguous)",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans": 0,
  "exp": "Detailed explanation of why answer is correct"
}

Return ALL 15 sets as a JSON array. Example structure:
[
  [
    {"q": "Question 1", "opts": [...], "ans": 0, "exp": "..."},
    ...30 questions for set 1...
  ],
  [
    ...30 questions for set 2...
  ],
  ...
  [
    ...30 questions for set 15...
  ]
]

RULES:
- Total: 15 sets × 30 questions = 450 questions
- CBSE Class 12 board exam level
- 100% ORIGINAL content (no copying)
- Each option must be plausible but clearly distinguishable
- Ans value: 0-3 (index of correct option)
- Explanations: 2-3 sentences`;

  try {
    const response = await callClaude(prompt, 4000);
    const sets = extractJSON(response);

    // Validate structure
    if (!Array.isArray(sets) || sets.length !== 15) {
      throw new Error(`Expected 15 sets, got ${sets.length}`);
    }

    // Validate each set
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      if (!Array.isArray(set) || set.length !== 30) {
        throw new Error(`Set ${i + 1}: Expected 30 questions, got ${set.length}`);
      }

      // Validate questions in set
      for (let j = 0; j < set.length; j++) {
        const q = set[j];
        if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || typeof q.ans !== "number" || !q.exp) {
          throw new Error(`Set ${i + 1}, Question ${j + 1}: Invalid structure`);
        }
      }
    }

    return sets;
  } catch (err) {
    console.error(`  Error generating sets: ${err.message}`);
    return null;
  }
}

// Run in browser console: seedQuizSets()
// Or use directly in Node.js with proper environment setup
