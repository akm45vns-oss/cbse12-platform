/**
 * exportManager.js — JSON Export Manager
 *
 * Exports generated content to structured JSON files:
 *   exports/{classLevel}/{subject}/{chapter}.json
 *
 * Each export file contains all 15 content types for a chapter.
 * Can export a single chapter, an entire subject, or a full class.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = path.resolve(__dirname, "../../../exports");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9\-_]/g, "_");
}

function getChapterExportPath(classLevel, subject, chapter) {
  return path.join(
    EXPORTS_DIR,
    classLevel,
    safeFilename(subject),
    `${safeFilename(chapter)}.json`
  );
}

/**
 * Fetch all content for a chapter from Supabase.
 */
async function fetchChapterContent(classLevel, subject, chapter) {
  const { data, error } = await supabase
    .from("content_library")
    .select("*")
    .eq("class_level", classLevel)
    .eq("subject", subject)
    .eq("chapter", chapter)
    .eq("is_valid", true);

  if (error) throw new Error(`DB error: ${error.message}`);
  return data || [];
}

/**
 * Export a single chapter to JSON file.
 * Returns the export path.
 */
export async function exportChapter(classLevel, subject, chapter) {
  const rows = await fetchChapterContent(classLevel, subject, chapter);

  if (rows.length === 0) {
    console.warn(`[Export] No content found for ${subject}/${chapter}`);
    return null;
  }

  // Build structured export object
  const exportObj = {
    class: classLevel,
    subject,
    chapter,
    exported_at: new Date().toISOString(),
    content_count: rows.length,
    content: {},
  };

  for (const row of rows) {
    exportObj.content[row.content_type] = {
      generated_by: row.generated_by,
      generated_at: row.generated_at,
      version: row.version,
      data: row.data,
    };
  }

  const filePath = getChapterExportPath(classLevel, subject, chapter);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(exportObj, null, 2));

  console.log(`[Export] ✅ ${subject}/${chapter} → ${filePath}`);
  return filePath;
}

/**
 * Export all chapters for a subject.
 * Returns array of export paths.
 */
export async function exportSubject(classLevel, subject) {
  const allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("content_library")
      .select("chapter")
      .eq("class_level", classLevel)
      .eq("subject", subject)
      .eq("is_valid", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`[Export] Could not list chapters for ${subject}:`, error.message);
      return [];
    }

    if (data && data.length > 0) {
      allData.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const chapters = [...new Set(allData.map(r => r.chapter))];
  console.log(`[Export] Exporting ${chapters.length} chapters for ${subject}...`);

  const paths = [];
  for (const chapter of chapters) {
    const p = await exportChapter(classLevel, subject, chapter);
    if (p) paths.push(p);
  }

  // Write subject index
  const indexPath = path.join(EXPORTS_DIR, classLevel, safeFilename(subject), "_index.json");
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify({
    class: classLevel,
    subject,
    exported_at: new Date().toISOString(),
    chapters,
    total: chapters.length,
  }, null, 2));

  return paths;
}

/**
 * Export ALL subjects for a class.
 */
export async function exportAll(classLevel) {
  const allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("content_library")
      .select("subject")
      .eq("class_level", classLevel)
      .eq("is_valid", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("[Export] Could not list subjects:", error.message);
      return;
    }

    if (data && data.length > 0) {
      allData.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const subjects = [...new Set(allData.map(r => r.subject))];
  console.log(`[Export] Exporting ${subjects.length} subjects for Class ${classLevel}...`);

  let totalFiles = 0;
  for (const subject of subjects) {
    const paths = await exportSubject(classLevel, subject);
    totalFiles += paths.length;
  }

  // Write class index
  const classIndexPath = path.join(EXPORTS_DIR, classLevel, "_index.json");
  fs.mkdirSync(path.dirname(classIndexPath), { recursive: true });
  fs.writeFileSync(classIndexPath, JSON.stringify({
    class: classLevel,
    exported_at: new Date().toISOString(),
    subjects,
    total_subjects: subjects.length,
    total_chapter_files: totalFiles,
  }, null, 2));

  console.log(`[Export] ✅ Complete — ${totalFiles} chapter files exported to ${EXPORTS_DIR}/${classLevel}/`);
}

// ── CLI entry point ────────────────────────────────────────────────
// Usage: node exportManager.js [classLevel] [subject?] [chapter?]
if (process.argv[1].endsWith("exportManager.js")) {
  const [, , classLevel = "11", subject, chapter] = process.argv;

  (async () => {
    if (chapter && subject) {
      await exportChapter(classLevel, subject, chapter);
    } else if (subject) {
      await exportSubject(classLevel, subject);
    } else {
      await exportAll(classLevel);
    }
    process.exit(0);
  })();
}
