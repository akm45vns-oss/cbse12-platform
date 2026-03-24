/**
 * Password Validation & Security Utilities
 * Enforces strong password requirements
 */

export function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&* etc)");
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password cannot contain more than 2 repeating characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculateStrength(password)
  };
}

function calculateStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(password)) strength += 20;
  if (!/(.)\1{2,}/.test(password)) strength += 5;

  if (strength >= 90) return { level: "Very Strong", color: "#16a34a", percent: 100 };
  if (strength >= 70) return { level: "Strong", color: "#22c55e", percent: 85 };
  if (strength >= 50) return { level: "Moderate", color: "#eab308", percent: 60 };
  if (strength >= 30) return { level: "Weak", color: "#f97316", percent: 40 };
  return { level: "Very Weak", color: "#ef4444", percent: 20 };
}

export function generatePasswordHint() {
  return "Use 8+ chars, uppercase, lowercase, numbers, and special characters (!@#$%^&*)";
}
