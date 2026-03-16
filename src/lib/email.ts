export type InviteParams = {
  guestName: string;
  guestEmail: string | null;
  eventTitle: string;
  hostName: string;
  startTime: Date;
  rsvpUrl: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

function getBaseUrl(): string {
  return process.env.APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export function buildRsvpUrl(publicId: string, guestToken: string): string {
  const base = getBaseUrl();
  return `${base.replace(/\/$/, "")}/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(guestToken)}`;
}

export function isEmailConfigured(): boolean {
  const provider = (process.env.EMAIL_PROVIDER ?? "none").toLowerCase();
  if (provider === "none") return false;
  if (provider === "smtp") {
    return !!(process.env.SMTP_HOST && process.env.EMAIL_FROM);
  }
  if (provider === "resend") {
    return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  }
  return false;
}

export async function sendInvite(params: InviteParams): Promise<SendResult> {
  const provider = (process.env.EMAIL_PROVIDER ?? "none").toLowerCase();

  if (provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send invite to", params.guestEmail, "for", params.eventTitle);
    }
    return { ok: true };
  }

  if (!params.guestEmail?.trim()) {
    return { ok: false, error: "Guest has no email address" };
  }

  const from = process.env.EMAIL_FROM ?? "VyteKit <noreply@localhost>";
  const subject = `You're invited: ${params.eventTitle}`;
  const startStr = params.startTime.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>Hi ${escapeHtml(params.guestName)},</p>
  <p>${escapeHtml(params.hostName)} has invited you to:</p>
  <h2 style="margin: 16px 0;">${escapeHtml(params.eventTitle)}</h2>
  <p><strong>When:</strong> ${escapeHtml(startStr)}</p>
  <p>Use the link below to RSVP:</p>
  <p><a href="${escapeHtml(params.rsvpUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">RSVP</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">This invite was sent by VyteKit.</p>
</body>
</html>`;

  const text = `
Hi ${params.guestName},

${params.hostName} has invited you to: ${params.eventTitle}
When: ${startStr}

RSVP here: ${params.rsvpUrl}

—
Sent by VyteKit
`.trim();

  if (provider === "smtp") {
    return sendViaSmtp({
      to: params.guestEmail,
      from,
      subject,
      html,
      text,
    });
  }

  if (provider === "resend") {
    return sendViaResend({
      to: params.guestEmail,
      from,
      subject,
      html,
      text,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[email] unknown provider, no-op. Would send to", params.guestEmail);
  }
  return { ok: true };
}

async function sendViaSmtp(payload: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  try {
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST!;
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `SMTP failed: ${msg}` };
  }
}

async function sendViaResend(payload: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  try {
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (result.error) {
      return { ok: false, error: `Resend: ${result.error.message}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Resend failed: ${msg}` };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
