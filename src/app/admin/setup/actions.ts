"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  hasAnyUser,
  isAdminPasswordConfigured,
  sessionFromUser,
  setAdminSessionCookie,
} from "@/lib/auth";
import { sanitizeReturnTo } from "@/lib/safe-redirect";
import { setSetting } from "@/lib/settings";

export async function setupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"), "/settings");

  if (await hasAnyUser()) {
    redirect("/admin/login");
  }

  if (await isAdminPasswordConfigured()) {
    redirect("/admin/migrate");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/setup?error=invalid_email");
  }

  if (password.length < 8) {
    redirect("/admin/setup?error=too_short");
  }

  if (password !== confirm) {
    redirect(`/admin/setup?error=mismatch&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  await setSetting("admin_session_secret", Buffer.from(bytes).toString("base64url"));

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      canCreateEvent: true,
      canModifySettings: true,
    },
  });

  const session = sessionFromUser(user);
  const token = await createUserSession(session);
  await setAdminSessionCookie(token);

  redirect(returnTo);
}
