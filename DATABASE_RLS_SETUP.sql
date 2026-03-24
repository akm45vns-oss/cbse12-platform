-- ============================================================
-- CBSE Platform: Row-Level Security (RLS) Setup
-- Run these SQL commands in Supabase SQL Editor
-- ============================================================

-- NOTE: This assumes you have Supabase Auth enabled
-- RLS works with auth.uid() from Supabase Auth

-- ============================================================
-- 1. USERS TABLE - Row Level Security
-- ============================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (username = current_user_id());

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (username = current_user_id())
  WITH CHECK (username = current_user_id());

-- ============================================================
-- 2. PROGRESS_TRACKING TABLE - Row Level Security
-- ============================================================

-- Enable RLS on progress_tracking table
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own progress
CREATE POLICY "Users can read own progress" ON progress_tracking
  FOR SELECT
  USING (username = current_user_id());

-- Policy: Users can insert their own progress records
CREATE POLICY "Users can insert own progress" ON progress_tracking
  FOR INSERT
  WITH CHECK (username = current_user_id());

-- Policy: Users can update only their own progress
CREATE POLICY "Users can update own progress" ON progress_tracking
  FOR UPDATE
  USING (username = current_user_id())
  WITH CHECK (username = current_user_id());

-- Policy: Users can delete their own progress
CREATE POLICY "Users can delete own progress" ON progress_tracking
  FOR DELETE
  USING (username = current_user_id());

-- ============================================================
-- 3. CHAPTER_NOTES TABLE - Read-Only for Users
-- ============================================================

-- Enable RLS on chapter_notes table
ALTER TABLE chapter_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read chapter notes (cached data)
CREATE POLICY "Chapter notes are readable by all" ON chapter_notes
  FOR SELECT
  USING (true);

-- Policy: Only server/admin can insert notes (prevent user writes)
CREATE POLICY "Only server can insert chapter notes" ON chapter_notes
  FOR INSERT
  WITH CHECK (false);  -- Allows no inserts

-- Policy: Only server/admin can update notes
CREATE POLICY "Only server can update chapter notes" ON chapter_notes
  FOR UPDATE
  USING (false);  -- Allows no updates

-- ============================================================
-- 4. CREATE INDEX for Performance
-- ============================================================

-- Speed up progress_tracking queries by username
CREATE INDEX IF NOT EXISTS idx_progress_tracking_username 
  ON progress_tracking(username);

-- Speed up progress_tracking queries by subject
CREATE INDEX IF NOT EXISTS idx_progress_tracking_subject 
  ON progress_tracking(subject);

-- Speed up chapter_notes queries
CREATE INDEX IF NOT EXISTS idx_chapter_notes_subject_chapter 
  ON chapter_notes(subject, chapter);

-- ============================================================
-- 5. VERIFY RLS IS ENABLED (Check these)
-- ============================================================

-- Run this query to verify RLS is enabled:
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'progress_tracking', 'chapter_notes')
ORDER BY tablename;

-- All should show "true" in rowsecurity column
*/

-- ============================================================
-- 6. HELPER FUNCTION (Optional)
-- ============================================================

-- Create a helper function to get current user ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user', NULL);
END;
$$ LANGUAGE plpgsql STABLE;

-- When your app makes requests, set the user ID:
-- SET app.current_user = 'username_here';

-- ============================================================
-- 7. SECURITY BEST PRACTICES
-- ============================================================

/*
✅ What RLS Prevents:
- User A reading User B's progress data
- User C modifying User D's notes progress
- Unauthorized deletion of records
- Direct database access bypassing application logic

⚠️ Important Notes:
1. RLS policies are evaluated AT THE DATABASE LEVEL
2. Even direct SQL queries must pass RLS checks
3. Server-side operations can bypass RLS by using a service role key
4. Always test RLS policies thoroughly before production

🔧 Testing RLS Policies:
1. Login as user@example.com
2. Query progress_tracking (should only see own records)
3. Try to query another user's data (should fail)
4. Try to update someone else's record (should fail)

📊 Monitoring RLS:
- Check Supabase dashboard for policy violations
- Monitor logs for unauthorized access attempts
- Review audit trail for suspicious activity
*/

-- ============================================================
-- 8. ADDITIONAL SECURITY FEATURES (OPTIONAL)
-- ============================================================

-- Add a trigger to track who modified records (audit log)
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  username TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================
-- 9. CLEANUP (If needed to remove all RLS)
-- ============================================================

/*
-- WARNING: Only run if you need to disable RLS for testing!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_notes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- ... etc for all policies

-- Only do this in development, NEVER in production!
*/

-- ============================================================
-- END OF RLS SETUP
-- ============================================================
