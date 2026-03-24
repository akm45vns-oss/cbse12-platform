/**
 * Input Validation & Sanitization
 * Prevents XSS, injection attacks, and malicious input
 */

export function sanitizeInput(input) {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 500); // Limit length
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUsername(username) {
  // Only alphanumeric, dots, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
  return usernameRegex.test(username);
}

export function preventXSS(html) {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

export function validateInput(value, type = "text") {
  const sanitized = sanitizeInput(value);

  switch (type) {
    case "email":
      if (!validateEmail(sanitized)) {
        return { isValid: false, error: "Invalid email address" };
      }
      break;

    case "password":
      if (sanitized.length < 8) {
        return { isValid: false, error: "Password too short" };
      }
      break;

    case "text":
      if (sanitized.length < 2) {
        return { isValid: false, error: "Input too short" };
      }
      break;

    case "number":
      if (isNaN(sanitized)) {
        return { isValid: false, error: "Must be a number" };
      }
      break;
  }

  return { isValid: true, value: sanitized };
}

export function escapeHTML(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function validateAndSanitize(data, schema) {
  const result = {};
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && !value) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Sanitize
    result[field] = sanitizeInput(value || "");

    // Validate type
    if (rules.type === "email" && !validateEmail(result[field])) {
      errors[field] = "Invalid email format";
    }

    if (rules.type === "username" && !validateUsername(result[field])) {
      errors[field] = "Invalid username (3-20 alphanumeric characters)";
    }

    if (rules.maxLength && result[field].length > rules.maxLength) {
      errors[field] = `${field} exceeds maximum length of ${rules.maxLength}`;
    }

    if (rules.minLength && result[field].length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    data: result,
    errors
  };
}
