import { env } from "../config/env.js";
import { logger } from "./logger.js";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Uses Brevo's transactional email REST API directly — a single POST, so
// pulling in Brevo's full SDK for one call site isn't worth it. Never
// throws: callers (e.g. forgot-password) must succeed regardless of
// whether the email actually went out, to avoid leaking account existence.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    logger.warn({ to, subject }, "Brevo not configured — email not sent");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, "Brevo email send failed");
    }
  } catch (err) {
    logger.error({ err }, "Brevo email send threw");
  }
}
