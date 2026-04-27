# Smart Study Hub - MCQ & Notes Generation Guide

## Overview
This guide explains how to generate high-quality Multiple Choice Questions (MCQs) and comprehensive notes for each chapter/topic using the Groq API with LLaMA 3.3 70B model.

## Prerequisites
- ✅ Python 3.8+
- ✅ Groq API Key (stored in `.env`)
- ✅ Dependencies installed: `pip install -r requirements.txt`
- ✅ Database with courses/units/topics populated

## Setup

### 1. Verify Your Groq API Key
Make sure your `.env` file contains:
```
GROQ_API_KEY=your_api_key_here
```

Get your API key from: https://console.groq.com/

### 2. Populate Initial Data
If you haven't seeded your database yet, you can use the offline seeder first:
```bash
cd backend/scripts
python offline_seeder.py
```

Or load from your existing database if already populated.

## Usage

### Option 1: Generate MCQs for All Courses
```bash
cd backend/scripts
python groq_mcq_generator.py
```

### Option 2: Generate MCQs for a Specific Course
```bash
python groq_mcq_generator.py --course "Python Programming"
```

### Option 3: Generate MCQs for a Specific Unit
```bash
python groq_mcq_generator.py --course "Python Programming" --unit "Fundamentals of Python"
```

### Option 4: Adjust LLM Parameters
```bash
# Higher creativity (more diverse answers)
python groq_mcq_generator.py --temperature 0.9

# More consistent/deterministic
python groq_mcq_generator.py --temperature 0.5

# Use different Groq model
python groq_mcq_generator.py --model "llama-3.3-70b-versatile"
```

## What Gets Generated

For each topic, the system generates:

### 📝 Comprehensive Notes
- 500+ words of detailed, markdown-formatted content
- Technical explanations with examples
- Key concepts and best practices
- Ready to display in frontend

### 📊 30 MCQs (Per Topic)
- **Part 1**: 15 fundamental questions covering core concepts
- **Part 2**: 15 advanced questions covering applications and edge cases

Each MCQ includes:
- Clear, unambiguous question text
- 4 distinct answer options
- 1 correct answer (clearly marked)
- Detailed explanation of why the answer is correct

## Output Structure

Generated content is stored in the SQLite database:
```
Course
└── Unit
    └── Topic
        ├── content_summary (markdown notes)
        └── quizzes (Quiz objects)
            └── questions (Question objects)
                └── options (Option objects with is_correct flag)
```

## Database Schema

### Topics Table
- `id`: Unique identifier
- `title`: Topic name
- `content_summary`: Generated markdown notes
- `unit_id`: Reference to parent unit

### Quizzes Table
- `id`: Unique identifier
- `title`: Quiz title (e.g., "Topic Name Challenge Part 1")
- `topic_id`: Reference to topic
- `ai_generated`: Boolean flag (true for Groq-generated)
- `xp_reward`: XP points for completing quiz

### Questions Table
- `id`: Unique identifier
- `question_text`: The MCQ question
- `explanation`: Why the answer is correct
- `quiz_id`: Reference to quiz

### Options Table
- `id`: Unique identifier
- `option_text`: Answer option text
- `is_correct`: Boolean (exactly 1 per question should be true)
- `question_id`: Reference to question

## Rate Limiting & Performance

⚠️ **Important**: Groq API has rate limits:
- **LLaMA 3.3 70B**: 12,000 TPM (Tokens Per Minute)
- The script applies automatic cooldown delays to prevent limit hits
- Each topic generation includes:
  - Part 1 call: ~35 second cooldown
  - Part 2 call: ~35 second cooldown
  - Total: ~70 seconds per topic

## Estimated Time

For a typical course with:
- 5 units
- 4 topics per unit
- 20 topics total

**Estimated time**: ~25-30 minutes

## Troubleshooting

### ❌ "GROQ_API_KEY not found"
**Solution**: Add `GROQ_API_KEY=your_key` to `.env` file

### ❌ "Rate limit hit"
**Solution**: Script automatically waits 90 seconds. Just wait and let it continue.

### ❌ "Failed to parse JSON response"
**Solution**: Network issue or malformed response. Script retries up to 3 times automatically.

### ❌ "No courses found in database"
**Solution**: Populate database first using `offline_seeder.py` or your own data loader.

### ❌ Import errors
**Solution**: Ensure you're running from within `backend/scripts` directory and Python path includes backend:
```bash
cd backend/scripts
python groq_mcq_generator.py
```

## Monitoring Progress

The script provides detailed logging:
```
2026-04-06 10:30:00 - INFO - Starting Groq MCQ & Notes Generator...
2026-04-06 10:30:05 - INFO - Course: Python Programming
2026-04-06 10:30:10 - INFO -   Unit: Fundamentals of Python
2026-04-06 10:30:15 - INFO -     Processing Topic: Introduction to Python
2026-04-06 10:30:20 - INFO - Calling Groq API (attempt 1/3)...
2026-04-06 10:30:50 - INFO - Rate limit cooldown: waiting 35s...
...
```

## Viewing Generated Content

### Via Database Query
```bash
sqlite3 backend/database.db
SELECT * FROM topics WHERE content_summary IS NOT NULL;
```

### Via API Endpoint
```bash
curl http://localhost:5000/api/courses
curl http://localhost:5000/api/quizzes?topic_id=1
```

### Via Frontend
1. Start the app: `python app.py`
2. Navigate to courses and topics
3. Generated MCQs and notes will be displayed

## Advanced Options

### Custom Model Selection
```bash
# Use a different Groq model
python groq_mcq_generator.py --model "mixtral-8x7b-32768"
```

Available Groq models:
- `llama-3.3-70b-versatile` (recommended)
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

### Batch Processing
Generate for multiple specific units:
```bash
python groq_mcq_generator.py --course "Python Programming" --unit "Fundamentals of Python"
python groq_mcq_generator.py --course "Python Programming" --unit "Functions and Scope"
```

## Support & Feedback

For issues or improvements:
1. Check logs for error details
2. Verify API key and rate limits
3. Review database schema compatibility
4. Check Groq API status: https://status.groq.com

## Next Steps

1. ✅ Verify Groq API key in `.env`
2. ✅ Install dependencies: `pip install -r requirements.txt`
3. ✅ Run the generator: `python groq_mcq_generator.py`
4. ✅ Monitor logs for progress
5. ✅ View results in database or frontend

Happy learning! 🚀
