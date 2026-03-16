"use server";

import { prisma } from "@/lib/prisma";

export async function rsvpAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  const plusOnesConfirmed = Number(formData.get("plusOnesConfirmed") ?? 0);
  const guestMessageRaw = String(formData.get("guestMessage") ?? "").trim();
  const guestMessage = guestMessageRaw.length > 2000 ? guestMessageRaw.slice(0, 2000) : guestMessageRaw;

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: { id: true, plusOnesAllowed: true, event: { select: { publicId: true } } },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  const allowedStatuses = new Set(["PENDING", "ACCEPTED", "DECLINED", "MAYBE"]);
  const safeStatus = allowedStatuses.has(status) ? (status as "PENDING" | "ACCEPTED" | "DECLINED" | "MAYBE") : "PENDING";

  const safePlusOnes = Number.isFinite(plusOnesConfirmed)
    ? Math.max(0, Math.min(guest.plusOnesAllowed, Math.trunc(plusOnesConfirmed)))
    : 0;

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      status: safeStatus,
      plusOnesConfirmed: safeStatus === "DECLINED" ? 0 : safePlusOnes,
      guestMessage: guestMessage.length > 0 ? guestMessage : null,
      respondedAt: safeStatus === "PENDING" ? null : new Date(),
    },
  });

  return { ok: true as const, publicId: guest.event.publicId };
}

