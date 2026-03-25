/**
 * Email Service for sending OTP codes
 * Uses Supabase Edge Functions to call Resend API (avoids CORS issues)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Send OTP email using Supabase Edge Function + Resend
 */
export async function sendOTPEmail(email, otp) {
  try {
    console.log(`📧 Sending OTP to ${email} via Edge Function...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ email, otp }),
    });

    console.log(`✓ Got response: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Edge Function error:", errorData);
      return { success: false, error: errorData.error || "Failed to send email" };
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully:`, result);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    // Fallback to development mode
    console.log(`🔐 Development OTP for ${email}: ${otp}`);
    return { success: true, development: true, otp };
  }
}

/**
 * Send password reset email using Supabase Edge Function + SendGrid
 */
export async function sendPasswordResetEmail(email, otp) {
  try {
    console.log(`📧 Sending password reset code to ${email} via Edge Function...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        email,
        otp,
        type: "password_reset"
      }),
    });

    console.log(`✓ Got response: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Edge Function error:", errorData);
      return { success: false, error: errorData.error || "Failed to send email" };
    }

    const result = await response.json();
    console.log(`✅ Password reset email sent successfully:`, result);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    // Fallback to development mode
    console.log(`🔐 Development Password Reset Code for ${email}: ${otp}`);
    return { success: true, development: true, otp };
  }
}
