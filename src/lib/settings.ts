import { prisma } from "@/lib/prisma";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getEmailConfig(): Promise<{
  provider: string;
  emailFrom: string;
  appUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: string;
  smtpUser: string;
  smtpPass: string;
  resendApiKey: string;
}> {
  const defaults = {
    provider: "none",
    emailFrom: "",
    appUrl: process.env.APP_URL ?? "http://localhost:3000",
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: "false",
    smtpUser: "",
    smtpPass: "",
    resendApiKey: "",
  };
  const keys = Object.keys(defaults) as (keyof typeof defaults)[];
  const values = await Promise.all(keys.map((k) => getSetting(k)));
  keys.forEach((k, i) => {
    if (values[i] != null) (defaults as Record<string, string>)[k] = values[i]!;
  });
  return defaults;
}
