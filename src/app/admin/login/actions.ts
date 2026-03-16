"use server";

import { redirect } from "next/navigation";

import {
  createUserSession,
  getUserByEmail,
  hasAnyUser,
  isAdminPasswordConfigured,
  needsMigration,
  sessionFromUser,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/auth";
import { sanitizeReturnTo } from "@/lib/safe-redirect";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"));

  if (!(await hasAnyUser()) && !(await isAdminPasswordConfigured())) {
    redirect("/admin/setup");
  }

  if (await needsMigration()) {
    redirect("/admin/migrate");
  }

  // User-based auth
  if (await hasAnyUser()) {
    const user = await getUserByEmail(email);
    if (!user) {
      redirect(`/admin/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
    }
    const bcrypt = await import("bcryptjs");
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      redirect(`/admin/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
    }
    const session = sessionFromUser(user);
    const token = await createUserSession(session);
    await setAdminSessionCookie(token);
    redirect(returnTo);
  }

  // Legacy: single admin password (no users yet, but hash exists - shouldn't happen if migrate works)
  if (await verifyAdminPassword(password)) {
    const { createAdminSession } = await import("@/lib/auth");
    const token = await createAdminSession();
    await setAdminSessionCookie(token);
    redirect(returnTo);
  }

  redirect(`/admin/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
}
