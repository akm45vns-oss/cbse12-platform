# Analytics Setup Guide for AkmEdu

## Overview
This guide covers setting up Google Analytics 4 (GA4) to track user behavior, conversion funnels, and platform metrics.

## Step 1: Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property:
   - Property name: `AkmEdu`
   - Reporting timezone: India (IST)
   - Currency: INR
3. Create web data stream:
   - Website URL: `https://yourdomain.com`
   - Stream name: `AkmEdu Web`
4. Copy the **MEASUREMENT ID** (starts with `G-`)
   - Format: `G-XXXXXXXXXX`

## Step 2: Install Analytics in Your Project

```bash
npm install google-analytics-4
# or
npm install gtag.js
```

## Step 3: Create Analytics Configuration File

Create `src/utils/analytics.js`:

```javascript
/**
 * Google Analytics 4 Integration
 * Tracks user behavior, conversions, and platform metrics
 */

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

/**
 * Initialize Google Analytics
 */
export function initializeGA() {
  if (!GA_MEASUREMENT_ID) return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    'page_path': window.location.pathname,
    'anonymize_ip': true,
  });

  window.gtag = gtag;
}

/**
 * Track page view
 */
export function trackPageView(pageName, pagePath) {
  if (!window.gtag) return;
  window.gtag('event', 'page_view', {
    'page_title': pageName,
    'page_path': pagePath,
  });
}

/**
 * Track sign up event
 */
export function trackSignUp(method) {
  if (!window.gtag) return;
  window.gtag('event', 'sign_up', {
    'method': method || 'email',
  });
}

/**
 * Track login event
 */
export function trackLogin(method) {
  if (!window.gtag) return;
  window.gtag('event', 'login', {
    'method': method || 'email',
  });
}

/**
 * Track subject selection
 */
export function trackSubjectSelect(subjectName) {
  if (!window.gtag) return;
  window.gtag('event', 'select_subject', {
    'subject': subjectName,
  });
}

/**
 * Track chapter selection
 */
export function trackChapterSelect(subjectName, chapterName) {
  if (!window.gtag) return;
  window.gtag('event', 'select_chapter', {
    'subject': subjectName,
    'chapter': chapterName,
  });
}

/**
 * Track notes view
 */
export function trackNotesView(subjectName, chapterName) {
  if (!window.gtag) return;
  window.gtag('event', 'view_notes', {
    'subject': subjectName,
    'chapter': chapterName,
    'timestamp': Date.now(),
  });
}

/**
 * Track quiz start
 */
export function trackQuizStart(subjectName, chapterName) {
  if (!window.gtag) return;
  window.gtag('event', 'quiz_start', {
    'subject': subjectName,
    'chapter': chapterName,
  });
}

/**
 * Track quiz completion
 */
export function trackQuizComplete(subjectName, chapterName, score, total) {
  if (!window.gtag) return;
  window.gtag('event', 'quiz_complete', {
    'subject': subjectName,
    'chapter': chapterName,
    'score': score,
    'total': total,
    'percentage': Math.round((score / total) * 100),
  });
}

/**
 * Track paper view
 */
export function trackPaperView(subjectName) {
  if (!window.gtag) return;
  window.gtag('event', 'view_paper', {
    'subject': subjectName,
  });
}

/**
 * Track user engagement time (session duration)
 */
export function trackEngagementTime(durationMs) {
  if (!window.gtag) return;
  window.gtag('event', 'engagement_time', {
    'duration_ms': Math.round(durationMs),
    'session_engaged': durationMs > 30000, // Engaged if > 30 seconds
  });
}

/**
 * Track search event
 */
export function trackSearch(query) {
  if (!window.gtag) return;
  window.gtag('event', 'search', {
    'search_term': query,
  });
}

/**
 * Track forum post
 */
export function trackForumPost(category) {
  if (!window.gtag) return;
  window.gtag('event', 'forum_post', {
    'category': category,
  });
}

/**
 * Track custom event
 */
export function trackEvent(eventName, eventData) {
  if (!window.gtag) return;
  window.gtag('event', eventName, eventData);
}

/**
 * Set user ID for logged-in users
 */
export function setUserID(userId) {
  if (!window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    'user_id': userId,
  });
}

/**
 * Set user properties
 */
export function setUserProperties(properties) {
  if (!window.gtag) return;
  window.gtag('set', { 'user_properties': properties });
}
```

## Step 4: Update Environment Variables

Create/update `.env`:
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual GA4 Measurement ID.

## Step 5: Initialize in App.jsx

```javascript
import { initializeGA, trackPageView, setUserID } from './utils/analytics';

export default function App() {
  // Initialize analytics on component mount
  useEffect(() => {
    initializeGA();
  }, []);

  // Track page views when navigation changes
  useEffect(() => {
    trackPageView(
      `${nav.view} ${nav.subject || ''} ${nav.chapter || ''}`.trim(),
      window.location.pathname
    );
  }, [nav.view, nav.subject, nav.chapter]);

  // Track user ID when authenticated
  useEffect(() => {
    if (auth.currentUser) {
      setUserID(auth.currentUser.id);
    }
  }, [auth.currentUser]);

  // ... rest of your code
}
```

## Step 6: Add Event Tracking to Key Components

### In AuthView (after successful login/signup):
```javascript
import { trackLogin, trackSignUp } from '../utils/analytics';

// On login success
trackLogin('email');

// On signup success
trackSignUp('email');
```

### In SubjectView (on subject selection):
```javascript
import { trackSubjectSelect } from '../utils/analytics';

const handleSelectSubject = (subject) => {
  trackSubjectSelect(subject);
  nav.navigateToSubject(subject);
};
```

### In ChapterView (on chapter selection):
```javascript
import { trackChapterSelect } from '../utils/analytics';

const handleSelectChapter = (chapter) => {
  trackChapterSelect(nav.subject, chapter);
  nav.navigateToChapter(chapter);
};
```

### In NotesView (on view):
```javascript
import { trackNotesView } from '../utils/analytics';

useEffect(() => {
  trackNotesView(nav.subject, nav.chapter);
}, []);
```

### In QuizView (start & completion):
```javascript
import { trackQuizStart, trackQuizComplete } from '../utils/analytics';

// On quiz load
useEffect(() => {
  trackQuizStart(nav.subject, nav.chapter);
}, []);

// On submission
const handleSubmit = () => {
  trackQuizComplete(nav.subject, nav.chapter, score, total);
  // ... rest of submit logic
};
```

### In LandingPage (CTA clicks):
```javascript
import { trackEvent } from '../utils/analytics';

const handleSignUp = () => {
  trackEvent('landing_page_cta', {
    'cta_text': 'Sign Up',
    'cta_location': 'hero_section',
  });
  onSignUp();
};
```

## Step 7: Key Analytics Metrics to Monitor

### Acquisition Metrics
- **Users**: Total unique visitors
- **Sessions**: Number of visits
- **Bounce Rate**: % of users who leave without action
- **New Users**: First-time visitors

### Engagement Metrics
- **Pages/Session**: Average pages visited per session
- **Avg. Session Duration**: How long users stay
- **Active Users**: Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- **Subject Selection Rate**: % users who start learning

### Conversion Metrics
- **Sign-up Rate**: % of visitors who create account
- **Login Rate**: % of returning users who log in
- **Quiz Completion Rate**: % users completing quizzes
- **Study Consistency**: % users returning daily

### Content Metrics
- **Most Popular Subjects**: Which subjects attract most users
- **Most Viewed Chapters**: Which chapters get most engagement
- **Quiz Attempt Rate**: How many users attempt quizzes
- **Notes View Duration**: Time spent on notes

### User Retention
- **Day 1 Retention**: % users returning after 1 day
- **Day 7 Retention**: % users returning after 1 week
- **Day 30 Retention**: % users returning after 1 month
- **Churn Rate**: % users who don't return

## Step 8: Create Custom Audience Segments

In Google Analytics, create audiences for:
1. **Engaged Users**: Session duration > 3 minutes
2. **Quiz Takers**: Users who completed at least 1 quiz
3. **Returning Users**: Visited more than once
4. **High Performers**: Quiz average score > 70%
5. **At-Risk Users**: Haven't visited in 7 days

## Step 9: Set Up Conversion Goals

Create goals/conversions for:
1. Sign Up (Destination: `/dashboard` after signup)
2. First Quiz Completion
3. Complete a Full Chapter (All chapters in subject)
4. 7-Day Retention
5. Forum Contribution

## Step 10: Dashboard & Reports to Check

### Daily Checks
- Active users today
- Page views
- Bounce rate
- New sign-ups

### Weekly Reviews
- Top content performed
- User retention cohort
- Most used features
- Traffic sources

### Monthly Analysis
- Growth rate (users, sessions)
- Engagement trends
- Feature adoption
- Retention trends

## Useful GA4 Reports

1. **Real-time**: See live user activity
2. **Acquisition**: Traffic sources, channels
3. **User**: Demographics, behavior flows
4. **Engagement**: Page performance, events
5. **Monetization**: Revenue (if applicable)
6. **Retention**: Cohort analysis, churn
7. **Tech**: Device, browser, OS performance

## Testing Analytics

Before going live, test your analytics:

```javascript
// Open browser console and run:
// 1. Check if GA is loaded
console.log(window.gtag);

// 2. Check dataLayer
console.log(window.dataLayer);

// 3. Manual event test
window.gtag('event', 'test_event', {
  'test_param': 'test_value'
});

// Go to Google Analytics Real-time Report
// Wait 1-2 seconds and you should see the event
```

## Integration Checklist

- [ ] Google Analytics 4 property created
- [ ] Measurement ID copied to `.env`
- [ ] Analytics utility file created (`src/utils/analytics.js`)
- [ ] GA initialized in `App.jsx`
- [ ] Events added to key components
- [ ] Test data sent to Google Analytics
- [ ] Reports configured
- [ ] Team added to GA property
- [ ] Alerts/notifications set up
- [ ] Regular analysis schedule created

## Next Steps After Analytics

Once analytics is running for 1-2 weeks:
1. Analyze user acquisition sources
2. Identify most popular content
3. Optimize low-performing sections
4. Run A/B tests on landing page
5. Plan user acquisition campaigns

## Troubleshooting

**GA shows no data after 1 hour:**
- Check Measurement ID is correct
- Verify `.env` variable is loaded
- Check browser console for errors
- Wait 24-48 hours for data to fully populate

**Events not tracking:**
- Verify `window.gtag` exists in console
- Check event names match GA4 format
- Ensure user hasn't blocked Google Analytics
- Check GA property is in data collection mode

---

**Estimated Setup Time**: 2-3 hours for full implementation including testing
