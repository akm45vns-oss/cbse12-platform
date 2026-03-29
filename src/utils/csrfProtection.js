/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates CSRF tokens for state-changing operations
 */

const CSRF_TOKEN_KEY = "akmedu_csrf_token";
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure random token
 * @returns {string} CSRF token
 */
function generateRandomToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create CSRF token for current session
 * @returns {string} CSRF token
 */
export function getCSRFToken() {
  const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
  
  if (stored) {
    try {
      const { token, timestamp } = JSON.parse(stored);
      
      // Check if token is still valid
      if (Date.now() - timestamp < CSRF_TOKEN_EXPIRY) {
        return token;
      }
    } catch (e) {
      console.error("Invalid CSRF token stored:", e);
    }
  }
  
  // Generate new token
  const token = generateRandomToken();
  sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify({
    token,
    timestamp: Date.now()
  }));
  
  return token;
}

/**
 * Validate CSRF token from form/request
 * @param {string} token - Token to validate
 * @returns {boolean} Whether token is valid
 */
export function validateCSRFToken(token) {
  if (!token) return false;
  
  const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!stored) return false;
  
  try {
    const { token: storedToken, timestamp } = JSON.parse(stored);
    
    // Check if token matches AND is not expired
    if (token === storedToken && Date.now() - timestamp < CSRF_TOKEN_EXPIRY) {
      return true;
    }
  } catch (e) {
    console.error("Error validating CSRF token:", e);
  }
  
  return false;
}

/**
 * Invalidate current CSRF token (logout/session end)
 */
export function invalidateCSRFToken() {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Add CSRF token to form data
 * @param {FormData|object} formData - Form data to add token to
 * @returns {FormData|object} Form data with CSRF token
 */
export function addCSRFTokenToForm(formData) {
  const token = getCSRFToken();
  
  if (formData instanceof FormData) {
    formData.append("_csrf", token);
  } else if (typeof formData === "object") {
    formData._csrf = token;
  }
  
  return formData;
}

/**
 * Create CSRF header object for API requests
 * @returns {object} Headers with CSRF token
 */
export function getCSRFHeaders() {
  return {
    "X-CSRF-Token": getCSRFToken()
  };
}

/**
 * Validate CSRF token from request
 * Can be called from headers or body
 * @param {string} tokenFromRequest - Token from request (header or body)
 * @returns {boolean} Whether CSRF check passes
 */
export function validateCSRFFromRequest(tokenFromRequest) {
  if (!tokenFromRequest) {
    console.warn("CSRF token missing from request");
    return false;
  }
  
  if (!validateCSRFToken(tokenFromRequest)) {
    console.warn("CSRF token validation failed");
    return false;
  }
  
  return true;
}

/**
 * Middleware-like function to protect API calls
 * @param {function} handler - Request handler
 * @returns {function} Wrapped handler that validates CSRF
 */
export function withCSRFProtection(handler) {
  return async function(req, res) {
    // Get token from headers or body
    const tokenFromRequest = req.headers["x-csrf-token"] || (req.body && req.body._csrf);
    
    if (!validateCSRFFromRequest(tokenFromRequest)) {
      return res.status(403).json({ error: "CSRF validation failed" });
    }
    
    return handler(req, res);
  };
}
