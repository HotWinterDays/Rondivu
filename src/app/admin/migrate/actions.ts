"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  needsMigration,
  sessionFromUser,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";

const HASH_KEY = "admin_password_hash";

export async function migrateAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/settings").trim() || "/settings";

  if (!(await needsMigration())) {
    redirect("/admin/login");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/migrate?error=invalid_email");
  }

  if (!(await verifyAdminPassword(password))) {
    redirect(`/admin/migrate?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const hash = await getSetting(HASH_KEY);
  if (!hash) redirect("/admin/login");

  const passwordHash = hash;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      canCreateEvent: true,
      canModifySettings: true,
    },
  });

  await setSetting(HASH_KEY, "");
  const session = sessionFromUser(user);
  const token = await createUserSession(session);
  await setAdminSessionCookie(token);

  redirect(returnTo);
}
