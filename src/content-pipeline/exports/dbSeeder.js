import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const CLASS_LEVEL = process.argv[2] || "11";

function cleanOptionText(opt) {
  if (!opt) return "";
  return opt.replace(/^\(([A-D])\)\s*/i, '').replace(/^[A-D]\.\s*/i, '').trim();
}

function letterToIndex(letter) {
  if (typeof letter !== "string") return 0;
  const l = letter.trim().toUpperCase().replace(/[^A-D]/g, '');
  const map = { A: 0, B: 1, C: 2, D: 3 };
  return map[l] !== undefined ? map[l] : 0;
}

async function main() {
  console.log("=== CBSE Class 11 Database Seeder ===");
  console.log("Loading generated content from content_library...");

  // Fetch all generated rows for Class 11
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("content_library")
      .select("subject, chapter, content_type, data")
      .eq("class_level", CLASS_LEVEL)
      .eq("is_valid", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Failed to fetch content_library:", error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allRows.length} content rows from database.`);

  // Group by chapter
  // key: "Subject||Chapter"
  const chaptersMap = {};

  for (const row of allRows) {
    const key = `${row.subject}||${row.chapter}`;
    if (!chaptersMap[key]) {
      chaptersMap[key] = {
        subject: row.subject,
        chapter: row.chapter,
        detailed_notes: null,
        mcqs: null,
        assertion_reason: null,
        case_based: null,
      };
    }
    if (row.content_type === "detailed_notes") {
      chaptersMap[key].detailed_notes = row.data;
    } else if (row.content_type === "mcqs") {
      chaptersMap[key].mcqs = row.data;
    } else if (row.content_type === "assertion_reason") {
      chaptersMap[key].assertion_reason = row.data;
    } else if (row.content_type === "case_based") {
      chaptersMap[key].case_based = row.data;
    }
  }

  const entries = Object.values(chaptersMap);
  console.log(`Processing ${entries.length} unique chapters...`);

  let notesCount = 0;
  let quizCount = 0;

  for (const entry of entries) {
    const { subject, chapter, detailed_notes, mcqs, assertion_reason, case_based } = entry;

    // 1. Seed detailed notes
    if (detailed_notes && detailed_notes.markdown) {
      console.log(`📝 Seeding notes for: ${subject} — ${chapter}`);
      // Check if note already exists for this class_level, subject, chapter
      const { data: existingNote, error: fetchErr } = await supabase
        .from("chapter_notes")
        .select("id")
        .eq("class_level", CLASS_LEVEL)
        .eq("subject", subject)
        .eq("chapter", chapter)
        .maybeSingle();

      let notesErr = null;
      if (existingNote) {
        // Update existing note
        const { error: updateErr } = await supabase
          .from("chapter_notes")
          .update({
            notes: detailed_notes.markdown,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingNote.id);
        notesErr = updateErr;
      } else {
        // Insert new note
        const { error: insertErr } = await supabase
          .from("chapter_notes")
          .insert({
            class_level: CLASS_LEVEL,
            subject,
            chapter,
            notes: detailed_notes.markdown,
            created_at: new Date().toISOString(),
          });
        notesErr = insertErr;
      }

      if (notesErr) {
        console.error(`  ❌ Failed to seed notes:`, notesErr.message);
      } else {
        notesCount++;
      }
    }

    // 2. Seed quiz sets (Set 1)
    // Combine MCQs, Assertion-Reason, and Case-Based questions
    const combinedQuestions = [];

    // Add standard MCQs
    if (mcqs && Array.isArray(mcqs.questions)) {
      for (const q of mcqs.questions) {
        combinedQuestions.push({
          q: q.q,
          opts: Array.isArray(q.opts) ? q.opts.map(cleanOptionText) : ["", "", "", ""],
          ans: typeof q.ans === "number" ? q.ans : letterToIndex(q.ans),
          exp: q.explanation || "Refer to the correct concept and eliminate incorrect options step by step.",
        });
      }
    }

    // Add Assertion-Reason questions
    if (assertion_reason && Array.isArray(assertion_reason.questions)) {
      for (const q of assertion_reason.questions) {
        const questionText = `${q.assertion}\n\n${q.reason}`;
        combinedQuestions.push({
          q: questionText,
          opts: Array.isArray(q.opts) ? q.opts.map(cleanOptionText) : [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
          ],
          ans: typeof q.ans === "number" ? q.ans : letterToIndex(q.ans),
          exp: q.explanation || "Analyze the assertion and reason logically to check their validity.",
        });
      }
    }

    // Add Case-Based questions
    if (case_based && case_based.cases && Array.isArray(case_based.cases)) {
      for (const c of case_based.cases) {
        const passage = c.passage || "";
        if (Array.isArray(c.questions)) {
          for (const q of c.questions) {
            const questionText = `Based on the passage below, answer the question:\n\n${passage}\n\nQuestion: ${q.q}`;
            combinedQuestions.push({
              q: questionText,
              opts: Array.isArray(q.opts) ? q.opts.map(cleanOptionText) : ["", "", "", ""],
              ans: typeof q.ans === "number" ? q.ans : letterToIndex(q.ans),
              exp: q.explanation || "Refer to the case study passage to analyze and select the correct option.",
            });
          }
        }
      }
    }

    if (combinedQuestions.length > 0) {
      // Robust Padding Fallback: if we still have fewer than 30 questions, duplicate some
      if (combinedQuestions.length < 30) {
        console.warn(`  ⚠️ Chapter ${subject} — ${chapter} has only ${combinedQuestions.length} questions. Padding to 30 using duplicates.`);
        const originalLen = combinedQuestions.length;
        while (combinedQuestions.length < 30) {
          const idx = Math.floor(Math.random() * originalLen);
          combinedQuestions.push({ ...combinedQuestions[idx] });
        }
      }

      // Trim to exactly 30 questions
      const final30 = combinedQuestions.slice(0, 30);
      console.log(`🧠 Seeding Quiz Set 1 for: ${subject} — ${chapter} (${final30.length} questions)`);

      // Delete existing Set 1 first to prevent duplicate/key conflicts
      await supabase
        .from("quiz_sets")
        .delete()
        .eq("class_level", CLASS_LEVEL)
        .eq("subject", subject)
        .eq("chapter", chapter)
        .eq("set_number", 1);

      const { error: quizErr } = await supabase
        .from("quiz_sets")
        .insert({
          class_level: CLASS_LEVEL,
          subject,
          chapter,
          set_number: 1,
          questions: final30,
          created_at: new Date().toISOString(),
        });

      if (quizErr) {
        console.error(`  ❌ Failed to seed quiz set:`, quizErr.message);
      } else {
        quizCount++;
      }
    } else {
      console.warn(`  ❌ Chapter ${subject} — ${chapter} has no questions generated at all!`);
    }
  }

  console.log("\n====================================");
  console.log("🎉 Seeding Completed!");
  console.log(`📝 Notes seeded: ${notesCount}/${entries.length}`);
  console.log(`🧠 Quiz sets seeded: ${quizCount}/${entries.length}`);
  console.log("====================================\n");
}

main().catch(err => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
