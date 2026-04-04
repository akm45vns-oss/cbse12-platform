/**
 * regenerateQuizSetsProperFormat.js
 *
 * Goal:
 * - Ensure quiz_sets only contains playable sets with exactly 30 questions.
 * - Regenerate chapters until each chapter has at least TARGET_VALID_SETS valid sets.
 *
 * Usage:
 *   node src/scripts/regenerateQuizSetsProperFormat.js
 *   node src/scripts/regenerateQuizSetsProperFormat.js --limit=20
 *   node src/scripts/regenerateQuizSetsProperFormat.js --subject=Physics
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { CURRICULUM } from "../constants/curriculum.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL =
  process.env.SEED_QUIZ_SETS_FUNCTION_URL ||
  "https://winsxslcmlyxzmlctkzt.functions.supabase.co/seed-quiz-sets";
const AUTH_TOKEN = process.env.SEED_QUIZ_SETS_BEARER || supabaseAnonKey;

const TARGET_VALID_SETS = Number(process.env.QUIZ_TARGET_VALID_SETS || 15);
const MAX_ATTEMPTS_PER_CHAPTER = Number(process.env.QUIZ_MAX_ATTEMPTS_PER_CHAPTER || 6);
const RETRY_WAIT_MS = Number(process.env.QUIZ_RETRY_WAIT_MS || 30000);
const CHAPTER_WAIT_MS = Number(process.env.QUIZ_CHAPTER_WAIT_MS || 15000);

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const subjectArg = process.argv.find((a) => a.startsWith("--subject="));
const subjectFilter = subjectArg ? subjectArg.split("=")[1] : null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAllCurriculumChapters() {
  const all = [];
  Object.entries(CURRICULUM).forEach(([subject, subjectData]) => {
    subjectData.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        all.push({ subject, chapter });
      });
    });
  });
  return all;
}

function getQuestionCount(questions) {
  return Array.isArray(questions) ? questions.length : 0;
}

async function fetchChapterRows(subject, chapter) {
  const { data, error } = await supabase
    .from("quiz_sets")
    .select("subject, chapter, set_number, questions")
    .eq("subject", subject)
    .eq("chapter", chapter);

  if (error) {
    throw new Error(`Failed to fetch rows for ${subject}/${chapter}: ${error.message}`);
  }

  return data || [];
}

function splitValidInvalid(rows) {
  const validSetNumbers = new Set();
  const invalidRows = [];

  for (const row of rows) {
    const len = getQuestionCount(row.questions);
    if (len === 30) {
      validSetNumbers.add(row.set_number);
    } else {
      invalidRows.push(row);
    }
  }

  return {
    validCount: validSetNumbers.size,
    invalidRows,
  };
}

async function deleteRows(rows) {
  let deleted = 0;

  for (const row of rows) {
    const { error } = await supabase
      .from("quiz_sets")
      .delete()
      .eq("subject", row.subject)
      .eq("chapter", row.chapter)
      .eq("set_number", row.set_number);

    if (!error) {
      deleted++;
    }
  }

  return deleted;
}

async function cleanInvalidForChapter(subject, chapter) {
  const rows = await fetchChapterRows(subject, chapter);
  const { validCount, invalidRows } = splitValidInvalid(rows);

  if (invalidRows.length === 0) {
    return { deleted: 0, validCount };
  }

  const deleted = await deleteRows(invalidRows);
  return { deleted, validCount };
}

async function getValidCount(subject, chapter) {
  const rows = await fetchChapterRows(subject, chapter);
  const { validCount } = splitValidInvalid(rows);
  return validCount;
}

async function seedChapter(subject, chapter) {
  const url = `${BASE_URL}?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = { success: false, error: "Non-JSON response from edge function" };
  }

  return { ok: res.ok, body };
}

async function cleanInvalidGlobally() {
  console.log("Scanning all quiz sets for invalid question lengths...");

  let from = 0;
  let to = 999;
  let scanned = 0;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase
      .from("quiz_sets")
      .select("subject, chapter, set_number, questions")
      .range(from, to);

    if (error) {
      throw new Error(`Global scan failed: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    scanned += data.length;
    const invalidRows = data.filter((row) => getQuestionCount(row.questions) !== 30);
    if (invalidRows.length > 0) {
      deleted += await deleteRows(invalidRows);
    }

    if (data.length < 1000) break;
    from += 1000;
    to += 1000;
  }

  console.log(`Global cleanup complete. Scanned=${scanned}, deleted_invalid=${deleted}`);
}

async function run() {
  console.log("\n=== Regenerate Quiz Sets (Proper Format) ===\n");
  console.log(`Target valid sets per chapter: ${TARGET_VALID_SETS}`);
  console.log(`Max attempts per chapter: ${MAX_ATTEMPTS_PER_CHAPTER}\n`);

  await cleanInvalidGlobally();

  let chapters = getAllCurriculumChapters();
  if (subjectFilter) {
    chapters = chapters.filter((c) => c.subject.toLowerCase() === subjectFilter.toLowerCase());
  }

  if (chapters.length === 0) {
    console.log("No chapters matched the provided subject filter.");
    return;
  }

  const queue = chapters.slice(0, Number.isFinite(limit) ? limit : chapters.length);

  console.log(`Chapters to process: ${queue.length}`);
  if (subjectFilter) {
    console.log(`Subject filter applied: ${subjectFilter}`);
  }
  if (Number.isFinite(limit)) {
    console.log(`Limit applied: ${queue.length}`);
  }

  let success = 0;
  let fail = 0;
  const failedChapters = [];

  for (let i = 0; i < queue.length; i++) {
    const { subject, chapter } = queue[i];
    console.log(`\n[${i + 1}/${queue.length}] ${subject} - ${chapter}`);

    try {
      const preClean = await cleanInvalidForChapter(subject, chapter);
      if (preClean.deleted > 0) {
        console.log(`Deleted ${preClean.deleted} invalid sets before regeneration.`);
      }

      let validCount = await getValidCount(subject, chapter);
      console.log(`Current valid sets: ${validCount}`);

      if (validCount >= TARGET_VALID_SETS) {
        console.log("Already at target, skipping.");
        success++;
        continue;
      }

      let chapterDone = false;
      let lastError = "Unknown error";

      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_CHAPTER; attempt++) {
        const seedResult = await seedChapter(subject, chapter);

        if (!seedResult.ok || !seedResult.body?.success) {
          lastError = seedResult.body?.error || JSON.stringify(seedResult.body);
          console.log(`Attempt ${attempt}/${MAX_ATTEMPTS_PER_CHAPTER} failed: ${lastError}`);
          if (attempt < MAX_ATTEMPTS_PER_CHAPTER) {
            await wait(RETRY_WAIT_MS);
          }
          continue;
        }

        const postClean = await cleanInvalidForChapter(subject, chapter);
        if (postClean.deleted > 0) {
          console.log(`Removed ${postClean.deleted} invalid sets after seeding.`);
        }

        validCount = await getValidCount(subject, chapter);
        console.log(`Attempt ${attempt}/${MAX_ATTEMPTS_PER_CHAPTER} -> valid sets: ${validCount}`);

        if (validCount >= TARGET_VALID_SETS) {
          chapterDone = true;
          console.log("Chapter reached target with proper format sets.");
          break;
        }

        lastError = `Only ${validCount} valid sets after attempt ${attempt}`;
        if (attempt < MAX_ATTEMPTS_PER_CHAPTER) {
          await wait(RETRY_WAIT_MS);
        }
      }

      if (chapterDone) {
        success++;
      } else {
        fail++;
        failedChapters.push({ subject, chapter, reason: lastError });
        console.log(`Failed chapter: ${lastError}`);
      }
    } catch (error) {
      fail++;
      failedChapters.push({ subject, chapter, reason: error.message });
      console.log(`Error chapter: ${error.message}`);
    }

    if (i < queue.length - 1) {
      await wait(CHAPTER_WAIT_MS);
    }
  }

  console.log("\n=== Proper Regeneration Summary ===");
  console.log(`Processed: ${queue.length}`);
  console.log(`Success:   ${success}`);
  console.log(`Failed:    ${fail}`);

  if (failedChapters.length > 0) {
    console.log("\nFailed chapters:");
    failedChapters.forEach((f, idx) => {
      console.log(`${idx + 1}. ${f.subject} - ${f.chapter}: ${f.reason}`);
    });
  }
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
