/**
 * integrity_check.js
 *
 * Reads every JSON file under cache/output/11/ and cache/output/12/
 * and validates that the internal metadata fields (class, subject, chapter,
 * content_type) match what the directory path expects.
 *
 * Reports:
 *  - PASS: internal fields match the path
 *  - MISMATCH: a field inside the JSON doesn't match the path
 *  - CORRUPT: file cannot be parsed as JSON
 *  - EMPTY: file exists but has no content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'cache', 'output');

const CLASSES = ['11', '12'];

let totalChecked = 0;
let totalPass = 0;
let totalMismatch = 0;
let totalCorrupt = 0;
let totalEmpty = 0;

const mismatches = [];
const corrupts = [];

function checkFile(expectedClass, expectedSubject, expectedChapter, expectedContentType, filePath) {
  totalChecked++;

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8').trim();
  } catch (err) {
    totalCorrupt++;
    corrupts.push({ filePath, reason: `Read error: ${err.message}` });
    return;
  }

  if (!raw || raw.length === 0) {
    totalEmpty++;
    corrupts.push({ filePath, reason: 'Empty file' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    totalCorrupt++;
    corrupts.push({ filePath, reason: `JSON parse error: ${err.message}` });
    return;
  }

  const issues = [];

  // Check class
  const fileClass = parsed.class ? String(parsed.class).trim() : null;
  if (!fileClass) {
    issues.push(`Missing 'class' field (expected "${expectedClass}")`);
  } else if (fileClass !== expectedClass) {
    issues.push(`class mismatch: file says "${fileClass}", path expects "${expectedClass}"`);
  }

  // Check subject
  const fileSubject = parsed.subject ? String(parsed.subject).trim() : null;
  if (!fileSubject) {
    issues.push(`Missing 'subject' field (expected "${expectedSubject}")`);
  } else if (fileSubject !== expectedSubject) {
    issues.push(`subject mismatch: file says "${fileSubject}", path expects "${expectedSubject}"`);
  }

  // Check chapter
  const fileChapter = parsed.chapter ? String(parsed.chapter).trim() : null;
  if (!fileChapter) {
    issues.push(`Missing 'chapter' field (expected "${expectedChapter}")`);
  } else if (fileChapter !== expectedChapter) {
    issues.push(`chapter mismatch: file says "${fileChapter}", path expects "${expectedChapter}"`);
  }

  // Check content_type
  const fileContentType = parsed.content_type ? String(parsed.content_type).trim() : null;
  if (!fileContentType) {
    issues.push(`Missing 'content_type' field (expected "${expectedContentType}")`);
  } else if (fileContentType !== expectedContentType) {
    issues.push(`content_type mismatch: file says "${fileContentType}", path expects "${expectedContentType}"`);
  }

  if (issues.length > 0) {
    totalMismatch++;
    mismatches.push({
      filePath,
      expectedClass,
      expectedSubject,
      expectedChapter,
      expectedContentType,
      issues,
    });
  } else {
    totalPass++;
  }
}

function scanClass(classLevel) {
  const classDir = path.join(CACHE_DIR, classLevel);

  if (!fs.existsSync(classDir)) {
    console.warn(`⚠️  Class ${classLevel} directory not found: ${classDir}`);
    return;
  }

  // Iterate subjects
  const subjects = fs.readdirSync(classDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const subjectDir of subjects) {
    const subjectPath = path.join(classDir, subjectDir);

    // Iterate chapters
    const chapters = fs.readdirSync(subjectPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const chapterDir of chapters) {
      const chapterPath = path.join(subjectPath, chapterDir);

      // Derive the expected human-readable subject and chapter names by
      // reversing the sanitization: replace underscores with spaces.
      // The JSON stores the original name (e.g. "Current Electricity"),
      // but the folder uses underscores (e.g. "Current_Electricity").
      // We recover the expected name by replacing underscores back.
      // NOTE: This is approximate — some names have dashes or special chars.
      // We do a loose comparison by normalising both sides.
      function normalise(str) {
        // Strip all non-alphanumeric characters, collapse spaces, lowercase.
        // This makes "Era of One-Party Dominance" == "Era_of_One_Party_Dominance"
        // and "Semiconductor Electronics: Materials…" == "Semiconductor_Electronics__Materials…"
        return str.replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase();
      }

      const expectedSubjectNorm = normalise(subjectDir);
      const expectedChapterNorm = normalise(chapterDir);

      // Iterate JSON files
      const files = fs.readdirSync(chapterPath, { withFileTypes: true })
        .filter(f => f.isFile() && f.name.endsWith('.json'))
        .map(f => f.name);

      for (const fileName of files) {
        const contentType = fileName.replace('.json', '');
        const filePath = path.join(chapterPath, fileName);

        let raw, parsed;
        try {
          raw = fs.readFileSync(filePath, 'utf-8').trim();
          if (!raw) { totalEmpty++; corrupts.push({ filePath, reason: 'Empty file' }); totalChecked++; continue; }
          parsed = JSON.parse(raw);
        } catch (err) {
          totalCorrupt++;
          totalChecked++;
          corrupts.push({ filePath, reason: `JSON parse error: ${err.message}` });
          continue;
        }

        totalChecked++;
        const issues = [];

        // Class check
        const fileClass = parsed.class != null ? String(parsed.class).trim() : null;
        if (!fileClass) {
          issues.push(`Missing 'class' field (expected "${classLevel}")`);
        } else if (fileClass !== classLevel) {
          issues.push(`class: file="${fileClass}" vs expected="${classLevel}"`);
        }

        // Subject check (normalised)
        const fileSubjectNorm = parsed.subject ? normalise(parsed.subject) : null;
        if (!fileSubjectNorm) {
          issues.push(`Missing 'subject' field (expected dir "${subjectDir}")`);
        } else if (fileSubjectNorm !== expectedSubjectNorm) {
          issues.push(`subject: file="${parsed.subject}" vs dir="${subjectDir}"`);
        }

        // Chapter check (normalised)
        const fileChapterNorm = parsed.chapter ? normalise(parsed.chapter) : null;
        if (!fileChapterNorm) {
          issues.push(`Missing 'chapter' field (expected dir "${chapterDir}")`);
        } else if (fileChapterNorm !== expectedChapterNorm) {
          issues.push(`chapter: file="${parsed.chapter}" vs dir="${chapterDir}"`);
        }

        // Content type check
        const fileContentType = parsed.content_type ? String(parsed.content_type).trim() : null;
        if (!fileContentType) {
          issues.push(`Missing 'content_type' field (expected "${contentType}")`);
        } else if (fileContentType !== contentType) {
          issues.push(`content_type: file="${fileContentType}" vs filename="${contentType}"`);
        }

        if (issues.length > 0) {
          totalMismatch++;
          mismatches.push({ filePath, issues });
        } else {
          totalPass++;
        }
      }
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("==================================================");
console.log("🔍 CONTENT INTEGRITY CHECKER — CLASS 11 & 12");
console.log("==================================================\n");

for (const cls of CLASSES) {
  console.log(`📂 Scanning Class ${cls}...`);
  scanClass(cls);
  console.log(`   Done.\n`);
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log("==================================================");
console.log("📊 INTEGRITY CHECK SUMMARY");
console.log("==================================================");
console.log(`Total Files Checked:  ${totalChecked}`);
console.log(`✅ Passed:            ${totalPass}`);
console.log(`❌ Mismatched:        ${totalMismatch}`);
console.log(`💥 Corrupt/Unparsable:${totalCorrupt}`);
console.log(`🕳️  Empty files:       ${totalEmpty}`);
console.log("==================================================\n");

if (mismatches.length > 0) {
  console.log("❌ MISMATCH DETAILS:");
  console.log("──────────────────────────────────────────────────");
  mismatches.forEach((m, i) => {
    console.log(`\n[${i + 1}] ${m.filePath}`);
    m.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
  });
} else {
  console.log("✅ NO MISMATCHES FOUND — all files belong to the correct class, subject, and chapter!");
}

if (corrupts.length > 0) {
  console.log("\n💥 CORRUPT / EMPTY FILE DETAILS:");
  console.log("──────────────────────────────────────────────────");
  corrupts.forEach((c, i) => {
    console.log(`[${i + 1}] ${c.filePath}`);
    console.log(`   Reason: ${c.reason}`);
  });
}
