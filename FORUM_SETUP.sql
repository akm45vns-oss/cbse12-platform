-- ============================================================
-- Community Forum Tables - Run in Supabase SQL Editor
-- ============================================================

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  question TEXT NOT NULL,
  author TEXT NOT NULL,
  subject TEXT,
  chapter TEXT,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_answers table
CREATE TABLE IF NOT EXISTS forum_answers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  question_id BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  helpful INTEGER DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read forum posts
CREATE POLICY "Forum posts are readable by all" ON forum_posts
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert forum posts
CREATE POLICY "Anyone can post questions" ON forum_posts
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE
  USING (author = current_user)
  WITH CHECK (author = current_user);

-- Enable RLS on forum_answers
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read forum answers
CREATE POLICY "Forum answers are readable by all" ON forum_answers
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert forum answers
CREATE POLICY "Anyone can post answers" ON forum_answers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own answers
CREATE POLICY "Users can update own answers" ON forum_answers
  FOR UPDATE
  USING (author = current_user)
  WITH CHECK (author = current_user);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_forum_posts_subject_chapter 
  ON forum_posts(subject, chapter);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at 
  ON forum_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id 
  ON forum_answers(question_id);
