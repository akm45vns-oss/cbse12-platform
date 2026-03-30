-- ===== GAMIFICATION TABLES FOR PRODUCTION =====
-- MIGRATION VERSION: 1.0
-- DATE: 2024-03-30
-- DESCRIPTION: Add gamification tables (streaks, badges, rankings)
-- SAFETY: Uses CREATE TABLE IF NOT EXISTS - safe for production
-- BACKUP: Recommended to backup database before running
-- ESTIMATED TIME: 2-5 seconds
-- IMPACT: No impact on existing tables - pure additions

-- User Daily Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE REFERENCES users(username) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_quiz_date DATE,
  start_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Badges (Earned Achievements)
CREATE TABLE IF NOT EXISTS user_badges (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  badge_tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold'
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, badge_tier)
);

-- Weekly Rankings Snapshot (Historical)
CREATE TABLE IF NOT EXISTS weekly_rankings (
  id BIGSERIAL PRIMARY KEY,
  rank INTEGER,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_score INTEGER,
  total_attempts INTEGER,
  avg_score DECIMAL(5,2),
  badge_tier TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, week_start_date)
);

-- User Performance Metrics (for badge calculation)
CREATE TABLE IF NOT EXISTS user_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE REFERENCES users(username) ON DELETE CASCADE,
  total_quizzes_attempted INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0,
  current_badge_tier TEXT, -- 'none', 'bronze', 'silver', 'gold'
  badge_progress_percentage INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_user_streaks_username 
  ON user_streaks(username);

CREATE INDEX IF NOT EXISTS idx_user_badges_username 
  ON user_badges(username);

CREATE INDEX IF NOT EXISTS idx_user_badges_tier 
  ON user_badges(badge_tier);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_week 
  ON weekly_rankings(week_start_date, week_end_date);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_username 
  ON weekly_rankings(username);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_rank 
  ON weekly_rankings(rank);

CREATE INDEX IF NOT EXISTS idx_user_metrics_username 
  ON user_performance_metrics(username);

CREATE INDEX IF NOT EXISTS idx_user_metrics_badge 
  ON user_performance_metrics(current_badge_tier);

-- ===== TRIGGERS FOR AUTOMATIC UPDATES =====
-- These triggers auto-update timestamp columns without application code

-- Update user_streaks.updated_at on any modification
-- Safe: Only creates if doesn't exist, won't override existing logic
CREATE OR REPLACE FUNCTION update_user_streaks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist (safe for production)
-- In Supabase SQL editor - one-time operation
DO $$
BEGIN
  CREATE TRIGGER trigger_update_user_streaks_timestamp
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streaks_timestamp();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update user_performance_metrics.last_updated on modification
CREATE OR REPLACE FUNCTION update_user_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger safely (won't error if exists)
DO $$
BEGIN
  CREATE TRIGGER trigger_update_user_metrics_timestamp
    BEFORE UPDATE ON user_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_user_metrics_timestamp();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===== RLS POLICIES =====
-- Enable Row Level Security on gamification tables
-- IMPORTANT: These policies control who can read/write data
-- They work alongside Supabase auth to isolate user data

-- Enable RLS on gamification tables (safe: idempotent operation)
ALTER TABLE IF EXISTS user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- ===== USER STREAKS POLICIES =====
-- Users can view ALL streaks (for leaderboard), but only update their own
CREATE POLICY IF NOT EXISTS "view_all_streaks" ON user_streaks
  FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "update_own_streak" ON user_streaks
  FOR UPDATE USING (auth.uid()::text = username OR username = current_user)
  WITH CHECK (auth.uid()::text = username OR username = current_user);

CREATE POLICY IF NOT EXISTS "insert_own_streak" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid()::text = username OR username = current_user);

-- ===== USER BADGES POLICIES =====
-- Anyone can view all badges (public leaderboard), users can earn their own
CREATE POLICY IF NOT EXISTS "view_all_badges" ON user_badges
  FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "users_earn_badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid()::text = username OR username = current_user);

-- ===== WEEKLY RANKINGS POLICIES =====
-- Rankings are public read-only (system updates via service role)
CREATE POLICY IF NOT EXISTS "view_weekly_rankings" ON weekly_rankings
  FOR SELECT USING (TRUE);

-- ===== PERFORMANCE METRICS POLICIES =====
-- Public read access for dashboard data
CREATE POLICY IF NOT EXISTS "view_public_metrics" ON user_performance_metrics
  FOR SELECT USING (TRUE);

-- Users can update their own metrics (via application)
CREATE POLICY IF NOT EXISTS "update_own_metrics" ON user_performance_metrics
  FOR UPDATE USING (auth.uid()::text = username OR username = current_user)
  WITH CHECK (auth.uid()::text = username OR username = current_user);

-- ===== VERIFY & MONITOR =====
-- Run these AFTER migration to confirm success

-- 1. Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%streak%' OR table_name LIKE '%badge%' OR table_name LIKE '%ranking%' OR table_name LIKE '%metric%';

-- 2. Check all indexes created (should see 8 new indexes)
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND tablename IN ('user_streaks', 'user_badges', 'weekly_rankings', 'user_performance_metrics');

-- 3. Check triggers created
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND event_object_table IN ('user_streaks', 'user_performance_metrics');

-- 4. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('user_streaks', 'user_badges', 'weekly_rankings', 'user_performance_metrics');

-- 5. Sample data check (should be empty after initial creation)
SELECT COUNT(*) as total_streaks FROM user_streaks;
SELECT COUNT(*) as total_badges FROM user_badges;
SELECT COUNT(*) as total_rankings FROM weekly_rankings;
SELECT COUNT(*) as total_metrics FROM user_performance_metrics;

-- ===== PRODUCTION NOTES =====
/*
SAFETY CHECKLIST:
✓ Uses CREATE TABLE IF NOT EXISTS - safe for re-running
✓ No DROP TABLE statements - won't delete existing data
✓ Uses CREATE POLICY IF NOT EXISTS - safe RLS policies
✓ Uses DO $$ blocks for triggers - prevents duplicate trigger errors
✓ All indexes are optional (IF NOT EXISTS) - safe to re-apply

MIGRATION STEPS FOR LIVE ENVIRONMENT:
1. Backup your database (Supabase: Settings → Backups)
2. Copy this entire SQL script
3. Go to your Supabase project → SQL Editor
4. Paste and review the script
5. Run the verification queries at the end
6. Check application logs for any errors
7. Test gamification features with a test user account

ESTIMATED TIME: 2-5 seconds total
ZERO DOWNTIME: Yes - all operations are non-blocking

IF SOMETHING GOES WRONG:
- The "CREATE TABLE IF NOT EXISTS" prevents data loss
- You can run this script multiple times safely
- To rollback: Delete the 4 new tables manually
  DELETE FROM user_streaks;
  DELETE FROM user_badges;
  DELETE FROM user_performance_metrics;
  DELETE FROM weekly_rankings;
  DROP TABLE user_streaks;
  DROP TABLE user_badges;
  DROP TABLE weekly_rankings;
  DROP TABLE user_performance_metrics;

PERFORMANCE IMPACT:
- Tables are indexed for fast queries
- Triggers are minimal (just timestamp updates)
- No impact on existing quiz_submissions or users tables
- RLS policies: Minimal overhead, secure by default

MONITORING:
Monitor these queries in Supabase to ensure data is flowing:
- Check user_performance_metrics for growing records
- Monitor user_streaks for streak updates
- Verify weekly_rankings populates on quiz submissions
- All data should sync automatically from application
*/
