import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) {
      console.error("SENDGRID_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine email subject and content based on type
    const isPasswordReset = type === "password_reset";
    const subject = isPasswordReset ? "Your AkmEdu45 Password Reset Code" : "Your AkmEdu45 Verification Code";
    const plainText = isPasswordReset
      ? `Your password reset code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`
      : `Welcome to AkmEdu45! Your verification code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`;

    const htmlContent = isPasswordReset
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1; text-align: center;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 16px;">
            You requested to reset your AkmEdu45 password. Use the code below:
          </p>
          <div style="background: #f0f9fc; border: 2px solid #06b6d4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <code style="font-size: 28px; font-weight: bold; color: #0369a1; letter-spacing: 6px;">
              ${otp}
            </code>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1; text-align: center;">Email Verification</h2>
          <p style="color: #64748b; font-size: 16px;">
            Welcome to AkmEdu45! Your verification code is:
          </p>
          <div style="background: #f0f9fc; border: 2px solid #06b6d4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <code style="font-size: 28px; font-weight: bold; color: #0369a1; letter-spacing: 6px;">
              ${otp}
            </code>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `;

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
          },
        ],
        from: {
          email: "noreply@akmedu45.xyz",
          name: "AkmEdu45",
        },
        subject: subject,
        content: [
          {
            type: "text/plain",
            value: plainText,
          },
          {
            type: "text/html",
            value: htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("SendGrid error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Email sent to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
