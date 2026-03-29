import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const groqKey = process.env.VITE_GROQ_KEY;

if (!supabaseUrl || !supabaseKey || !groqKey) {
  console.error("Missing credentials in .env.local (Need Supabase and VITE_GROQ_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateQuizSetsLocally(chapter, subject, numSetsToGenerate) {
  // For reliability with Groq's rate limits, we'll use massive delays
  const allSets = [];

  for (let setNum = 0; setNum < numSetsToGenerate; setNum++) {
    const prompt = `Generate 1 quiz set for CBSE Class 12.
Chapter: "${chapter}" (${subject})

Create exactly 30 MCQs: 5 Easy, 5 Medium, 5 Hard.
Output ONLY valid JSON array with 30 question objects:
[{"q":"What is...","opts":["A text","B text","C text","D text"],"ans":0,"exp":"Explanation"},...30 total]

No markdown, no extra text. ONLY JSON.`;

    const requestBody = {
      model: "llama-3.1-8b-instant",
      max_tokens: 2500,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }]
    };

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const status = response.status;
          if (status === 429) {
            // Rate limited - wait before retry
            console.log(`     ⏳ Rate limited (429), waiting 60s before retry...`);
            await new Promise(r => setTimeout(r, 60000));
          } else {
            throw new Error(`API ${status}`);
          }
          attempts++;
          continue;
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
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

        allSets.push(questions);
        success = true;
      } catch (err) {
        attempts++;
        if (attempts >= 3) throw err;
        console.log(`     ⏳ Retrying set ${setNum + 1}/${numSetsToGenerate} in 10s...`);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    // Large delay between sets to avoid rate limiting
    if (setNum < numSetsToGenerate - 1) {
      await new Promise(r => setTimeout(r, 60000)); // 60s between sets
    }
  }

  return allSets;
}

async function run() {
  console.log("🔍 Fetching database to identify chapters with < 15 sets...");
  let allRows = [], from = 0, to = 999, hasMore = true;

  while(hasMore) {
    const { data, error } = await supabase.from('quiz_sets').select('subject, chapter, set_number').range(from, to);
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
    if (!chapterData[key]) chapterData[key] = { subject: row.subject, chapter: row.chapter, highestSet: 0, currentSets: [] };
    chapterData[key].currentSets.push(row.set_number);
    if (row.set_number > chapterData[key].highestSet) chapterData[key].highestSet = row.set_number;
  });

  const below15 = Object.values(chapterData).filter(item => item.currentSets.length < 15);
  console.log(`Found ${below15.length} chapters that need to be topped up to at least 15 sets.\n`);

  for (let i = 0; i < below15.length; i++) {
    const item = below15[i];
    const missingCount = 15 - item.currentSets.length;
    console.log(`[${i+1}/${below15.length}] Processing ${item.subject} - ${item.chapter}`);
    console.log(`   (Currently has ${item.currentSets.length} sets. Need to generate ${missingCount} sets, starting at set_number ${item.highestSet + 1})`);

    let attempts = 0, success = false;

    while (attempts < 3 && !success) {
      try {
        if (attempts > 0) {
          console.log(`   ⏳ Waiting 60 seconds before retry...`);
          await new Promise(r => setTimeout(r, 60000));
        }

        console.log(`  🚀 Generating all ${missingCount} missing sets...`);
        const sets = await generateQuizSetsLocally(item.chapter, item.subject, missingCount);
        
        if (!Array.isArray(sets) || sets.length === 0) throw new Error("Returned sets is empty or invalid");
        
        let savedCount = 0;
        for (let s = 0; s < sets.length; s++) {
          const setNumber = item.highestSet + 1 + s;
          const { error } = await supabase.from('quiz_sets').insert({
            subject: item.subject,
            chapter: item.chapter,
            set_number: setNumber,
            questions: sets[s],
            created_at: new Date().toISOString()
          });
          if (!error) {
            savedCount++;
            console.log(`    ✅ Saved set ${setNumber}`);
          } else {
            console.log(`    ❌ DB Error: ${error.message}`);
          }
        }
        
        console.log(`  🎉 OK (${savedCount}/${missingCount} sets successfully generated and saved)`);
        success = true;
      } catch (err) {
        console.log(`  ❌ FAIL attempt ${attempts + 1}: ${err.message}`);
        attempts++;
      }
    }

    // Large delay between chapters - Groq free tier is very rate limited
    if (i < below15.length - 1) {
      const delayMin = 5;
      console.log(`  ⏳ Waiting ${delayMin} minutes before next chapter (Groq rate limit management)...`);
      await new Promise(r => setTimeout(r, delayMin * 60000));
    }
  }
  console.log("\n🎉 ALL DONE! The chapters have been topped up.");
}

run();
