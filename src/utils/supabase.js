import { createClient } from "@supabase/supabase-js";
import { generateOTP, getOTPExpiration, isOTPExpired } from "./emailVerification";
import { sendOTPEmail } from "./emailService";

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== SUPABASE OPERATIONS =====
export async function loginUser(usernameOrEmail, passwordHash) {
  const input = usernameOrEmail.trim().toLowerCase();

  // Try to login with username or email
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .or(`username.eq.${input},email.eq.${input}`)
    .eq("password_hash", passwordHash)
    .single();

  if (error || !data) return "Invalid username/email or password";

  // Update last login
  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("username", data.username);

  return null;
}

export async function registerUser(username, passwordHash, email, name) {
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

  const { error } = await supabase.from("users").insert({
    username,
    email,
    name,
    password_hash: passwordHash,
    email_verified: false,
    joined_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  });

  if (error) return "Registration failed: " + (error.message || "Unknown error");

  return null;
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
