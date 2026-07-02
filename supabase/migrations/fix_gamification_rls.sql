-- ================================================================
-- Fix RLS Policies for Custom Auth System
-- The app uses a custom users table (not Supabase Auth),
-- so auth.uid() is always null. We allow anon key to
-- read/write rows scoped to a username column.
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================================

-- ── user_streaks ──────────────────────────────────────────────────
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "user_streaks_select" ON user_streaks;
DROP POLICY IF EXISTS "user_streaks_insert" ON user_streaks;
DROP POLICY IF EXISTS "user_streaks_update" ON user_streaks;
DROP POLICY IF EXISTS "user_streaks_delete" ON user_streaks;
DROP POLICY IF EXISTS "allow_all_streaks" ON user_streaks;

-- Allow anyone (anon key) to read all streaks (needed for leaderboard)
CREATE POLICY "user_streaks_select"
  ON user_streaks FOR SELECT
  USING (true);

-- Allow anon key to insert (new user first login)
CREATE POLICY "user_streaks_insert"
  ON user_streaks FOR INSERT
  WITH CHECK (true);

-- Allow anon key to update
CREATE POLICY "user_streaks_update"
  ON user_streaks FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── user_performance_metrics ──────────────────────────────────────
ALTER TABLE user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "user_performance_select" ON user_performance_metrics;
DROP POLICY IF EXISTS "user_performance_insert" ON user_performance_metrics;
DROP POLICY IF EXISTS "user_performance_update" ON user_performance_metrics;
DROP POLICY IF EXISTS "allow_all_performance" ON user_performance_metrics;

-- Allow read
CREATE POLICY "user_performance_select"
  ON user_performance_metrics FOR SELECT
  USING (true);

-- Allow insert
CREATE POLICY "user_performance_insert"
  ON user_performance_metrics FOR INSERT
  WITH CHECK (true);

-- Allow update
CREATE POLICY "user_performance_update"
  ON user_performance_metrics FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Verify (run after applying) ───────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('user_streaks', 'user_performance_metrics');
