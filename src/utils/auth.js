// ===== PASSWORD HASHING =====
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
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
