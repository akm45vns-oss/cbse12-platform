-- CBSE Platform Notes RLS Fix
-- Run this in the Supabase Dashboard > SQL Editor to allow database seeding of Class 11 notes

ALTER TABLE chapter_notes DISABLE ROW LEVEL SECURITY;
