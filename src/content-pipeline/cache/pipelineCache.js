/**
 * pipelineCache.js — Cache Layer for Content Pipeline
 *
 * Three-tier cache:
 * 1. In-memory cache (fastest, per-run)
 * 2. Local filesystem cache (JSON files in cache/output/)
 * 3. Supabase database cache (content_library table)
 *
 * Before generating, always check all three tiers.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../../cache/output");

// ── Supabase client ────────────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ── In-memory cache (hot cache for current run) ────────────────────
const memCache = new Map();

function memKey(classLevel, subject, chapter, contentType) {
  return `${classLevel}::${subject}::${chapter}::${contentType}`;
}

// ── Local filesystem cache ────────────────────────────────────────

function localCachePath(classLevel, subject, chapter, contentType) {
  const safeSubject  = subject.replace(/[^a-zA-Z0-9]/g, "_");
  const safeChapter  = chapter.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(CACHE_DIR, classLevel, safeSubject, safeChapter, `${contentType}.json`);
}

function checkLocalCache(classLevel, subject, chapter, contentType) {
  try {
    const filePath = localCachePath(classLevel, subject, chapter, contentType);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalCache(envelope) {
  try {
    const { class: classLevel, subject, chapter, content_type } = envelope;
    const filePath = localCachePath(classLevel, subject, chapter, content_type);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2));
  } catch (e) {
    console.warn("[Cache] Failed to write local cache:", e.message);
  }
}

// ── Supabase database cache ───────────────────────────────────────

async function checkDatabaseCache(classLevel, subject, chapter, contentType) {
  try {
    const { data, error } = await supabase
      .from("content_library")
      .select("*")
      .eq("class_level", classLevel)
      .eq("subject", subject)
      .eq("chapter", chapter)
      .eq("content_type", contentType)
      .eq("is_valid", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeToDatabase(envelope) {
  try {
    const { class: classLevel, subject, chapter, content_type, generated_by, generated_at, version, data } = envelope;

    const { error } = await supabase
      .from("content_library")
      .upsert({
        class_level:  classLevel,
        subject,
        chapter,
        content_type,
        generated_by,
        generated_at,
        version,
        data,
        is_valid: true,
      }, {
        onConflict: "class_level,subject,chapter,content_type",
      });

    if (error) {
      console.warn("[Cache] DB write failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[Cache] DB write exception:", e.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────

/**
 * Check all cache tiers. Returns the cached envelope if found, else null.
 * Promotes to higher tiers if found in a lower one.
 */
export async function checkCache(classLevel, subject, chapter, contentType) {
  const key = memKey(classLevel, subject, chapter, contentType);

  // Tier 1: in-memory
  if (memCache.has(key)) return memCache.get(key);

  // Tier 2: local filesystem
  const local = checkLocalCache(classLevel, subject, chapter, contentType);
  if (local) {
    memCache.set(key, local);
    return local;
  }

  // Tier 3: Supabase
  const db = await checkDatabaseCache(classLevel, subject, chapter, contentType);
  if (db) {
    const envelope = {
      class: db.class_level,
      subject: db.subject,
      chapter: db.chapter,
      content_type: db.content_type,
      generated_by: db.generated_by,
      generated_at: db.generated_at,
      version: db.version,
      data: db.data,
    };
    memCache.set(key, envelope);
    writeLocalCache(envelope); // promote to FS cache
    return envelope;
  }

  return null;
}

/**
 * Quick check if content is already generated (returns boolean, checks all tiers).
 */
export async function isAlreadyGenerated(classLevel, subject, chapter, contentType) {
  const result = await checkCache(classLevel, subject, chapter, contentType);
  return result !== null;
}

/**
 * Store generated content to all cache tiers.
 */
export async function storeContent(envelope) {
  const { class: classLevel, subject, chapter, content_type } = envelope;
  const key = memKey(classLevel, subject, chapter, content_type);

  // Tier 1: memory
  memCache.set(key, envelope);

  // Tier 2: filesystem
  writeLocalCache(envelope);

  // Tier 3: Supabase
  const dbOk = await writeToDatabase(envelope);
  if (!dbOk) {
    console.warn(`[Cache] DB write failed for ${subject}/${chapter}/${content_type} — cached locally only`);
  }

  return dbOk;
}

/**
 * Get all already-generated task IDs for a class (from DB).
 * Used to build the initial skip list when resuming.
 * Returns a Set of task IDs.
 */
export async function getCompletedTaskIds(classLevel) {
  try {
    const allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("content_library")
        .select("subject, chapter, content_type")
        .eq("class_level", classLevel)
        .eq("is_valid", true)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

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

    const ids = new Set(allData.map(r => `${classLevel}::${r.subject}::${r.chapter}::${r.content_type}`));
    console.log(`[Cache] Found ${ids.size} already-generated items in DB for Class ${classLevel}`);
    return ids;
  } catch (e) {
    console.warn("[Cache] Could not fetch completed IDs from DB:", e.message);
    return new Set();
  }
}

/**
 * Get cache stats for a given class.
 */
export async function getCacheStats(classLevel) {
  try {
    const { count, error } = await supabase
      .from("content_library")
      .select("*", { count: "exact", head: true })
      .eq("class_level", classLevel)
      .eq("is_valid", true);

    return { total: count || 0, error };
  } catch {
    return { total: 0, error: "Query failed" };
  }
}

/**
 * Clear in-memory cache (use between pipeline restarts).
 */
export function clearMemCache() {
  memCache.clear();
}
