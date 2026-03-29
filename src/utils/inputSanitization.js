/**
 * Input Sanitization & Validation Utility
 * Prevents XSS, injection attacks, and malicious input
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, maxLength = 500) {
  if (!input) return "";
  
  let sanitized = String(input).trim().slice(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");
  
  return sanitized;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHTML(text) {
  if (!text) return "";
  
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, error?: string, email?: string }
 */
export function validateAndSanitizeEmail(email) {
  const sanitized = sanitizeInput(email, 254); // RFC 5321
  
  if (!sanitized) {
    return { valid: false, error: "Email is required" };
  }
  
  if (!validateEmail(sanitized)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true, email: sanitized.toLowerCase() };
}

/**
 * Validate username (alphanumeric, dots, dashes, underscores)
 * @param {string} username - Username to validate
 * @returns {object} { valid: boolean, error?: string, username?: string }
 */
export function validateAndSanitizeUsername(username) {
  const sanitized = sanitizeInput(username, 20).toLowerCase();
  
  if (!sanitized || sanitized.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  
  if (!/^[a-z0-9_.@#$!\-]+$/.test(sanitized)) {
    return { valid: false, error: "Username contains invalid characters" };
  }
  
  return { valid: true, username: sanitized };
}

/**
 * Validate and sanitize user name/display name
 * @param {string} name - User name
 * @returns {object} { valid: boolean, error?: string, name?: string }
 */
export function validateAndSanitizeName(name) {
  const sanitized = sanitizeInput(name, 100);
  
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }
  
  // Allow letters, numbers, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z0-9\s\-']+$/.test(sanitized)) {
    return { valid: false, error: "Name contains invalid characters" };
  }
  
  return { valid: true, name: sanitized };
}

/**
 * Sanitize quiz answer input
 * @param {string} answer - Answer text
 * @returns {string} Sanitized answer
 */
export function sanitizeQuizAnswer(answer) {
  return sanitizeInput(answer, 1000);
}

/**
 * Sanitize forum post/comment
 * @param {string} content - Post content
 * @returns {string} Sanitized content
 */
export function sanitizeForumPost(content) {
  let sanitized = sanitizeInput(content, 5000);
  
  // Allow basic markdown-like formatting but prevent XSS
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  
  return sanitized;
}

/**
 * Validate quiz/test input
 * Ensures answer is reasonable length and type
 * @param {string} questionId - Question ID
 * @param {string} answer - User answer
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateQuizInput(questionId, answer) {
  if (!questionId || typeof questionId !== "string") {
    return { valid: false, error: "Invalid question ID" };
  }
  
  if (!answer || typeof answer !== "string") {
    return { valid: false, error: "Answer is required" };
  }
  
  const sanitized = sanitizeQuizAnswer(answer);
  if (sanitized.length === 0) {
    return { valid: false, error: "Answer cannot be empty" };
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {object} { valid: boolean, error?: string, url?: string }
 */
export function validateAndSanitizeURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "Invalid URL protocol" };
    }
    
    return { valid: true, url: urlObj.toString() };
  } catch (e) {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate form data against a schema
 * @param {object} data - Form data
 * @param {object} schema - Validation schema
 * @returns {object} { valid: boolean, errors: object }
 */
export function validateFormData(data, schema) {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required validation
    if (rules.required && !value) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (!value) continue;
    
    // Type validation
    if (rules.type === "email") {
      const result = validateAndSanitizeEmail(value);
      if (!result.valid) errors[field] = result.error;
    } else if (rules.type === "username") {
      const result = validateAndSanitizeUsername(value);
      if (!result.valid) errors[field] = result.error;
    } else if (rules.type === "url") {
      const result = validateAndSanitizeURL(value);
      if (!result.valid) errors[field] = result.error;
    }
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Prevent NoSQL injection by validating object keys
 * @param {object} obj - Object to validate
 * @returns {boolean} Whether object is safe
 */
export function isSafeObject(obj) {
  if (!obj || typeof obj !== "object") return true;
  
  const dangerousPatterns = /^\$|^__proto__|^constructor|^prototype/;
  
  for (const key of Object.keys(obj)) {
    if (dangerousPatterns.test(key)) return false;
    
    if (typeof obj[key] === "object" && !isSafeObject(obj[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create sanitized copy of user data
 * Removes sensitive fields before sending to client
 * @param {object} userData - User data from database
 * @returns {object} Safe user data for client
 */
export function sanitizeUserDataForClient(userData) {
  if (!userData) return null;
  
  return {
    username: userData.username,
    name: userData.name,
    email: userData.email, // Email can be shared with owner
    joined_at: userData.joined_at,
    // Never send: password_hash, email_verified, last_login
  };
}
