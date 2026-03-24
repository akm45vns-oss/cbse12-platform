/**
 * Rate Limiting Utility
 * Prevents brute force attacks with login attempt tracking
 */

const ATTEMPT_KEY = "login_attempts";
const LOCKOUT_KEY = "login_lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const ATTEMPT_RESET_TIME = 60 * 60 * 1000; // 1 hour in ms

export function recordLoginAttempt(email) {
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "{}");

  // Initialize or reset old attempts
  if (!attempts[email] || now - attempts[email].timestamp > ATTEMPT_RESET_TIME) {
    attempts[email] = {
      count: 0,
      timestamp: now,
      history: []
    };
  }

  attempts[email].count += 1;
  attempts[email].history.push(now);
  attempts[email].history = attempts[email].history.slice(-MAX_ATTEMPTS);

  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempts));

  return attempts[email].count;
}

export function isAccountLocked(email) {
  const now = Date.now();
  const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");

  if (!lockout[email]) return false;

  // Check if lockout has expired
  if (now - lockout[email] > LOCKOUT_DURATION) {
    delete lockout[email];
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockout));
    return false;
  }

  return true;
}

export function lockAccount(email) {
  const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");
  lockout[email] = Date.now();
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockout));
}

export function getLoginAttempts(email) {
  const attempts = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "{}");
  if (!attempts[email]) return 0;
  return attempts[email].count;
}

export function getRemainingLockoutTime(email) {
  const now = Date.now();
  const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");

  if (!lockout[email]) return 0;

  const elapsed = now - lockout[email];
  const remaining = Math.max(0, LOCKOUT_DURATION - elapsed);

  return Math.ceil(remaining / 1000); // Return seconds
}

export function resetLoginAttempts(email) {
  const attempts = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "{}");
  delete attempts[email];
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempts));
}

export function clearAllLockouts() {
  localStorage.removeItem(LOCKOUT_KEY);
}

export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: MAX_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES: LOCKOUT_DURATION / 60 / 1000,
  ATTEMPT_RESET_HOURS: ATTEMPT_RESET_TIME / 60 / 60 / 1000
};
