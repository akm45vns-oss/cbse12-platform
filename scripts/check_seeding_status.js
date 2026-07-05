import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Checking DB Seeding Status...\n");

  // 1. Check chapter_notes
  const { data: notes11, error: n11Err, count: countNotes11 } = await supabase
    .from("chapter_notes")
    .select("id", { count: "exact", head: true })
    .eq("class_level", "11");

  const { data: notes12, error: n12Err, count: countNotes12 } = await supabase
    .from("chapter_notes")
    .select("id", { count: "exact", head: true })
    .eq("class_level", "12");

  if (n11Err) console.error("Error reading chapter_notes 11:", n11Err.message);
  if (n12Err) console.error("Error reading chapter_notes 12:", n12Err.message);

  // 2. Check quiz_sets
  const { data: quiz11, error: q11Err, count: countQuiz11 } = await supabase
    .from("quiz_sets")
    .select("id", { count: "exact", head: true })
    .eq("class_level", "11");

  const { data: quiz12, error: q12Err, count: countQuiz12 } = await supabase
    .from("quiz_sets")
    .select("id", { count: "exact", head: true })
    .eq("class_level", "12");

  if (q11Err) console.error("Error reading quiz_sets 11:", q11Err.message);
  if (q12Err) console.error("Error reading quiz_sets 12:", q12Err.message);

  console.log("--------------------------------------------");
  console.log(`Class 11 - Seeded Notes chapters: ${countNotes11 || 0}`);
  console.log(`Class 11 - Seeded Quiz sets:       ${countQuiz11 || 0}`);
  console.log("--------------------------------------------");
  console.log(`Class 12 - Seeded Notes chapters: ${countNotes12 || 0}`);
  console.log(`Class 12 - Seeded Quiz sets:       ${countQuiz12 || 0}`);
  console.log("--------------------------------------------");
}

main().catch(console.error);
