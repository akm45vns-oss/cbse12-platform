/**
 * Session Tracking Utility
 * Tracks user study sessions, time spent, and session state
 */

const SESSION_STORAGE_KEY = 'akmedu_session';
const SESSION_HISTORY_KEY = 'akmedu_sessions_history';

/**
 * Start a new study session
 */
export function startSession(subject, chapter, mode) {
  const session = {
    id: Date.now(),
    subject,
    chapter,
    mode, // 'notes', 'quiz', 'paper'
    startTime: Date.now(),
    endTime: null,
    duration: 0,
    status: 'active', // active, paused, completed
  };
  
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Get current active session
 */
export function getCurrentSession() {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);
  return session ? JSON.parse(session) : null;
}

/**
 * Pause current session
 */
export function pauseSession() {
  const session = getCurrentSession();
  if (session) {
    session.status = 'paused';
    session.pausedAt = Date.now();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Resume paused session
 */
export function resumeSession() {
  const session = getCurrentSession();
  if (session && session.status === 'paused') {
    const pausedTime = Date.now() - session.pausedAt;
    if (!session.pausedDurations) session.pausedDurations = [];
    session.pausedDurations.push(pausedTime);
    session.status = 'active';
    delete session.pausedAt;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * End current session and save to history
 */
export function endSession(completed = false) {
  const session = getCurrentSession();
  if (!session) return null;
  
  session.endTime = Date.now();
  session.status = completed ? 'completed' : 'abandoned';
  
  // Calculate actual duration (subtract paused time)
  let totalPausedTime = 0;
  if (session.pausedDurations) {
    totalPausedTime = session.pausedDurations.reduce((sum, d) => sum + d, 0);
  }
  session.duration = (session.endTime - session.startTime) - totalPausedTime;
  
  // Save to history
  const history = getSessionHistory();
  history.push(session);
  saveSessionHistory(history);
  
  // Clear current session
  localStorage.removeItem(SESSION_STORAGE_KEY);
  
  return session;
}

/**
 * Get session history
 */
export function getSessionHistory() {
  const history = localStorage.getItem(SESSION_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
}

/**
 * Save session history
 */
export function saveSessionHistory(history) {
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Get session statistics for a specific subject
 */
export function getSubjectStats(subject) {
  const history = getSessionHistory();
  const subjectSessions = history.filter(s => s.subject === subject);
  
  const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);
  const completedCount = subjectSessions.filter(s => s.status === 'completed').length;
  const totalSessions = subjectSessions.length;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
  
  return {
    subject,
    totalTime,
    totalSessions,
    completedSessions: completedCount,
    abandonedSessions: totalSessions - completedCount,
    avgSessionTime,
    sessions: subjectSessions,
  };
}

/**
 * Get overall study statistics
 */
export function getOverallStats() {
  const history = getSessionHistory();
  
  const totalTime = history.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = history.length;
  const completedCount = history.filter(s => s.status === 'completed').length;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  // Calculate study streak
  const streak = calculateStreak(history);
  
  // Group by subject
  const bySubject = {};
  history.forEach(session => {
    if (!bySubject[session.subject]) {
      bySubject[session.subject] = { total: 0, count: 0 };
    }
    bySubject[session.subject].total += session.duration;
    bySubject[session.subject].count += 1;
  });
  
  // Calculate mode distribution
  const modeDistribution = {
    notes: history.filter(s => s.mode === 'notes').length,
    quiz: history.filter(s => s.mode === 'quiz').length,
    paper: history.filter(s => s.mode === 'paper').length,
  };
  
  return {
    totalTime,
    totalSessions,
    completedSessions: completedCount,
    abandonedSessions: totalSessions - completedCount,
    avgSessionTime,
    studyStreak: streak,
    bySubject,
    modeDistribution,
    lastSession: history[history.length - 1] || null,
  };
}

/**
 * Calculate study streak (consecutive days of studying)
 */
function calculateStreak(history) {
  if (history.length === 0) return 0;
  
  const dates = [...new Set(history.map(s => new Date(s.startTime).toDateString()))].sort().reverse();
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (date.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get study recommendations based on stats
 */
export function getStudyRecommendations(stats) {
  const recommendations = [];
  
  if (stats.studyStreak === 0) {
    recommendations.push({
      type: 'motivation',
      message: '🎯 Start your study streak today!',
      priority: 'high',
    });
  }
  
  if (stats.totalSessions > 0 && stats.completedSessions / stats.totalSessions < 0.5) {
    recommendations.push({
      type: 'completion',
      message: '💪 Focus on completing your study sessions!',
      priority: 'medium',
    });
  }
  
  // Find least studied subject
  const subjects = Object.entries(stats.bySubject);
  if (subjects.length > 0) {
    const leastStudied = subjects.sort((a, b) => a[1].count - b[1].count)[0];
    if (leastStudied[1].count < 3) {
      recommendations.push({
        type: 'subject',
        message: `📚 Focus on ${leastStudied[0]} - you haven't studied it much yet!`,
        priority: 'medium',
      });
    }
  }
  
  if (stats.avgSessionTime < 300000) { // Less than 5 minutes
    recommendations.push({
      type: 'duration',
      message: '⏱️ Try to study for longer sessions to retain more!',
      priority: 'low',
    });
  }
  
  return recommendations;
}

/**
 * Clear all session data (for debugging/testing)
 */
export function clearAllSessionData() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_HISTORY_KEY);
}
