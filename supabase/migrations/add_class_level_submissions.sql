-- CBSE Platform — Quiz Submissions Class Level Isolation
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE quiz_submissions
ADD COLUMN IF NOT EXISTS class_level TEXT NOT NULL DEFAULT '12';

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_class_level
ON quiz_submissions(class_level, username, subject, chapter);
