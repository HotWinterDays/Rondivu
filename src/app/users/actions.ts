"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getEmailConfig } from "@/lib/settings";
import { newInviteToken } from "@/lib/ids";
import { sendUserInvite } from "@/lib/email";

const INVITE_EXPIRY_DAYS = 7;

export async function inviteUserAction(formData: FormData) {
  const session = await requirePermission("modifySettings", "/users");
  if (!session.userId) {
    return { ok: false as const, error: "Please log in again to complete account setup." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const canCreateEvent = formData.get("canCreateEvent") === "1";
  const canModifySettings = formData.get("canModifySettings") === "1";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "A user with this email already exists." };
  }

  const pending = await prisma.userInvite.findFirst({
    where: { email, usedAt: null },
  });
  if (pending) {
    const expired = new Date() > pending.expiresAt;
    if (!expired) {
      return { ok: false as const, error: "An invite for this email is already pending." };
    }
  }

  const token = newInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const { appUrl } = await getEmailConfig();
  const base = appUrl?.replace(/\/$/, "") || process.env.APP_URL || "http://localhost:3000";
  const acceptUrl = `${base}/accept-invite/${token}`;

  const inviter = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  const inviterEmail = inviter?.email ?? "A Rondivu admin";

  await prisma.userInvite.create({
    data: {
      email,
      token,
      invitedById: session.userId,
      canCreateEvent,
      canModifySettings,
      expiresAt,
    },
  });

  const result = await sendUserInvite({
    inviteeEmail: email,
    inviterEmail,
    acceptUrl,
  });

  if (!result.ok) {
    await prisma.userInvite.deleteMany({ where: { token } });
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const };
}

export async function updateUserAction(formData: FormData) {
  await requirePermission("modifySettings", "/users");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "USER");
  const canCreateEvent = formData.get("canCreateEvent") === "on" || formData.get("canCreateEvent") === "1";
  const canModifySettings = formData.get("canModifySettings") === "on" || formData.get("canModifySettings") === "1";

  if (!userId) {
    return { ok: false as const, error: "Invalid user." };
  }

  const validRoles = ["ADMIN", "USER"];
  const safeRole = validRoles.includes(role) ? (role as "ADMIN" | "USER") : "USER";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { ok: false as const, error: "User not found." };
  }

  if (safeRole === "USER") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (user.role === "ADMIN" && adminCount <= 1) {
      return { ok: false as const, error: "Cannot demote the last admin." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: safeRole,
      canCreateEvent: safeRole === "ADMIN" ? true : canCreateEvent,
      canModifySettings: safeRole === "ADMIN" ? true : canModifySettings,
    },
  });

  return { ok: true as const };
}

export async function deleteUserAction(formData: FormData) {
  const session = await requirePermission("modifySettings", "/users");

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { ok: false as const, error: "Invalid user." };
  }

  if (session.userId === userId) {
    return { ok: false as const, error: "You cannot delete your own account." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { ok: false as const, error: "User not found." };
  }

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { ok: false as const, error: "Cannot delete the last admin." };
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  return { ok: true as const };
}
