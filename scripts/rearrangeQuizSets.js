import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Fetching all quiz sets...");
  let allSets = [];
  let page = 0;
  const pageSize = 1000;
  
  // Pagination since there might be many sets
  while (true) {
    const { data, error } = await supabase
      .from("quiz_sets")
      .select("*")
      .order("subject")
      .order("chapter")
      .order("set_number")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching quiz sets:", error);
      process.exit(1);
    }
    
    if (!data || data.length === 0) break;
    allSets = allSets.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Fetched ${allSets.length} quiz sets in total.`);

  // Group by class_level, subject, chapter
  const grouped = {};
  for (const set of allSets) {
    const key = `${set.class_level}||${set.subject}||${set.chapter}`;
    if (!grouped[key]) {
      grouped[key] = {
        class_level: set.class_level,
        subject: set.subject,
        chapter: set.chapter,
        questions: []
      };
    }
    
    let qList = set.questions || [];
    if (!Array.isArray(qList)) qList = [qList];
    grouped[key].questions.push(...qList);
  }
  
  console.log(`Grouped into ${Object.keys(grouped).length} unique chapters.`);
  
  // For each group, rearrange questions and upload
  for (const key of Object.keys(grouped)) {
    const group = grouped[key];
    console.log(`\nProcessing: ${group.class_level} - ${group.subject} - ${group.chapter}`);
    console.log(`Total questions pooled: ${group.questions.length}`);
    
    // Deduplicate questions just in case based on question text
    const uniqueQuestionsMap = new Map();
    for (const q of group.questions) {
       const text = q.q || q.question || q.text;
       if (text && typeof text === 'string') {
          uniqueQuestionsMap.set(text.trim(), q);
       }
    }
    const uniqueQuestions = Array.from(uniqueQuestionsMap.values());
    console.log(`Unique questions after deduplication: ${uniqueQuestions.length}`);

    if (uniqueQuestions.length === 0) {
      console.log(`No valid questions found for this chapter, skipping...`);
      continue;
    }
    
    // Chunk into sets of 30
    const chunks = [];
    for (let i = 0; i < uniqueQuestions.length; i += 30) {
      chunks.push(uniqueQuestions.slice(i, i + 30));
    }
    
    // Pad the last chunk if it's less than 30 and it's not the only chunk
    // Or even if it is the only chunk, we pad it to exactly 30 questions
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk.length > 0 && lastChunk.length < 30) {
       console.log(`Padding last chunk from ${lastChunk.length} to 30 questions...`);
       let i = 0;
       while (lastChunk.length < 30) {
         lastChunk.push({ ...lastChunk[i % lastChunk.length] }); // Duplicate questions to hit 30
         i++;
       }
    }
    
    console.log(`Divided into ${chunks.length} sets of 30.`);
    
    // Delete old sets
    const { error: delError } = await supabase
      .from("quiz_sets")
      .delete()
      .eq("class_level", group.class_level)
      .eq("subject", group.subject)
      .eq("chapter", group.chapter);
      
    if (delError) {
      console.error(`Failed to delete old sets for ${group.chapter}:`, delError);
      continue;
    }
    
    // Insert new sets
    const rowsToInsert = chunks.map((chunk, index) => ({
      class_level: group.class_level,
      subject: group.subject,
      chapter: group.chapter,
      set_number: index + 1,
      questions: chunk,
      created_at: new Date().toISOString(),
    }));
    
    const { error: insError } = await supabase
      .from("quiz_sets")
      .insert(rowsToInsert);
      
    if (insError) {
      console.error(`Failed to insert new sets for ${group.chapter}:`, insError);
    } else {
      console.log(`✅ Successfully rearranged into sets 1 to ${chunks.length}.`);
    }
  }
  
  console.log("\nFinished rearranging all quiz sets!");
}

main().catch(console.error);
