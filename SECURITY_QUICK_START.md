# Security Quick Reference (Current)

This quick reference matches the current repository state.

## Active Security Modules

- src/utils/auth.js
  - bcrypt password hashing and verification
  - legacy SHA-256 compatibility helper
- src/utils/passwordValidation.js
  - strong password policy checks
  - strength scoring for UX feedback
- src/utils/rateLimiting.js
  - failed-login tracking
  - temporary account lockout logic
- src/hooks/useAuth.js
  - integrates lockout checks and counters
  - OTP-first registration flow
  - OTP-verified password reset flow

## Current Lockout Policy

- Max failed attempts: 5
- Lockout duration: 15 minutes
- Attempt reset window: 1 hour

The lockout state is currently client-side (localStorage-based).

## Fast Validation Checklist

1. Run app and attempt 5 failed logins for one account identifier.
2. Confirm lockout message appears with remaining time.
3. Wait for lockout expiry and confirm login can be retried.
4. Register a new user and verify OTP is required before account creation.
5. Run forgot-password flow and verify OTP is required before reset.

## Security Imports That Should Work Today

```javascript
import { hashPassword, verifyPassword, isBcryptHash } from "@/utils/auth";
import { validatePasswordStrength } from "@/utils/passwordValidation";
import {
  recordLoginAttempt,
  isAccountLocked,
  lockAccount,
  getRemainingLockoutTime,
  resetLoginAttempts,
  SECURITY_CONFIG,
} from "@/utils/rateLimiting";
```

## Removed Modules (Do Not Import)

These files were removed and are not part of the runtime codebase:

- src/utils/inputSanitization.js
- src/utils/csrfProtection.js
- src/utils/sessionManagement.js
- src/utils/securityAuditLog.js

## Common Mistakes to Avoid

- Do not add hardcoded API keys in source files.
- Do not bypass validatePasswordStrength during registration/reset.
- Do not skip resetLoginAttempts after successful login.
- Do not assume client-side lockout alone is sufficient for high-security environments.

## Next Security Upgrades Recommended

1. Reintroduce centralized input sanitization utilities.
2. Add CSRF protections for state-changing requests.
3. Add centralized audit/security event logging.
4. Add server-side rate limits and lockout enforcement.

## Related Docs

1. SECURITY_HARDENING.md
2. SECURITY.md

Last Updated: April 2, 2026
