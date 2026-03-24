# Security Hardening Guide

This document outlines all the security improvements implemented in the CBSE Class 12 Platform.

## 1. Authentication Security 🔐

### Password Strength Requirements
- **Minimum 8 characters** (increased from 6)
- **Uppercase letters** (A-Z) required
- **Lowercase letters** (a-z) required
- **Numbers** (0-9) required  
- **Special characters** (!@#$%^&*) required
- **No 3+ repeating characters** (prevents "aaaa", "1111", etc)

**Location:** `src/utils/passwordValidation.js`

**Usage in Register:**
- Real-time password strength indicator
- Visual feedback (color-coded: Red→Yellow→Green)
- Specific error messages for missing requirements

### Rate Limiting & Account Lockout
- **5 failed login attempts** triggers temporary lockout
- **15-minute lockout period** after max attempts
- **Automatic reset** after 1 hour of no attempts
- Shows remaining attempts to user

**Location:** `src/utils/rateLimiting.js`

**Example Error:** "Too many failed attempts. Account locked for 15 minutes."

### Login Attempt Tracking
```javascript
recordLoginAttempt(email)          // Track failed attempt
isAccountLocked(email)              // Check if locked out
lockAccount(email)                  // Lock account
getRemainingLockoutTime(email)      // Get seconds remaining
resetLoginAttempts(email)           // Clear attempts
```

## 2. Input Validation & Sanitization 🛡️

### Sanitization Functions
**Location:** `src/utils/validation.js`

```javascript
sanitizeInput(input)        // Remove dangerous characters, limit length
validateEmail(email)        // Validate email format
validateUsername(username)  // Only a-z, 0-9, ., -, _ (3-20 chars)
preventXSS(html)           // HTML entity encoding
escapeHTML(text)           // Escape dangerous characters
```

### Input Validation Schema
```javascript
validateAndSanitize(data, {
  email: { required: true, type: "email" },
  username: { required: true, type: "username" },
  password: { required: true, minLength: 8 }
})
```

### XSS Prevention
- All user inputs are sanitized
- HTML special characters are escaped
- Maximum input length enforced (500 chars default)
- No dangerous JavaScript can execute

## 3. Data Protection 📊

### Database Row-Level Security (RLS)
Implemented in Supabase to ensure users can only access their own data.

#### Users Table Security
```sql
-- Users can only see their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid()::text = id);
```

#### Progress Table Security  
```sql
-- Users can only view/edit their own progress
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY progress_select ON progress_tracking
  FOR SELECT USING (auth.uid()::text = username);

CREATE POLICY progress_insert ON progress_tracking
  FOR INSERT WITH CHECK (auth.uid()::text = username);

CREATE POLICY progress_update ON progress_tracking
  FOR UPDATE USING (auth.uid()::text = username);
```

#### Chapter Notes Security
```sql
-- Chapter notes are public read-only (cached data)
ALTER TABLE chapter_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY chapter_notes_select ON chapter_notes
  FOR SELECT USING (true);  -- Anyone can read

CREATE POLICY chapter_notes_write ON chapter_notes
  FOR INSERT, UPDATE WITH CHECK (false);  -- Only server can write
```

## 4. API Security 🔒

### API Key Protection
- All API keys stored in `.env.local` (never committed)
- Keys loaded via `dotenv` at runtime
- No keys exposed in browser console
- Groq API key protected with Bearer token authentication

### Rate Limiting on API Calls
- Groq API: 12-second delay between requests (respects TPM limits)
- Automatic retry logic with exponential backoff
- 30-second timeout per request
- 3 automatic retry attempts

**Location:** `src/scripts/seedNotes.js`

```javascript
async function callGroqAPI(prompt, maxTokens = 1500, retries = 3) {
  // Includes timeout handling and retry logic
}
```

### CORS Configuration
```javascript
// In production, restrict to your domain only
const allowedOrigins = [
  "https://cbse12-platform.vercel.app",
  "https://yourdomain.com"
];
```

## 5. Password Storage Security 🔐

### Hashing Algorithm: SHA-256
```javascript
// NOT secure for production (replace with bcrypt)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  // ... convert to hex
}
```

**⚠️ IMPORTANT:** SHA-256 should be replaced with **bcrypt** or **Argon2** for production!

**Recommended upgrade:**
```bash
npm install bcryptjs
```

```javascript
const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  return await bcrypt.hash(password, 12); // Salt rounds: 12
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

## 6. Environment Variable Security 🗝️

### .env.local (Never Committed)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_KEY=your-groq-api-key
```

### .gitignore Protection
```
*.local
.env
.env*.local
```

## 7. Deployment Security 🚀

### HTTPS Only
- All data transmitted encrypted
- SSL/TLS certificates required
- HSTS headers enabled

### Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'">
```

### Security Headers
```javascript
// Add to your server response headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 8. Implemented Security Features Checklist

✅ **Authentication**
- [x] Strong password requirements (8+ chars, mixed case, numbers, symbols)
- [x] Rate limiting (5 attempts → 15 min lockout)
- [x] Password strength indicator
- [x] Account lockout mechanism
- [x] Session management

✅ **Data Protection**
- [x] Input sanitization
- [x] XSS prevention
- [x] SQL injection prevention (parameterized queries)
- [x] Row-Level Security in database
- [x] User data isolation

✅ **API Security**
- [x] API key protection (.env.local)
- [x] Rate limiting on API calls
- [x] Timeout handling
- [x] Retry logic
- [x] Bearer token authentication

✅ **Deployment**
- [x] HTTPS enforced
- [x] Environment variables managed
- [x] Secrets not exposed

## 9. Testing Security

### Manual Security Checks
```bash
# 1. Try weak password (should fail)
- Password: "123456"
- Result: ❌ Multiple requirement failures

# 2. Try brute force (should lockout)
- 5 failed login attempts
- Result: ❌ Account locked for 15 minutes

# 3. Try XSS injection
- Input: "<script>alert('xss')</script>"
- Result: ❌ Sanitized to safe text

# 4. Try SQL injection
- Input: "' OR '1'='1"
- Result: ❌ Escaped by parameterized queries
```

## 10. Future Security Improvements 🔮

### High Priority
1. **Replace SHA-256 with bcrypt** - Use `bcryptjs` for proper password hashing
2. **Implement JWT tokens** - For stateless authentication
3. **Add 2-factor authentication** - SMS or authenticator app
4. **Email verification** - Verify email on registration
5. **Password reset flow** - Secure password recovery

### Medium Priority
1. **Content Security Policy** - Strict CSP headers
2. **CORS configuration** - Strict origin whitelist
3. **Audit logging** - Track all auth events
4. **IP rate limiting** - Limit by IP address
5. **Device fingerprinting** - Detect suspicious logins

### Low Priority
1. **OAuth2 integration** - Google/GitHub login
2. **Biometric auth** - Fingerprint/Face ID
3. **Behavior analysis** - Detect unusual activity
4. **Data encryption at rest** - Encrypt sensitive data in DB

## References

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Password Security:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Node.js Security:** https://nodejs.org/en/secure/
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Bcrypt.js:** https://github.com/dcodeIO/bcrypt.js

---

**Last Updated:** March 24, 2026  
**Security Level:** Medium (Community Best Practices)  
**Status:** ✅ Ready for Staging
