/**
 * Retry Failed Notes
 * Regenerates only the chapters that failed in the seeding process
 */
/* eslint-disable no-undef */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GROQ_API_KEY = process.env.VITE_GROQ_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Failed chapters from the seeding run
const FAILED_CHAPTERS = [
  { subject: "Biology", chapter: "Organisms and Populations" },
  { subject: "Biology", chapter: "Ecosystem" },
  { subject: "Biology", chapter: "Biodiversity and Conservation" },
  { subject: "Biology", chapter: "Environmental Issues" },
  { subject: "English", chapter: "The Last Lesson" },
  { subject: "English", chapter: "An Elementary School Classroom in a Slum" }
];

async function saveChapterNotes(subject, chapter, notes) {
  const { error } = await supabase.from("chapter_notes").upsert(
    {
      subject,
      chapter,
      notes,
      created_at: new Date().toISOString()
    },
    { onConflict: "subject,chapter" }
  );

  if (error) {
    console.error("Save notes error:", error);
    return false;
  }
  return true;
}

async function callGroqAPI(prompt, maxTokens = 1500, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await delay(2000);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryFailedNotes() {
  console.log("🔄 Retrying failed chapters...\n");

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < FAILED_CHAPTERS.length; i++) {
    const { subject, chapter } = FAILED_CHAPTERS[i];
    const progress = `[${i + 1}/${FAILED_CHAPTERS.length}]`;

    try {
      console.log(`${progress} 📝 Generating notes for ${subject} - ${chapter}...`);

      const notes = await callGroqAPI(
        `Create CBSE Class 12 NCERT study notes for "${chapter}" (${subject}).

# ${chapter}
## Key Concepts
- List 5-8 important terms with brief definitions

## Important Laws & Formulas
- State key laws/principles with formulas if applicable

## Mechanisms & Processes
- Explain 2-3 important step-by-step processes

## Board Exam Focus
- ⭐ 8-10 must-know points for exams
- Common mistakes students make
- Topics frequently asked

## Quick Summary
- 8-10 bullet points for revision

Be concise, clear, and comprehensive for CBSE exam prep.`,
        1500
      );

      const saved = await saveChapterNotes(subject, chapter, notes);

      if (saved) {
        console.log(`${progress} ✅ Saved successfully!\n`);
        successful++;
      } else {
        console.log(`${progress} ⚠️ Generated but failed to save\n`);
        failed++;
      }

      if (i < FAILED_CHAPTERS.length - 1) {
        await delay(12000);
      }
    } catch (error) {
      console.log(`${progress} ❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 RETRY COMPLETE");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📚 Total: ${FAILED_CHAPTERS.length}`);
  console.log("=".repeat(50) + "\n");

  if (failed > 0) {
    console.log("⚠️  Some chapters still failed. Check the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 All failed chapters successfully generated!");
    process.exit(0);
  }
}

retryFailedNotes();
