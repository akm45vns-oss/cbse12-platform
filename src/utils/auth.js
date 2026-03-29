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
