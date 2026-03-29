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
    const subject = "Your verification code";
    const plainText = `
Hi,

Your verification code is: ${otp}

This code will expire in 15 minutes.

If you did not request this, please ignore this email.

Thanks,
Ayush
`;

    const htmlContent = isPasswordReset
      ? `
<p>Hi,</p>

<p>Your password reset code is:</p>

<p><strong>${otp}</strong></p>

<p>This code will expire in 15 minutes.</p>

<p>If you did not request this, please ignore this email.</p>

<p>Thanks,<br>Ayush</p>

<p style="font-size:12px;color:gray;">
You are receiving this email because you requested a password reset.
</p>
`
      : `
<p>Hi,</p>

<p>Your verification code is:</p>

<p><strong>${otp}</strong></p>

<p>This code will expire in 15 minutes.</p>

<p>If you did not request this, please ignore this email.</p>

<p>Thanks,<br>Ayush</p>

<p style="font-size:12px;color:gray;">
You are receiving this email because you signed up on our platform.
</p>
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
        subject: "Quick check",
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
