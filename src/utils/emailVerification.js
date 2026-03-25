/**
 * Email Verification OTP System
 * Generates and verifies 6-digit OTP codes
 */

/**
 * Generate random 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculate expiration time (10 minutes from now)
 */
export function getOTPExpiration() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now.toISOString();
}

/**
 * Check if OTP is still valid
 */
export function isOTPExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}
