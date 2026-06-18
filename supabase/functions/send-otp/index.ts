import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendEmailWithRetry } from "./brevoService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// In-memory sliding window IP-based rate limiter
// Key: IP address, Value: Array of timestamps of recent requests
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 5;           // Max 5 emails per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (!ipRequestHistory.has(ip)) {
    ipRequestHistory.set(ip, [now]);
    return false;
  }

  const timestamps = ipRequestHistory.get(ip)!;
  // Filter out timestamps older than the sliding window limit
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);
  return false;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Extract IP and perform rate limiting check
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(clientIp)) {
    console.warn(`[Rate Limit] Blocked IP: ${clientIp} from sending verification email.`);
    return new Response(
      JSON.stringify({ error: "Too many verification requests. Please try again in an hour." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine email subject and content based on type
    const isPasswordReset = type === "password_reset";
    const subject = isPasswordReset 
      ? `AkmEdu45 - Your Password Reset Code: ${otp}`
      : `AkmEdu45 - Your Verification Code: ${otp}`;
      
    const plainText = `
Hi there,

${isPasswordReset ? "You requested a password reset for your AkmEdu45 account." : "Thank you for joining AkmEdu45! Please verify your email address to continue."}

Your verification code is: ${otp}

This code will expire in 15 minutes.

If you did not request this code, please ignore this email. No changes will be made to your account.

Thanks,
The AkmEdu45 Team
https://akmedu45.xyz
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  .container { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; text-align: center; }
  .logo { font-size: 24px; font-weight: bold; color: #0891b2; margin-bottom: 24px; }
  .otp-box { background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">AkmEdu45</div>
    
    <h2>${isPasswordReset ? "Password Reset Request" : "Verify Your Email"}</h2>
    
    <p>${isPasswordReset ? "We received a request to reset the password for your AkmEdu45 account. Your reset code is:" : "Thank you for joining AkmEdu45! Please use the following code to verify your email address:"}</p>
    
    <div class="otp-box">${otp}</div>
    
    <p>This code will expire in <strong>15 minutes</strong>.</p>
    <p>If you did not request this code, you can safely ignore this email.</p>
    
    <div class="footer">
      <p>This is an automated message from AkmEdu45. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} AkmEdu45. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@akmedu45.xyz";

    // Send the email using Brevo Service
    const success = await sendEmailWithRetry(
      { to: email, subject, htmlContent, plainText, senderEmail: brevoSenderEmail },
      brevoApiKey
    );

    if (!success) {
      console.error(`[Error] Brevo email service returned failure for ${email}`);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Email successfully delivered to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
