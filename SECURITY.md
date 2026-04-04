# Security Guide (Current State)

This document summarizes the security controls currently implemented in this repository.

## Implemented Today

### Authentication Hardening
- Password hashing and verification use bcrypt via bcryptjs.
- Password strength checks enforce length, mixed case, numbers, symbols, and repeated-character rules.
- Login flow enforces temporary account lockout after repeated failures.

Main files:
- src/utils/auth.js
- src/utils/passwordValidation.js
- src/utils/rateLimiting.js
- src/hooks/useAuth.js

### Account Lockout Policy
- Max failed attempts: 5
- Lockout duration: 15 minutes
- Attempt reset window: 1 hour
- Remaining time is surfaced in login error messaging

### OTP Verification Flows
- Registration requires OTP verification before account creation.
- Password reset requires OTP verification before password update.

### Session Tracking
- Study sessions are tracked in localStorage for analytics/progress features.
- This is not an inactivity auto-logout security control.

Main file:
- src/utils/sessionTracking.js

## Not Currently Implemented as Runtime Modules

The following previously documented modules are not present in the current codebase:

- src/utils/inputSanitization.js
- src/utils/csrfProtection.js
- src/utils/sessionManagement.js
- src/utils/securityAuditLog.js

References to these modules in old documentation are historical and not active implementation.

## Environment and Secret Handling

- Keep keys in .env/.env.local files.
- Ensure .env files are not committed.
- Review production deployment settings for secret management.

## Practical Security Tests

1. Registration rejects weak passwords.
2. Five consecutive failed logins trigger lockout.
3. Successful login clears attempt counters.
4. Registration does not complete without OTP verification.
5. Password reset does not complete without OTP verification.

## Recommended Next Improvements

1. Add centralized input sanitization utilities and apply them across form handlers.
2. Add CSRF protections for state-changing requests.
3. Add centralized audit/security event logging.
4. Add server-side rate-limiting and lockout safeguards.

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- bcryptjs: https://github.com/dcodeIO/bcrypt.js

Last Updated: April 2, 2026
Status: Aligned with current repository state
