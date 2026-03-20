import { getEmailConfig } from "@/lib/settings";

export type InviteParams = {
  guestName: string;
  guestEmail: string | null;
  eventTitle: string;
  hostName: string;
  startTime: Date;
  rsvpUrl: string;
  bannerImageUrl?: string | null; // full URL
  themeColor?: string | null;    // hex e.g. #3b82f6
};

export type SendResult = { ok: true } | { ok: false; error: string };

async function getConfig() {
  const db = await getEmailConfig();
  const fromEnv = (key: string) => process.env[key] ?? "";
  return {
    provider: db.provider || (fromEnv("EMAIL_PROVIDER") || "none").toLowerCase(),
    emailFrom: db.emailFrom || fromEnv("EMAIL_FROM") || "Rondivu <noreply@localhost>",
    appUrl: fromEnv("APP_URL") || db.appUrl?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
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

export async function getAppBaseUrl(): Promise<string> {
  const cfg = await getConfig();
  return (process.env.APP_URL ?? cfg.appUrl ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function buildRsvpUrlFromConfig(publicId: string, guestToken: string): Promise<string> {
  const base = await getAppBaseUrl();
  return `${base}/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(guestToken)}`;
}

export async function buildEventDetailsUrlFromConfig(publicId: string, guestToken: string): Promise<string> {
  const base = await getAppBaseUrl();
  return `${base}/e/${encodeURIComponent(publicId)}?token=${encodeURIComponent(guestToken)}`;
}

export async function isEmailConfigured(): Promise<boolean> {
  const cfg = await getConfig();
  if (cfg.provider === "none") return false;
  if (cfg.provider === "smtp") return !!(cfg.smtpHost && cfg.emailFrom);
  if (cfg.provider === "resend") return !!(cfg.resendApiKey && cfg.emailFrom);
  return false;
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    return { ok: false, error: "Email is not configured. Choose SMTP or Resend and save." };
  }
  const email = to.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const from = cfg.emailFrom;
  const subject = "Rondivu test email";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>This is a test email from Rondivu.</p>
  <p>If you received this, your email configuration is working.</p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Sent by Rondivu</p>
</body>
</html>`;
  const text = "This is a test email from Rondivu. If you received this, your email configuration is working.\n\n— Sent by Rondivu";
  if (cfg.provider === "smtp") return sendViaSmtp({ to: email, from, subject, html, text, cfg });
  if (cfg.provider === "resend") return sendViaResend({ to: email, from, subject, html, text, cfg });
  return { ok: false, error: "Email provider not supported for testing." };
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
  const accentColor = params.themeColor || "#18181b";
  const bannerHtml = params.bannerImageUrl
    ? `<div style="margin: -20px -20px 20px -20px; overflow: hidden; border-radius: 0;"><img src="${escapeHtml(params.bannerImageUrl)}" alt="" width="500" style="display: block; width: 100%; max-width: 500px; height: auto;" /></div>`
    : "";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  ${bannerHtml}
  <p>Hi ${escapeHtml(params.guestName)},</p>
  <p>${escapeHtml(params.hostName)} has invited you to:</p>
  <h2 style="margin: 16px 0; border-left: 4px solid ${accentColor}; padding-left: 12px;">${escapeHtml(params.eventTitle)}</h2>
  <p><strong>When:</strong> ${escapeHtml(startStr)}</p>
  <p>Use the link below to RSVP:</p>
  <p><a href="${escapeHtml(params.rsvpUrl)}" style="display: inline-block; background: ${accentColor}; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">RSVP</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">This invite was sent by Rondivu.</p>
</body>
</html>`;

  const text = `
Hi ${params.guestName},

${params.hostName} has invited you to: ${params.eventTitle}
When: ${startStr}

RSVP here: ${params.rsvpUrl}

—
Sent by Rondivu
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

export type UserInviteParams = {
  inviteeEmail: string;
  inviterEmail: string;
  acceptUrl: string;
};

export async function sendUserInvite(params: UserInviteParams): Promise<SendResult> {
  const cfg = await getConfig();

  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send user invite to", params.inviteeEmail);
    }
    return { ok: true };
  }

  const from = cfg.emailFrom;
  const subject = `You're invited to Rondivu`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>Hi,</p>
  <p>${escapeHtml(params.inviterEmail)} has invited you to join Rondivu.</p>
  <p>Use the link below to set your password and accept the invite:</p>
  <p><a href="${escapeHtml(params.acceptUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">Accept invite</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">This invite was sent by Rondivu.</p>
</body>
</html>`;

  const text = `
Hi,

${params.inviterEmail} has invited you to join Rondivu.

Accept the invite here: ${params.acceptUrl}

—
Sent by Rondivu
`.trim();

  if (cfg.provider === "smtp") {
    return sendViaSmtp({
      to: params.inviteeEmail,
      from,
      subject,
      html,
      text,
      cfg,
    });
  }

  if (cfg.provider === "resend") {
    return sendViaResend({
      to: params.inviteeEmail,
      from,
      subject,
      html,
      text,
      cfg,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[email] unknown provider, no-op. Would send invite to", params.inviteeEmail);
  }
  return { ok: true };
}

export type RsvpChangeNotificationParams = {
  hostEmail: string;
  eventTitle: string;
  guestName: string;
  status: string;
  plusOnesConfirmed: number;
  manageUrl: string;
};

export async function sendRsvpChangeNotification(params: RsvpChangeNotificationParams): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send RSVP change notification to", params.hostEmail);
    }
    return { ok: true };
  }
  const from = cfg.emailFrom;
  const subject = `RSVP update: ${params.guestName} – ${params.eventTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>${escapeHtml(params.guestName)} updated their RSVP for <strong>${escapeHtml(params.eventTitle)}</strong>.</p>
  <p><strong>Status:</strong> ${escapeHtml(params.status)}<br/><strong>Plus-ones:</strong> ${params.plusOnesConfirmed}</p>
  <p><a href="${escapeHtml(params.manageUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">View event</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Rondivu</p>
</body>
</html>`;
  const text = `${params.guestName} updated their RSVP for ${params.eventTitle}. Status: ${params.status}, Plus-ones: ${params.plusOnesConfirmed}. View: ${params.manageUrl}`;
  if (cfg.provider === "smtp") return sendViaSmtp({ to: params.hostEmail, from, subject, html, text, cfg });
  if (cfg.provider === "resend") return sendViaResend({ to: params.hostEmail, from, subject, html, text, cfg });
  return { ok: true };
}

export type NewGuestNotificationParams = {
  hostEmail: string;
  eventTitle: string;
  guestName: string;
  manageUrl: string;
};

export async function sendNewGuestNotification(params: NewGuestNotificationParams): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send new guest notification to", params.hostEmail);
    }
    return { ok: true };
  }
  const from = cfg.emailFrom;
  const subject = `New guest added: ${params.guestName} – ${params.eventTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>A new guest <strong>${escapeHtml(params.guestName)}</strong> was added to <strong>${escapeHtml(params.eventTitle)}</strong>.</p>
  <p><a href="${escapeHtml(params.manageUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">View event</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Rondivu</p>
</body>
</html>`;
  const text = `New guest ${params.guestName} was added to ${params.eventTitle}. View: ${params.manageUrl}`;
  if (cfg.provider === "smtp") return sendViaSmtp({ to: params.hostEmail, from, subject, html, text, cfg });
  if (cfg.provider === "resend") return sendViaResend({ to: params.hostEmail, from, subject, html, text, cfg });
  return { ok: true };
}

export type NewCommentNotificationParams = {
  hostEmail: string;
  eventTitle: string;
  authorName: string;
  content: string;
  manageUrl: string;
};

export async function sendNewCommentNotification(params: NewCommentNotificationParams): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send new comment notification to", params.hostEmail);
    }
    return { ok: true };
  }
  const from = cfg.emailFrom;
  const subject = `New comment: ${params.authorName} – ${params.eventTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p><strong>${escapeHtml(params.authorName)}</strong> posted a comment on <strong>${escapeHtml(params.eventTitle)}</strong>:</p>
  <blockquote style="margin: 16px 0; padding: 12px; background: #f4f4f5; border-radius: 8px;">${escapeHtml(params.content)}</blockquote>
  <p><a href="${escapeHtml(params.manageUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">View event</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Rondivu</p>
</body>
</html>`;
  const text = `${params.authorName} commented on ${params.eventTitle}: "${params.content}"\n\nView: ${params.manageUrl}`;
  if (cfg.provider === "smtp") return sendViaSmtp({ to: params.hostEmail, from, subject, html, text, cfg });
  if (cfg.provider === "resend") return sendViaResend({ to: params.hostEmail, from, subject, html, text, cfg });
  return { ok: true };
}

export type ReplyToCommentNotificationParams = {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  replierName: string;
  originalComment: string;
  replyContent: string;
  rsvpUrl: string;
};

export async function sendReplyToCommentNotification(params: ReplyToCommentNotificationParams): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send reply notification to", params.recipientEmail);
    }
    return { ok: true };
  }
  if (!params.recipientEmail?.trim()) return { ok: true };
  const from = cfg.emailFrom;
  const subject = `${params.replierName} replied to your comment – ${params.eventTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>Hi ${escapeHtml(params.recipientName)},</p>
  <p><strong>${escapeHtml(params.replierName)}</strong> replied to your comment on <strong>${escapeHtml(params.eventTitle)}</strong>.</p>
  <p>Your comment:</p>
  <blockquote style="margin: 8px 0; padding: 12px; background: #f4f4f5; border-radius: 8px;">${escapeHtml(params.originalComment)}</blockquote>
  <p>${escapeHtml(params.replierName)}'s reply:</p>
  <blockquote style="margin: 8px 0; padding: 12px; background: #f4f4f5; border-radius: 8px;">${escapeHtml(params.replyContent)}</blockquote>
  <p><a href="${escapeHtml(params.rsvpUrl)}" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">View & reply</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Rondivu</p>
</body>
</html>`;
  const text = `Hi ${params.recipientName},\n\n${params.replierName} replied to your comment on ${params.eventTitle}.\n\nYour comment: "${params.originalComment}"\n\nReply: "${params.replyContent}"\n\nView: ${params.rsvpUrl}`;
  if (cfg.provider === "smtp") return sendViaSmtp({ to: params.recipientEmail, from, subject, html, text, cfg });
  if (cfg.provider === "resend") return sendViaResend({ to: params.recipientEmail, from, subject, html, text, cfg });
  return { ok: true };
}

export type EventDetailsToGuestParams = {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  hostName: string;
  startTime: Date;
  location?: string | null;
  eventDetailsUrl: string;
  themeColor?: string | null;
};

export async function sendEventDetailsToGuest(params: EventDetailsToGuestParams): Promise<SendResult> {
  const cfg = await getConfig();
  if (cfg.provider === "none") {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] no-op: would send event details to", params.guestEmail, "for", params.eventTitle);
    }
    return { ok: true };
  }
  if (!params.guestEmail?.trim()) {
    return { ok: true };
  }
  const from = cfg.emailFrom;
  const subject = `Event details: ${params.eventTitle}`;
  const startStr = params.startTime.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const accentColor = params.themeColor || "#18181b";
  const locationLine = params.location?.trim()
    ? `<p><strong>Where:</strong> ${escapeHtml(params.location)}</p>`
    : "";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <p>Hi ${escapeHtml(params.guestName)},</p>
  <p>Thanks for RSVPing to <strong>${escapeHtml(params.eventTitle)}</strong>!</p>
  <p><strong>When:</strong> ${escapeHtml(startStr)}</p>
  ${locationLine}
  <p>Save this link to view event details, see who&apos;s coming, and leave comments:</p>
  <p><a href="${escapeHtml(params.eventDetailsUrl)}" style="display: inline-block; background: ${accentColor}; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; margin-top: 8px;">View event details</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Sent by Rondivu</p>
</body>
</html>`;

  const text = `
Hi ${params.guestName},

Thanks for RSVPing to ${params.eventTitle}!

When: ${startStr}
${params.location?.trim() ? `Where: ${params.location}\n` : ""}

View event details: ${params.eventDetailsUrl}

—
Sent by Rondivu
`.trim();

  if (cfg.provider === "smtp") {
    return sendViaSmtp({
      to: params.guestEmail.trim().toLowerCase(),
      from,
      subject,
      html,
      text,
      cfg,
    });
  }
  if (cfg.provider === "resend") {
    return sendViaResend({
      to: params.guestEmail.trim().toLowerCase(),
      from,
      subject,
      html,
      text,
      cfg,
    });
  }
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
