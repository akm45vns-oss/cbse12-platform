/**
 * keyPool.js — Groq API Key Pool
 *
 * Manages 5 Groq keys with:
 * - Health scoring (0–100)
 * - Round-robin + health-weighted selection
 * - Per-key concurrency limiting (max 2 simultaneous requests)
 * - Rate-limit (429) detection → cooldown with exponential backoff
 * - 401 detection → permanent disable for session
 * - waitForAvailableKey() for non-blocking async access
 */

import * as dotenv from "dotenv";
dotenv.config();

const MAX_CONCURRENT_PER_KEY = 2;
const BASE_COOLDOWN_MS = 65_000;        // 65s initial cooldown after 429
const MAX_COOLDOWN_MS  = 600_000;       // 10 min max cooldown
const HEALTH_BOOST     = 5;            // health gained on success
const HEALTH_PENALTY   = 20;           // health lost on 429
const HEALTH_INIT      = 100;
const WAIT_POLL_MS     = 300;          // polling interval for waitForAvailableKey
const WAIT_TIMEOUT_MS  = 120_000;      // 2 min max wait

// Load all 5 keys
const RAW_KEYS = [
  process.env.VITE_GROQ_KEY_1,
  process.env.VITE_GROQ_KEY_2,
  process.env.VITE_GROQ_KEY_3,
  process.env.VITE_GROQ_KEY_4,
  process.env.VITE_GROQ_KEY_5,
].filter(Boolean);

if (RAW_KEYS.length === 0) {
  throw new Error("No Groq keys found. Add VITE_GROQ_KEY_1…VITE_GROQ_KEY_5 to .env");
}

// Key state objects
const keyStates = RAW_KEYS.map((key, idx) => ({
  index: idx,
  key,
  health: HEALTH_INIT,       // 0–100
  active: 0,                 // concurrent requests in flight
  disabled: false,           // permanently disabled (401)
  cooldownUntil: 0,          // epoch ms — key is off-limits until this time
  failureCount: 0,           // consecutive failures (for exponential backoff)
  totalRequests: 0,
  totalSuccesses: 0,
  totalFailures: 0,
}));

// Round-robin cursor
let rrCursor = 0;

/**
 * Returns true if the key is currently available for a new request.
 */
function isAvailable(state) {
  if (state.disabled) return false;
  if (Date.now() < state.cooldownUntil) return false;
  if (state.active >= MAX_CONCURRENT_PER_KEY) return false;
  return true;
}

/**
 * Select the healthiest available key using round-robin with health weighting.
 * Returns null if no key is available right now.
 */
export function getAvailableKey() {
  const available = keyStates.filter(isAvailable);
  if (available.length === 0) return null;

  // Start from round-robin cursor, pick highest health among available
  available.sort((a, b) => b.health - a.health);
  const chosen = available[0];

  // Advance cursor
  rrCursor = (chosen.index + 1) % keyStates.length;
  return chosen;
}

/**
 * Wait until an available key appears (polls every WAIT_POLL_MS).
 * Rejects if no key becomes available within WAIT_TIMEOUT_MS.
 */
export function waitForAvailableKey() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + WAIT_TIMEOUT_MS;

    const poll = () => {
      const k = getAvailableKey();
      if (k) return resolve(k);
      if (Date.now() > deadline) {
        return reject(new Error("Key pool timeout — no key became available within 2 minutes"));
      }
      setTimeout(poll, WAIT_POLL_MS);
    };

    poll();
  });
}

/**
 * Mark key as in-use before making a request.
 */
export function acquireKey(state) {
  state.active += 1;
  state.totalRequests += 1;
}

/**
 * Release key and record success.
 */
export function releaseSuccess(state) {
  state.active = Math.max(0, state.active - 1);
  state.totalSuccesses += 1;
  state.failureCount = 0;
  state.health = Math.min(HEALTH_INIT, state.health + HEALTH_BOOST);
}

/**
 * Release key and record failure.
 * @param {object} state
 * @param {number} statusCode — HTTP status (429, 401, 5xx, etc.)
 */
export function releaseFailure(state, statusCode) {
  state.active = Math.max(0, state.active - 1);
  state.totalFailures += 1;
  state.failureCount += 1;

  if (statusCode === 401) {
    state.disabled = true;
    state.health = 0;
    console.warn(`[KeyPool] Key #${state.index + 1} permanently disabled (401 Unauthorized)`);
    return;
  }

  if (statusCode === 429) {
    // Exponential backoff: 65s * 2^(failureCount - 1), capped at 10m
    const cooldown = Math.min(
      BASE_COOLDOWN_MS * Math.pow(2, state.failureCount - 1),
      MAX_COOLDOWN_MS
    );
    state.cooldownUntil = Date.now() + cooldown;
    state.health = Math.max(0, state.health - HEALTH_PENALTY);
    const cooldownSec = Math.round(cooldown / 1000);
    console.warn(`[KeyPool] Key #${state.index + 1} rate-limited — cooldown ${cooldownSec}s (health: ${state.health})`);
    return;
  }

  // Generic failure — small health penalty
  state.health = Math.max(0, state.health - 10);
}

/**
 * Get a snapshot of all key statuses for monitoring/UI.
 */
export function getKeyStatus() {
  return keyStates.map(s => ({
    index: s.index,
    health: s.health,
    active: s.active,
    disabled: s.disabled,
    cooldownRemainingMs: Math.max(0, s.cooldownUntil - Date.now()),
    totalRequests: s.totalRequests,
    totalSuccesses: s.totalSuccesses,
    totalFailures: s.totalFailures,
    isAvailable: isAvailable(s),
  }));
}

/**
 * Print a compact status table to the console.
 */
export function printKeyStatus() {
  const rows = getKeyStatus().map(s => {
    const bar = "█".repeat(Math.floor(s.health / 10)) + "░".repeat(10 - Math.floor(s.health / 10));
    const coolSec = s.cooldownRemainingMs > 0
      ? ` [cooldown ${Math.ceil(s.cooldownRemainingMs / 1000)}s]`
      : "";
    const status = s.disabled ? " [DISABLED]" : coolSec;
    return `  Key ${s.index + 1}  ${bar} ${s.health}%  active:${s.active}  ok:${s.totalSuccesses}  fail:${s.totalFailures}${status}`;
  });
  console.log("\n── API Key Pool ────────────────────────────────");
  rows.forEach(r => console.log(r));
  console.log("────────────────────────────────────────────────\n");
}
