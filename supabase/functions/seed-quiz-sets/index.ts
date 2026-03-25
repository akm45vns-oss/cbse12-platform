import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

          // Generate 15 sets
          const sets = await generateQuizSets(chap, subj, groqKey);

          if (!sets || sets.length === 0) {
            console.log(`    ❌ Failed to generate questions`);
            results.push({ subject: subj, chapter: chap, status: "failed" });
            continue;
          }

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
          console.log(`    ✓ 15 sets saved`);
          results.push({ subject: subj, chapter: chap, status: "success", sets: sets.length });
        } catch (err) {
          console.error(`  Error with ${chap}:`, err);
          results.push({ subject: subj, chapter: chap, status: "error", error: err.message });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
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

async function generateQuizSets(chapter, subject, groqKey) {
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
    console.log(`Generating sets for ${subject} - ${chapter}...`);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      })
    });

    console.log(`Groq response status: ${response.status}`);

    if (!response.ok) {
      const err = await response.json();
      console.error(`Groq API error:`, err);
      throw new Error(err.error?.message || `Groq API error ${response.status}`);
    }

    const data = await response.json();
    console.log(`Response received, extracting text...`);

    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq");

    console.log(`Text length: ${text.length}, first 200 chars:`, text.substring(0, 200));

    // Extract JSON
    let cleaned = text.trim().replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    if (start === -1) throw new Error("No JSON array found in response");

    cleaned = cleaned.slice(start);
    const lastGood = cleaned.lastIndexOf("},");
    if (lastGood === -1) {
      const onlyOne = cleaned.lastIndexOf("}");
      if (onlyOne === -1) throw new Error("No complete JSON objects found");
      cleaned = cleaned.slice(0, onlyOne + 1) + "]";
    } else {
      cleaned = cleaned.slice(0, lastGood + 1) + "]";
    }

    console.log(`Parsing JSON, cleaned length: ${cleaned.length}`);
    const sets = JSON.parse(cleaned);

    // Validate
    if (!Array.isArray(sets) || sets.length !== 15) {
      throw new Error(`Expected 15 sets, got ${sets.length}`);
    }

    for (let i = 0; i < sets.length; i++) {
      if (!Array.isArray(sets[i]) || sets[i].length !== 30) {
        throw new Error(`Set ${i + 1}: Expected 30 questions, got ${sets[i].length}`);
      }
    }

    console.log(`✓ Successfully generated 15 sets for ${chapter}`);
    return sets;
  } catch (err) {
    console.error(`❌ Error generating sets for ${chapter}:`, err.message);
    return null;
  }
}
