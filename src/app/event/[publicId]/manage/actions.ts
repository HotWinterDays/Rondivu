"use server";

import { prisma } from "@/lib/prisma";
import { buildRsvpUrl, isEmailConfigured, sendInvite } from "@/lib/email";

export async function sendInviteAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");
  const guestToken = String(formData.get("guestToken") ?? "");

  if (!publicId || !adminKey || !guestToken) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true, title: true, hostName: true, startTime: true },
  });

  if (!event || event.adminKey !== adminKey) {
    return { ok: false as const, error: "Invalid or unauthorized" };
  }

  const guest = await prisma.guest.findFirst({
    where: { eventId: event.id, token: guestToken },
    select: { name: true, email: true },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest not found" };
  }

  if (!isEmailConfigured()) {
    return { ok: false as const, error: "Email is not configured. Set EMAIL_PROVIDER and provider-specific env vars." };
  }

  const rsvpUrl = buildRsvpUrl(publicId, guestToken);
  const result = await sendInvite({
    guestName: guest.name,
    guestEmail: guest.email,
    eventTitle: event.title,
    hostName: event.hostName,
    startTime: event.startTime,
    rsvpUrl,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  return { ok: true as const };
}
