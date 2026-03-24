/**
 * Security Configuration & Headers
 * Add these to your server/deployment configuration
 */

// ============================================================
// 1. CORS CONFIGURATION
// ============================================================

export const CORS_CONFIG = {
  // Allowed origins - restrict in production
  allowedOrigins: [
    "http://localhost:3000",      // Local development
    "http://localhost:5173",      // Vite dev server
    "https://cbse12-platform.vercel.app",  // Production
    "https://yourdomain.com",
  ],

  // Allowed HTTP methods
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
  ],

  // Expose these headers to client
  exposedHeaders: ["X-Request-Id", "X-Response-Time"],

  // Allow credentials (cookies, auth headers)
  credentials: true,

  // Max cache time for preflight requests (seconds)
  maxAge: 86400,
};

// ============================================================
// 2. SECURITY HEADERS
// ============================================================

export const SECURITY_HEADERS = {
  // Prevent browsers from MIME-sniffing
  "X-Content-Type-Options": "nosniff",

  // Prevent framing (clickjacking protection)
  "X-Frame-Options": "DENY",

  // XSS Protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // HSTS - Force HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Content Security Policy
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.groq.com https://*.supabase.co; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'",

  // Permissions Policy (formerly Feature Policy)
  "Permissions-Policy":
    "geolocation=(), " +
    "microphone=(), " +
    "camera=(), " +
    "payment=(), " +
    "usb=(), " +
    "magnetometer=(), " +
    "gyroscope=(), " +
    "accelerometer=()",
};

// ============================================================
// 3. API RATE LIMITING CONFIG
// ============================================================

export const RATE_LIMIT_CONFIG = {
  // Login endpoint
  login: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per window
    message: "Too many login attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Register endpoint
  register: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 registrations per day per IP
    message: "Too many accounts created, please try again later",
  },

  // General API
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: "Too many requests, please try again later",
  },

  // Upload endpoint
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: "Too many uploads, please try again later",
  },
};

// ============================================================
// 4. FILE UPLOAD SECURITY
// ============================================================

export const FILE_UPLOAD_CONFIG = {
  // Max file size (10MB)
  maxSize: 10 * 1024 * 1024,

  // Allowed file types
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  // Allowed file extensions
  allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"],

  // Scan for malware (if integrated)
  scanForMalware: true,

  // Store in secure directory
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
};

// ============================================================
// 5. SESSION SECURITY
// ============================================================

export const SESSION_CONFIG = {
  // Session timeout (30 minutes in milliseconds)
  timeout: 30 * 60 * 1000,

  // Refresh interval (every 15 minutes)
  refreshInterval: 15 * 60 * 1000,

  // Use secure cookies only
  secure: process.env.NODE_ENV === "production",

  // HttpOnly prevents JavaScript access to cookie
  httpOnly: true,

  // SameSite prevents CSRF
  sameSite: "Strict",

  // Regenerate session ID on login
  regenerate: true,
};

// ============================================================
// 6. PASSWORD POLICY
// ============================================================

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  expiryDays: 90,
  historyCount: 5, // Prevent reusing last 5 password
};

// ============================================================
// 7. LOGIN SECURITY
// ============================================================

export const LOGIN_SECURITY = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTimeoutMinutes: 30,
  requirePasswordReset: false,
  requireEmailVerification: true,
  twoFactorEnabled: false,
};

// ============================================================
// 8. EXAMPLE: Adding Security Headers in Express.js
// ============================================================

/*
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// Add security headers
app.use(helmet());

// Set additional headers
app.use((req, res, next) => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

// CORS configuration
app.use(cors(CORS_CONFIG));

// Rate limiting
const loginLimiter = rateLimit(RATE_LIMIT_CONFIG.login);
const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.api);

app.post('/api/login', loginLimiter, (req, res) => {
  // Handle login
});

app.use('/api/', generalLimiter);

app.listen(3000);
*/

// ============================================================
// 9. EXAMPLE: Adding to Vercel (Next.js)
// ============================================================

/*
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
*/

// ============================================================
// 10. VALIDATION UTILITIES
// ============================================================

export function validateOrigin(origin) {
  return CORS_CONFIG.allowedOrigins.includes(origin);
}

export function isSecureConnection(protocol) {
  return protocol === "https" || process.env.NODE_ENV === "development";
}

export function sanitizeHeaderValue(value) {
  // Remove newlines and carriage returns to prevent header injection
  return String(value).replace(/[\r\n]/g, "");
}

export function getCORSHeaders(origin) {
  if (validateOrigin(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": CORS_CONFIG.allowedMethods.join(","),
      "Access-Control-Allow-Headers": CORS_CONFIG.allowedHeaders.join(","),
      "Access-Control-Expose-Headers": CORS_CONFIG.exposedHeaders.join(","),
      "Access-Control-Allow-Credentials": CORS_CONFIG.credentials,
      "Access-Control-Max-Age": CORS_CONFIG.maxAge,
    };
  }
  return {};
}

// ============================================================
// 11. ENCRYPTION UTILITIES (Optional)
// ============================================================

export async function encryptSensitiveData(plaintext, encryptionKey) {
  // Example with Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: iv, iterations: 100000, hash: "SHA-256" },
    await crypto.subtle.importKey("raw", encoder.encode(encryptionKey), "PBKDF2", false, ["deriveKey"]),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    data
  );

  // Return iv + encrypted data as base64
  return (
    Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("") +
    Array.from(new Uint8Array(encrypted)).map((b) => b.toString(16).padStart(2, "0")).join("")
  );
}

// ============================================================
// EXPORT ALL CONFIGS
// ============================================================

export const SECURITY_CONFIG = {
  CORS_CONFIG,
  SECURITY_HEADERS,
  RATE_LIMIT_CONFIG,
  FILE_UPLOAD_CONFIG,
  SESSION_CONFIG,
  PASSWORD_POLICY,
  LOGIN_SECURITY,
};

export default SECURITY_CONFIG;
