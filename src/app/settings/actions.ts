"use server";

import { sendTestEmail } from "@/lib/email";
import { setSetting } from "@/lib/settings";

export async function sendTestEmailAction(formData: FormData) {
  const to = String(formData.get("to") ?? "").trim();
  const result = await sendTestEmail(to);
  return result;
}

export async function saveEmailConfigAction(formData: FormData) {
  const keys = [
    "provider",
    "emailFrom",
    "appUrl",
    "smtpHost",
    "smtpPort",
    "smtpSecure",
    "smtpUser",
    "smtpPass",
    "resendApiKey",
  ] as const;
  for (const key of keys) {
    const value = String(formData.get(key) ?? "").trim();
    await setSetting(key, value);
  }
  return { ok: true };
}
