import { getEmailConfig } from "@/lib/settings";

export type InviteParams = {
  guestName: string;
  guestEmail: string | null;
  eventTitle: string;
  hostName: string;
  startTime: Date;
  rsvpUrl: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

async function getConfig() {
  const db = await getEmailConfig();
  const fromEnv = (key: string) => process.env[key] ?? "";
  return {
    provider: db.provider || (fromEnv("EMAIL_PROVIDER") || "none").toLowerCase(),
    emailFrom: db.emailFrom || fromEnv("EMAIL_FROM") || "VyteKit <noreply@localhost>",
    appUrl: fromEnv("APP_URL") || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    smtpHost: db.smtpHost || fromEnv("SMTP_HOST"),
    smtpPort: db.smtpPort || fromEnv("SMTP_PORT") || "587",
    smtpSecure: db.smtpSecure || fromEnv("SMTP_SECURE") || "false",
    smtpUser: db.smtpUser || fromEnv("SMTP_USER"),
    smtpPass: db.smtpPass || fromEnv("SMTP_PASS"),
    resendApiKey: db.resendApiKey || fromEnv("RESEND_API_KEY"),
  };
}

export function buildRsvpUrl(publicId: string, guestToken: string): string {
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(guestToken)}`;
}

export async function buildRsvpUrlFromConfig(publicId: string, guestToken: string): Promise<string> {
  const cfg = await getConfig();
  const base = process.env.APP_URL ?? cfg.appUrl ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(guestToken)}`;
}

export async function isEmailConfigured(): Promise<boolean> {
  const cfg = await getConfig();
  if (cfg.provider === "none") return false;
  if (cfg.provider === "smtp") return !!(cfg.smtpHost && cfg.emailFrom);
  if (cfg.provider === "resend") return !!(cfg.resendApiKey && cfg.emailFrom);
  return false;
}

export async function sendInvite(params: InviteParams): Promise<SendResult> {
  const cfg = await getConfig();

  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send invite to", params.guestEmail, "for", params.eventTitle);
    }
    return { ok: true };
  }

  if (!params.guestEmail?.trim()) {
    return { ok: false, error: "Guest has no email address" };
  }

  const from = cfg.emailFrom;
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

  if (cfg.provider === "smtp") {
    return sendViaSmtp({
      to: params.guestEmail,
      from,
      subject,
      html,
      text,
      cfg,
    });
  }

  if (cfg.provider === "resend") {
    return sendViaResend({
      to: params.guestEmail,
      from,
      subject,
      html,
      text,
      cfg,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[email] unknown provider, no-op. Would send to", params.guestEmail);
  }
  return { ok: true };
}

type SmtpCfg = Awaited<ReturnType<typeof getConfig>>;

async function sendViaSmtp(payload: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  cfg: SmtpCfg;
}): Promise<SendResult> {
  try {
    const nodemailer = await import("nodemailer");
    const { cfg } = payload;
    const port = parseInt(cfg.smtpPort || "587", 10);
    const secure = cfg.smtpSecure === "true" || cfg.smtpSecure === "1";

    const transporter = nodemailer.default.createTransport({
      host: cfg.smtpHost,
      port,
      secure,
      auth: cfg.smtpUser && cfg.smtpPass ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
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
  cfg: SmtpCfg;
}): Promise<SendResult> {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(payload.cfg.resendApiKey);
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
