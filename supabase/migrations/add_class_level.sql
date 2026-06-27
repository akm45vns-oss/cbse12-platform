-- ================================================================
-- CBSE Platform — Class 11 Expansion Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Add class_level column to chapter_notes (Class 12 default)
ALTER TABLE chapter_notes 
ADD COLUMN IF NOT EXISTS class_level TEXT NOT NULL DEFAULT '12';

-- 2. Add class_level column to quiz_sets (Class 12 default)
ALTER TABLE quiz_sets
ADD COLUMN IF NOT EXISTS class_level TEXT NOT NULL DEFAULT '12';

-- 3. Index for fast class-level queries on chapter_notes
CREATE INDEX IF NOT EXISTS idx_chapter_notes_class_level 
ON chapter_notes(class_level, subject, chapter);

-- 4. Index for fast class-level queries on quiz_sets
CREATE INDEX IF NOT EXISTS idx_quiz_sets_class_level 
ON quiz_sets(class_level, subject, chapter);

-- ================================================================
-- 5. Content Library Table — stores all 15 content types per chapter
-- ================================================================
CREATE TABLE IF NOT EXISTS content_library (
  id             BIGSERIAL PRIMARY KEY,
  class_level    TEXT        NOT NULL DEFAULT '11',
  subject        TEXT        NOT NULL,
  chapter        TEXT        NOT NULL,
  content_type   TEXT        NOT NULL,
  generated_by   TEXT,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  version        TEXT        NOT NULL DEFAULT '1.0',
  data           JSONB       NOT NULL,
  is_valid       BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: only one record per class+subject+chapter+type
  UNIQUE(class_level, subject, chapter, content_type)
);

-- 6. Composite index on content_library for all pipeline queries
CREATE INDEX IF NOT EXISTS idx_content_library_lookup 
ON content_library(class_level, subject, chapter, content_type);

-- 7. Index for filtering by validity
CREATE INDEX IF NOT EXISTS idx_content_library_valid
ON content_library(class_level, is_valid);

-- 8. Index for finding content by type across all chapters
CREATE INDEX IF NOT EXISTS idx_content_library_type
ON content_library(content_type, class_level);

-- ================================================================
-- 9. Update trigger: auto-update updated_at timestamp
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_library_updated_at ON content_library;
CREATE TRIGGER update_content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 10. Row Level Security (RLS) — allow reads by all, writes only
--     via service role (pipeline uses anon key with insert policy)
-- ================================================================
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read valid content
DROP POLICY IF EXISTS "content_library_read" ON content_library;
CREATE POLICY "content_library_read"
  ON content_library FOR SELECT
  USING (is_valid = true);

-- Allow inserts/updates from pipeline (using anon key)
DROP POLICY IF EXISTS "content_library_write" ON content_library;
CREATE POLICY "content_library_write"
  ON content_library FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "content_library_update" ON content_library;
CREATE POLICY "content_library_update"
  ON content_library FOR UPDATE
  USING (true);

-- ================================================================
-- 11. Helper views for progress monitoring
-- ================================================================

-- View: generation progress per class/subject
CREATE OR REPLACE VIEW content_library_progress AS
SELECT
  class_level,
  subject,
  COUNT(DISTINCT chapter) AS chapters_touched,
  COUNT(*) AS content_items_generated,
  COUNT(*) FILTER (WHERE is_valid) AS valid_items,
  MIN(generated_at) AS first_generated,
  MAX(generated_at) AS last_generated
FROM content_library
GROUP BY class_level, subject
ORDER BY class_level, subject;

-- View: per-chapter completion status
CREATE OR REPLACE VIEW chapter_completion_status AS
SELECT
  class_level,
  subject,
  chapter,
  COUNT(*) AS types_generated,
  COUNT(*) FILTER (WHERE is_valid) AS types_valid,
  -- 15 = total content types
  ROUND(COUNT(*) * 100.0 / 15, 1) AS completion_pct
FROM content_library
GROUP BY class_level, subject, chapter
ORDER BY class_level, subject, chapter;

-- ================================================================
-- Verification queries (run after migration to confirm)
-- ================================================================
-- SELECT * FROM content_library_progress;
-- SELECT COUNT(*) FROM content_library WHERE class_level = '11';
-- SELECT * FROM chapter_completion_status WHERE class_level = '11' LIMIT 10;
