import { createClient } from "@supabase/supabase-js";
import { generateOTP, getOTPExpiration, isOTPExpired } from "./emailVerification";
import { sendOTPEmail, sendPasswordResetEmail } from "./emailService";
import { verifyPassword, isBcryptHash, createSHA256Hash, hashPassword } from "./auth";

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== SUPABASE OPERATIONS =====
/**
 * Login user with username/email and password
 * Supports both bcrypt and old SHA-256 hashes (backward compatible)
 * Auto-upgrades old SHA-256 users to bcrypt on successful login
 * @param {string} usernameOrEmail - Username or email
 * @param {string} passwordPlainText - Plain text password
 * @returns {Promise<object>} { error: string|null, username: string|null }
 */
export async function loginUser(usernameOrEmail, passwordPlainText) {
  const input = usernameOrEmail.trim().toLowerCase();

  try {
    // Fetch user by username or email
    const { data, error } = await supabase
      .from("users")
      .select("username, password_hash")
      .or(`username.eq.${input},email.eq.${input}`)
      .single();

    if (error || !data) {
      return { error: "Invalid username/email or password", username: null };
    }

    let isPasswordValid = false;
    let shouldUpgradeHash = false;

    // Check if hash is bcrypt or old SHA-256
    if (isBcryptHash(data.password_hash)) {
      // New bcrypt hash - use bcrypt verification
      isPasswordValid = await verifyPassword(passwordPlainText, data.password_hash);
    } else {
      // Old SHA-256 hash - compute SHA-256 and compare
      try {
        const sha256Hash = await createSHA256Hash(passwordPlainText);
        isPasswordValid = sha256Hash === data.password_hash;
        
        // Mark for upgrade if password is correct
        if (isPasswordValid) {
          shouldUpgradeHash = true;
          console.log(`[AUTH] Will upgrade ${data.username} from SHA-256 to bcrypt`);
        }
      } catch (hashError) {
        console.error('SHA-256 hash creation failed:', hashError);
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return { error: "Invalid username/email or password", username: null };
    }

    // Auto-upgrade old SHA-256 hash to bcrypt
    if (shouldUpgradeHash) {
      try {
        const newHash = await hashPassword(passwordPlainText);
        await supabase
          .from("users")
          .update({ password_hash: newHash })
          .eq("username", data.username);
        console.log(`[AUTH] Successfully upgraded ${data.username} to bcrypt`);
      } catch (upgradeError) {
        console.error('Failed to upgrade password hash:', upgradeError);
        // Continue login even if upgrade fails
      }
    }

    // Update last login timestamp
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("username", data.username);

    return { error: null, username: data.username };
  } catch (error) {
    console.error('Login error:', error);
    return { error: "Login failed. Please try again.", username: null };
  }
}

export async function registerUser(username, passwordPlain, email, name, emailVerified = false) {
  // Check if username exists
  const { data: existingUsername } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUsername) return "Username already taken";

  // Check if email exists
  const { data: existingEmail } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  if (existingEmail) return "Email already registered";

  // Hash the password using bcrypt
  const { hashPassword } = await import("./auth.js");
  const passwordHash = await hashPassword(passwordPlain);

  const { error } = await supabase.from("users").insert({
    username,
    email,
    name,
    password_hash: passwordHash,
    email_verified: emailVerified,
    joined_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  });

  if (error) return "Registration failed: " + (error.message || "Unknown error");

  return null;
}

export async function getUserProfile(username) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("username, email, name, joined_at")
      .eq("username", username)
      .single();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error("Get user profile error:", err);
    return null;
  }
}

export async function updateUserName(username, newName) {
  try {
    const { error } = await supabase
      .from("users")
      .update({ name: newName })
      .eq("username", username);

    if (error) return { success: false, error: "Failed to update name" };
    return { success: true };
  } catch (err) {
    console.error("Update name error:", err);
    return { success: false, error: "Network error updating name" };
  }
}

/**
 * Update username with uniqueness validation
 * @param {string} currentUsername - Current username
 * @param {string} newUsername - New username to change to
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export async function updateUsername(currentUsername, newUsername) {
  try {
    console.log("Attempting to update username:", { currentUsername, newUsername });
    
    // Validate new username
    const validationError = validateUsername(newUsername);
    if (validationError) {
      console.error("Validation error:", validationError);
      return { success: false, error: validationError };
    }

    // Check if new username already exists
    try {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", newUsername)
        .limit(1);

      if (existing && existing.length > 0) {
        console.warn("Username already exists");
        return { success: false, error: "Username already taken" };
      }
    } catch (checkErr) {
      console.warn("Warning checking username existence:", checkErr);
    }

    console.log("Validation passed, calling RPC function...");

    // Call the RPC function to update username
    const { data, error } = await supabase.rpc("update_user_username", {
      current_username: currentUsername,
      new_username: newUsername
    });

    if (error) {
      console.error("RPC update error:", error);
      return { success: false, error: error.message || "Failed to update username" };
    }

    console.log("RPC response:", data);

    if (data && data.success === false) {
      return { success: false, error: data.error || "Failed to update username" };
    }

    return { success: true };
  } catch (err) {
    console.error("Update username error:", err);
    return { success: false, error: err.message || "Network error updating username" };
  }
}

/**
 * Validate username format
 * @private
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return "Username is required";
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return "Username must be at least 3 characters";
  }

  if (trimmed.length > 20) {
    return "Username must be at most 20 characters";
  }

  // Allow alphanumeric and underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores";
  }

  return null;
}

/**
 * Update user password with verification of current password
 * @param {string} username - Username
 * @param {string} currentPasswordPlain - Current password in plain text
 * @param {string} newPasswordPlain - New password in plain text
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export async function updateUserPassword(username, currentPasswordPlain, newPasswordPlain) {
  try {
    // First, fetch the stored password hash
    const { data, error: fetchError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("username", username)
      .single();

    if (fetchError || !data) {
      return { success: false, error: "Account not found" };
    }

    const storedHash = data.password_hash;

    // Verify the current password against the stored hash
    let isCurrentPasswordValid = false;
    
    if (isBcryptHash(storedHash)) {
      // New bcrypt hash - use bcrypt verification
      isCurrentPasswordValid = await verifyPassword(currentPasswordPlain, storedHash);
    } else {
      // Old SHA-256 hash - compute SHA-256 and compare
      try {
        const sha256Hash = await createSHA256Hash(currentPasswordPlain);
        isCurrentPasswordValid = sha256Hash === storedHash;
      } catch (hashError) {
        console.error('SHA-256 hash verification failed:', hashError);
        isCurrentPasswordValid = false;
      }
    }

    if (!isCurrentPasswordValid) {
      return { success: false, error: "Incorrect current password" };
    }

    // Hash the new password
    const newHashBcrypt = await hashPassword(newPasswordPlain);

    // Update the password in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newHashBcrypt })
      .eq("username", username);

    if (updateError) {
      return { success: false, error: "Failed to update password" };
    }
    
    return { success: true };
  } catch (err) {
    console.error("Update password error:", err);
    return { success: false, error: "Network error updating password" };
  }
}

/**
 * Send OTP to email using Resend API
 */
export async function sendOTP(email) {
  try {
    const otp = generateOTP();
    // Store expiration as Unix timestamp (milliseconds) to avoid timezone issues
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    // Store OTP in email_verifications table
    const { error } = await supabase.from("email_verifications").upsert(
      {
        email,
        otp,
        expires_at: new Date(expiresAtMs).toISOString(), // Convert to ISO for DB storage
        created_at: new Date().toISOString()
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("OTP storage error:", error);
      return { success: false, error: "Failed to generate OTP" };
    }

    // Send email with OTP
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    // Return OTP in development mode only
    if (emailResult.development) {
      return { success: true, otp };
    }

    // In production, don't return OTP (user will receive via email)
    return { success: true };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: "Failed to send verification code" };
  }
}

/**
 * Verify OTP and mark email as verified
 */
export async function verifyOTP(email, otp) {
  try {
    // Get stored OTP
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("otp, expires_at")
      .eq("email", email)
      .single();

    if (fetchError || !verification) {
      return { success: false, error: "No verification request found" };
    }

    // Parse expires_at - add 'Z' if missing to mark as UTC
    const expiresAtStr = verification.expires_at.endsWith('Z')
      ? verification.expires_at
      : verification.expires_at + 'Z';

    const expiresAt = new Date(expiresAtStr);
    const now = new Date();

    console.log(`⏰ OTP Check: Expires at ${expiresAtStr}, Now is ${now.toISOString()}`);
    console.log(`⏰ Time remaining: ${Math.round((expiresAt - now) / 1000)}s`);

    if (now > expiresAt) {
      return { success: false, error: "OTP expired. Request a new one." };
    }

    // Check if OTP matches
    if (verification.otp !== otp) {
      return { success: false, error: "Invalid OTP. Please try again." };
    }

    // Mark email as verified in users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("email", email);

    if (updateError) {
      return { success: false, error: "Verification failed" };
    }

    // Delete used OTP
    await supabase.from("email_verifications").delete().eq("email", email);

    return { success: true };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, error: "Verification failed" };
  }
}

export async function loadProgress(username) {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("username", username);
  
  if (error) {
    console.error("Load progress error:", error);
    return {};
  }
  
  const progress = {};
  (data || []).forEach(row => {
    const key = `${row.subject}||${row.chapter}||${row.type}`;
    progress[key] = row.data;
  });
  
  return progress;
}

export async function saveProgressItem(username, subject, chapter, type, data) {
  return await supabase.from("progress").upsert(
    {
      username,
      subject,
      chapter,
      type,
      data,
      updated_at: new Date().toISOString()
    },
    { onConflict: "username,subject,chapter,type" }
  );
}

// ===== CHAPTER NOTES CACHING =====
export async function saveChapterNotes(subject, chapter, notes) {
  const { error } = await supabase.from("chapter_notes").upsert(
    {
      subject,
      chapter,
      notes,
      created_at: new Date().toISOString()
    },
    { onConflict: "subject,chapter" }
  );
  
  if (error) {
    console.error("Save notes error:", error);
    return false;
  }
  return true;
}

export async function getChapterNotes(subject, chapter) {
  const { data, error } = await supabase
    .from("chapter_notes")
    .select("notes")
    .eq("subject", subject)
    .eq("chapter", chapter)
    .single();

  if (error || !data) return null;
  return data.notes;
}

// ===== PASSWORD RESET =====
export async function sendPasswordResetOTP(usernameOrEmail) {
  try {
    const input = usernameOrEmail.trim().toLowerCase();
    
    // Check if user exists by email or username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, username")
      .or(`username.eq.${input},email.eq.${input}`)
      .single();

    if (userError || !user) {
      return { success: false, error: "Account not found in our system" };
    }

    const email = user.email;
    const otp = generateOTP();
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store OTP in password_resets table
    const { error } = await supabase.from("password_resets").upsert(
      {
        email,
        otp,
        expires_at: new Date(expiresAtMs).toISOString(),
        created_at: new Date().toISOString()
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Password reset OTP storage error:", error);
      return { success: false, error: "Failed to generate reset code" };
    }

    // Send email with reset OTP
    const emailResult = await sendPasswordResetEmail(email, otp);

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    // Return OTP in development mode only
    if (emailResult.development) {
      return { success: true, email, otp };
    }

    return { success: true, email };
  } catch (error) {
    console.error("Send password reset OTP error:", error);
    return { success: false, error: "Failed to send reset code" };
  }
}

export async function verifyPasswordResetOTP(email, otp) {
  try {
    const { data: verification, error: fetchError } = await supabase
      .from("password_resets")
      .select("otp, expires_at")
      .eq("email", email)
      .single();

    if (fetchError || !verification) {
      return { success: false, error: "No reset request found" };
    }

    const expiresAtStr = verification.expires_at.endsWith('Z')
      ? verification.expires_at
      : verification.expires_at + 'Z';

    const expiresAt = new Date(expiresAtStr);
    const now = new Date();

    if (now > expiresAt) {
      return { success: false, error: "Reset code expired. Request a new one." };
    }

    if (verification.otp !== otp) {
      return { success: false, error: "Invalid reset code. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Verify password reset OTP error:", error);
    return { success: false, error: "Verification failed" };
  }
}

export async function resetPassword(email, newPasswordPlain) {
  try {
    // Hash the new password using bcrypt
    const { hashPassword } = await import("./auth.js");
    const newPasswordHash = await hashPassword(newPasswordPlain);
    
    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("email", email);

    if (updateError) {
      return { success: false, error: "Failed to reset password" };
    }

    // Delete used reset token
    await supabase.from("password_resets").delete().eq("email", email);

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Password reset failed" };
  }
}

// ===== QUIZ SETS =====
/**
 * Fetch a specific quiz set (1-15) for a chapter
 */
export async function getQuizSet(subject, chapter, setNumber) {
  try {
    const { data, error } = await supabase
      .from("quiz_sets")
      .select("questions")
      .eq("subject", subject)
      .eq("chapter", chapter)
      .eq("set_number", setNumber)
      .single();

    if (error || !data) {
      return null;
    }

    const questions = Array.isArray(data.questions) ? data.questions : [];
    // Enforce the quiz contract: every playable set must contain exactly 30 MCQs.
    if (questions.length < 30) {
      console.warn(
        `[getQuizSet] Incomplete set ignored: ${subject}/${chapter}/set-${setNumber} has ${questions.length} questions`
      );
      return null;
    }

    return questions.slice(0, 30).map((q) => ({
      ...q,
      exp:
        typeof q?.exp === "string" && q.exp.trim().length > 0
          ? q.exp
          : "Use core chapter concepts and eliminate the incorrect options logically.",
    }));
  } catch (error) {
    console.error("Fetch quiz set error:", error);
    return null;
  }
}

/**
 * Get all quiz set summaries for a chapter (for displaying set list)
 */
export async function getQuizSetSummaries(subject, chapter) {
  try {
    console.log(`[getQuizSetSummaries] Querying: subject="${subject}", chapter="${chapter}"`);
    const { data, error } = await supabase
      .from("quiz_sets")
      .select("set_number, questions")
      .eq("subject", subject)
      .eq("chapter", chapter)
      .order("set_number", { ascending: true });

    if (error) {
      console.error("[getQuizSetSummaries] Supabase error:", error);
      return [];
    }
    if (!data) {
      console.warn("[getQuizSetSummaries] data is null/undefined");
      return [];
    }

    const playable = (data || [])
      .filter((row) => Array.isArray(row.questions) && row.questions.length >= 30)
      .map((row) => row.set_number);

    console.log(
      `[getQuizSetSummaries] Got ${data.length} rows, ${playable.length} playable sets`
    );
    return playable;
  } catch (error) {
    console.error("[getQuizSetSummaries] Unexpected error:", error);
    return [];
  }
}

/**
 * Save quiz submission for a specific set
 */
export async function saveQuizSubmission(username, subject, chapter, setNumber, answers, score) {
  try {
    const { error } = await supabase.from("quiz_submissions").insert({
      username,
      subject,
      chapter,
      set_number: setNumber,
      answers: answers, // JSON object {questionIndex: selectedIndex}
      score,
      total_questions: 30,
      submitted_at: new Date().toISOString()
    });

    if (error) {
      console.error("Save submission error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Save quiz submission error:", error);
    return false;
  }
}

/**
 * Get user's best score for a quiz set
 */
export async function getBestQuizScore(username, subject, chapter, setNumber) {
  try {
    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("score")
      .eq("username", username)
      .eq("subject", subject)
      .eq("chapter", chapter)
      .eq("set_number", setNumber)
      .order("score", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return undefined;
    }

    return data.score;
  } catch (error) {
    return undefined;
  }
}

/**
 * Get all quiz completion status for a chapter
 */
export async function getQuizSetStatus(username, subject, chapter) {
  try {
    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("set_number, score")
      .eq("username", username)
      .eq("subject", subject)
      .eq("chapter", chapter);

    if (error || !data) {
      return {};
    }

    // Group by set_number, get best score
    const status = {};
    for (const row of data) {
      if (!status[row.set_number] || status[row.set_number] < row.score) {
        status[row.set_number] = row.score;
      }
    }

    return status;
  } catch (error) {
    console.error("Get quiz set status error:", error);
    return {};
  }
}

/**
 * Get all sample papers for a subject
 */
export async function getSamplePapers(subject) {
  try {
    const { data, error } = await supabase
      .from("sample_papers")
      .select("set_number, content, total_marks")
      .eq("subject", subject)
      .order("set_number", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Get sample papers error:", error);
    return [];
  }
}

/**
 * Get a specific sample paper
 */
export async function getSamplePaper(subject, setNumber) {
  try {
    const { data, error } = await supabase
      .from("sample_papers")
      .select("content, total_marks")
      .eq("subject", subject)
      .eq("set_number", setNumber)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get sample paper error:", error);
    return null;
  }
}

