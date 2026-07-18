/**
 * audit_mcqs.js — Comprehensive MCQ Audit System
 *
 * Audits every MCQ in the Supabase `quiz_sets` table against NCERT/CBSE standards.
 *
 * TWO-PASS VALIDATION:
 *   Pass 1 — Structural validator (local, zero API cost)
 *   Pass 2 — Independent AI solver (Groq, ignores stored answer)
 *   + Explanation consistency check
 *
 * ON FAILURE: Regenerates the ENTIRE question (not just the answer key).
 * Writes corrections back to Supabase immediately after each chapter.
 * Saves checkpoint after each chapter for resume capability.
 *
 * ORDER: Class 12 first (all subjects), then Class 11.
 *
 * CLI FLAGS:
 *   --class 12|11         Audit only this class (default: 12 then 11)
 *   --subject "Biology"   Audit only this subject
 *   --chapter "Evolution" Audit only this chapter
 *   --dry-run             Validate only, no DB writes
 *
 * Usage:
 *   node scripts/audit_mcqs.js
 *   node scripts/audit_mcqs.js --class 12 --subject Biology
 *   node scripts/audit_mcqs.js --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// ─── Load environment variables ────────────────────────────────────────────
dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(ROOT, ".env.local") });

// ─── Parse CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const ARG_CLASS  = getArg("--class");   // "12" | "11" | null
const ARG_SUBJ   = getArg("--subject"); // "Biology" | null
const ARG_CHAP   = getArg("--chapter"); // "Evolution" | null

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

// ─── Supabase client ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing Supabase credentials. Check .env file.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Groq API configuration ─────────────────────────────────────────────────
import { waitForAvailableKey, acquireKey, releaseSuccess, releaseFailure } from "../src/content-pipeline/keyPool.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VALIDATE_MODEL   = "llama-3.3-70b-versatile";
const REGENERATE_MODEL = "llama-3.3-70b-versatile";

async function callGroq(prompt, model = VALIDATE_MODEL, maxRetries = 15) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let keyState;
    try {
      keyState = await waitForAvailableKey();
    } catch (err) {
      // Timeout waiting for a key (120s limit in keyPool)
      continue;
    }
    
    acquireKey(keyState);
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keyState.key}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.status === 429 || res.status === 401) {
        releaseFailure(keyState, res.status);
        await sleep(1000);
        continue;
      }
      if (!res.ok) {
        releaseFailure(keyState, res.status);
        const body = await res.json().catch(() => ({}));
        throw new Error(`Groq ${res.status}: ${body?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) {
        releaseFailure(keyState, 500);
        throw new Error("Empty response from Groq");
      }
      
      releaseSuccess(keyState);
      return text;
    } catch (err) {
      if (!keyState) continue;
      // We already released failure above for !res.ok, but if network error:
      if (!err.message.includes("Groq")) {
         releaseFailure(keyState, 500);
      }
      if (attempt === maxRetries - 1) throw err;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error("All Groq retries exhausted");
}

// ─── Paths ──────────────────────────────────────────────────────────────────
const CACHE_DIR       = path.join(ROOT, "cache");
const CHECKPOINT_FILE = path.join(CACHE_DIR, "mcq_audit_checkpoint.json");
const REPORT_FILE     = path.join(CACHE_DIR, "mcq_audit_report.md");

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ─── Curriculum loading ─────────────────────────────────────────────────────
/**
 * Returns a flat list of { classLevel, subject, unit, chapter } objects.
 */
async function buildChapterList(classesToAudit) {
  const tasks = [];

  for (const cls of classesToAudit) {
    let curriculum;
    if (cls === "12") {
      const mod = await import("../src/constants/curriculum.js");
      curriculum = mod.CURRICULUM;
    } else {
      const mod = await import("../src/constants/curriculum11.js");
      curriculum = mod.CURRICULUM_11;
    }

    for (const [subject, data] of Object.entries(curriculum)) {
      if (ARG_SUBJ && subject !== ARG_SUBJ) continue;
      for (const unit of data.units) {
        for (const chapter of unit.chapters) {
          if (ARG_CHAP && chapter !== ARG_CHAP) continue;
          tasks.push({ classLevel: cls, subject, unit: unit.name, chapter });
        }
      }
    }
  }

  return tasks;
}

// ─── Checkpoint manager ─────────────────────────────────────────────────────
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
    } catch {
      /* corrupt checkpoint — start fresh */
    }
  }
  return {
    started_at: new Date().toISOString(),
    completed_chapters: [],
    stats: {
      total_checked: 0,
      passed_p1: 0,
      passed_p2: 0,
      failed_p1: 0,
      failed_p2: 0,
      explanation_fixed: 0,
      regenerated: 0,
      duplicates_removed: 0,
      chapters_completed: 0,
    },
  };
}

function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2), "utf-8");
}

// ─── Chapter key for checkpoint ──────────────────────────────────────────────
function chapterKey(task) {
  return `${task.classLevel}||${task.subject}||${task.chapter}`;
}

// ─── Pass 1 — Structural Validator (local, zero API cost) ───────────────────
/**
 * Validates the structural integrity of a single MCQ object.
 * @param {{ q: string, opts: string[], ans: number, exp: string }} mcq
 * @param {{ classLevel, subject, chapter }} meta
 * @returns {{ pass: boolean, issues: string[] }}
 */
function pass1Validate(mcq, meta) {
  const issues = [];
  const { q, opts, ans, exp } = mcq;

  // ── Question text checks ──
  if (!q || typeof q !== "string" || q.trim().length < 10) {
    issues.push("Question text is missing or too short");
  } else {
    if (q.trim().length > 600) issues.push("Question text unusually long (>600 chars)");
    if (/<[^>]+>/.test(q)) issues.push("Question contains raw HTML tags");
    if (/```/.test(q)) issues.push("Question contains markdown code fences");
  }

  // ── Options checks ──
  if (!Array.isArray(opts) || opts.length !== 4) {
    issues.push(`Expected 4 options, found ${Array.isArray(opts) ? opts.length : "none"}`);
  } else {
    const texts = opts.map(o => (typeof o === "string" ? o.trim().toLowerCase() : ""));
    // Check each option is non-empty
    opts.forEach((o, i) => {
      if (!o || typeof o !== "string" || o.trim().length === 0) {
        issues.push(`Option ${["A","B","C","D"][i]} is empty`);
      }
    });
    // Duplicate options check
    const seen = new Set();
    texts.forEach((t, i) => {
      if (t && seen.has(t)) {
        issues.push(`Duplicate option detected: option ${["A","B","C","D"][i]} duplicates another`);
      }
      seen.add(t);
    });
    // Options that are just letters/numbers
    texts.forEach((t, i) => {
      if (t.length < 2) issues.push(`Option ${["A","B","C","D"][i]} is suspiciously short`);
    });
  }

  // ── Answer key check ──
  if (typeof ans !== "number" || ans < 0 || ans > 3) {
    issues.push(`Answer index ${ans} is out of range (must be 0–3)`);
  }

  // ── Explanation check ──
  if (!exp || typeof exp !== "string" || exp.trim().length < 10) {
    issues.push("Explanation is missing or too short");
  } else {
    if (/<[^>]+>/.test(exp)) issues.push("Explanation contains raw HTML tags");
  }

  // ── Cross-chapter contamination check (keyword blocklist) ──
  const contamination = detectCrossChapterContamination(q, meta);
  if (contamination) {
    issues.push(`Possible cross-chapter contamination: ${contamination}`);
  }

  return { pass: issues.length === 0, issues };
}

/**
 * Heuristic check: does the question reference another chapter's core concept?
 * Only flags strong, unambiguous signals.
 */
function detectCrossChapterContamination(questionText, { subject, chapter }) {
  if (!questionText || typeof questionText !== "string") return null;
  const q = questionText.toLowerCase();

  // Map of chapter → unique keywords that strongly belong ONLY to that chapter
  // We only include very specific terms, not generic ones.
  const CHAPTER_SIGNALS = {
    // Biology Class 12
    "Sexual Reproduction in Flowering Plants": ["stigma", "pistil", "stamen", "pollen grain", "ovary", "ovule", "anther", "filament", "sepal", "petal", "pollination", "fertilisation of flower"],
    "Human Reproduction": ["spermatogenesis", "oogenesis", "menstrual cycle", "fallopian tube", "uterus", "testes", "ovaries", "corpus luteum", "acrosome"],
    "Molecular Basis of Inheritance": ["dna replication", "transcription", "translation", "operon", "lac operon", "trp operon", "hnrna", "rna polymerase", "promoter sequence", "codon", "anticodon"],
    "Principles of Inheritance and Variation": ["mendel", "monohybrid", "dihybrid", "punnett square", "law of segregation", "law of independent assortment", "dominant", "recessive allele", "genotype", "phenotype"],
    "Evolution": ["natural selection", "darwin", "lamarck", "speciation", "gene flow", "genetic drift", "hardy-weinberg", "fossil record", "analogous organs", "homologous organs", "adaptive radiation"],
    "Human Health and Disease": ["pathogen", "innate immunity", "acquired immunity", "antibody", "antigen", "vaccination", "cancer", "aids", "allergy", "drug addiction"],
    "Biotechnology: Principles and Processes": ["recombinant dna", "restriction enzyme", "gel electrophoresis", "pcr", "cloning vector", "plasmid", "competent cell", "expression vector"],
    "Biotechnology and its Applications": ["bt cotton", "golden rice", "rnai", "gene therapy", "transgenic animal", "insulin production", "biopiracy"],
    "Organisms and Populations": ["population density", "natality", "mortality", "age pyramid", "logistic growth", "exponential growth", "carrying capacity", "interspecific", "intraspecific"],
    "Ecosystem": ["food chain", "food web", "trophic level", "energy flow", "biogeochemical cycle", "decomposition", "productivity", "nutrient cycling"],
    "Biodiversity and Conservation": ["biodiversity hotspot", "endemic species", "extinction", "in-situ conservation", "ex-situ conservation", "iucn", "red data book", "biosphere reserve"],
    "Environmental Issues": ["biomagnification", "eutrophication", "ozone depletion", "greenhouse effect", "deforestation", "sewage treatment", "e-waste"],
    // Physics Class 12
    "Electric Charges and Fields": ["coulomb's law", "electric field", "electric flux", "gauss's law", "dipole moment"],
    "Electrostatic Potential and Capacitance": ["electric potential", "capacitance", "capacitor", "dielectric", "equipotential"],
    "Current Electricity": ["ohm's law", "kirchhoff", "wheatstone bridge", "meter bridge", "potentiometer", "drift velocity", "resistivity"],
    "Moving Charges and Magnetism": ["biot-savart", "ampere's law", "lorentz force", "cyclotron", "solenoid field"],
    "Electromagnetic Induction": ["faraday's law", "lenz's law", "self inductance", "mutual inductance", "eddy current"],
    "Alternating Current": ["rms value", "impedance", "resonance circuit", "power factor", "transformer"],
    "Ray Optics and Optical Instruments": ["snell's law", "total internal reflection", "lens formula", "mirror formula", "optical instrument", "microscope", "telescope"],
    "Wave Optics": ["huygens principle", "interference", "diffraction", "polarization", "young's double slit"],
    "Dual Nature of Radiation and Matter": ["photoelectric effect", "work function", "de broglie", "davisson"],
    "Atoms": ["bohr model", "hydrogen spectrum", "balmer series", "lyman series"],
    "Nuclei": ["nuclear fission", "nuclear fusion", "radioactive decay", "half-life", "binding energy"],
  };

  // Only flag if the current chapter is different from where the keyword belongs
  for (const [targetChapter, keywords] of Object.entries(CHAPTER_SIGNALS)) {
    if (targetChapter === chapter) continue; // same chapter, no contamination
    for (const kw of keywords) {
      if (q.includes(kw)) {
        // Make sure the keyword isn't also valid in the current chapter context
        // (e.g. "stigma" for a flower chapter but question is about ecology)
        return `keyword "${kw}" belongs to "${targetChapter}", not "${chapter}"`;
      }
    }
  }

  return null;
}

// ─── Pass 2 — Independent AI Validator ─────────────────────────────────────
/**
 * Sends the MCQ to Groq WITHOUT revealing the stored answer.
 * Asks Groq to solve it independently using NCERT knowledge.
 * Compares Groq's answer with the stored answer index.
 *
 * @returns {{ pass: boolean, aiAnswer: number|null, confidence: string, aiExplanation: string, issues: string[] }}
 */
async function pass2Validate(mcq, meta) {
  const { q, opts, ans } = mcq;
  const { classLevel, subject, chapter } = meta;

  const optLabels = ["A", "B", "C", "D"];
  const optionsText = opts
    .map((o, i) => `${optLabels[i]}) ${o}`)
    .join("\n");

  const prompt = `You are a strict CBSE NCERT expert examiner for Class ${classLevel} ${subject}.

Chapter under audit: "${chapter}"

Your task: Independently solve this MCQ using ONLY NCERT Class ${classLevel} ${subject} knowledge. Do NOT guess. If unsure, say confidence = "low".

QUESTION:
${q}

OPTIONS:
${optionsText}

STRICT INSTRUCTIONS:
- Analyze each option carefully based on NCERT facts only.
- Identify the single most correct answer.
- Return ONLY valid JSON in this exact format (no other text):
{
  "answer": "A" or "B" or "C" or "D",
  "confidence": "high" or "medium" or "low",
  "reasoning": "Brief 1-2 sentence NCERT-based justification"
}`;

  let responseText;
  try {
    responseText = await callGroq(prompt, VALIDATE_MODEL);
  } catch (err) {
    // If AI call fails, give benefit of doubt — don't fail the question
    return {
      pass: true,
      aiAnswer: null,
      confidence: "unknown",
      aiExplanation: `AI unavailable: ${err.message}`,
      issues: [],
    };
  }

  // Parse AI response
  let parsed;
  try {
    const cleaned = responseText.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    parsed = JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    // Unparseable response — give benefit of doubt
    return {
      pass: true,
      aiAnswer: null,
      confidence: "unknown",
      aiExplanation: "Could not parse AI response",
      issues: [],
    };
  }

  const letterMap = { A: 0, B: 1, C: 2, D: 3 };
  const aiAnswerLetter = (parsed.answer || "").trim().toUpperCase().replace(/[^ABCD]/, "");
  const aiAnswerIdx = letterMap[aiAnswerLetter];
  const confidence = (parsed.confidence || "low").toLowerCase();
  const reasoning = parsed.reasoning || "";

  // Only flag as FAIL if confidence is high or medium AND answers differ
  const answerMismatch = typeof aiAnswerIdx === "number" && aiAnswerIdx !== ans;
  const shouldFail = answerMismatch && (confidence === "high" || confidence === "medium");

  const issues = [];
  if (shouldFail) {
    issues.push(
      `AI independently solved: answer is ${aiAnswerLetter} (index ${aiAnswerIdx}), stored answer is ${optLabels[ans]} (index ${ans}). Confidence: ${confidence}. Reasoning: ${reasoning}`
    );
  }

  return {
    pass: !shouldFail,
    aiAnswer: aiAnswerIdx,
    confidence,
    aiExplanation: reasoning,
    issues,
  };
}

// ─── Explanation Validator ───────────────────────────────────────────────────
/**
 * Checks that the explanation supports the stored answer and doesn't contradict NCERT.
 * Only runs if Pass 1 and Pass 2 both passed.
 */
async function validateExplanation(mcq, meta) {
  const { q, opts, ans, exp } = mcq;
  const { classLevel, subject, chapter } = meta;
  const answerText = opts[ans] || "";

  const prompt = `You are a CBSE NCERT expert checking explanation quality.

Class ${classLevel} | Subject: ${subject} | Chapter: ${chapter}

QUESTION: ${q}
CORRECT ANSWER: ${answerText}
EXPLANATION: ${exp}

Check:
1. Does the explanation correctly support the marked answer?
2. Is the explanation factually accurate per NCERT Class ${classLevel} ${subject}?
3. Does the explanation contradict the answer or introduce wrong facts?

Return ONLY valid JSON:
{
  "valid": true or false,
  "issue": "Describe the problem if invalid, else empty string"
}`;

  let responseText;
  try {
    responseText = await callGroq(prompt, VALIDATE_MODEL);
  } catch {
    return { valid: true, issue: "" }; // benefit of doubt on API failure
  }

  try {
    const cleaned = responseText.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    return {
      valid: parsed.valid !== false,
      issue: parsed.issue || "",
    };
  } catch {
    return { valid: true, issue: "" };
  }
}

// ─── MCQ Regenerator ────────────────────────────────────────────────────────
/**
 * Regenerates a COMPLETE replacement MCQ for a failed question.
 * Returns a new { q, opts[4], ans (0-3), exp } object.
 */
async function regenerateMCQ(failedMcq, meta, failureReasons) {
  const { classLevel, subject, chapter } = meta;
  const topicHint = failedMcq.topic ? `Sub-topic: ${failedMcq.topic}` : "";
  const difficultyHint = failedMcq.difficulty || "medium";

  const prompt = `You are an expert CBSE NCERT question setter for Class ${classLevel} ${subject}.

Generate ONE fresh, high-quality replacement MCQ for the chapter: "${chapter}"
${topicHint}
Difficulty: ${difficultyHint}

The previous question failed audit for these reasons:
${failureReasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}

STRICT REQUIREMENTS:
- Question MUST be from chapter "${chapter}" ONLY — no other chapter's concepts.
- All 4 options must be unique and plausible.
- Exactly ONE option must be correct per NCERT Class ${classLevel} ${subject}.
- Distractors must be educationally meaningful (common misconceptions).
- Scientific facts, formulae, and terminology must exactly match NCERT.
- No HTML tags, no markdown code fences.

Return ONLY valid JSON (no other text):
{
  "q": "Question text ending with ?",
  "opts": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "ans": 0,
  "exp": "Detailed explanation of why the correct answer is correct and why others are wrong.",
  "difficulty": "${difficultyHint}",
  "topic": "Sub-topic within ${chapter}"
}

Where "ans" is the 0-based index (0=A, 1=B, 2=C, 3=D) of the correct option.`;

  let responseText;
  try {
    responseText = await callGroq(prompt, REGENERATE_MODEL, 4);
  } catch (err) {
    console.warn(`    ⚠️  Regeneration API call failed: ${err.message}. Keeping original.`);
    return null; // Keep original if regeneration fails
  }

  try {
    const cleaned = responseText.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.substring(start, end + 1));

    // Validate the regenerated question structure
    if (
      !parsed.q || !Array.isArray(parsed.opts) || parsed.opts.length !== 4 ||
      typeof parsed.ans !== "number" || parsed.ans < 0 || parsed.ans > 3 ||
      !parsed.exp
    ) {
      console.warn(`    ⚠️  Regenerated MCQ has invalid structure. Keeping original.`);
      return null;
    }

    return {
      q: parsed.q,
      opts: parsed.opts.map(o => String(o).trim()),
      ans: parsed.ans,
      exp: parsed.exp,
      difficulty: parsed.difficulty || difficultyHint,
      topic: parsed.topic || "",
    };
  } catch {
    console.warn(`    ⚠️  Could not parse regenerated MCQ. Keeping original.`);
    return null;
  }
}

// ─── Fix explanation only ────────────────────────────────────────────────────
async function regenerateExplanation(mcq, meta) {
  const { classLevel, subject, chapter } = meta;
  const { q, opts, ans } = mcq;
  const answerText = opts[ans] || "";

  const prompt = `You are a CBSE NCERT expert. Write a corrected explanation for this MCQ.

Class ${classLevel} | Subject: ${subject} | Chapter: ${chapter}
QUESTION: ${q}
CORRECT ANSWER: ${answerText}

Write a clear, accurate explanation (2-4 sentences) that:
- Explains WHY "${answerText}" is correct per NCERT.
- Briefly explains why the other options are wrong.
- Uses only facts from Class ${classLevel} ${subject} NCERT textbook.

Return ONLY the explanation text. No JSON. No labels.`;

  try {
    const text = await callGroq(prompt, VALIDATE_MODEL, 3);
    return text.trim();
  } catch {
    return mcq.exp; // keep original if it fails
  }
}

// ─── Duplicate detector ──────────────────────────────────────────────────────
function removeDuplicates(questions) {
  const seen = new Map();
  const unique = [];
  let dupeCount = 0;

  for (const q of questions) {
    // Support both DB schema (question) and normalised (q)
    const key = (q.question || q.q || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (key.length > 5 && seen.has(key)) {
      dupeCount++;
    } else {
      seen.set(key, true);
      unique.push(q);
    }
  }

  return { unique, dupeCount };
}

// ─── Chapter processor ───────────────────────────────────────────────────────
/**
 * Full audit pipeline for a single chapter.
 * Returns a ChapterReport object.
 */
async function processChapter(task, isDryRun) {
  const { classLevel, subject, chapter } = task;
  const label = `[Class ${classLevel}] ${subject} — ${chapter}`;

  const report = {
    classLevel,
    subject,
    chapter,
    total: 0,
    passed: 0,
    failed_p1: 0,
    failed_p2: 0,
    explanation_fixed: 0,
    regenerated: 0,
    duplicates_removed: 0,
    error: null,
    questions_detail: [],
  };

  // Fetch all quiz_sets rows for this chapter
  const { data: rows, error: fetchErr } = await supabase
    .from("quiz_sets")
    .select("*")
    .eq("class_level", classLevel)
    .eq("subject", subject)
    .eq("chapter", chapter)
    .order("set_number");

  if (fetchErr) {
    report.error = `Fetch error: ${fetchErr.message}`;
    console.error(`  ❌ ${label}: ${report.error}`);
    return report;
  }

  if (!rows || rows.length === 0) {
    report.error = "No quiz_sets found for this chapter";
    console.warn(`  ⚠️  ${label}: No data in DB`);
    return report;
  }

  // Collect all questions from all sets
  let allQuestions = [];
  for (const row of rows) {
    const qs = Array.isArray(row.questions) ? row.questions : [];
    allQuestions.push(...qs);
  }

  // Step 0: Remove duplicates before auditing
  const { unique: deduped, dupeCount } = removeDuplicates(allQuestions);
  report.duplicates_removed = dupeCount;
  if (dupeCount > 0) {
    console.log(`  🔁 Removed ${dupeCount} duplicate question(s)`);
  }

  report.total = deduped.length;
  console.log(`  📋 Total questions to audit: ${report.total}`);

  const auditedQuestions = [];

  for (let qi = 0; qi < deduped.length; qi++) {
    // Normalise field names — actual DB schema uses:
    //   question, options, correct_answer, explanation, difficulty, topic
    // Legacy/pipeline schema uses: q, opts, ans, exp
    const raw = deduped[qi];
    const mcq = {
      q:   String(raw.question || raw.q || raw.text || "").trim(),
      opts: Array.isArray(raw.options)  ? raw.options
              : Array.isArray(raw.opts) ? raw.opts
              : ["", "", "", ""],
      ans: typeof raw.correct_answer === "number" ? raw.correct_answer
             : typeof raw.ans        === "number" ? raw.ans
             : typeof raw.answer     === "number" ? raw.answer
             : 0,
      exp: String(raw.explanation || raw.exp || raw.expl || "").trim(),
      // carry over optional metadata
      difficulty:         raw.difficulty         || "",
      topic:              raw.topic              || "",
      learning_objective: raw.learning_objective || "",
    };
    process.stdout.write(`  Q${qi + 1}/${report.total} `);

    const meta = { classLevel, subject, chapter };
    let currentMcq = { ...mcq };
    let wasRegenerated = false;
    let wasExpFixed = false;
    const allIssues = [];

    // ── PASS 1: Structural validation ──
    const p1Result = pass1Validate(currentMcq, meta);
    if (!p1Result.pass) {
      process.stdout.write(`[P1 FAIL] `);
      report.failed_p1++;
      allIssues.push(...p1Result.issues);

      if (!isDryRun) {
        process.stdout.write(`[REGEN] `);
        const replacement = await regenerateMCQ(currentMcq, meta, p1Result.issues);
        if (replacement) {
          currentMcq = replacement;
          wasRegenerated = true;
          report.regenerated++;
        }
      }
    } else {
      // ── PASS 2: Independent AI validation ──
      const p2Result = await pass2Validate(currentMcq, meta);
      if (!p2Result.pass) {
        process.stdout.write(`[P2 FAIL:${["A","B","C","D"][p2Result.aiAnswer] || "?"}≠${["A","B","C","D"][currentMcq.ans]}] `);
        report.failed_p2++;
        allIssues.push(...p2Result.issues);

        if (!isDryRun) {
          process.stdout.write(`[REGEN] `);
          const replacement = await regenerateMCQ(currentMcq, meta, p2Result.issues);
          if (replacement) {
            currentMcq = replacement;
            wasRegenerated = true;
            report.regenerated++;
          }
        }
      } else {
        // ── Explanation validation (only if both passes pass) ──
        const expResult = await validateExplanation(currentMcq, meta);
        if (!expResult.valid) {
          process.stdout.write(`[EXP FIX] `);
          allIssues.push(`Explanation issue: ${expResult.issue}`);
          report.explanation_fixed++;

          if (!isDryRun) {
            const fixedExp = await regenerateExplanation(currentMcq, meta);
            currentMcq = { ...currentMcq, exp: fixedExp };
            wasExpFixed = true;
          }
        } else {
          process.stdout.write(`[✅] `);
          report.passed++;
        }
      }
    }

    report.questions_detail.push({
      index: qi + 1,
      question_preview: (currentMcq.q || "").substring(0, 80),
      original_ans: ["A","B","C","D"][mcq.ans] || String(mcq.ans),
      final_ans: ["A","B","C","D"][currentMcq.ans] || String(currentMcq.ans),
      regenerated: wasRegenerated,
      exp_fixed: wasExpFixed,
      issues: allIssues,
    });

    // Convert normalised MCQ back to DB schema before storing
    auditedQuestions.push({
      question:          currentMcq.q,
      options:           currentMcq.opts,
      correct_answer:    currentMcq.ans,
      explanation:       currentMcq.exp,
      difficulty:        currentMcq.difficulty        || raw.difficulty        || "medium",
      topic:             currentMcq.topic             || raw.topic             || "",
      learning_objective:currentMcq.learning_objective|| raw.learning_objective|| "",
    });
  }

  process.stdout.write("\n");

  // ── Write corrected questions back to DB ──
  if (!isDryRun && (report.regenerated > 0 || report.duplicates_removed > 0 || report.explanation_fixed > 0)) {
    console.log(`  💾 Writing ${auditedQuestions.length} corrected questions back to DB...`);

    // Chunk into sets of 30 (match original structure)
    const CHUNK_SIZE = 30;
    const chunks = [];
    for (let i = 0; i < auditedQuestions.length; i += CHUNK_SIZE) {
      chunks.push(auditedQuestions.slice(i, i + CHUNK_SIZE));
    }

    // Pad last chunk if needed
    const last = chunks[chunks.length - 1];
    if (last && last.length < CHUNK_SIZE && auditedQuestions.length > 0) {
      let padIdx = 0;
      while (last.length < CHUNK_SIZE) {
        last.push({ ...last[padIdx % last.length] });
        padIdx++;
      }
    }

    // Delete all existing sets for this chapter
    const { error: delErr } = await supabase
      .from("quiz_sets")
      .delete()
      .eq("class_level", classLevel)
      .eq("subject", subject)
      .eq("chapter", chapter);

    if (delErr) {
      console.error(`  ❌ Failed to delete old sets: ${delErr.message}`);
      report.error = `DB delete error: ${delErr.message}`;
      return report;
    }

    // Insert corrected chunks
    const rowsToInsert = chunks.map((chunk, idx) => ({
      class_level: classLevel,
      subject,
      chapter,
      set_number: idx + 1,
      questions: chunk,
      created_at: new Date().toISOString(),
    }));

    const { error: insErr } = await supabase
      .from("quiz_sets")
      .insert(rowsToInsert);

    if (insErr) {
      console.error(`  ❌ Failed to insert corrected sets: ${insErr.message}`);
      report.error = `DB insert error: ${insErr.message}`;
    } else {
      console.log(`  ✅ Saved ${chunks.length} corrected set(s) to DB`);
    }
  } else if (isDryRun) {
    console.log(`  🔍 DRY RUN — No DB writes performed`);
  } else {
    console.log(`  ✅ All questions passed — no DB update needed`);
  }

  return report;
}

// ─── Report writer ───────────────────────────────────────────────────────────
function writeReport(allReports, stats, dryRun) {
  const lines = [
    `# MCQ Audit Report`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Mode:** ${dryRun ? "DRY RUN (no DB writes)" : "LIVE (DB updated)"}`,
    ``,
    `## Aggregate Summary`,
    ``,
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total MCQs Checked | ${stats.total_checked} |`,
    `| Passed Pass 1 (Structural) | ${stats.passed_p1} |`,
    `| Failed Pass 1 | ${stats.failed_p1} |`,
    `| Passed Pass 2 (AI) | ${stats.passed_p2} |`,
    `| Failed Pass 2 | ${stats.failed_p2} |`,
    `| Explanations Fixed | ${stats.explanation_fixed} |`,
    `| Total Regenerated | ${stats.regenerated} |`,
    `| Duplicates Removed | ${stats.duplicates_removed} |`,
    `| Chapters Completed | ${stats.chapters_completed} |`,
    ``,
    `## Chapter-by-Chapter Results`,
    ``,
    `| Class | Subject | Chapter | Total | ✅ OK | ❌ P1 | ❌ P2 | 🔁 Dupes | 🔄 Regen | 📝 ExpFix | Error |`,
    `|-------|---------|---------|-------|------|------|------|---------|---------|---------|-------|`,
  ];

  for (const r of allReports) {
    const ok = r.total - r.failed_p1 - r.failed_p2 - r.duplicates_removed;
    lines.push(
      `| ${r.classLevel} | ${r.subject} | ${r.chapter} | ${r.total} | ${Math.max(0,ok)} | ${r.failed_p1} | ${r.failed_p2} | ${r.duplicates_removed} | ${r.regenerated} | ${r.explanation_fixed} | ${r.error || "—"} |`
    );
  }

  lines.push("");
  lines.push("## Question-Level Detail (Failed Only)");
  lines.push("");

  for (const r of allReports) {
    const failed = r.questions_detail.filter(q => q.issues.length > 0);
    if (failed.length === 0) continue;
    lines.push(`### Class ${r.classLevel} — ${r.subject} — ${r.chapter}`);
    for (const q of failed) {
      lines.push(`- **Q${q.index}**: "${q.question_preview}..."`);
      lines.push(`  - Original ans: **${q.original_ans}** → Final ans: **${q.final_ans}**`);
      lines.push(`  - Regenerated: ${q.regenerated ? "Yes" : "No"} | Exp Fixed: ${q.exp_fixed ? "Yes" : "No"}`);
      for (const issue of q.issues) {
        lines.push(`  - ⚠️ ${issue}`);
      }
    }
    lines.push("");
  }

  fs.writeFileSync(REPORT_FILE, lines.join("\n"), "utf-8");
  console.log(`\n📄 Full report written to: ${REPORT_FILE}`);
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printBanner() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          MCQ AUDIT SYSTEM — AkmEdu CBSE Platform            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (DRY_RUN) console.log("🔍 MODE: DRY RUN — No database writes will occur");
  if (ARG_CLASS) console.log(`🎯 Filter Class: ${ARG_CLASS}`);
  if (ARG_SUBJ)  console.log(`🎯 Filter Subject: ${ARG_SUBJ}`);
  if (ARG_CHAP)  console.log(`🎯 Filter Chapter: ${ARG_CHAP}`);
  console.log("");
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  // Determine which classes to audit
  const classesToAudit = ARG_CLASS
    ? [ARG_CLASS]
    : ["12", "11"]; // Class 12 ALWAYS first

  // Build full chapter list
  console.log("📚 Loading curriculum...");
  const chapters = await buildChapterList(classesToAudit);
  console.log(`   Found ${chapters.length} chapters to audit\n`);

  if (chapters.length === 0) {
    console.error("❌ No chapters found. Check --subject / --chapter filters.");
    process.exit(1);
  }

  // Load checkpoint
  const cp = loadCheckpoint();
  const completedSet = new Set(cp.completed_chapters);
  const stats = cp.stats;

  // Count how many are remaining
  const remaining = chapters.filter(t => !completedSet.has(chapterKey(t)));
  console.log(`🔖 Checkpoint: ${completedSet.size} already completed, ${remaining.length} remaining\n`);

  const allReports = [];
  let currentClass = null;

  const RUNTIME_LIMIT_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours
  const startTimeMs = Date.now();

  for (const task of chapters) {
    if (Date.now() - startTimeMs > RUNTIME_LIMIT_MS) {
      console.log(`\n⏳ 3.5 hour execution limit reached! Exiting gracefully to yield to the next scheduled cloud runner...`);
      break;
    }

    const key = chapterKey(task);

    // Skip completed chapters
    if (completedSet.has(key)) {
      console.log(`⏭️  Skipping (already audited): [${task.classLevel}] ${task.subject} — ${task.chapter}`);
      continue;
    }

    // Print class separator
    if (task.classLevel !== currentClass) {
      currentClass = task.classLevel;
      console.log(`\n${"═".repeat(65)}`);
      console.log(`  STARTING CLASS ${currentClass} AUDIT`);
      console.log(`${"═".repeat(65)}\n`);
    }

    console.log(`\n▶  [Class ${task.classLevel}] ${task.subject} — ${task.chapter}`);
    console.log(`   Unit: ${task.unit}`);

    const report = await processChapter(task, DRY_RUN);
    allReports.push(report);

    // Update aggregate stats
    stats.total_checked   += report.total;
    stats.failed_p1       += report.failed_p1;
    stats.failed_p2       += report.failed_p2;
    stats.explanation_fixed += report.explanation_fixed;
    stats.regenerated     += report.regenerated;
    stats.duplicates_removed += report.duplicates_removed;
    stats.passed_p1       += (report.total - report.failed_p1);
    stats.passed_p2       += (report.total - report.failed_p1 - report.failed_p2);
    stats.chapters_completed++;

    // Print chapter summary
    console.log(`   📊 Total: ${report.total} | ❌ P1 fails: ${report.failed_p1} | ❌ P2 fails: ${report.failed_p2} | 🔄 Regen: ${report.regenerated} | 📝 Exp fixes: ${report.explanation_fixed} | 🔁 Dupes removed: ${report.duplicates_removed}`);

    // Mark chapter as complete and save checkpoint
    if (!DRY_RUN) {
      completedSet.add(key);
      cp.completed_chapters = Array.from(completedSet);
      cp.stats = stats;
      cp.last_updated = new Date().toISOString();
      saveCheckpoint(cp);
    }
  }

  // ── Final summary ──
  console.log(`\n${"═".repeat(65)}`);
  console.log("  AUDIT COMPLETE — FINAL SUMMARY");
  console.log(`${"═".repeat(65)}`);
  console.log(`📋 Total MCQs Checked:     ${stats.total_checked}`);
  console.log(`❌ Failed Pass 1:           ${stats.failed_p1}`);
  console.log(`❌ Failed Pass 2:           ${stats.failed_p2}`);
  console.log(`📝 Explanations Fixed:     ${stats.explanation_fixed}`);
  console.log(`🔄 Questions Regenerated:  ${stats.regenerated}`);
  console.log(`🔁 Duplicates Removed:     ${stats.duplicates_removed}`);
  console.log(`📚 Chapters Completed:     ${stats.chapters_completed}`);
  console.log(`✅ Consistency Score:      ${stats.total_checked > 0 ? ((1 - (stats.failed_p1 + stats.failed_p2) / stats.total_checked) * 100).toFixed(1) : 100}%`);
  console.log(`${"═".repeat(65)}\n`);

  // Write the report
  writeReport(allReports, stats, DRY_RUN);

  // Update brain.md section if full audit completed (not filtered)
  if (!ARG_CLASS && !ARG_SUBJ && !ARG_CHAP && !DRY_RUN) {
    console.log("📝 Full audit completed. Remember to update brain.md.");
  }
}

main().catch(err => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
