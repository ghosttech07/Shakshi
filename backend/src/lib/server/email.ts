/**
 * Transactional email (order confirmations and updates) through Resend's HTTP API.
 *
 * Environment:
 *   RESEND_API_KEY  from resend.com → API Keys. Without it, emails are skipped (and logged), never an error.
 *   EMAIL_FROM      e.g. "Shakshi <orders@yourdomain.com>" once your domain is verified in Resend.
 *                   Defaults to Resend's test sender, which can only deliver to your own Resend address.
 *   EMAIL_REPLY_TO  optional; where customers' replies go.
 */
export type Mail = { to: string; subject: string; html: string; text: string };

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] skipped (RESEND_API_KEY not set): "${mail.subject}" to ${mail.to}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Shakshi <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const error = `${res.status} ${(await res.text()).slice(0, 300)}`;
      console.error(`[email] failed: "${mail.subject}" to ${mail.to}: ${error}`);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[email] failed: "${mail.subject}" to ${mail.to}: ${(e as Error).message}`);
    return { ok: false, error: (e as Error).message };
  }
}
