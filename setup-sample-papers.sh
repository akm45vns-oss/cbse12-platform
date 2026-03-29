#!/bin/bash

# Setup Sample Papers Table and Generate Papers
# Interactive guide for setting up the sample_papers table and generating papers

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║          📄 CBSE SAMPLE PAPERS - DATABASE SETUP & GENERATION              ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 STEP 1: Create Database Table${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Go to: https://app.supabase.com/project/_/sql"
echo ""
echo "1. Click 'New query'"
echo "2. Copy-paste the SQL below:"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
cat << 'SQLEOF'
CREATE TABLE IF NOT EXISTS sample_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  set_number integer NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
  content text NOT NULL,
  total_marks integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, set_number)
);

CREATE INDEX IF NOT EXISTS idx_sample_papers_subject
ON sample_papers(subject);

CREATE INDEX IF NOT EXISTS idx_sample_papers_set
ON sample_papers(subject, set_number);
SQLEOF
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "3. Click 'RUN' (or Cmd+Enter)"
echo "4. Wait for success message ✓"
echo ""
echo -e "${YELLOW}⏳ Press ENTER when the table is created in Supabase...${NC}"
read

echo ""
echo -e "${GREEN}✅ Table created!${NC}"
echo ""

echo -e "${BLUE}📄 STEP 2: Generate 60 Sample Papers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will:"
echo "  • Generate 5 ORIGINAL papers for each of 12 subjects (60 total)"
echo "  • Match CBSE format & weightage exactly"
echo "  • Auto-retry if rate-limited"
echo "  • Save directly to sample_papers table"
echo ""
echo "⏱️  Estimated time: 30-45 minutes"
echo ""
echo -e "${YELLOW}Starting generation in 3 seconds...${NC}"
sleep 1
echo -e "${YELLOW}2...${NC}"
sleep 1
echo -e "${YELLOW}1...${NC}"
sleep 1

echo ""
echo "🚀 Generating papers..."
echo ""

# Run the generation script with timeout
timeout 1800 node src/scripts/generateSamplePapers.js

if [ $? -eq 0 ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════════════════════╗"
  echo "║                    🎉 GENERATION COMPLETE!                                 ║"
  echo "╚════════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo -e "${GREEN}✅ All 60 sample papers have been generated and stored!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Open your app: http://localhost:5173"
  echo "  2. Select a subject"
  echo "  3. Click 'Generate Sample Paper'"
  echo "  4. Choose a set (1-5)"
  echo "  5. View and save as PDF"
  echo ""
else
  echo ""
  echo "⚠️  Timeout or error occurred"
  echo "If you see rate limit errors, wait a few minutes and run again:"
  echo "  node src/scripts/generateSamplePapers.js"
  echo ""
fi
