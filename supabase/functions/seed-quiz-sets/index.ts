import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// deno-lint-ignore no-explicit-any
const __NO_AUTH_CHECK = true; // Allow unauthenticated calls for seeding

// CURRICULUM structure (must match frontend)
const CURRICULUM = {
  Physics: { chapters: ["Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory"] },
  Chemistry: { chapters: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "The s-Block Elements", "The p-Block Elements", "Organic Chemistry - Some Basic Principles and Techniques", "Hydrocarbons"] },
  Biology: { chapters: ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and its Conservation"] },
  English: { chapters: ["Reading Comprehension", "Listening Comprehension", "Grammar", "Vocabulary", "Writing Skills", "Speaking Skills", "Literature - Flamingo", "Literature - Vistas"] },
  Mathematics: { chapters: ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming"] },
  "Computer Science": { chapters: ["Networking and Communications", "Data Management", "Society, Law and Ethics", "Web Development", "Cybersecurity"] },
  Economics: { chapters: ["Microeconomics", "Macroeconomics", "Money and Banking", "Government Budget and Economy", "International Economics"] },
  Accountancy: { chapters: ["Accounting Standards", "Partnership Accounts", "Company Accounts", "Analysis of Financial Statements", "Cash Flow Statement"] },
  "Business Studies": { chapters: ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling", "Financial Management", "Financial Markets"] },
  History: { chapters: ["Sources, Periodisation and Historians", "Bricks, Beads and Bones", "Kinship, Caste and Class", "Bhakti and Sufi Traditions", "The Making of Regional Cultures", "Colonialism and the Countryside", "Weavers, Iron Smelters and Factory Owners", "Civilising the Native, Making the Citizen", "Women, Caste and Reform", "Displacing Indigenous", "Paths to Modernisation"] },
  "Political Science": { chapters: ["Political Theory", "Constitution Design", "Electoral Politics", "Working of Institutions", "Challenges to Indian Democracy"] },
  "Physical Education": { chapters: ["Planning in Physical Education", "Organization and Management", "Psychology of Physical Education", "Biomechanics and Kinesiology", "Physiology of Exercise"] }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const subject = url.searchParams.get("subject") || "ALL";

    // Debug endpoint
    if (subject === "DEBUG") {
      const groqKey = Deno.env.get("GROQ_API_KEY");
      return new Response(
        JSON.stringify({
          groqKeyPresent: !!groqKey,
          groqKeyLength: groqKey?.length || 0,
          groqKeyPrefix: groqKey ? groqKey.substring(0, 10) + "..." : "MISSING",
          supabaseUrlPresent: !!Deno.env.get("SUPABASE_URL"),
          supabaseKeyPresent: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!groqKey) {
      return new Response(
        JSON.stringify({ error: "GROQ API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which subjects to seed
    const subjects = subject === "ALL" ? Object.keys(CURRICULUM) : [subject];

    let totalSets = 0;
    let totalQuestions = 0;
    const results = [];

    for (const subj of subjects) {
      const chapters = CURRICULUM[subj].chapters || [];
      console.log(`\n📚 ${subj} (${chapters.length} chapters)`);

      for (const chap of chapters) {
        try {
          console.log(`  ✏️ ${chap}...`);

          // Generate 15 sets (3 API calls of 5 sets each)
          const allSets = [];
          let successCount = 0;

          for (let batch = 1; batch <= 3; batch++) {
            if (successCount >= 15) break; // Stop if we have enough sets

            const result = await generateQuizSets(chap, subj, groqKey, 5, batch);

            if (result.success && result.data && result.data.length > 0) {
              allSets.push(...result.data);
              successCount += result.data.length;
              console.log(`    ✓ Batch ${batch}: ${result.data.length} sets`);
            } else {
              console.log(`    ⚠️ Batch ${batch} failed, retrying after longer wait...`);

              // If batch failed, wait extra long before retry
              await new Promise(resolve => setTimeout(resolve, 60000));

              const retryResult = await generateQuizSets(chap, subj, groqKey, 5, `${batch}-retry`);
              if (retryResult.success && retryResult.data && retryResult.data.length > 0) {
                allSets.push(...retryResult.data);
                successCount += retryResult.data.length;
                console.log(`    ✓ Batch ${batch} retry: ${retryResult.data.length} sets`);
              }
            }

            // Delay between batches to avoid rate limits (60+ seconds)
            if (batch < 3 && successCount < 15) {
              console.log(`    ⏳ Waiting 70s before batch ${batch + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 70000));
            }
          }

          if (allSets.length === 0) {
            console.log(`    ❌ No sets generated for this chapter after retries`);
            results.push({ subject: subj, chapter: chap, status: "failed", error: "No sets generated" });
            continue;
          }

          // Keep only first 15 sets if more were generated
          const sets = allSets.slice(0, 15);

          // Save to database
          for (let i = 0; i < sets.length; i++) {
            const { error } = await supabase.from("quiz_sets").upsert(
              {
                subject: subj,
                chapter: chap,
                set_number: i + 1,
                questions: sets[i],
                created_at: new Date().toISOString()
              },
              { onConflict: "subject,chapter,set_number" }
            );

            if (error) {
              console.log(`    ❌ Set ${i + 1} failed`);
            }
          }

          totalSets += sets.length;
          totalQuestions += sets.reduce((sum, set) => sum + set.length, 0);
          console.log(`    ✓ ${sets.length} sets saved`);
          results.push({ subject: subj, chapter: chap, status: "success", sets: sets.length });
        } catch (err) {
          console.error(`  Error with ${chap}:`, err);
          results.push({ subject: subj, chapter: chap, status: "error", error: err.message });
        }

        // Long delay to avoid rate limiting between chapters
        await new Promise(resolve => setTimeout(resolve, 90000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalSets,
        totalQuestions,
        summary: `✅ Seeded ${totalSets} sets with ${totalQuestions} questions`,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateQuizSets(chapter, subject, groqKey, numSets = 5, batchNum = 1) {
  const prompt = `Generate exactly ${numSets} quiz sets for "${chapter}" (${subject}). Batch ${batchNum}.
Each set: exactly 30 MCQs (5 easy + 5 medium + 5 hard). CBSE 12 level.
JSON format: [[[{"q":"...","opts":[...],"ans":0,"exp":"..."},...30 each],...${numSets} sets]]
Unique questions. Short 1-line explanations.`;

  try {
    console.log(`Generating ${numSets} sets (batch ${batchNum}) for ${subject} - ${chapter}...`);

    const requestBody = {
      model: "llama-3.1-8b-instant",
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`Groq response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response length: ${responseText.length}`);

    if (!response.ok) {
      let err;
      try {
        err = JSON.parse(responseText);
      } catch {
        err = { message: responseText };
      }
      const errMsg = err.error?.message || err.message || responseText || `Groq API error ${response.status}`;
      console.error(`Groq API error:`, errMsg);
      throw new Error(errMsg);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(`Failed to parse response as JSON:`, parseErr.message);
      throw new Error(`Invalid JSON response: ${parseErr.message}`);
    }
    console.log(`Response received, extracting text...`);

    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq");

    console.log(`Text length: ${text.length}`);

    // Extract JSON - robust parsing for truncated/malformed responses
    let cleaned = text.trim().replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    if (start === -1) throw new Error("No JSON array found in response");

    cleaned = cleaned.slice(start);

    // Try to find valid JSON by progressively finding matching brackets
    let bracketCount = 0;
    let endPos = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === "[") bracketCount++;
      else if (char === "]") {
        bracketCount--;
        if (bracketCount === 0) {
          endPos = i;
          break;
        }
      }
    }

    if (endPos !== -1) {
      // Valid complete JSON found
      cleaned = cleaned.slice(0, endPos + 1);
    } else {
      // Incomplete JSON - try to fix it
      const lastObjectEnd = cleaned.lastIndexOf("}");
      if (lastObjectEnd === -1) {
        throw new Error("No complete JSON objects found in response");
      }

      // Count opening brackets up to the last object
      let openBrackets = 0;
      for (let i = 0; i <= lastObjectEnd; i++) {
        if (cleaned[i] === "[") openBrackets++;
      }

      // Take everything up to the last complete object and close all brackets
      cleaned = cleaned.slice(0, lastObjectEnd + 1);
      cleaned += "]".repeat(openBrackets);
      console.log(`Auto-completed JSON with ${openBrackets} closing brackets`);
    }

    // Try to parse - if it fails, progressively remove trailing content
    console.log(`Attempting JSON parse, length: ${cleaned.length}`);
    let sets = null;
    let parseError = null;

    try {
      sets = JSON.parse(cleaned);
      console.log(`✓ JSON parsed successfully`);
    } catch (err) {
      parseError = err;
      console.log(`Parse error: ${err.message}`);

      // Try removing trailing characters one by one
      for (let i = cleaned.length - 1; i > 10; i--) {
        try {
          if (cleaned[i] === "]") {
            const test = cleaned.slice(0, i + 1);
            sets = JSON.parse(test);
            cleaned = test;
            console.log(`✓ JSON parsed after removing ${cleaned.length - i} trailing chars`);
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }

      if (!sets) {
        throw parseError;
      }
    }

    // Validate - accept any sets with at least some questions
    if (!Array.isArray(sets) || sets.length === 0) {
      throw new Error(`Expected sets array, got ${sets.length} items`);
    }

    // Validate each set has questions (accept even if not exactly 30)
    let validSetCount = 0;
    for (let i = 0; i < sets.length; i++) {
      if (Array.isArray(sets[i]) && sets[i].length > 0) {
        if (sets[i].length !== 30) {
          console.warn(`Set ${i + 1}: Has ${sets[i].length} questions (expected 30)`);
        }
        validSetCount++;
      }
    }

    if (validSetCount === 0) {
      throw new Error("No valid question sets found");
    }

    console.log(`✓ Successfully generated ${sets.length} sets (${validSetCount} valid) for ${chapter}`);
    return { success: true, data: sets };
  } catch (err) {
    console.error(`❌ Error generating sets for ${chapter}:`, err.message);
    return { success: false, error: err.message };
  }
}
