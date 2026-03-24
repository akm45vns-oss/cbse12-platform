# Chapter Notes Seeding - Setup Guide

This guide explains how to pre-generate and cache all chapter notes so they load instantly instead of being generated on demand.

## What Was Changed

### 1. **New Supabase Functions** (`src/utils/supabase.js`)
- `saveChapterNotes(subject, chapter, notes)` - Saves pre-generated notes
- `getChapterNotes(subject, chapter)` - Retrieves cached notes from database

### 2. **Updated genNotes Function** (`src/App.jsx`)
- Now tries to load notes from database first
- Falls back to API generation if not cached
- Much faster loading times after seeding

### 3. **Seeding Script** (`src/scripts/seedNotes.js`)
- Generates notes for all chapters in all subjects
- Stores them in the database
- Includes retry logic and progress tracking

### 4. **NPM Script** (`package.json`)
- Added `npm run seed-notes` command

## Database Setup

### Step 1: Create the `chapter_notes` Table in Supabase

Go to **Supabase Dashboard → SQL Editor** and run this SQL:

```sql
CREATE TABLE chapter_notes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject, chapter)
);

CREATE INDEX idx_chapter_notes_subject_chapter ON chapter_notes(subject, chapter);
```

### Step 2: Verify Environment Variables

Make sure your `.env.local` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Seeding Script

### Option 1: Using NPM (Recommended)

```bash
npm run seed-notes
```

This will:
1. Iterate through all 12 subjects
2. For each subject, iterate through all chapters
3. Generate detailed notes using Groq API
4. Save each set of notes to the database
5. Show progress as it goes

**Expected Duration:** ~30-40 minutes (due to API call delays)

### Option 2: From Node.js

```bash
node src/scripts/seedNotes.js
```

## What Happens During Seeding

```
🚀 Starting Chapter Notes Seeding...

📚 Total chapters to generate: 182

[1/182] 📝 Generating notes for Physics - Motion in a Plane...
[1/182] ✅ Saved successfully!

[2/182] 📝 Generating notes for Physics - Laws of Motion...
[2/182] ✅ Saved successfully!

... (continues for all chapters)

==================================================
📊 SEEDING COMPLETE
==================================================
✅ Successful: 182
❌ Failed: 0
📚 Total: 182
==================================================

🎉 All notes generated and saved successfully!
```

## How Caching Works

When a user requests notes for a chapter:

1. **First Load (From Cache)** 
   - App calls `getChapterNotes()` 
   - Returns instantly from database (~50-200ms)
   - Shows "Loading notes..." message

2. **Missing Notes (Fallback)**
   - If notes not in database, generates with API
   - Takes 15-30 seconds depending on API response
   - Shows "Generating notes..." message and spinner

3. **Future Loads**
   - Same instant loading from cached data

## Monitoring Seeding Progress

The script logs:
- ✅ Successful saves
- ❌ Failed saves with error details
- 📝 Current chapter being generated
- Progress percentage [current/total]

If a save fails, the script will:
1. Log the error
2. Continue with next chapter
3. Exit with code 1 if any failed
4. Exit with code 0 if all successful

## Troubleshooting

### "Table does not exist" Error
- Make sure you ran the SQL to create `chapter_notes` table first

### "Invalid credentials" Error
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Restart the seeding script

### Script Timeout
- The script has a 1-second delay between API calls
- If getting rate-limited, increase `DELAY_MS` in seedNotes.js
- Some chapters may timeout after ~30 seconds of generation

### Partial Seeding (Some Success, Some Failed)
- You can safely re-run the script
- It will skip already-saved chapters and retry failed ones
- Use the SQL query below to check what was saved:

```sql
SELECT subject, COUNT(*) as count 
FROM chapter_notes 
GROUP BY subject 
ORDER BY subject;
```

## Checking Seeding Status

**View how many notes have been saved:**

```sql
SELECT COUNT(*) as total_chapters FROM chapter_notes;
```

**View notes for a specific subject:**

```sql
SELECT subject, COUNT(*) as chapters 
FROM chapter_notes 
WHERE subject = 'Physics' 
GROUP BY subject;
```

**Export all chapter notes:**

```sql
SELECT * FROM chapter_notes ORDER BY subject, chapter;
```

## After Seeding

Once seeding is complete:

1. ✅ All notes are cached and load instantly
2. ✅ Users don't need to regenerate notes
3. ✅ Save API costs (no repeated generation)
4. ✅ Better user experience (instant loading)
5. ✅ Fallback still works if database fails

## Resetting Notes

If you want to regenerate all notes:

```sql
DELETE FROM chapter_notes;
```

Then run `npm run seed-notes` again.

---

**Questions?** Check the console output during seeding for detailed error messages.
