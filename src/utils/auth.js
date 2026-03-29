import bcrypt from 'bcryptjs';

// ===== PASSWORD HASHING =====
// Using bcryptjs for secure password hashing with salt
// Cost factor: 12 (provides good balance between security and performance)
export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify a password against its bcrypt hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * BACKWARD COMPATIBILITY: Create old SHA-256 hash for existing users
 * @param {string} password - Plain text password
 * @returns {string} SHA-256 hex hash
 * @private
 */
export function createSHA256Hash(password) {
  const enc = new TextEncoder();
  const hashBuffer = crypto.subtle.digest("SHA-256", enc.encode(password));
  return hashBuffer.then(buf => 
    Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Check if a hash is bcrypt (starts with $2a$, $2b$, or $2y$)
 * @param {string} hash - Hash to check
 * @returns {boolean} True if hash is bcrypt
 */
export function isBcryptHash(hash) {
  return /^\$2[aby]\$/.test(hash);
}

// ===== VALIDATION HELPERS =====
export function validateUsername(username) {
  const u = username.trim().toLowerCase();
  if (!u) return "Username is required";
  if (u.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-z0-9_.@#$!\-]+$/.test(u)) return "Username: only letters, numbers, and allowed symbols (._@#$!-)";
  return null;
}

export function validatePassword(password, confirmPassword = null) {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (confirmPassword && password !== confirmPassword) return "Passwords do not match";
  return null;
}
