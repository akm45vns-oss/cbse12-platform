/**
 * Google Analytics 4 Integration
 * Tracks user behavior, conversions, and platform metrics
 */

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 */
export function initializeGA() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('GA_MEASUREMENT_ID not configured');
    return;
  }

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
    'session_engaged': durationMs > 30000,
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
