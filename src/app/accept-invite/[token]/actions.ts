"use server";

import { prisma } from "@/lib/prisma";
import { createUserSession, sessionFromUser, setAdminSessionCookie } from "@/lib/auth";

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (password.length < 8) {
    return { ok: false as const, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false as const, error: "Passwords do not match." };
  }

  const invite = await prisma.userInvite.findUnique({
    where: { token, usedAt: null },
    select: { id: true, email: true, expiresAt: true, canCreateEvent: true, canModifySettings: true },
  });

  if (!invite) {
    return { ok: false as const, error: "Invalid or expired invite." };
  }
  if (new Date() > invite.expiresAt) {
    return { ok: false as const, error: "This invite has expired." };
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return { ok: false as const, error: "A user with this email already exists." };
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      passwordHash,
      role: "USER",
      canCreateEvent: invite.canCreateEvent,
      canModifySettings: invite.canModifySettings,
    },
  });

  await prisma.userInvite.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  const session = sessionFromUser(user);
  const jwt = await createUserSession(session);
  await setAdminSessionCookie(jwt);

  return { ok: true as const };
}
