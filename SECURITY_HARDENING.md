# Security Hardening Guide (Current Codebase)

This document reflects the security controls that are currently present in the repository.

## Scope

The app currently implements client-side authentication hardening, password quality checks, account lockout protection, and study-session tracking. It does not currently implement dedicated runtime modules for CSRF tokens, centralized audit logs, or standalone input sanitization helpers.

## Active Security Controls

### 1. Password Hashing and Verification
File: src/utils/auth.js

- Uses bcrypt via bcryptjs for password hashing.
- Cost factor is 12 salt rounds.
- Supports hash verification with bcrypt compare.
- Includes SHA-256 compatibility helper for legacy migration support.

Key exports:
- hashPassword(password)
- verifyPassword(password, hash)
- isBcryptHash(hash)
- createSHA256Hash(password)

### 2. Password Strength Policy
File: src/utils/passwordValidation.js

Rules enforced:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Rejects 3+ repeated characters

Used in:
- src/hooks/useAuth.js registration flow
- src/hooks/useAuth.js password reset flow

### 3. Login Rate Limiting and Temporary Lockout
File: src/utils/rateLimiting.js

Behavior:
- Max failed attempts: 5
- Lockout duration: 15 minutes
- Attempt counter reset window: 1 hour
- Storage mechanism: localStorage

Used in:
- src/hooks/useAuth.js doLogin()

Key exports:
- recordLoginAttempt(email)
- isAccountLocked(email)
- lockAccount(email)
- getRemainingLockoutTime(email)
- resetLoginAttempts(email)
- SECURITY_CONFIG

### 4. OTP-Based Account Verification and Password Reset
Primary integration file: src/hooks/useAuth.js

Current flow:
- Registration sends OTP before account creation.
- Account is created only after OTP is verified.
- Password reset requires OTP verification before setting new password.

Backend integration calls are made via:
- sendOTP / verifyOTP
- sendPasswordResetOTP / verifyPasswordResetOTP / resetPassword

### 5. Session Tracking (Analytics/Progress)
File: src/utils/sessionTracking.js

This module tracks study sessions (start, pause, resume, end) and stores session history in localStorage. It is used for productivity analytics, not as an inactivity auto-logout enforcement module.

## Removed/Deprecated Modules

The following files were removed from runtime code and should not be referenced for current implementation:

- src/utils/inputSanitization.js
- src/utils/csrfProtection.js
- src/utils/sessionManagement.js
- src/utils/securityAuditLog.js

If these controls are reintroduced later, update this guide and SECURITY_QUICK_START.md in the same change.

## Security Gaps vs Earlier Plan

The current codebase still needs dedicated implementation for:

- Centralized input sanitization helpers
- CSRF token lifecycle and request validation
- Centralized security audit logging
- Session inactivity auto-expiry enforcement

## Operational Checklist (Current State)

- Keep secrets in .env/.env.local and never commit them.
- Keep bcryptjs dependency up to date.
- Retest lockout behavior after auth changes.
- Retest OTP verification flows after Supabase changes.
- Review localStorage usage for sensitive data exposure risk.

## Verification Steps

1. Test password strength validation during registration.
2. Trigger 5 failed logins and verify lockout duration message.
3. Verify successful login resets lockout attempt counter.
4. Verify registration OTP must pass before account creation.
5. Verify password reset OTP must pass before update.

## Recommended Next Hardening Work

1. Reintroduce centralized input sanitization and apply in Auth, Profile, and Forum forms.
2. Implement CSRF strategy for state-changing requests.
3. Add security event logging (failed logins, lockouts, reset attempts).
4. Add server-side enforcement for critical security checks where feasible.

Last Updated: April 2, 2026
Status: Aligned with current repository state
