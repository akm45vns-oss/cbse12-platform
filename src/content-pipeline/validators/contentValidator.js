/**
 * contentValidator.js — Quality Control for Generated Content
 *
 * Validates:
 * 1. Schema (required envelope fields)
 * 2. Minimum content length
 * 3. CBSE keyword alignment
 * 4. No duplicate questions (hash-based)
 * 5. Structured markdown sections
 * 6. JSON structure for question types
 * 7. Basic hallucination heuristics
 */

import crypto from "crypto";

// ── Minimum token estimates (by content type) ──────────────────────
const MIN_LENGTHS = {
  detailed_notes:       800,
  short_notes:          200,
  key_definitions:      5,    // min 5 terms
  formula_sheet:        1,    // min 1 item — some chapters are purely conceptual
  important_concepts:   5,    // min 5 concepts
  ncert_summary:        300,
  mcqs:                 10,   // min 10 questions (out of 20)
  assertion_reason:     3,
  case_based:           1,    // min 1 case set
  short_answer:         3,
  long_answer:          2,
  pyq_style:            3,
  difficulty_tags:      1,
  learning_objectives:  1,
  estimated_study_time: 1,
};

// ── CBSE subject-specific mandatory keywords ──────────────────────
// A valid response for a subject MUST contain at least one of these terms
const SUBJECT_KEYWORDS = {
  Physics:             ["equation", "force", "energy", "velocity", "acceleration", "law", "current", "charge", "wave", "motion"],
  Chemistry:           ["reaction", "element", "compound", "bond", "molecule", "atom", "orbital", "organic", "acid", "electron"],
  Biology:             ["cell", "organism", "protein", "gene", "tissue", "evolution", "photosynthesis", "respiration", "nucleus", "membrane"],
  Mathematics:         ["theorem", "function", "derivative", "integral", "matrix", "vector", "probability", "equation", "set", "limit"],
  English:             ["theme", "character", "literary", "metaphor", "narrative", "plot", "author", "passage", "poem", "stanza"],
  "Computer Science":  ["algorithm", "program", "function", "variable", "database", "network", "loop", "array", "python", "query"],
  Economics:           ["demand", "supply", "market", "GDP", "inflation", "price", "income", "equilibrium", "production", "cost"],
  Accountancy:         ["debit", "credit", "account", "ledger", "balance", "journal", "asset", "liability", "profit", "cash"],
  "Business Studies":  ["management", "organisation", "business", "marketing", "finance", "trade", "commerce", "enterprise", "profit", "consumer"],
  History:             ["civilization", "empire", "century", "war", "revolution", "society", "culture", "ruler", "dynasty", "period"],
  "Political Science": ["constitution", "government", "parliament", "democracy", "rights", "law", "election", "policy", "state", "federal"],
  "Physical Education":["exercise", "fitness", "sport", "muscle", "health", "training", "body", "physical", "nutrition", "yoga"],
};

// ── Seen question hashes (per run, to detect duplicates across chapters) ──
const seenHashes = new Set();

// ────────────────────────────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ────────────────────────────────────────────────────────────────────

/**
 * 1. Validate envelope schema
 */
function validateSchema(envelope) {
  const required = ["class", "subject", "chapter", "content_type", "generated_by", "generated_at", "version", "data"];
  const errors = [];
  for (const field of required) {
    if (envelope[field] === undefined || envelope[field] === null || envelope[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return errors;
}

/**
 * 2. Validate content length meets minimum threshold
 */
function validateLength(envelope) {
  const { content_type, data } = envelope;
  const min = MIN_LENGTHS[content_type];
  const errors = [];

  if (min === undefined) return errors;

  // For markdown types
  if (data.markdown) {
    const wordCount = data.markdown.trim().split(/\s+/).length;
    if (wordCount < min) {
      errors.push(`Content too short: ${wordCount} words (minimum ${min})`);
    }
    return errors;
  }

  // For question arrays
  const arrays = ["questions", "definitions", "formulas", "concepts", "cases"];
  for (const arr of arrays) {
    if (Array.isArray(data[arr])) {
      if (data[arr].length < min) {
        errors.push(`Too few items in ${arr}: ${data[arr].length} (minimum ${min})`);
      }
      return errors;
    }
  }

  // For objects (difficulty_tags, learning_objectives, estimated_study_time)
  if (typeof data === "object" && Object.keys(data).length < 1) {
    errors.push("Data object is empty");
  }

  return errors;
}

/**
 * 3. Validate CBSE keyword alignment
 */
function validateCBSEAlignment(envelope) {
  const { subject, data } = envelope;
  const keywords = SUBJECT_KEYWORDS[subject];
  if (!keywords) return [];

  // Convert data to a searchable string
  const content = JSON.stringify(data).toLowerCase();
  const found = keywords.some(kw => content.includes(kw.toLowerCase()));

  if (!found) {
    return [`Content may not be CBSE-aligned for ${subject} — no subject-specific keywords found`];
  }
  return [];
}

/**
 * 4. No duplicate questions (hash-based, cross-chapter detection)
 */
function validateNoDuplicates(envelope) {
  const { data, content_type } = envelope;
  const errors = [];
  const arrayKeys = ["questions", "definitions", "formulas", "concepts"];

  for (const key of arrayKeys) {
    if (!Array.isArray(data[key])) continue;

    const seenLocal = new Set();
    for (const item of data[key]) {
      const questionText = (item.q || item.assertion || item.term || item.name || "").trim();
      if (!questionText) continue;

      const hash = crypto.createHash("sha256").update(questionText.toLowerCase()).digest("hex").slice(0, 16);

      if (seenLocal.has(hash)) {
        errors.push(`Duplicate question/item within response: "${questionText.slice(0, 60)}..."`);
        continue;
      }

      if (seenHashes.has(hash) && ["mcqs", "assertion_reason", "short_answer", "long_answer", "pyq_style"].includes(content_type)) {
        // Cross-chapter duplicate — warn but don't reject (common for broad topics)
        console.warn(`[Validator] Cross-chapter duplicate detected: "${questionText.slice(0, 60)}"`);
      }

      seenLocal.add(hash);
      seenHashes.add(hash);
    }
  }

  return errors;
}

/**
 * 5. Validate markdown structure (for note types)
 */
function validateMarkdown(envelope) {
  const { content_type, data } = envelope;
  if (!data.markdown) return [];

  const noteTypes = ["detailed_notes", "short_notes", "ncert_summary"];
  if (!noteTypes.includes(content_type)) return [];

  const errors = [];
  const md = data.markdown;

  // Must have at least one heading
  if (!md.includes("#")) {
    errors.push("Markdown response has no headings — may be malformatted");
  }

  // Must have reasonable content density
  const lines = md.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 10) {
    errors.push(`Markdown has only ${lines.length} non-empty lines — likely truncated`);
  }

  return errors;
}

/**
 * 6. Basic hallucination heuristics
 */
function validateHallucination(envelope) {
  const { subject, chapter, data } = envelope;
  const content = JSON.stringify(data).toLowerCase();
  const errors = [];

  // Check for obvious failure patterns
  const failPatterns = [
    "i cannot", "i am unable", "i don't have access",
    "as an ai", "i'm sorry", "i apologize",
    "lorem ipsum", "placeholder",
  ];

  for (const pattern of failPatterns) {
    if (content.includes(pattern)) {
      errors.push(`Response contains AI refusal/failure pattern: "${pattern}"`);
      break;
    }
  }

  // Check chapter name appears in content
  const chapterWords = chapter.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const mentionsChapter = chapterWords.some(w => content.includes(w));
  if (!mentionsChapter && chapterWords.length > 0) {
    errors.push(`Content may not be specific to chapter "${chapter}" — no chapter-specific terms found`);
  }

  return errors;
}

// ────────────────────────────────────────────────────────────────────
// MAIN VALIDATOR
// ────────────────────────────────────────────────────────────────────

/**
 * Validate a content envelope.
 * @param {object} envelope
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateContent(envelope) {
  const errors = [
    ...validateSchema(envelope),
    ...validateLength(envelope),
    ...validateMarkdown(envelope),
    ...validateNoDuplicates(envelope),
  ];

  const warnings = [
    ...validateCBSEAlignment(envelope),
    ...validateHallucination(envelope),
  ];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results in a formatted way.
 */
export function logValidation(envelope, result) {
  const { subject, chapter, content_type } = envelope;
  const tag = `[Validator] ${subject} / ${chapter} / ${content_type}`;

  if (result.valid) {
    if (result.warnings.length > 0) {
      console.warn(`${tag} ⚠️  ${result.warnings.join("; ")}`);
    } else {
      console.log(`${tag} ✅ Valid`);
    }
  } else {
    console.error(`${tag} ❌ INVALID: ${result.errors.join("; ")}`);
  }
}

/**
 * Clear seen hashes (call between different pipeline runs).
 */
export function clearSeenHashes() {
  seenHashes.clear();
}
