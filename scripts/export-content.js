import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("Using Supabase URL:", process.env.VITE_SUPABASE_URL);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Load curricula
import { CURRICULUM as CURRICULUM_12 } from "../src/constants/curriculum.js";
import { CURRICULUM_11 } from "../src/constants/curriculum11.js";

// Parse CLI Options
const args = process.argv.slice(2);

function getFlagValue(flag) {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  const valParts = [];
  for (let j = i + 1; j < args.length; j++) {
    if (args[j].startsWith("--")) break;
    valParts.push(args[j]);
  }
  return valParts.join(" ").trim();
}

const filterClass = getFlagValue("--class"); // "11" or "12"
const filterSubject = getFlagValue("--subject");
const filterChapter = getFlagValue("--chapter");


function sanitizePathName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim();
}

async function exportChapter(classLevel, subject, unitName, chapterName) {
  const sanitizedSubject = sanitizePathName(subject);
  const sanitizedChapter = sanitizePathName(chapterName);
  const targetDir = path.join(
    process.cwd(),
    "exports",
    `class${classLevel}`,
    sanitizedSubject,
    sanitizedChapter
  );

  let notesText = null;
  let notesMeta = null;
  let quizSets = [];
  let notesDbId = null;
  let quizDbIds = [];

  try {
    // 1. Fetch Notes from chapter_notes table
    const { data: notesRow, error: notesError } = await supabase
      .from("chapter_notes")
      .select("id, notes, created_at")
      .eq("class_level", classLevel)
      .eq("subject", subject)
      .eq("chapter", chapterName)
      .maybeSingle();

    if (notesRow && notesRow.notes) {
      notesText = notesRow.notes;
      notesMeta = notesRow;
      notesDbId = notesRow.id;
    } else {
      // Fallback: Fetch from content_library detailed_notes
      const { data: libRow, error: libError } = await supabase
        .from("content_library")
        .select("id, data, created_at")
        .eq("class_level", classLevel)
        .eq("subject", subject)
        .eq("chapter", chapterName)
        .eq("content_type", "detailed_notes")
        .eq("is_valid", true)
        .maybeSingle();

      if (libRow && libRow.data && libRow.data.markdown) {
        notesText = libRow.data.markdown;
        notesMeta = libRow;
        notesDbId = libRow.id;
      }
    }

    // 2. Fetch Quiz Sets from quiz_sets table
    const { data: quizRows, error: quizError } = await supabase
      .from("quiz_sets")
      .select("id, set_number, questions, created_at")
      .eq("class_level", classLevel)
      .eq("subject", subject)
      .eq("chapter", chapterName);

    if (quizRows && quizRows.length > 0) {
      quizSets = quizRows;
      quizDbIds = quizRows.map((r) => ({ set: r.set_number, id: r.id }));
    }

    // If no content exists at all in the database, skip folder creation
    if (!notesText && quizSets.length === 0) {
      return { success: false, reason: "No database content found" };
    }

    // Ensure folder structure exists
    fs.mkdirSync(targetDir, { recursive: true });

    // 3. Write notes.json if notes exist
    if (notesText) {
      fs.writeFileSync(
        path.join(targetDir, "notes.json"),
        JSON.stringify({ notes: notesText }, null, 2)
      );
    }

    // 4. Write mcqs.json if quiz sets exist
    if (quizSets.length > 0) {
      fs.writeFileSync(
        path.join(targetDir, "mcqs.json"),
        JSON.stringify(
          {
            quiz_sets: quizSets.map((q) => ({
              set_number: q.set_number,
              questions: q.questions,
            })),
          },
          null,
          2
        )
      );
    }

    // 5. Write metadata.json
    const metadata = {
      board: "CBSE",
      class: classLevel,
      subject,
      unit: unitName,
      chapter: chapterName,
      database_id: {
        notes_id: notesDbId,
        quiz_ids: quizDbIds,
      },
      created_at: notesMeta?.created_at || quizSets[0]?.created_at || new Date().toISOString(),
      updated_at: notesMeta?.updated_at || quizSets[0]?.updated_at || new Date().toISOString(),
      version: "1.0",
    };

    fs.writeFileSync(
      path.join(targetDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    return { success: true, hasNotes: !!notesText, hasQuizzes: quizSets.length > 0 };
  } catch (err) {
    console.error(`Error exporting ${subject} - ${chapterName}:`, err.message);
    return { success: false, reason: err.message };
  }
}

async function main() {
  console.log("==================================================");
  console.log("🎬 STARTING OFFLINE CONTENT EXPORTER");
  console.log("==================================================");

  const report = {
    total_classes: 0,
    total_subjects: 0,
    total_chapters: 0,
    total_notes_exported: 0,
    total_mcqs_exported: 0,
    successful_exports: 0,
    failed_exports: 0,
    missing_chapters: [],
  };

  const classesToExport = [];
  if (!filterClass || filterClass === "11") {
    classesToExport.push({ level: "11", curriculum: CURRICULUM_11 });
  }
  if (!filterClass || filterClass === "12") {
    classesToExport.push({ level: "12", curriculum: CURRICULUM_12 });
  }

  report.total_classes = classesToExport.length;
  const uniqueSubjects = new Set();

  for (const { level, curriculum } of classesToExport) {
    for (const [subjectName, subjectData] of Object.entries(curriculum)) {
      // Filter by subject if specified
      if (filterSubject && !subjectName.toLowerCase().includes(filterSubject.toLowerCase())) {
        continue;
      }
      uniqueSubjects.add(`${level}::${subjectName}`);

      for (const unit of subjectData.units) {
        for (const chapterName of unit.chapters) {
          // Filter by chapter if specified
          if (filterChapter && !chapterName.toLowerCase().includes(filterChapter.toLowerCase())) {
            continue;
          }

          report.total_chapters++;
          console.log(`📡 Exporting: Class ${level} | ${subjectName} | ${chapterName}...`);

          const result = await exportChapter(level, subjectName, unit.name, chapterName);

          if (result.success) {
            report.successful_exports++;
            if (result.hasNotes) report.total_notes_exported++;
            if (result.hasQuizzes) report.total_mcqs_exported++;
            console.log(`   ✅ Success!`);
          } else {
            report.failed_exports++;
            report.missing_chapters.push({
              class: level,
              subject: subjectName,
              chapter: chapterName,
              reason: result.reason,
            });
            console.log(`   ❌ Skipped/Failed: ${result.reason}`);
          }
        }
      }
    }
  }

  report.total_subjects = uniqueSubjects.size;

  // Save report file
  const reportPath = path.join(process.cwd(), "exports", "export-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n==================================================");
  console.log("🏁 EXPORT RUN COMPLETE!");
  console.log("==================================================");
  console.log(`📊 Successful chapter exports: ${report.successful_exports}`);
  console.log(`📊 Failed/Missing chapter exports: ${report.failed_exports}`);
  console.log(`📝 Total Notes files written: ${report.total_notes_exported}`);
  console.log(`🧠 Total MCQs files written: ${report.total_mcqs_exported}`);
  console.log(`📄 Report written to: exports/export-report.json`);
  console.log("==================================================");
}

main();
