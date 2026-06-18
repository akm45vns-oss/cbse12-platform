interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  plainText: string;
  senderEmail: string; // Dynamic sender email
}

/**
 * Sends an email using Brevo's HTTP API directly, with retries and exponential backoff.
 * Avoids SDK ESM dependency issues in serverless Deno/Supabase environments.
 */
export async function sendEmailWithRetry(
  params: SendEmailParams,
  apiKey: string,
  retries = 3,
  delay = 1000
): Promise<boolean> {
  const { to, subject, htmlContent, plainText, senderEmail } = params;
  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;
      console.log(`[Brevo Service] Attempt ${attempt} sending to ${to} from ${senderEmail}...`);

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { name: "AkmEdu45 Support", email: senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: htmlContent,
          textContent: plainText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Brevo Service] Success: Email sent to ${to}. Message ID: ${result.messageId}`);
        return true;
      }

      // Handle HTTP error response
      const statusCode = response.status;
      let errorDetails = "";
      try {
        errorDetails = await response.text();
      } catch (_) {
        errorDetails = "Unable to read error text";
      }

      console.error(`[Brevo Service] Brevo API returned status ${statusCode}: ${errorDetails}`);

      // Permanent client errors (4xx, except 429 rate limits) shouldn't be retried
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        console.error(`[Brevo Service] Permanent error (${statusCode}). Aborting retries.`);
        throw new Error(`Brevo API error (${statusCode}): ${errorDetails}`);
      }

      if (attempt >= retries) {
        throw new Error(`Failed to send email after ${retries} attempts. Last status: ${statusCode}`);
      }

    } catch (error) {
      console.error(`[Brevo Service] Connection or runtime error on attempt ${attempt}:`, error.message || error);

      if (attempt >= retries) {
        throw error;
      }
    }

    console.log(`[Brevo Service] Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay *= 2; // Exponential backoff
  }

  return false;
}
