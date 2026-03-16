"use server";

import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, sendRsvpChangeNotification } from "@/lib/email";

type PlusOneDetail = { name?: string; email?: string };

export async function rsvpAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  const plusOneDetailsRaw = String(formData.get("plusOneDetails") ?? "[]");
  const guestMessageRaw = String(formData.get("guestMessage") ?? "").trim();
  const guestMessage = guestMessageRaw.length > 2000 ? guestMessageRaw.slice(0, 2000) : guestMessageRaw;

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      plusOnesAllowed: true,
      event: { select: { publicId: true, adminKey: true, title: true, hostEmail: true, notifyOnRsvpChange: true } },
    },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  const allowedStatuses = new Set(["PENDING", "ACCEPTED", "DECLINED", "MAYBE"]);
  const safeStatus = allowedStatuses.has(status) ? (status as "PENDING" | "ACCEPTED" | "DECLINED" | "MAYBE") : "PENDING";

  let plusOneDetails: PlusOneDetail[] = [];
  try {
    const parsed = JSON.parse(plusOneDetailsRaw);
    if (Array.isArray(parsed)) {
      plusOneDetails = parsed
        .slice(0, guest.plusOnesAllowed)
        .map((p: unknown) => {
          if (p && typeof p === "object" && !Array.isArray(p)) {
            const o = p as Record<string, unknown>;
            return {
              name: typeof o.name === "string" ? o.name.trim().slice(0, 100) : "",
              email: typeof o.email === "string" ? o.email.trim().slice(0, 255) : "",
            };
          }
          return { name: "", email: "" };
        });
    }
  } catch {
    plusOneDetails = [];
  }

  const safePlusOnes =
    safeStatus === "DECLINED"
      ? 0
      : plusOneDetails.filter((p) => (p.name ?? "").trim() || (p.email ?? "").trim()).length;

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      status: safeStatus,
      plusOnesConfirmed: safePlusOnes,
      plusOneDetails: safeStatus === "DECLINED" ? [] : plusOneDetails,
      guestMessage: guestMessage.length > 0 ? guestMessage : null,
      respondedAt: safeStatus === "PENDING" ? null : new Date(),
    },
  });

  if (guest.event.notifyOnRsvpChange && guest.event.hostEmail) {
    const baseUrl = await getAppBaseUrl();
    const manageUrl = `${baseUrl}/event/${guest.event.publicId}/manage?key=${guest.event.adminKey}`;
    sendRsvpChangeNotification({
      hostEmail: guest.event.hostEmail,
      eventTitle: guest.event.title,
      guestName: guest.name,
      status: safeStatus,
      plusOnesConfirmed: safePlusOnes,
      manageUrl,
    }).catch(() => {});
  }

  return { ok: true as const, publicId: guest.event.publicId };
}

