-- Create sample_papers table for storing pre-generated CBSE exam papers
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sample_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  set_number integer NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
  content text NOT NULL,
  total_marks integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, set_number)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sample_papers_subject
ON sample_papers(subject);

CREATE INDEX IF NOT EXISTS idx_sample_papers_set
ON sample_papers(subject, set_number);

-- Table structure complete!
-- Next: Run: node src/scripts/generateSamplePapers.js
