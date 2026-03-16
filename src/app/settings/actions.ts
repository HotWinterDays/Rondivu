"use server";

import { setSetting } from "@/lib/settings";

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
