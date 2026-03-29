import { useState } from "react";
import { hashPassword, validateUsername, validatePassword } from "../utils/auth";
import { loginUser, registerUser, sendOTP, verifyOTP, sendPasswordResetOTP, verifyPasswordResetOTP, resetPassword } from "../utils/supabase";
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [otpState, setOtpState] = useState({ show: false, email: "", otp: "", loading: false, pendingRegistration: null });
  const [resetPasswordData, setResetPasswordData] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "", loading: false, step: "email" });

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

    // Check if input is email or username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(u);

    // Validate: must be either valid email or valid username
    if (!isEmail) {
      const usernameErr = validateUsername(u);
      if (usernameErr) return setError(usernameErr);
    }

    // Check if account is locked
    if (isAccountLocked(u)) {
      const remainingSeconds = getRemainingLockoutTime(u);
      setIsLockedOut(true);
      setLockoutTimeRemaining(remainingSeconds);
      return setError(`❌ Account temporarily locked. Try again in ${remainingSeconds} seconds.`);
    }

    const passwordErr = validatePassword(credentials.password);
    if (passwordErr) return setError(passwordErr);

    const hashed = await hashPassword(credentials.password);
    const loginResult = await loginUser(u, hashed);

    if (loginResult.error) {
      // Record failed attempt
      const attempts = recordLoginAttempt(u);
      const remaining = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - attempts;

      if (remaining <= 0) {
        lockAccount(u);
        setIsLockedOut(true);
        setLockoutTimeRemaining(SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60);
        return setError(`❌ Too many failed attempts. Account locked for ${SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.`);
      }

      return setError(`❌ ${loginResult.error} (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`);
    }

    // Clear attempts on successful login
    resetLoginAttempts(u);
    setCurrentUser(loginResult.username);
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

    // DON'T CREATE ACCOUNT YET - Just send OTP
    // Store registration data temporarily for after OTP verification
    const hashed = await hashPassword(credentials.password);

    setOtpState({
      show: true,
      email: em,
      otp: "",
      loading: true,
      pendingRegistration: { username: u, email: em, name: nm, passwordHash: hashed }
    });

    const otpResult = await sendOTP(em);
    setOtpState(prev => ({ ...prev, loading: false }));

    if (!otpResult.success) {
      // OTP sending failed - reset state
      setOtpState({ show: false, email: "", otp: "", loading: false, pendingRegistration: null });
      return setError("⚠️ " + (otpResult.error || "Failed to send verification code"));
    }

    // For development: show OTP in console if returned
    if (otpResult.otp) {
      console.log(`🔐 Development OTP: ${otpResult.otp}`);
    }

    setError(""); // Clear errors
  };

  const doVerifyOTP = async () => {
    if (!otpState.otp || otpState.otp.length !== 6) {
      return setError("❌ Please enter a valid 6-digit code");
    }

    setOtpState(prev => ({ ...prev, loading: true }));
    const result = await verifyOTP(otpState.email, otpState.otp);
    setOtpState(prev => ({ ...prev, loading: false }));

    if (!result.success) {
      return setError("⚠️ " + result.error);
    }

    // OTP verified! Now create the account with email already verified
    const pending = otpState.pendingRegistration;
    if (!pending) {
      return setError("⚠️ Registration data not found");
    }

    const registerErr = await registerUser(pending.username, pending.passwordHash, pending.email, pending.name, true);
    if (registerErr) {
      return setError("⚠️ " + registerErr);
    }

    // Account created successfully! Auto-login
    setCurrentUser(pending.username);
    setOtpState({ show: false, email: "", otp: "", loading: false, pendingRegistration: null });
    setCredentials({ username: "", email: "", name: "", password: "", confirmPassword: "" });
    setAuthTab("login");
    setError("✅ Email verified! Account created - you're now logged in!");
  };

  const doLogout = () => {
    setCurrentUser(null);
    setCredentials({ username: "", email: "", name: "", password: "", confirmPassword: "" });
    setError("");
    setAuthTab("login");
    setIsLockedOut(false);
    setLockoutTimeRemaining(0);
    setShowPass(false);
    setOtpState({ show: false, email: "", otp: "", loading: false, pendingRegistration: null });
  };

  const doForgotPasswordRequest = async () => {
    setError("");
    const input = resetPasswordData.email.trim().toLowerCase();

    if (!input) {
      return setError("❌ Please enter your email or username");
    }

    setResetPasswordData(prev => ({ ...prev, loading: true }));
    const result = await sendPasswordResetOTP(input);
    setResetPasswordData(prev => ({ ...prev, loading: false }));

    if (!result.success) {
      return setError("⚠️ " + (result.error || "Failed to send reset code"));
    }

    // Show OTP in console for development
    if (result.otp) {
      console.log(`🔐 Development Reset Code: ${result.otp}`);
    }

    // Move to OTP verification step using the resolved email
    setResetPasswordData(prev => ({ ...prev, step: "otp", email: result.email || input }));
  };

  const doForgotPasswordVerifyOTP = async () => {
    setError("");
    if (!resetPasswordData.otp || resetPasswordData.otp.length !== 6) {
      return setError("❌ Please enter a valid 6-digit code");
    }

    setResetPasswordData(prev => ({ ...prev, loading: true }));
    const result = await verifyPasswordResetOTP(resetPasswordData.email, resetPasswordData.otp);
    setResetPasswordData(prev => ({ ...prev, loading: false }));

    if (!result.success) {
      return setError("⚠️ " + result.error);
    }

    // Move to password reset step
    setResetPasswordData(prev => ({ ...prev, step: "newPassword" }));
  };

  const doForgotPasswordReset = async () => {
    setError("");
    const newPass = resetPasswordData.newPassword;
    const confirmPass = resetPasswordData.confirmPassword;

    // Validate password strength
    const passwordStrength = validatePasswordStrength(newPass);
    if (!passwordStrength.isValid) {
      return setError(passwordStrength.errors[0]);
    }

    // Check if passwords match
    if (newPass !== confirmPass) {
      return setError("❌ Passwords do not match");
    }

    setResetPasswordData(prev => ({ ...prev, loading: true }));
    const hashedPassword = await hashPassword(newPass);
    const result = await resetPassword(resetPasswordData.email, hashedPassword);
    setResetPasswordData(prev => ({ ...prev, loading: false }));

    if (!result.success) {
      return setError("⚠️ " + (result.error || "Failed to reset password"));
    }

    // Success! Reset state and go back to login
    setResetPasswordData({ email: "", otp: "", newPassword: "", confirmPassword: "", loading: false, step: "email" });
    setShowResetPassword(false);
    setAuthTab("login");
    setError("✅ Password reset successfully! Please login with your new password.");
  };

  const cancelForgotPassword = () => {
    setResetPasswordData({ email: "", otp: "", newPassword: "", confirmPassword: "", loading: false, step: "email" });
    setShowResetPassword(false);
    setError("");
    setAuthTab("login");
  };

  return {
    currentUser,
    authTab,
    credentials,
    error,
    isLockedOut,
    lockoutTimeRemaining,
    showPass,
    showResetPassword,
    otpState,
    resetPasswordData,
    setAuthTab,
    setCredentials,
    setShowPass,
    setShowResetPassword,
    setOtpState,
    setResetPasswordData,
    doLogin,
    doRegister,
    doVerifyOTP,
    doLogout,
    doForgotPasswordRequest,
    doForgotPasswordVerifyOTP,
    doForgotPasswordReset,
    cancelForgotPassword,
  };
}
