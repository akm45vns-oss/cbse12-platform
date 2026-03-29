# Leaderboard Feature Implementation

## Overview
A comprehensive subject-wise and chapter-wise leaderboard system has been implemented to rank users based on their quiz performance. Users are ranked by average percentage score, with tie-breaking based on best score.

## Files Created

### 1. `src/utils/leaderboard.js`
Core utility functions for leaderboard data calculation:

- **`getLeaderboardData(subject, chapter = null, limit = 25)`**
  - Fetches all quiz submissions for a subject (optionally filtered by chapter)
  - Calculates average percentage, best score, worst score, and total attempts for each user
  - Ranks users by average percentage (descending) with best score as tie-breaker
  - Returns top N users (default: 25) with rank assigned
  - Returns array of objects: `{ rank, username, avgPercentage, bestScore, worstScore, totalAttempts, totalScore }`

- **`getUserRank(username, subject, chapter = null)`**
  - Retrieves the specific rank of a user in a subject/chapter leaderboard
  - Returns: `{ rank, username, avgPercentage, bestScore, totalUsers }`
  - Returns null if user has no submissions

- **`getAllSubjectLeaderboards(limit = 25)`**
  - Builds leaderboards for all subjects at once
  - Returns object with subject names as keys and leaderboard arrays as values
  - Useful for dashboard overview or multi-subject ranking

- **`getChapterLeaderboards(subject, limit = 25)`**
  - Creates per-chapter leaderboards for a specific subject
  - Returns object with chapter names as keys and leaderboard arrays as values
  - Useful for detailed chapter-wise performance tracking

### 2. `src/components/views/LeaderboardView.jsx`
React component for displaying leaderboards with features:

- **View Types:**
  - Subject-wise: Top 25 users in entire subject
  - Chapter-wise: Top 25 users in specific chapter (with chapter selector)

- **Subject Selector:** Dropdown to switch between all 12 CBSE subjects

- **Chapter Selector Grid:** (Visible in chapter-wise view)
  - Scrollable grid showing all chapters for selected subject
  - Click to toggle chapter selection
  - Dynamically populated from curriculum data

- **User's Current Rank Card:** 
  - Prominent display of logged-in user's rank and score
  - Shows rank badge with medal icons (🥇🥈🥉 for top 3)
  - Only visible if user has quiz submissions

- **Leaderboard Table:**
  - Columns: Rank | Username | Average % | Best Score | Attempts
  - Medal icons for top 3 ranks
  - Current user highlighted and marked with "YOU" badge
  - Hover effects for better UX
  - Loading state with spinner
  - Empty state with helpful message

- **Stats Summary:**
  - Top score in leaderboard
  - Total competitors
  - User's position (if ranked)

### 3. `src/styles/LeaderboardView.css`
Comprehensive styling with:

- **Purple gradient theme:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Responsive design:** Works on desktop, tablet, and mobile
- **Animations:** Smooth transitions, slide-in effects, hover states
- **Accessibility:** High contrast, readable fonts, clear visual hierarchy

## Integration Points

### App.jsx Updates
1. Added `LeaderboardView` to eager imports (alongside DashboardView and QuizSetsView)
2. Added conditional rendering: `{nav.view === "leaderboard" && <LeaderboardView />}`
3. Added navigation button in header with 🏆 emoji and "Leaderboard" title

### Views Index Export
Updated `src/components/views/index.js` to export LeaderboardView

### Navigation Integration
Leaderboard is accessible via:
- `nav.navigate("leaderboard")` from anywhere in the app
- Header button in navigation bar
- Uses existing useNavigation hook (no changes needed)

## Data Flow

```
User clicks Leaderboard button
    ↓
App renders LeaderboardView with nav.view === "leaderboard"
    ↓
LeaderboardView extracts selected subject/chapter
    ↓
getLeaderboardData() queries quiz_submissions from Supabase
    ↓
Data grouped by username and aggregated (avg %, best score, etc.)
    ↓
Ranked by average percentage (descending)
    ↓
Top 25 returned with rank numbers
    ↓
Rendered in table with user's rank highlighted
```

## Database Requirements

Uses existing `quiz_submissions` table:
- `username` (text)
- `subject` (text)
- `chapter` (text)
- `score` (integer, 0-100)

No schema changes required - fully compatible with existing data structure.

## Performance Considerations

1. **In-memory Aggregation:** Leaderboard calculations happen on client-side
   - Reduces database load
   - Suitable for typical user counts (hundreds to low thousands)
   - For millions of users, consider materialized views or caching

2. **Late binding:** Data fetched on component mount
   - Fresh data every time leaderboard is opened
   - Could be cached if performance becomes an issue

3. **Scalability Tips:** (For future enhancement)
   - Create materialized views in Supabase
   - Implement client-side caching with 5-10 minute TTL
   - Use pagination for large leaderboards
   - Add indices on (username, subject, chapter) in quiz_submissions

## Features Implemented

✅ Subject-wise ranking
✅ Chapter-wise ranking with selector
✅ Top 25 users per subject/chapter
✅ Average percentage calculation
✅ Tie-breaking by best score
✅ Current user rank display
✅ Current user highlighting in table
✅ Medal icons for top 3
✅ Responsive mobile design
✅ Loading and empty states
✅ Stats summary cards
✅ Smooth animations and transitions

## User Experience

- **Desktop:** Full-width table with subject/chapter selectors
- **Tablet:** Responsive grid layout, readable fonts
- **Mobile:** Stacked layout, scrollable table, touch-friendly buttons
- **Loading:** Spinner animation while fetching data
- **No Data:** Friendly message ("Complete some quizzes to appear on the leaderboard!")
- **Top Performers:** Medal rewards (🥇🥈🥉) for motivation

## Integration with Existing Features

- Uses `useAuth` hook for current user identification
- Integrates with app navigation system
- Compatible with existing quiz submission tracking
- Works alongside other views (stats, progress, etc.)
- Respects Supabase RLS if configured

## Next Steps (Optional Enhancements)

1. Add monthly/weekly leaderboard variants
2. Implement achievements/badges for leaderboard milestones
3. Add leaderboard notifications ("You're in top 10!")
4. Export leaderboard data as PDF/CSV
5. Globally pooled leaderboards (all subjects combined)
6. Leaderboard filters (by date range, performance threshold)
7. Social features (follow top performers, challenge mode)
8. Animated rank transitions when returning user improves

## Testing Checklist

- [ ] Render leaderboard with sample data
- [ ] Verify subject dropdown works
- [ ] Verify chapter selector appears/hides correctly
- [ ] Check rank calculation accuracy
- [ ] Verify current user is highlighted
- [ ] Test responsive design on mobile
- [ ] Check loading state appears briefly
- [ ] Verify empty state shows when no data
- [ ] Test navigation button integration
- [ ] Verify data persists on reload
