## Community Forum Fix - Setup Guide

### Problem Fixed
The community Q&A forum was not working properly across different user accounts because:
- **Root Cause**: All forum posts were stored only in **localStorage**, which is device/browser specific and not shared across accounts
- **Symptom**: Questions asked by one account were not visible to other accounts

### Solution Implemented
The forum system has been upgraded to use **Supabase** for persistent, cloud-based storage while maintaining localStorage as a fallback.

### Files Modified

#### 1. **Database Setup Required** ⚠️
Run this SQL in your Supabase SQL Editor to create the forum tables:

```bash
# File: FORUM_SETUP.sql
# Run all the SQL commands in this file in Supabase SQL Editor
```

This creates:
- `forum_posts` table - stores all questions
- `forum_answers` table - stores all answers with foreign key to forum_posts
- Row-Level Security (RLS) policies
- Performance indexes

#### 2. **Core Changes**

**`src/utils/forum.js`** - Forum utility functions
- Added import: `import { supabase } from "./supabase";`
- Made all functions async to fetch from/sync with Supabase
- Added fallback to localStorage if Supabase is unavailable
- Updated function signatures to include `currentUser` parameter

**Key async functions now include:**
- `postQuestion()` - includes currentUser parameter
- `getQuestions()` - fetches from Supabase with nested answers
- `getQuestionsForChapter()` - filters by subject/chapter
- `postAnswer()` - includes currentUser parameter  
- `getAnswers()` - async fetching from Supabase
- `markHelpful()` - increments helpful count in Supabase
- `searchQuestions()` - async search
- `getTrendingQuestions()` - async trending calculation
- `incrementViews()` - updates view count in Supabase
- `getForumStats()` - async stats calculation

**`src/components/common/FloatingForumButton.jsx`** - Forum button component
- Added `currentUser` prop
- Passes currentUser to ForumModal

**`src/components/common/ForumModal.jsx`** - Forum modal (UI)
- Added `currentUser` prop
- Made all forum API calls async
- Added `answers` state to store loaded answers
- Added useEffect to load answers when question is selected
- Updated answers rendering to show the actual author name (e.g., "Posted by john_doe" instead of "Anonymous Student")
- Updated question click handler to be async
- Updated stats to be fetched asynchronously

**`src/App.jsx`** - App entry point
- Updated FloatingForumButton call to pass `currentUser={auth.currentUser}`

### Setup Instructions

1. **Run the SQL Setup** (One-time):
   - Open Supabase SQL Editor
   - Copy and paste **all** the SQL from `FORUM_SETUP.sql`
   - Execute it to create the forum tables

2. **Restart Your App**:
   ```bash
   npm run dev
   ```

3. **Test the Forum**:
   - Log in with Account A
   - Ask a question in the forum
   - Log in with Account B (different account)
   - Navigate to the forum - you should now see the question from Account A
   - Post an answer
   - Log back into Account A - you should see the answer

### Feature Improvements

✅ **Cross-Account Visibility** - Questions and answers now visible to all authenticated users

✅ **User Attribution** - Questions and answers show the actual username of the poster (e.g., "Posted by john_doe")

✅ **Real-Time Sync** - Data syncs with Supabase for persistence across devices/browsers

✅ **Automatic Fallback** - Uses localStorage if Supabase is temporarily unavailable

✅ **Data Persistence** - Questions and answers are saved in the database permanently

✅ **Vote Tracking** - "Helpful" votes are tracked and persisted

✅ **View Counter** - Question view counts are tracked in Supabase

### Database Schema

**forum_posts table:**
```sql
id              BIGINT (Primary Key)
question        TEXT
author          TEXT (username)
subject         TEXT (nullable)
chapter         TEXT (nullable)
image_url       TEXT (nullable)
views           INTEGER (default 0)
helpful_count   INTEGER (default 0)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**forum_answers table:**
```sql
id              BIGINT (Primary Key)
question_id     BIGINT (Foreign Key → forum_posts.id)
text            TEXT
author          TEXT (username)
image_url       TEXT (nullable)
helpful         INTEGER (default 0)
is_selected     BOOLEAN (default false)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Backward Compatibility

- Existing localStorage data will still work as a fallback
- No data loss - the system tries Supabase first, then falls back to localStorage
- Users can gracefully migrate without losing existing posts

### Security

- Row-Level Security (RLS) enabled on both tables
- Anyone can read posts (public forum)
- Anyone can post questions and answers (anonymous+ accounts)
- The `author` field stores the username

### Troubleshooting

**Q: Forum still shows "No questions yet" after posting**
- Wait a few seconds and refresh
- Check browser console for errors
- Verify the SQL setup was completed successfully

**Q: Questions disappear when I logout**
- This is normal for legacy localStorage-only posts
- New posts (after the fix) will persist properly

**Q: "Posted by Anonymous Student" still showing**
- The account didn't have a currentUser when posting
- This happens for posts made before the fix
- New posts will show actual usernames

### Future Enhancements

- [ ] Upvote/downvote questions
- [ ] Search full-text indexing
- [ ] Moderation tools for admins
- [ ] User reputation system
- [ ] Notification system for new answers
- [ ] Pinned/featured questions
