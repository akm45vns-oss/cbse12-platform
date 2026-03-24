-- ============================================================
-- CBSE Platform: Row-Level Security (RLS) Setup
-- Run these SQL commands in Supabase SQL Editor
-- ============================================================

-- NOTE: This assumes you have Supabase Auth enabled
-- RLS works with auth.uid() from Supabase Auth

-- ============================================================
-- 0. CREATE MISSING TABLES (if they don't exist)
-- ============================================================

-- Create progress_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS progress_tracking (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'notes', 'quiz', 'paper'
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, subject, chapter, type)
);

-- ============================================================
-- 1. USERS TABLE - Row Level Security (if table exists)
-- ============================================================

-- Enable RLS on users table (only if you have one)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. PROGRESS_TRACKING TABLE - Row Level Security
-- ============================================================

-- Enable RLS on progress_tracking table
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own progress
CREATE POLICY "Users can read own progress" ON progress_tracking
  FOR SELECT
  USING (username = current_user);

-- Policy: Users can insert their own progress records
CREATE POLICY "Users can insert own progress" ON progress_tracking
  FOR INSERT
  WITH CHECK (username = current_user);

-- Policy: Users can update only their own progress
CREATE POLICY "Users can update own progress" ON progress_tracking
  FOR UPDATE
  USING (username = current_user)
  WITH CHECK (username = current_user);

-- Policy: Users can delete their own progress
CREATE POLICY "Users can delete own progress" ON progress_tracking
  FOR DELETE
  USING (username = current_user);

-- ============================================================
-- 3. CHAPTER_NOTES TABLE - Read-Only for Users
-- ============================================================

-- Enable RLS on chapter_notes table
ALTER TABLE chapter_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read chapter notes (cached data - public)
CREATE POLICY "Chapter notes are readable by all" ON chapter_notes
  FOR SELECT
  USING (true);

-- Don't allow users to insert chapter notes
CREATE POLICY "Disable user inserts on chapter_notes" ON chapter_notes
  FOR INSERT
  WITH CHECK (false);

-- Don't allow users to update chapter notes
CREATE POLICY "Disable user updates on chapter_notes" ON chapter_notes
  FOR UPDATE
  USING (false);

-- ============================================================
-- 4. CREATE INDEXES for Performance
-- ============================================================

-- Speed up progress_tracking queries
CREATE INDEX IF NOT EXISTS idx_progress_tracking_username 
  ON progress_tracking(username);

CREATE INDEX IF NOT EXISTS idx_progress_tracking_subject 
  ON progress_tracking(subject);

CREATE INDEX IF NOT EXISTS idx_progress_tracking_chapter 
  ON progress_tracking(chapter);

-- Speed up chapter_notes queries
CREATE INDEX IF NOT EXISTS idx_chapter_notes_subject_chapter 
  ON chapter_notes(subject, chapter);

-- ============================================================
-- 5. VERIFY RLS IS ENABLED
-- ============================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'progress_tracking', 'chapter_notes')
ORDER BY tablename;
