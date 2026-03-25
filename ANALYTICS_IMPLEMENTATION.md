# Analytics Implementation Checklist

## ✅ Step-by-Step Implementation

### 1. Environment Setup
- [ ] Create `.env` file in project root (if not exists)
- [ ] Add your GA4 Measurement ID: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
- [ ] Restart dev server: `npm run dev`

### 2. App.jsx Integration
Add to imports:
```javascript
import { initializeGA, trackPageView, setUserID } from './utils/analytics';
```

Add to useEffect section (after line 58):
```javascript
// Initialize GA on mount
useEffect(() => {
  initializeGA();
}, []);

// Track page changes
useEffect(() => {
  const pageName = `${nav.view}${nav.subject ? ' - ' + nav.subject : ''}${nav.chapter ? ' - ' + nav.chapter : ''}`;
  trackPageView(pageName.trim(), window.location.pathname);
}, [nav.view, nav.subject, nav.chapter]);

// Set user ID when logged in
useEffect(() => {
  if (auth.currentUser?.id) {
    setUserID(auth.currentUser.id);
  }
}, [auth.currentUser]);
```

### 3. AuthView Integration
**Location**: `src/components/views/AuthView.jsx`

After successful login (in doLogin):
```javascript
import { trackLogin } from '../../utils/analytics';

// Add inside doLogin success handler
trackLogin('email');
```

After successful signup (in doRegister):
```javascript
import { trackSignUp } from '../../utils/analytics';

// Add inside doRegister success handler
trackSignUp('email');
```

### 4. DashboardView Integration
**Location**: `src/components/views/DashboardView.jsx`

When subject is selected (in onSelectSubject callback):
```javascript
import { trackSubjectSelect } from '../../utils/analytics';

trackSubjectSelect(subject);
```

### 5. SubjectView Integration
**Location**: `src/components/views/SubjectView.jsx`

When chapter is selected (in onSelectChapter callback):
```javascript
import { trackChapterSelect } from '../../utils/analytics';

trackChapterSelect(subject, chapter);
```

### 6. NotesView Integration
**Location**: `src/components/views/NotesView.jsx`

On component mount/when notes load:
```javascript
import { trackNotesView } from '../../utils/analytics';

useEffect(() => {
  if (subject && chapter) {
    trackNotesView(subject, chapter);
  }
}, [subject, chapter]);
```

### 7. QuizView Integration
**Location**: `src/components/views/QuizView.jsx`

On quiz start (component mount):
```javascript
import { trackQuizStart, trackQuizComplete } from '../../utils/analytics';

useEffect(() => {
  if (subject && chapter && quiz.length > 0) {
    trackQuizStart(subject, chapter);
  }
}, []);
```

On quiz submission (in quiz result handler):
```javascript
// When quiz is submitted
trackQuizComplete(subject, chapter, score, quiz.length);
```

### 8. PaperView Integration
**Location**: `src/components/views/PaperView.jsx`

On component mount:
```javascript
import { trackPaperView } from '../../utils/analytics';

useEffect(() => {
  if (subject) {
    trackPaperView(subject);
  }
}, [subject]);
```

### 9. LandingPage Integration
**Location**: `src/components/views/LandingPage.jsx`

On CTA clicks:
```javascript
import { trackEvent } from '../../utils/analytics';

// Update onSignUp callback wrappers:
onClick={() => {
  trackEvent('landing_page_cta', {
    'cta_text': 'Sign In / Join Free',
    'section': 'navigation'
  });
  onSignUp();
}}

// Do this for all CTA buttons in landing page
// Different sections: 'hero', 'features', 'pricing', 'footer', 'navigation'
```

### 10. SearchBar Integration
**Location**: `src/components/common/SearchBar.jsx`

On search:
```javascript
import { trackSearch } from '../../utils/analytics';

// In search handler
const handleSearch = (query) => {
  if (query.trim()) {
    trackSearch(query);
  }
  // ... rest of search logic
};
```

### 11. ForumModal Integration
**Location**: Location of forum/Q&A posting

On forum post creation:
```javascript
import { trackForumPost } from '../../utils/analytics';

// After successful post creation
trackForumPost(category); // e.g., 'physics', 'chemistry', 'biology'
```

---

## 🧪 Testing Analytics

### Test 1: Check GA Initialization
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `console.log(window.gtag)`
4. Should show the gtag function (not undefined)

### Test 2: Check Analytics Script Loaded
1. Go to Network tab in DevTools
2. Filter by "gtag"
3. Should see: `gtag.js?id=G-XXXXX` (200 OK)

### Test 3: Send a Test Event
1. In Console, run:
```javascript
window.gtag('event', 'test_event', {
  'test_param': 'test_value'
});
```

2. Go to Google Analytics 4 console
3. Go to Real-time Report
4. Should see the event within 1-2 seconds

### Test 4: Check Page Views
1. Open your website
2. Click around and navigate between pages
3. Go to Google Analytics Real-time Report
4. Should see page views updating

---

## 📊 Verifying in Google Analytics

### View Real-time Data
1. Log in to [Google Analytics 4](https://analytics.google.com/)
2. Select your property (AkmEdu45)
3. Click **Real-time** on the left sidebar
4. Perform actions on your website
5. Data should appear within 1-2 seconds

### View Events
1. Go to **Events** in left sidebar
2. Click **Event name**
3. Should see your custom events:
   - `sign_up`
   - `login`
   - `select_subject`
   - `select_chapter`
   - `view_notes`
   - `quiz_start`
   - `quiz_complete`
   - `view_paper`
   - `search`
   - `forum_post`

### View User Sessions
1. Go to **User** → **Engagement** → **Engagement overview**
2. Should see:
   - Total users
   - Sessions
   - Session duration
   - Bounce rate

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] GA Measurement ID is in production `.env`
- [ ] All tracking events added to components
- [ ] No console errors with analytics
- [ ] Real-time data visible in GA4 console
- [ ] Privacy policy updated mentioning analytics
- [ ] GDPR compliance checked (if EU users)
- [ ] User consent banner considered (optional but recommended)

---

## 📈 Key Metrics to Monitor Monthly

1. **Acquisition**: New users, traffic sources
2. **Activation**: Sign-up rate, first quiz completion
3. **Retention**: Day 1, 7, 30 retention rates
4. **Revenue**: If applicable, conversion to premium
5. **Engagement**: Avg session duration, pages per session
6. **Popular Content**: Most viewed subjects/chapters

---

## 💡 Pro Tips

1. **Give it 24-48 hours**: GA data populates gradually, wait before analyzing
2. **Test in incognito**: GA doesn't track your own visits in incognito mode
3. **Use Segments**: Create custom user segments (e.g., "Quiz Takers", "Active Users")
4. **Set Alerts**: Get notified if traffic drops or conversion spikes
5. **Regular Reviews**: Check analytics weekly for insights
6. **A/B Test**: Use GA4 to test different landing page versions

---

**Estimated Implementation Time**: 1-2 hours for full implementation
