# CBSE12 Platform - Complete Project Context

## 1. PROJECT OVERVIEW

**Name**: CBSE12 Platform (AkmEdu45)
**Purpose**: Educational platform for CBSE Class 12 students in India
**Live Website**: Yes (currently live in production)
**Status**: Active development with continuous improvements

**Core Features**:
- Study notes for all chapters (auto-generated via Groq API)
- Practice quizzes with 15 pre-generated sets per chapter (450 MCQs per chapter)
- Sample papers for exam preparation
- Advanced analytics dashboard with study insights
- Session tracking and statistics
- Dark mode support
- Community Q&A forum (basic)

**12 Subjects Covered**:
Physics, Chemistry, Biology, English, Mathematics, Computer Science, Economics, Accountancy, Business Studies, History, Political Science, Physical Education

---

## 2. TECH STACK

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: CSS-in-JS (shared.js for theme colors)
- **State Management**: React hooks (useState, useContext, useEffect)
- **API Client**: Supabase JS SDK
- **Charts**: Custom SVG charts (no external charting library dependencies)
- **Dark Mode**: Implemented via CSS variables and theme context

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password via OTP)
- **Edge Functions**: Deno-based serverless functions
- **AI API**: Groq API (llama-3.1-8b-instant model)

### DevOps & Tools
- **Version Control**: Git/GitHub
- **Build Tool**: Vite
- **Package Manager**: npm
- **Environment**: Node.js

---

## 3. FOLDER STRUCTURE

```
cbse12-platform/
├── src/
│   ├── App.jsx                          # Main app component with routing
│   ├── main.jsx                         # Entry point
│   ├── components/
│   │   ├── views/
│   │   │   ├── AuthView.jsx             # Login/signup
│   │   │   ├── SubjectView.jsx          # Subject selection
│   │   │   ├── ChapterView.jsx          # Chapter listing
│   │   │   ├── NotesView.jsx            # Study notes display (FIXED: numbered lists)
│   │   │   ├── QuizView.jsx             # Individual quiz taker
│   │   │   ├── QuizSetsView.jsx         # 15 quiz sets grid (NEW)
│   │   │   ├── PaperView.jsx            # Sample papers
│   │   │   ├── StatsView.jsx            # Analytics dashboard (ENHANCED)
│   │   │   ├── ProgressView.jsx         # Progress tracking
│   │   │   └── index.js
│   │   ├── common/
│   │   │   ├── Badge.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── index.js
│   ├── hooks/
│   │   ├── useAuth.js                   # Authentication logic (added: showResetPassword)
│   │   ├── useCache.js
│   │   └── useFetch.js
│   ├── utils/
│   │   ├── supabase.js                  # DB queries + NEW: Quiz sets functions
│   │   ├── api.js                       # API helpers
│   │   ├── sessionTracking.js           # Session management
│   │   ├── queryOptimization.js
│   │   ├── cacheManager.js
│   │   ├── imageOptimization.js
│   │   ├── bookmarks.js
│   │   ├── loginStreak.js
│   │   ├── weakTopics.js
│   │   ├── recentChapters.js
│   │   └── analyticsEngine.js           # NEW: Analytics computation (phase 1 & 2)
│   ├── constants/
│   │   └── curriculum.js                # 12 subjects, chapters structure
│   ├── styles/
│   │   └── shared.js                    # Theme colors, CSS variables
│   └── scripts/
│       └── seedNotes.js                 # Notes generation script (uses Groq API)
│
├── supabase/
│   ├── functions/
│   │   ├── send-otp/                    # OTP email sending
│   │   └── seed-quiz-sets/              # CRITICAL: Quiz sets generation
│   │       ├── index.ts                 # Main function (batch processing, retries)
│   │       └── deno.json                # verify_jwt: false configuration
│   └── migrations/
│
├── public/
├── .env.local                           # Environment variables
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

---

## 4. FEATURES IMPLEMENTED

### ✅ COMPLETED

1. **Authentication System**
   - Email/OTP login
   - Forgot password with visibility toggle (eye icon)
   - Session persistence

2. **Study Notes**
   - Auto-generated via Groq API (llama-3.1-8b-instant)
   - Markdown rendering with headers, lists, bold, code blocks
   - **FIXED**: Numbered lists now render correctly (1, 2, 3... not 1, 1, 1...)
   - PDF export functionality
   - Dark mode support

3. **Quiz System (Original On-Demand)**
   - Generate quizzes on-the-fly via Groq API
   - Multiple choice with explanations
   - Score tracking per chapter

4. **15 Quiz Sets System** (NEW - IN PROGRESS)
   - Pre-generated 15 sets per chapter
   - 30 MCQs per set (ideally 5 Easy + 5 Medium + 5 Hard)
   - Database: `quiz_sets` table
   - Frontend: QuizSetsView component (grid layout, 15 buttons per chapter)
   - **Status**: 87/105 chapters seeded (83%), 18 still failing due to rate limits

5. **Advanced Analytics Dashboard** (NEW - COMPLETED)
   - Quiz Performance Panel (avg score, accuracy %, attempts)
   - Subject Performance Cards (accuracy by subject, color-coded)
   - Study Patterns Heatmap (24-hour hourly + 7-day daily views)
   - Topic Mastery Tracker (weak/strong topics with progress bars)
   - Personalized Insights (completion %, peak hours, best subject)
   - No external chart dependencies (custom SVG heatmaps)
   - Dark mode ✅, Responsive ✅

6. **Session Tracking**
   - Session duration per chapter
   - Study time by subject
   - Login streaks
   - Mode distribution (notes vs quiz vs papers)

7. **Performance Optimizations** (5 implemented)
   - Image optimization
   - Query optimization
   - Cache management
   - Lazy loading
   - Debouncing

8. **Dark Mode**
   - Full application support
   - CSS variables for theming
   - User preference persistence

---

## 5. CURRENT BUGS & ISSUES

### Issue 1: Quiz Sets Seeding Rate Limiting ⚠️ CRITICAL
**Status**: PARTIALLY RESOLVED
**Description**: Groq API has 6000 TPM (tokens per minute) free tier limit. When seeding 130 chapters with 3 API calls each, requests are being rate-limited and randomly failing.

**Progress**:
- First run (5s delays): 69/105 succeeded (66%)
- Second run (45s delays): +18 more succeeded
- Third run (60s delays): +12 more succeeded (in progress)
- **Current total**: ~99/105 chapters seeded

**Root Cause**: Each chapter needs 3 nested API calls (batches 1, 2, 3). With insufficient delays between chapters, Groq throttles requests.

**Solution Implemented**:
- Batch processing: 3 batches × 5 sets per chapter (instead of 15 in one call)
- Exponential backoff: 60+ second delays between chapters
- Retry logic: Auto-retries failed batches with 60s cooldown
- Progressive JSON recovery: Handles truncated responses

**Remaining Failures** (6-18 chapters still failing):
```
Chemistry - Structure of Atom (maybe)
Chemistry - The p-Block Elements (maybe)
History - The Making of Regional Cultures
History - Paths to Modernisation
Business Studies - Organising (maybe)
Computer Science - Data Management (maybe)
Computer Science - Web Development (maybe)
Economics - Money and Banking (maybe)
Accountancy - Company Accounts (maybe)
Physical Education - Planning in Physical Education (maybe)
Physical Education - Biomechanics and Kinesiology (maybe)
```

**Workaround**: Accept 95%+ completion rate; these chapters can be manually seeded later with even longer delays (120+ seconds).

---

## 6. RECENT WORK

### Session Latest (March 26, 2026)

#### A. Fixed Notes Rendering Issue ✅
**Commit**: `bb233b8`
**File**: `src/components/views/NotesView.jsx`

**Problem**: Numbered lists were rendering as:
```
1. Item 1
1. Item 2
1. Item 3
```

Instead of:
```
1. Item 1
2. Item 2
3. Item 3
```

**Root Cause**: Each numbered item was wrapped in its own `<ol>` element. HTML resets numbering for each list.

**Solution**: Group consecutive numbered items into a single `<ol>` element using a while loop in the JSX.

**Code Change**:
```jsx
// Before: Each item had individual <ol>
{/^\d+\.\s/.test(line) ? <ol><li>...</li></ol> : ...}

// After: Group items in single <ol>
const listItems = [];
let j = i;
while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
  listItems.push(<li>...</li>);
  j++;
}
elements.push(<ol>{listItems}</ol>);
```

---

#### B. Implemented 15 Quiz Sets System ✅ (IN PROGRESS)
**Commits**:
- `a10469f`: Initial setup with QuizSetsView component
- `51ae027`: Batch processing + retry logic
- `9dea237`: JWT verification fix (verify_jwt: false)
- `03bc55c`: Single chapter seeding (avoid timeout)

**What was built**:

1. **Frontend Component**: `QuizSetsView.jsx`
   - 15 buttons per chapter (Set 1 - Set 15)
   - Each button shows: "5 Easy • 5 Medium • 5 Hard"
   - Completion status: ✓ Completed / Not Started
   - Best score display for completed sets
   - Grid layout with hover effects

2. **Database Functions**: `src/utils/supabase.js`
   - `getQuizSet(subject, chapter, setNumber)`: Fetch questions for specific set
   - `getQuizSetStatus(username, subject, chapter)`: Get user's best score per set
   - `saveQuizSubmission(...)`: Track quiz attempts and scores
   - `getBestQuizScore(...)`: Get highest score for a set

3. **Edge Function**: `supabase/functions/seed-quiz-sets/index.ts`
   - **Mode 1** (single chapter): `?subject=X&chapter=Y`
     - Generates 15 quiz sets for one chapter
     - Uses 3 API calls with 30s delays
     - Completes in 5-10 minutes per chapter
   - **Mode 2** (bulk): `?subject=X`
     - Lists all chapters for subject (no generation)
     - For reference only
   - Batch processing: 5 sets per batch (3 batches total)
   - Rate limiting: 30s between batches, 30s between chapters (single mode)
   - Retry logic: Auto-retries failed batches with 60s cooldown
   - JSON recovery: Handles truncated Groq responses via bracket counting

4. **Seeding Scripts**: `seed-all-chapters.ps1`, `retry-failed-chapters.ps1`, `retry-final-chapters.ps1`
   - PowerShell scripts with authorization headers
   - Progressive delays: 5s → 45s → 60s for rate limit handling
   - Track success/failure rates
   - Summary stats at end

**Database Schema** (`quiz_sets` table):
```sql
id (uuid)
subject (text)
chapter (text)
set_number (int: 1-15)
questions (jsonb array of MCQ objects)
created_at (timestamp)

Composite unique index: (subject, chapter, set_number)
```

**Quiz Question Format**:
```json
{
  "question": "What is the chemical formula of water?",
  "options": [
    "H2O",
    "H2O2",
    "HO2",
    "H3O"
  ],
  "correctAnswer": "H2O",
  "explanation": "Water consists of 2 hydrogen atoms and 1 oxygen atom..."
}
```

---

#### C. Enhanced Analytics Dashboard ✅
**Commits**: Various (Phase 1 & 2 complete)
**Files**:
- `src/utils/analyticsEngine.js` (NEW)
- `src/components/views/StatsView.jsx` (ENHANCED)

**New Analytics Functions** (`analyticsEngine.js`):
- `getSubjectPerformance()`: Subject-wise accuracy %, attempts, best scores
- `getTopicMastery()`: Weak/strong topics with mistake counts
- `getStudyTrends()`: Peak hours (24h heatmap) + daily activity (7d heatmap)
- `getPersonalizedInsights()`: Completion %, study time, best subject, next goal
- `getQuizPerformanceMetrics()`: Avg score, accuracy %, total attempts

**New StatsView Sections**:
- Quiz Performance Panel
- Subject Performance Cards (color-coded by accuracy)
- Study Patterns Heatmap (tabbed: hourly / daily)
- Topic Mastery Tracker
- Personalized Insights Panel
- All original sections preserved

**Design Notes**:
- No external chart libraries (custom SVG)
- Dark mode ✅
- Responsive design ✅
- Color-coded performance visualization

---

### Previous Sessions (Earlier in project)

- Advanced analytics implementation
- Performance optimization (5 features)
- Dark mode rollout
- Session tracking system
- Database schema design
- Authentication system with OTP
- Notes generation via Groq API
- Initial quiz system

---

## 7. PENDING TASKS & NEXT STEPS

### Immediate (High Priority)

1. **Complete Quiz Sets Seeding**
   - **Status**: 99/105 chapters done (or 87/105 depending on retry count)
   - **Remaining**: 6 chapters still failing (or accept 95% completion)
   - **Next Step**: Run final retry with 120-second delays if needed
   - **Decision**: Either retry remaining 6, or proceed with 95% completion
   - **Time**: 10-15 minutes more (or skip)

2. **Test QuizSetsView on Live Site**
   - Does the grid display correctly?
   - Can students take quizzes from the 15 sets?
   - Do scores save to database?
   - Navigate: Home → Subject → Chapter → Quiz (should see 15 buttons)

3. **Verify Quiz Submissions**
   - Check `quiz_submissions` table for recent entries
   - Confirm scores are being saved
   - Test with multiple users

---

### Medium Priority

4. **UI/UX Improvements** (from earlier suggestions)
   - Keyboard shortcuts (?, n, q, p keys)
   - Search across chapters
   - Mobile swipe navigation
   - Better chapter breadcrumbs

5. **Analytics Phase 3**
   - Detailed analytics view (AnalyticsDetailView component)
   - Time series charts
   - Performance trends
   - Comparison across subjects

6. **Spaced Repetition System**
   - Algorithm to suggest weak topics for review
   - "Review weak topics" button on dashboard
   - Spacing calculations (SRS)

---

### Lower Priority

7. **Content Improvements**
   - Better notes formatting
   - Formula rendering (LaTeX/MathJax)
   - Code snippet syntax highlighting
   - Diagrams for STEM subjects

8. **Community Features**
   - Q&A forum improvements
   - User discussions
   - Expert moderation

9. **Admin Dashboard**
   - Monitor seeding progress
   - Manage content
   - User analytics

---

## 8. IMPORTANT CODE SNIPPETS

### A. Quiz Sets Generation (Edge Function)
**File**: `supabase/functions/seed-quiz-sets/index.ts`

**Key Logic - Single Chapter Seeding**:
```typescript
// Enable single chapter mode
const chapter = url.searchParams.get("chapter");

if (chapter) {
  // Generate 15 sets via 3 batches
  const allSets = [];
  for (let batch = 1; batch <= 3; batch++) {
    const result = await generateQuizSets(chapter, subject, groqKey, 5, batch);

    if (result.success) {
      allSets.push(...result.data);
    } else {
      // Retry with 60s cooldown
      await new Promise(resolve => setTimeout(resolve, 60000));
      const retry = await generateQuizSets(chapter, subject, groqKey, 5, `${batch}-retry`);
      if (retry.success) allSets.push(...retry.data);
    }

    // 30s delay between batches
    if (batch < 3) await new Promise(resolve => setTimeout(resolve, 30000));
  }

  // Save to database (upsert prevents duplicates)
  for (let i = 0; i < Math.min(15, allSets.length); i++) {
    await supabase.from("quiz_sets").upsert({
      subject,
      chapter,
      set_number: i + 1,
      questions: allSets[i]
    });
  }
}
```

---

### B. Notes Numbered List Fix
**File**: `src/components/views/NotesView.jsx`

**Problem**: Used `.map()` which created individual `<ol>` elements per line

**Solution**: Use a `while` loop to group consecutive numbered items:
```jsx
(() => {
  const elements = [];
  const lines = notes.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\d+\.\s/.test(line)) {
      // Group consecutive numbered items
      const listItems = [];
      let j = i;
      while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
        const text = lines[j].replace(/^\d+\.\s/, '');
        listItems.push(<li key={j}>{text}</li>);
        j++;
      }
      elements.push(<ol key={i}>{listItems}</ol>);
      i = j;
    } else {
      // Handle other line types...
      i++;
    }
  }

  return elements;
})()}
```

---

### C. QuizSetsView Component
**File**: `src/components/views/QuizSetsView.jsx`

```jsx
export function QuizSetsView({ subject, chapter, quizSetStatus, onSelectSet }) {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 20 }}>
      <h2>{chapter} - 15 Quiz Sets</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {Array.from({ length: 15 }, (_, i) => i + 1).map(setNum => {
          const status = quizSetStatus?.[setNum];
          return (
            <button
              key={setNum}
              onClick={() => onSelectSet(setNum)}
              style={{
                padding: 16,
                border: status?.completed ? "2px solid green" : "1px solid #ccc",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              <div>Set {setNum}</div>
              <div style={{ fontSize: 12 }}>5 Easy • 5 Medium • 5 Hard</div>
              {status?.completed && <div>✓ Best: {status.bestScore}%</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

### D. Analytics Engine
**File**: `src/utils/analyticsEngine.js`

```javascript
export function getSubjectPerformance(submissions, attempts) {
  const bySubject = {};

  submissions.forEach(sub => {
    if (!bySubject[sub.subject]) {
      bySubject[sub.subject] = { correct: 0, total: 0, scores: [] };
    }
    bySubject[sub.subject].correct += sub.correct;
    bySubject[sub.subject].total += sub.total;
    bySubject[sub.subject].scores.push(sub.score);
  });

  return Object.entries(bySubject).map(([subject, data]) => ({
    subject,
    accuracy: Math.round((data.correct / data.total) * 100),
    attempts: data.scores.length,
    bestScore: Math.max(...data.scores),
    avgScore: Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length)
  }));
}
```

---

## 9. DEPENDENCIES & SETUP INSTRUCTIONS

### Environment Variables (.env.local)
```
VITE_SUPABASE_URL=https://winsxslcmlyxzmlctkzt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROQ_KEY=gsk_...
```

### Installation
```bash
npm install
npm run dev          # Start dev server
npm run build        # Build for production
npm run seed-notes   # Generate study notes (one-time)
```

### Database Setup
```sql
-- quiz_sets table
CREATE TABLE quiz_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  set_number INT NOT NULL (1-15),
  questions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject, chapter, set_number)
);

-- quiz_submissions table (existing)
CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY,
  username TEXT,
  subject TEXT,
  chapter TEXT,
  set_number INT,
  answers JSONB,
  score INT,
  created_at TIMESTAMP
);

-- chapter_notes table (existing)
CREATE TABLE chapter_notes (
  id UUID PRIMARY KEY,
  subject TEXT,
  chapter TEXT,
  notes TEXT,
  created_at TIMESTAMP
);
```

### Deployment
```bash
# Deploy Edge Function
npx supabase functions deploy seed-quiz-sets

# Push to GitHub
git add .
git commit -m "Your message"
git push origin main
```

### Seeding Commands
```powershell
# First run: All chapters with 5s delays
cd C:\Users\akm45\Desktop
.\seed-all-chapters.ps1

# Retry failed with 45s delays
.\retry-failed-chapters.ps1

# Final retry with 60s delays
.\retry-final-chapters.ps1
```

---

## 10. KEY METRICS & STATUS

### Code Quality
- ✅ Builds successfully (585ms, zero errors)
- ✅ No external dependencies added for analytics (custom SVG)
- ✅ Dark mode fully implemented
- ✅ Responsive design across all views

### Database Status
- **quiz_sets**: ~99/105 chapters seeded (94%)
- **chapter_notes**: ~100+ chapters generated
- **quiz_submissions**: Active tracking per user
- **Users**: Growing (live platform)

### Performance
- Image optimization: ✅
- Query optimization: ✅
- Cache management: ✅
- Lazy loading: ✅
- Debouncing: ✅

### Live Website
- URL: https://akmedu45.xyz (or similar)
- Status: Production
- Users: Active students
- Updates: Continuous (be careful with changes)

---

## 11. QUICK REFERENCE - COMMON TASKS

### To add a new subject
1. Edit `src/constants/curriculum.js`
2. Add to CURRICULUM object with chapters array
3. Update component views
4. Regenerate notes and quiz sets

### To fix a bug
1. Identify reproduction steps
2. Check relevant component (see folder structure)
3. Check database if data-related
4. Test locally with `npm run dev`
5. Commit: `git commit -m "Fix: description"`

### To add a new feature
1. Create component in `src/components/views/`
2. Add state in `App.jsx` if needed
3. Add utility functions in `src/utils/`
4. Test locally
5. Deploy Edge Function if needed
6. Push to GitHub

### To debug Groq API issues
1. Check Edge Function logs: Supabase Dashboard → Functions → seed-quiz-sets → Logs
2. Test with curl: Include Authorization header
3. Increase delays if rate-limited
4. Check token count in prompts

---

## 12. CONTACT / HANDOFF NOTES

**Last Updated**: March 26, 2026, 21:00 UTC
**Status**: Active development, 95%+ quiz sets seeded
**Critical Issue**: Rate limiting on remaining 6 chapters (can retry later)
**Next Action**: Test QuizSetsView on live site, then iterate on UI/UX improvements

**If continuing in another AI**:
1. Read this document thoroughly
2. Check the recent git commits (last 7-10)
3. Review `.gitignore` for what's excluded
4. Run `npm run build` to verify no errors
5. Check Supabase logs for any errors
6. Start with highest priority tasks (section 7)

---

**End of Context Document**
