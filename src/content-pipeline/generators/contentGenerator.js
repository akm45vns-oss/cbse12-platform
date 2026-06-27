/**
 * contentGenerator.js — 15 Content Type Generators
 *
 * Each generator builds a structured prompt and calls the Groq API via the key pool.
 * Returns a content envelope: { class, subject, chapter, content_type, generated_by,
 *                               generated_at, version, data }
 *
 * Uses keyPool for round-robin key selection with health weighting and backoff.
 */

import { waitForAvailableKey, acquireKey, releaseSuccess, releaseFailure } from "../keyPool.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL        = "llama-3.1-8b-instant";
const MIN_DELAY_MS = 500; // minimum gap between requests per key

// ────────────────────────────────────────────────────────────────────
// GROQ CALL WRAPPER
// ────────────────────────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 2000) {
  const keyState = await waitForAvailableKey();
  acquireKey(keyState);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${keyState.key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.65,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.status === 429 || res.status === 401) {
      releaseFailure(keyState, res.status);
      throw Object.assign(new Error(`Groq HTTP ${res.status}`), { status: res.status, retryable: true });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      releaseFailure(keyState, res.status);
      throw new Error(`Groq API Error ${res.status}: ${body?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq");

    releaseSuccess(keyState);

    // Enforce minimum delay between requests (per key) to avoid burst rate-limits
    await sleep(MIN_DELAY_MS);

    return text;
  } catch (err) {
    if (!err.retryable) releaseFailure(keyState, 0);
    throw err;
  }
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ────────────────────────────────────────────────────────────────────
// ENVELOPE WRAPPER
// ────────────────────────────────────────────────────────────────────
function makeEnvelope(classLevel, subject, chapter, contentType, data) {
  return {
    class: classLevel,
    subject,
    chapter,
    content_type: contentType,
    generated_by: `groq/${MODEL}`,
    generated_at: new Date().toISOString(),
    version: "1.0",
    data,
  };
}

// ────────────────────────────────────────────────────────────────────
// CONTENT GENERATORS — 15 TYPES
// ────────────────────────────────────────────────────────────────────

export async function generateDetailedNotes(classLevel, subject, chapter) {
  const prompt = `You are an expert CBSE Class ${classLevel} teacher creating comprehensive study notes.
Subject: ${subject} | Chapter: ${chapter} | Class: ${classLevel} CBSE

Write detailed, original study notes in markdown format with the following structure:

# ${chapter}
## 📌 Chapter Overview
[2-3 paragraph introduction explaining what this chapter is about]

## 🎯 Learning Objectives
[Bullet list of 5-7 what students will learn]

## 🔑 Key Concepts & Definitions
[Define each important term clearly in your own words]

## 📐 Core Theory & Principles
[Explain the fundamental theories and principles with examples]

## 🧮 Important Formulas & Laws
[List all relevant formulas, laws, and equations with explanations]

## 🔬 Detailed Explanations
[In-depth explanation of each major topic with examples]

## 🖼️ Diagrams & Visual Concepts
[Describe what diagrams should show; explain any important visual concepts]

## ⭐ Most Important Points (Exam Focus)
[10-15 bullet points of the most exam-important content]

## ❌ Common Mistakes to Avoid
[5 common misconceptions or errors students make]

## 💡 Real-World Applications
[3-5 practical applications of this chapter's concepts]

## 🔁 Quick Revision Summary
[15-20 bullet points for last-minute revision]

Write original, accurate content aligned to NCERT Class ${classLevel} curriculum. Use proper terminology.`;

  const text = await callGroq(prompt, 3500);
  return makeEnvelope(classLevel, subject, chapter, "detailed_notes", { markdown: text });
}

export async function generateShortNotes(classLevel, subject, chapter) {
  const prompt = `Create concise revision notes for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as markdown:
# ${chapter} — Quick Revision Notes

## ⚡ Key Points
[15-20 crisp bullet points covering the entire chapter]

## 🔑 Must-Know Definitions
[5-8 most important terms with one-line definitions]

## 📊 Important Formulas
[All essential formulas — one per line with labels]

## ⭐ Exam Tips
[5 tips specific to this chapter for board exams]

Keep it concise, scannable, and complete. Target 400-600 words.`;

  const text = await callGroq(prompt, 1200);
  return makeEnvelope(classLevel, subject, chapter, "short_notes", { markdown: text });
}

export async function generateKeyDefinitions(classLevel, subject, chapter) {
  const prompt = `List all key definitions for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "term": "Term Name",
    "definition": "Clear, precise definition in 1-3 sentences using NCERT terminology",
    "example": "An example or application of this term (optional)"
  }
]

Include 15-25 most important terms. Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 1500);
  let definitions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    definitions = JSON.parse(cleaned.slice(start));
  } catch {
    definitions = [{ term: "Parse Error", definition: text, example: "" }];
  }
  return makeEnvelope(classLevel, subject, chapter, "key_definitions", { definitions });
}

export async function generateFormulaSheet(classLevel, subject, chapter) {
  const prompt = `Create a complete formula sheet for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "name": "Formula/Law Name",
    "formula": "Mathematical expression or statement",
    "variables": "What each variable/symbol means",
    "units": "SI units if applicable",
    "notes": "When to use this formula / important conditions"
  }
]

Include ALL relevant formulas. If the chapter has no mathematical formulas, include key statements/laws in the same format using 'formula' for the statement. Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 1200);
  let formulas;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    formulas = JSON.parse(cleaned.slice(start));
  } catch {
    formulas = [{ name: "Content", formula: text, variables: "", units: "", notes: "" }];
  }
  return makeEnvelope(classLevel, subject, chapter, "formula_sheet", { formulas });
}

export async function generateImportantConcepts(classLevel, subject, chapter) {
  const prompt = `List the most important concepts for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "concept": "Concept Name",
    "explanation": "Clear explanation in 2-4 sentences",
    "importance": "Why this is important for exams / real life",
    "related_topics": ["related topic 1", "related topic 2"]
  }
]

List 10-15 most important concepts. Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 2000);
  let concepts;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    concepts = JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    concepts = [{ concept: "Content", explanation: text, importance: "", related_topics: [] }];
  }
  return makeEnvelope(classLevel, subject, chapter, "important_concepts", { concepts });
}

export async function generateNcertSummary(classLevel, subject, chapter) {
  const prompt = `Write a comprehensive NCERT-aligned summary for Class ${classLevel} ${subject} — ${chapter}.

Format as markdown:
# NCERT Summary: ${chapter}

## Chapter at a Glance
[3-4 sentence overview of the entire chapter]

## Section-wise Summary
[Summarise each major section/topic as it appears in NCERT, using NCERT terminology]

## Important NCERT Exercises Insight
[Key concepts tested in NCERT exercises and what to remember]

## NCERT Exemplar Focus
[Additional topics covered in NCERT Exemplar for this chapter]

## Board Exam Relevance
[Marks weightage and frequently asked topics from this chapter]

Use accurate NCERT terminology. Write 500-700 words.`;

  const text = await callGroq(prompt, 1400);
  return makeEnvelope(classLevel, subject, chapter, "ncert_summary", { markdown: text });
}

export async function generateMCQs(classLevel, subject, chapter) {
  const prompt = `Generate exactly 20 high-quality MCQs for CBSE Class ${classLevel} ${subject} — ${chapter}.

Return as JSON array:
[
  {
    "q": "Question text ending with ?",
    "opts": ["(A) Option A", "(B) Option B", "(C) Option C", "(D) Option D"],
    "ans": "A",
    "explanation": "Why this answer is correct and others are wrong",
    "difficulty": "easy|medium|hard",
    "topic": "Sub-topic within the chapter"
  }
]

Mix difficulties: 6 easy, 9 medium, 5 hard.
Cover all major topics of the chapter.
Make distractors plausible and educational.
Return ONLY valid JSON array with exactly 20 questions.`;

  const text = await callGroq(prompt, 3000);
  let questions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    questions = JSON.parse(cleaned.slice(start));
  } catch {
    // Attempt repair
    try {
      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
      const start = cleaned.indexOf("[");
      let partial = cleaned.slice(start);
      const lastGood = partial.lastIndexOf("},");
      if (lastGood !== -1) partial = partial.slice(0, lastGood + 1) + "]";
      questions = JSON.parse(partial);
    } catch {
      questions = [];
    }
  }
  return makeEnvelope(classLevel, subject, chapter, "mcqs", { questions, total: questions.length });
}

export async function generateAssertionReason(classLevel, subject, chapter) {
  const prompt = `Generate exactly 10 Assertion-Reason questions for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "assertion": "Assertion (A): [statement]",
    "reason": "Reason (R): [statement]",
    "opts": [
      "(A) Both A and R are true and R is the correct explanation of A",
      "(B) Both A and R are true but R is not the correct explanation of A",
      "(C) A is true but R is false",
      "(D) A is false but R is true"
    ],
    "ans": "A",
    "explanation": "Explanation of why this option is correct"
  }
]

Use all 4 answer types. Make assertions and reasons factually accurate.
Return ONLY valid JSON array with exactly 10 questions.`;

  const text = await callGroq(prompt, 2000);
  let questions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    questions = JSON.parse(cleaned.slice(start));
  } catch {
    questions = [];
  }
  return makeEnvelope(classLevel, subject, chapter, "assertion_reason", { questions, total: questions.length });
}

export async function generateCaseBased(classLevel, subject, chapter) {
  const prompt = `Generate exactly 2 Case-Based question sets (5 questions each = 10 total) for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "case_id": 1,
    "passage": "A descriptive passage (100-150 words) describing a real-world scenario related to the chapter",
    "questions": [
      {
        "q": "Question based on the passage",
        "opts": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
        "ans": "A",
        "explanation": "Explanation"
      }
    ]
  }
]

Make passages realistic, relatable, and curriculum-aligned.
Return ONLY valid JSON array with exactly 2 case objects (5 questions each).`;

  const text = await callGroq(prompt, 2500);
  let cases;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    cases = JSON.parse(cleaned.slice(start));
  } catch {
    // Attempt partial repair
    try {
      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
      const start = cleaned.indexOf("[");
      let partial = cleaned.slice(start);
      const lastGood = partial.lastIndexOf("},");
      if (lastGood !== -1) partial = partial.slice(0, lastGood + 1) + "]";
      cases = JSON.parse(partial);
    } catch {
      cases = [];
    }
  }
  return makeEnvelope(classLevel, subject, chapter, "case_based", { cases });
}

export async function generateShortAnswer(classLevel, subject, chapter) {
  const prompt = `Generate exactly 10 Short Answer Questions (2-3 marks each) for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "q": "Question text",
    "marks": 2,
    "answer": "Model answer in 3-5 sentences using proper NCERT terminology",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "topic": "Sub-topic"
  }
]

Cover all major topics. Answers should be concise but complete.
Return ONLY valid JSON array with exactly 10 questions.`;

  const text = await callGroq(prompt, 2000);
  let questions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    questions = JSON.parse(cleaned.slice(start));
  } catch {
    questions = [];
  }
  return makeEnvelope(classLevel, subject, chapter, "short_answer", { questions, total: questions.length });
}

export async function generateLongAnswer(classLevel, subject, chapter) {
  const prompt = `Generate exactly 5 Long Answer Questions (5 marks each) for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "q": "Question text (often multi-part: a, b, c)",
    "marks": 5,
    "answer": "Detailed model answer covering all aspects (150-250 words)",
    "marking_scheme": [
      "Point 1 worth X mark(s)",
      "Point 2 worth X mark(s)"
    ],
    "topic": "Sub-topic"
  }
]

Questions should be comprehensive and cover important board-exam topics.
Return ONLY valid JSON array with exactly 5 questions.`;

  const text = await callGroq(prompt, 3500);
  let questions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    questions = JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    questions = [];
  }
  return makeEnvelope(classLevel, subject, chapter, "long_answer", { questions, total: questions.length });
}

export async function generatePYQStyle(classLevel, subject, chapter) {
  const prompt = `Generate 10 Previous Year Question-style questions for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON array:
[
  {
    "q": "Question text (similar style to CBSE board questions)",
    "type": "MCQ|Short Answer|Long Answer|Fill in the Blank|True/False",
    "marks": 1,
    "answer": "Model answer",
    "year_pattern": "Typical board year pattern this resembles (e.g., '2019-style')",
    "difficulty": "easy|medium|hard"
  }
]

Include a mix of question types. Base them on actual CBSE board question patterns.
Return ONLY valid JSON array with exactly 10 questions.`;

  const text = await callGroq(prompt, 2000);
  let questions;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    questions = JSON.parse(cleaned.slice(start));
  } catch {
    questions = [];
  }
  return makeEnvelope(classLevel, subject, chapter, "pyq_style", { questions, total: questions.length });
}

export async function generateDifficultyTags(classLevel, subject, chapter) {
  const prompt = `Return a JSON object with difficulty metadata for CBSE Class ${classLevel} ${subject} — ${chapter}.

{
  "overall_difficulty": "easy|medium|hard",
  "difficulty_score": 6,
  "topics": [
    { "name": "Topic Name", "difficulty": "easy|medium|hard", "weight_percentage": 20 }
  ],
  "exam_frequency": "high|medium|low",
  "memory_vs_application": "memory|application|balanced",
  "common_errors": ["Error 1", "Error 2"]
}

Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 400);
  let tags;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    tags = JSON.parse(cleaned.slice(start));
  } catch {
    tags = { overall_difficulty: "medium", difficulty_score: 5, topics: [], exam_frequency: "medium" };
  }
  return makeEnvelope(classLevel, subject, chapter, "difficulty_tags", tags);
}

export async function generateLearningObjectives(classLevel, subject, chapter) {
  const prompt = `Write learning objectives for CBSE Class ${classLevel} ${subject} — ${chapter}.

Format as JSON:
{
  "bloom_levels": {
    "remember": ["Students will be able to..."],
    "understand": ["Students will be able to..."],
    "apply": ["Students will be able to..."],
    "analyze": ["Students will be able to..."]
  },
  "ncert_objectives": ["As per NCERT objective 1", "..."],
  "board_exam_objectives": ["What CBSE tests from this chapter"]
}

Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 600);
  let objectives;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    objectives = JSON.parse(cleaned.slice(start));
  } catch {
    objectives = { bloom_levels: {}, ncert_objectives: [], board_exam_objectives: [] };
  }
  return makeEnvelope(classLevel, subject, chapter, "learning_objectives", objectives);
}

export async function generateEstimatedStudyTime(classLevel, subject, chapter) {
  const prompt = `Return a JSON object with estimated study times for CBSE Class ${classLevel} ${subject} — ${chapter}.

{
  "first_reading_minutes": 45,
  "notes_making_minutes": 30,
  "revision_minutes": 20,
  "practice_questions_minutes": 25,
  "total_minutes": 120,
  "sessions_recommended": 3,
  "difficulty_factor": "medium",
  "tips": ["Study tip 1", "Study tip 2"]
}

Return ONLY valid JSON.`;

  const text = await callGroq(prompt, 200);
  let timing;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    timing = JSON.parse(cleaned.slice(start));
  } catch {
    timing = {
      first_reading_minutes: 45,
      notes_making_minutes: 30,
      revision_minutes: 20,
      practice_questions_minutes: 25,
      total_minutes: 120,
      sessions_recommended: 3,
      difficulty_factor: "medium",
      tips: [],
    };
  }
  return makeEnvelope(classLevel, subject, chapter, "estimated_study_time", timing);
}

// ────────────────────────────────────────────────────────────────────
// DISPATCH TABLE — maps contentType → generator function
// ────────────────────────────────────────────────────────────────────
export const GENERATORS = {
  detailed_notes:       generateDetailedNotes,
  short_notes:          generateShortNotes,
  key_definitions:      generateKeyDefinitions,
  formula_sheet:        generateFormulaSheet,
  important_concepts:   generateImportantConcepts,
  ncert_summary:        generateNcertSummary,
  mcqs:                 generateMCQs,
  assertion_reason:     generateAssertionReason,
  case_based:           generateCaseBased,
  short_answer:         generateShortAnswer,
  long_answer:          generateLongAnswer,
  pyq_style:            generatePYQStyle,
  difficulty_tags:      generateDifficultyTags,
  learning_objectives:  generateLearningObjectives,
  estimated_study_time: generateEstimatedStudyTime,
};

/**
 * Generate a single content type for a chapter.
 * Returns the content envelope on success.
 */
export async function generateContent(classLevel, subject, chapter, contentType) {
  const generator = GENERATORS[contentType];
  if (!generator) throw new Error(`Unknown content type: ${contentType}`);
  return generator(classLevel, subject, chapter);
}
