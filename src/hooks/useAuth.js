import { useState } from "react";
import { hashPassword, validateUsername, validatePassword } from "../utils/auth";
import { loginUser, registerUser } from "../utils/supabase";
import { validatePasswordStrength } from "../utils/passwordValidation";
import { 
  recordLoginAttempt, 
  isAccountLocked, 
  lockAccount, 
  getRemainingLockoutTime, 
  resetLoginAttempts,
  SECURITY_CONFIG 
} from "../utils/rateLimiting";

export function useAuth() {
  // Initialize from localStorage, default to null if not found
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      return localStorage.getItem("akmedu_currentUser") || null;
    } catch {
      return null;
    }
  });
  const [authTab, setAuthTab] = useState("login");
  const [credentials, setCredentials] = useState({ username: "", email: "", name: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [showPass, setShowPass] = useState(false);

  // Helper function to set current user and persist to localStorage
  const setCurrentUser = (user) => {
    try {
      if (user) {
        localStorage.setItem("akmedu_currentUser", user);
      } else {
        localStorage.removeItem("akmedu_currentUser");
      }
      setCurrentUserState(user);
    } catch (e) {
      console.warn("Failed to persist auth state:", e);
      setCurrentUserState(user);
    }
  };

  const doLogin = async () => {
    setError("");
    setIsLockedOut(false);
    setShowPass(false);

    const u = credentials.username.trim().toLowerCase();

    // Check if account is locked
    if (isAccountLocked(u)) {
      const remainingSeconds = getRemainingLockoutTime(u);
      setIsLockedOut(true);
      setLockoutTimeRemaining(remainingSeconds);
      return setError(`❌ Account temporarily locked. Try again in ${remainingSeconds} seconds.`);
    }

    const usernameErr = validateUsername(u);
    if (usernameErr) return setError(usernameErr);

    const passwordErr = validatePassword(credentials.password);
    if (passwordErr) return setError(passwordErr);

    const hashed = await hashPassword(credentials.password);
    const loginErr = await loginUser(u, hashed);

    if (loginErr) {
      // Record failed attempt
      const attempts = recordLoginAttempt(u);
      const remaining = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - attempts;

      if (remaining <= 0) {
        lockAccount(u);
        setIsLockedOut(true);
        setLockoutTimeRemaining(SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60);
        return setError(`❌ Too many failed attempts. Account locked for ${SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.`);
      }

      return setError(`❌ ${loginErr} (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`);
    }

    // Clear attempts on successful login
    resetLoginAttempts(u);
    setCurrentUser(u);
    setCredentials({ username: "", email: "", name: "", password: "", confirmPassword: "" });
    setShowPass(false);
  };

  const doRegister = async () => {
    setError("");
    setShowPass(false);
    const u = credentials.username.trim().toLowerCase();
    const em = credentials.email.trim().toLowerCase();
    const nm = credentials.name.trim();

    // Validate name
    if (!nm || nm.length < 2) {
      return setError("❌ Please enter a valid name (min 2 characters)");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!em || !emailRegex.test(em)) {
      return setError("❌ Please enter a valid email address");
    }

    const usernameErr = validateUsername(u);
    if (usernameErr) return setError(usernameErr);

    // Validate password strength
    const passwordStrength = validatePasswordStrength(credentials.password);
    if (!passwordStrength.isValid) {
      return setError(passwordStrength.errors[0]);
    }

    const passwordErr = validatePassword(credentials.password, credentials.confirmPassword);
    if (passwordErr) return setError(passwordErr);

    const hashed = await hashPassword(credentials.password);
    const registerErr = await registerUser(u, hashed, em, nm);

    if (registerErr) return setError("⚠️ " + registerErr);

    // Clear lockout on successful registration
    resetLoginAttempts(u);
    setCurrentUser(u);
    setCredentials({ username: "", email: "", name: "", password: "", confirmPassword: "" });
    setShowPass(false);
  };

  const doLogout = () => {
    setCurrentUser(null);
    setCredentials({ username: "", email: "", name: "", password: "", confirmPassword: "" });
    setError("");
    setAuthTab("login");
    setIsLockedOut(false);
    setLockoutTimeRemaining(0);
    setShowPass(false);
  };

  return {
    currentUser,
    authTab,
    credentials,
    error,
    isLockedOut,
    lockoutTimeRemaining,
    showPass,
    setAuthTab,
    setCredentials,
    setShowPass,
    doLogin,
    doRegister,
    doLogout,
  };
}
