# Security Quick Reference

## 🚀 Installation & Setup (5 minutes)

### Step 1: Add New Utilities
All files created and ready:
- ✅ `src/utils/inputSanitization.js` 
- ✅ `src/utils/csrfProtection.js`
- ✅ `src/utils/sessionManagement.js`
- ✅ `src/utils/securityAuditLog.js`

### Step 2: Integrate Auth Updates
Update `src/hooks/useAuth.js`:

```javascript
import { logLoginAttempt, logAccountLocked } from "@/utils/securityAuditLog";

// In doLogin() - After login attempt
if (loginErr) {
  logLoginAttempt(u, false, loginErr);  // Add this line
  if (remaining <= 0) {
    logAccountLocked(u, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS);  // Add this
  }
}

// After successful login
if (!loginErr) {
  logLoginAttempt(u, true);  // Add this line
}
```

### Step 3: Integrate Session Management  
Update `src/App.jsx`:

```javascript
import { initializeSession, enableAutoActivityTracking } from "@/utils/sessionManagement";

useEffect(() => {
  if (auth.currentUser) {
    initializeSession(auth.currentUser);
    enableAutoActivityTracking();
  }
}, [auth.currentUser]);
```

### Step 4: Test Security
```bash
npm run dev
# Try:
# 1. Login with 5 wrong passwords → should lock
# 2. Type <script> in form → should be sanitized
# 3. Wait 30 min inactive → should logout
# 4. Check browser console → should see audit logs
```

---

## 📋 Component Integration Checklist

### AuthView.jsx
- [ ] Import `validateAndSanitizeEmail`, `validateAndSanitizeUsername`
- [ ] Replace current validation with sanitization functions
- [ ] Add CSRF token to login form

### ProfileView.jsx  
- [ ] Import `validateAndSanitizeName`
- [ ] Sanitize name before update
- [ ] Import `logPasswordChange`
- [ ] Log password changes

### ForumModal.jsx
- [ ] Import `sanitizeForumPost`
- [ ] Sanitize all forum posts before submitting
- [ ] Import `logDataModification`
- [ ] Log forum modifications

### Any Form Component
- [ ] Add `addCSRFTokenToForm()` or `getCSRFHeaders()`  
- [ ] Sanitize all user inputs before submit
- [ ] Validate all inputs

---

## 🔐 Security API Reference

### Input Validation (Most Common)
```javascript
import { 
  sanitizeInput,           // Strip dangerous chars
  validateAndSanitizeEmail,// Full email validation
  validateAndSanitizeUsername, // Username check
  escapeHTML              // HTML entity encode
} from "@/utils/inputSanitization";

// Usage
const { valid, error, email } = validateAndSanitizeEmail(userInput);
```

### Session Management (On Login)
```javascript
import { 
  initializeSession,
  enableAutoActivityTracking,
  onSessionExpired,
  getSessionInfo
} from "@/utils/sessionManagement";

initializeSession(username);
enableAutoActivityTracking();
onSessionExpired(() => doLogout());
```

### Audit Logging (Critical Operations)
```javascript
import { 
  logLoginAttempt,
  logPasswordChange,
  logSuspiciousActivity
} from "@/utils/securityAuditLog";

logLoginAttempt(username, success, reason);
logPasswordChange(username, success);
```

### CSRF Protection (Forms)
```javascript
import { 
  getCSRFToken,
  addCSRFTokenToForm,
  getCSRFHeaders
} from "@/utils/csrfProtection";

// In form
addCSRFTokenToForm(formData);

// In fetch
headers: getCSRFHeaders()
```

---

## ⚠️ Common Security Mistakes (AVOID)

❌ **DON'T:**
```javascript
// ❌ No sanitization
const post = userInput;  // RAW INPUT

// ❌ No CSRF protection
fetch("/api/action", { body: JSON.stringify(data) });

// ❌ No session timeout
localStorage.setItem("user", username);  // Never times out

// ❌ Weak hashing
const hash = btoa(password);  // BASE64 is not hashing!

// ❌ Hardcoded API keys
const GROQ_KEY = "gsk_xxx";  // EXPOSED!

// ❌ No input validation
element.innerHTML = userInput;  // XSS VULNERABILITY

// ❌ No error details
throw new Error("Database error: " + dbError.message);  // Leaks internals
```

✅ **DO:**
```javascript
// ✅ Always sanitize
import { sanitizeForumPost } from "@/utils/inputSanitization";
const post = sanitizeForumPost(userInput);

// ✅ Use CSRF tokens
import { addCSRFTokenToForm } from "@/utils/csrfProtection";
addCSRFTokenToForm(formData);

// ✅ Enable session timeout  
import { initializeSession } from "@/utils/sessionManagement";
initializeSession(username);

// ✅ Never expose sensitive data
throw new Error("Action failed");  // Generic message to user

// ✅ Always use environment variables
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;  // From .env

// ✅ Use textContent, not innerHTML
element.textContent = userInput;  // Safe

// ✅ Log security events
import { logSuspiciousActivity } from "@/utils/securityAuditLog";
logSuspiciousActivity("Unusual pattern detected");
```

---

## 🛡️ Priority Order for Implementation

### Critical (Do First)
1. ✅ Input sanitization in forms → Prevents immediate XSS
2. ✅ CSRF tokens → Prevents state-changing attacks
3. ✅ Session timeout → Prevents session hijacking
4. ✅ Audit logging → Forensics & compliance

### Important (Do Second)
5. Integrate into all components
6. Add security headers
7. Backend CSRF validation
8. Test all security features

### Nice-to-Have (Do Later)
9. 2FA/MFA
10. Rate limiting improvements
11. Advanced monitoring
12. Threat detection

---

## 🔍 Testing Your Security

### Manual Testing
```javascript
// 1. XSS Test - Open browser console
localStorage.setItem("test", "<script>alert('xss')</script>");
// Should see sanitized, not execute alert

// 2. CSRF Test
// Manually create form on external site
// Should fail when posting to your app

// 3. Session Test
// Login, wait 30+ minutes inactive
// Should auto-logout

// 4. Rate Limiting Test
// Try logging in 5 times wrong
// Should lock account
```

### Audit Log Inspection
```javascript
// In console
const logs = JSON.parse(localStorage.getItem("akmedu_audit_log"));
console.table(logs);  // See all security events

// Or use the export function
import { exportAuditLogs } from "@/utils/securityAuditLog";
console.log(exportAuditLogs());
```

### Check Implementation
```javascript
// In any component, this should work:
import { validateAndSanitizeEmail } from "@/utils/inputSanitization";
import { logLoginAttempt } from "@/utils/securityAuditLog";
import { initializeSession } from "@/utils/sessionManagement";
import { getCSRFToken } from "@/utils/csrfProtection";

// All should import without errors
```

---

## 📞 Troubleshooting

### Session expires too quickly
Change `SESSION_TIMEOUT` in `sessionManagement.js`:
```javascript
const SESSION_TIMEOUT = 60 * 60 * 1000;  // 60 minutes
```

### CSRF token not working
Verify you're calling:
```javascript
addCSRFTokenToForm(formData);  // Before submission
// OR
headers: getCSRFHeaders()  // For fetch requests
```

### Audit logs getting too large
Trim old logs:
```javascript
localStorage.removeItem("akmedu_audit_log");
// Starts fresh next time
```

### Inputs not sanitizing
Make sure to use the right function:
```javascript
sanitizeInput()              // Basic sanitization
sanitizeForumPost()         // Forum-specific
sanitizeQuizAnswer()        // Quiz-specific
validateAndSanitizeEmail()  // Full validation + sanitization
```

---

## 📚 Files to Read

1. **Read First:** This file (quick reference)
2. **Implementation Guide:** `SECURITY_HARDENING.md`
3. **Existing Security:** `SECURITY.md` (original guide)
4. **Database Security:** `DATABASE_RLS_SETUP.sql`

---

## ✨ Security Features Summary

| Feature | File | Status |
|---------|------|--------|
| Input Sanitization | `inputSanitization.js` | ✅ Ready |
| CSRF Protection | `csrfProtection.js` | ✅ Ready |
| Session Timeout | `sessionManagement.js` | ✅ Ready |
| Audit Logging | `securityAuditLog.js` | ✅ Ready |
| Rate Limiting | `rateLimiting.js` | ✅ Existing |
| Password Strength | `passwordValidation.js` | ✅ Existing |
| Database RLS | `DATABASE_RLS_SETUP.sql` | ✅ Existing |

---

## 🎯 Success Criteria

You'll know security is implemented when:

- ✅ Form inputs show sanitized (tags stripped)
- ✅ Audit logs track login attempts  
- ✅ Session expires after 30 min inactivity
- ✅ Account locks after 5 wrong passwords
- ✅ CSRF tokens validate on forms
- ✅ No `<script>` tags execute
- ✅ No API keys in network requests
- ✅ All security headers present

---

**Next Steps:** Start with integrating into `useAuth.js`, then work through components one by one.
