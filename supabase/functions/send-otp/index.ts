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
          name: "AkmEdu45 Support",
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
