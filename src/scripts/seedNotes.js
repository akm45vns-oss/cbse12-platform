/**
 * CBSE Platform Notes Seeding Script
 * Generates AI notes for all chapters in all subjects
 * Run with: npm run seed-notes
 */
/* eslint-disable no-undef */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { CURRICULUM } from "../constants/curriculum.js";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GROQ_API_KEY = process.env.VITE_GROQ_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local");
  console.error("Make sure your .env.local file exists and contains these variables:");
  console.error("  VITE_SUPABASE_URL=...");
  console.error("  VITE_SUPABASE_ANON_KEY=...");
  console.error("  VITE_GROQ_KEY=...");
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.error("❌ Error: VITE_GROQ_KEY not found in .env.local");
  console.error("Get your Groq API key from: https://console.groq.com");
  console.error("Then add to .env.local:");
  console.error("  VITE_GROQ_KEY=your-key-here");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
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
      // Wait before retrying
      await delay(2000);
    }
  }
}

const DELAY_MS = 12000; // 12 second delay between API calls to respect rate limits

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedAllNotes() {
  console.log("🚀 Starting Chapter Notes Seeding...\n");
  
  const allChapters = [];
  
  // Collect all chapters
  Object.entries(CURRICULUM).forEach(([subject, data]) => {
    data.units.forEach(unit => {
      unit.chapters.forEach(chapter => {
        allChapters.push({ subject, chapter });
      });
    });
  });
  
  console.log(`📚 Total chapters to generate: ${allChapters.length}\n`);
  
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < allChapters.length; i++) {
    const { subject, chapter } = allChapters[i];
    const progress = `[${i + 1}/${allChapters.length}]`;
    
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
      
      // Save to database
      const saved = await saveChapterNotes(subject, chapter, notes);
      
      if (saved) {
        console.log(`${progress} ✅ Saved successfully!\n`);
        successful++;
      } else {
        console.log(`${progress} ⚠️ Generated but failed to save\n`);
        failed++;
      }
      
      // Delay before next request
      if (i < allChapters.length - 1) {
        await delay(DELAY_MS);
      }
    } catch (error) {
      console.log(`${progress} ❌ Error: ${error.message}\n`);
      failed++;
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SEEDING COMPLETE");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📚 Total: ${allChapters.length}`);
  console.log("=".repeat(50) + "\n");
  
  if (failed > 0) {
    console.log("⚠️  Some notes failed to save. Check the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 All notes generated and saved successfully!");
    process.exit(0);
  }
}

// Run the seeding script
seedAllNotes();
