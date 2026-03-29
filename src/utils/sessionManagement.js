/**
 * Session Management & Timeout
 * Manages user sessions with automatic timeout and logout
 */

const SESSION_KEY = "akmedu_session";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours total session

/**
 * Initialize user session
 * @param {string} username - Username
 * @param {object} userData - Additional user data
 */
export function initializeSession(username, userData = {}) {
  const sessionData = {
    username,
    userData,
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    id: generateSessionId()
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  startSessionMonitoring();
}

/**
 * Get current session data
 * @returns {object|null} Current session or null if no session
 */
export function getSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    return JSON.parse(session);
  } catch (e) {
    console.error("Error reading session:", e);
    return null;
  }
}

/**
 * Check if session is active
 * @returns {boolean} Whether session is valid
 */
export function isSessionActive() {
  const session = getSession();
  if (!session) return false;
  
  const now = Date.now();
  const inactivityTimespan = now - session.lastActivityTime;
  const totalTimespan = now - session.startTime;
  
  // Check inactivity timeout
  if (inactivityTimespan > SESSION_TIMEOUT) {
    console.warn("Session expired due to inactivity");
    return false;
  }
  
  // Check absolute timeout (8 hour max session)
  if (totalTimespan > SESSION_ABSOLUTE_TIMEOUT) {
    console.warn("Session expired due to maximum duration");
    return false;
  }
  
  return true;
}

/**
 * Update session activity (called on user interaction)
 */
export function updateSessionActivity() {
  const session = getSession();
  if (!session) return;
  
  session.lastActivityTime = Date.now();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get remaining session time in milliseconds
 * @returns {number} Milliseconds remaining in session
 */
export function getSessionTimeRemaining() {
  const session = getSession();
  if (!session) return 0;
  
  const now = Date.now();
  const inactivityRemaining = SESSION_TIMEOUT - (now - session.lastActivityTime);
  const absoluteRemaining = SESSION_ABSOLUTE_TIMEOUT - (now - session.startTime);
  
  // Return the smaller of the two
  return Math.max(0, Math.min(inactivityRemaining, absoluteRemaining));
}

/**
 * End session (logout)
 */
export function endSession() {
  localStorage.removeItem(SESSION_KEY);
  stopSessionMonitoring();
}

/**
 * Generate unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Monitor session activity across tabs
 * Listens for storage changes from other tabs
 */
let monitoringInterval = null;
let warningShown = false;
let sessionExpiredCallback = null;

/**
 * Set callback for when session expires
 * @param {function} callback - Function to call when session expires
 */
export function onSessionExpired(callback) {
  sessionExpiredCallback = callback;
}

function startSessionMonitoring() {
  if (monitoringInterval) return;
  
  // Check session validity every minute
  monitoringInterval = setInterval(() => {
    if (!isSessionActive()) {
      stopSessionMonitoring();
      
      if (sessionExpiredCallback) {
        sessionExpiredCallback();
      }
      
      endSession();
      console.warn("User session has expired");
    } else {
      // Show warning at 5 minutes remaining
      const remaining = getSessionTimeRemaining();
      if (remaining < 5 * 60 * 1000 && !warningShown) {
        warningShown = true;
        console.warn(`Session expiring in ${Math.ceil(remaining / 1000)} seconds`);
        
        // Emit custom event for UI to show warning
        window.dispatchEvent(new CustomEvent("sessionExpiringWarning", {
          detail: { secondsRemaining: Math.ceil(remaining / 1000) }
        }));
      }
    }
  }, 60000); // Check every minute
  
  // Listen for storage changes from other tabs
  window.addEventListener("storage", handleStorageChange);
}

function stopSessionMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  window.removeEventListener("storage", handleStorageChange);
  warningShown = false;
}

function handleStorageChange(e) {
  // If session was removed from another tab, logout here too
  if (e.key === SESSION_KEY && e.newValue === null) {
    endSession();
    window.dispatchEvent(new CustomEvent("sessionTerminatedFromOtherTab"));
  }
}

/**
 * Auto-logout after inactivity
 * Attach to window for global activity tracking
 */
export function enableAutoActivityTracking() {
  const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
  
  const updateActivity = () => {
    updateSessionActivity();
  };
  
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
}

/**
 * Get session info for debugging
 * @returns {object} Session information
 */
export function getSessionInfo() {
  const session = getSession();
  if (!session) return { active: false };
  
  const remaining = getSessionTimeRemaining();
  const now = Date.now();
  
  return {
    active: isSessionActive(),
    username: session.username,
    sessionId: session.id,
    startTime: new Date(session.startTime),
    lastActivityTime: new Date(session.lastActivityTime),
    totalElapsed: now - session.startTime,
    inactivityElapsed: now - session.lastActivityTime,
    sessionTimeRemaining: remaining,
    sessionTimeRemainingMinutes: Math.ceil(remaining / 60000)
  };
}
