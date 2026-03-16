"use server";

import { requirePermission } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";
import { setSetting } from "@/lib/settings";

export async function sendTestEmailAction(formData: FormData) {
  await requirePermission("modifySettings", "/settings");
  const to = String(formData.get("to") ?? "").trim();
  const result = await sendTestEmail(to);
  return result;
}

const VALID_PROVIDERS = new Set(["none", "smtp", "resend"]);
const VALID_SMTP_SECURE = new Set(["true", "false", "1", "0"]);

export async function saveEmailConfigAction(formData: FormData) {
  await requirePermission("modifySettings", "/settings");

  let provider = String(formData.get("provider") ?? "").trim().toLowerCase();
  if (!VALID_PROVIDERS.has(provider)) provider = "none";

  let smtpSecure = String(formData.get("smtpSecure") ?? "").trim().toLowerCase();
  if (!VALID_SMTP_SECURE.has(smtpSecure)) smtpSecure = "false";

  const settings: Record<string, string> = {
    provider,
    smtpSecure,
    emailFrom: String(formData.get("emailFrom") ?? "").trim(),
    appUrl: String(formData.get("appUrl") ?? "").trim(),
    smtpHost: String(formData.get("smtpHost") ?? "").trim(),
    smtpPort: String(formData.get("smtpPort") ?? "").trim(),
    smtpUser: String(formData.get("smtpUser") ?? "").trim(),
    smtpPass: String(formData.get("smtpPass") ?? "").trim(),
    resendApiKey: String(formData.get("resendApiKey") ?? "").trim(),
  };

  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value);
  }
  return { ok: true };
}
