"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/settings";
import { buildRsvpUrlFromConfig, getAppBaseUrl, isEmailConfigured, sendInvite, sendNewGuestNotification } from "@/lib/email";
import { guestInputSchema, updateEventSchema } from "@/lib/validation";
import { newGuestToken } from "@/lib/ids";

const BULK_SEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export async function addGuestAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");

  if (!publicId || !adminKey) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true, title: true, hostEmail: true, notifyOnNewGuest: true },
  });

  if (!event || event.adminKey !== adminKey) {
    return { ok: false as const, error: "Invalid or unauthorized" };
  }

  const parsed = guestInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    plusOnesAllowed: formData.get("plusOnesAllowed"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: (first?.message as string) ?? "Invalid guest data" };
  }

  const { name, email, plusOnesAllowed, note } = parsed.data;

  await prisma.guest.create({
    data: {
      eventId: event.id,
      name,
      email: email ?? null,
      plusOnesAllowed: plusOnesAllowed ?? 0,
      note: note ?? null,
      token: newGuestToken(),
    },
  });

  if (event.notifyOnNewGuest && event.hostEmail) {
    const baseUrl = await getAppBaseUrl();
    const manageUrl = `${baseUrl}/event/${publicId}/manage?key=${adminKey}`;
    sendNewGuestNotification({
      hostEmail: event.hostEmail,
      eventTitle: event.title,
      guestName: name,
      manageUrl,
    }).catch(() => {});
  }

  return { ok: true as const };
}

export async function sendInviteAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");
  const guestToken = String(formData.get("guestToken") ?? "");

  if (!publicId || !adminKey || !guestToken) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true, title: true, hostName: true, startTime: true, bannerImageUrl: true, themeColor: true },
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

  const [rsvpUrl, baseUrl] = await Promise.all([buildRsvpUrlFromConfig(publicId, guestToken), getAppBaseUrl()]);
  const bannerFullUrl = event.bannerImageUrl ? `${baseUrl}${event.bannerImageUrl}` : null;
  const result = await sendInvite({
    guestName: guest.name,
    guestEmail: guest.email,
    eventTitle: event.title,
    hostName: event.hostName,
    startTime: event.startTime,
    rsvpUrl,
    bannerImageUrl: bannerFullUrl,
    themeColor: event.themeColor,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  return { ok: true as const };
}

export async function bulkSendInvitesAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");

  if (!publicId || !adminKey) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true, title: true, hostName: true, startTime: true, bannerImageUrl: true, themeColor: true },
  });

  if (!event || event.adminKey !== adminKey) {
    return { ok: false as const, error: "Invalid or unauthorized" };
  }

  if (!(await isEmailConfigured())) {
    return { ok: false as const, error: "Email is not configured. Set up email in Settings first." };
  }

  const cooldownKey = `bulk_send_cooldown_${event.id}`;
  const lastSend = await getSetting(cooldownKey);
  if (lastSend) {
    const elapsed = Date.now() - new Date(lastSend).getTime();
    if (elapsed < BULK_SEND_COOLDOWN_MS) {
      const remainingSec = Math.ceil((BULK_SEND_COOLDOWN_MS - elapsed) / 1000);
      return { ok: false as const, error: `Please wait ${remainingSec}s before sending again.` };
    }
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    select: { name: true, email: true, token: true },
  });

  const withEmail = guests.filter((g) => g.email?.trim());
  if (withEmail.length === 0) {
    return { ok: false as const, error: "No guests have email addresses." };
  }

  const baseUrl = await getAppBaseUrl();
  const bannerFullUrl = event.bannerImageUrl ? `${baseUrl}${event.bannerImageUrl}` : null;

  let sent = 0;
  let failed = 0;
  for (const g of withEmail) {
    const rsvpUrl = await buildRsvpUrlFromConfig(publicId, g.token);
    const result = await sendInvite({
      guestName: g.name,
      guestEmail: g.email!,
      eventTitle: event.title,
      hostName: event.hostName,
      startTime: event.startTime,
      rsvpUrl,
      bannerImageUrl: bannerFullUrl,
      themeColor: event.themeColor,
    });
    if (result.ok) sent++;
    else failed++;
  }

  await setSetting(cooldownKey, new Date().toISOString());

  if (failed > 0 && sent === 0) {
    return { ok: false as const, error: `Failed to send all invites. ${failed} failed.` };
  }
  return {
    ok: true as const,
    sent,
    skipped: withEmail.length - sent - failed,
    failed,
  };
}

export async function updateEventAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");

  if (!publicId || !adminKey) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true },
  });

  if (!event || event.adminKey !== adminKey) {
    return { ok: false as const, error: "Invalid or unauthorized" };
  }

  const parsed = updateEventSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    notifyOnRsvpChange: formData.get("notifyOnRsvpChange"),
    notifyOnNewGuest: formData.get("notifyOnNewGuest"),
    showAttendeesToGuests: formData.get("showAttendeesToGuests"),
    allowGuestComments: formData.get("allowGuestComments"),
    notifyOnNewComment: formData.get("notifyOnNewComment"),
    notifyGuestsOnReply: formData.get("notifyGuestsOnReply"),
    emailGuestsEventDetailsOnRsvp: formData.get("emailGuestsEventDetailsOnRsvp"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: (first?.message as string) ?? "Invalid data" };
  }

  const { title, subtitle, description, notifyOnRsvpChange, notifyOnNewGuest, showAttendeesToGuests, allowGuestComments, notifyOnNewComment, notifyGuestsOnReply, emailGuestsEventDetailsOnRsvp } = parsed.data;
  await prisma.event.update({
    where: { id: event.id },
    data: {
      title,
      subtitle: subtitle ?? null,
      description: description ?? null,
      notifyOnRsvpChange,
      notifyOnNewGuest,
      showAttendeesToGuests: showAttendeesToGuests ?? false,
      allowGuestComments: allowGuestComments ?? false,
      notifyOnNewComment: notifyOnNewComment ?? false,
      notifyGuestsOnReply: notifyGuestsOnReply ?? false,
      emailGuestsEventDetailsOnRsvp: emailGuestsEventDetailsOnRsvp ?? false,
    },
  });

  revalidatePath(`/event/${publicId}/manage`);

  return { ok: true as const };
}

export async function deleteEventAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const adminKey = String(formData.get("adminKey") ?? "");

  if (!publicId || !adminKey) {
    return { ok: false as const, error: "Missing parameters" };
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { id: true, adminKey: true },
  });

  if (!event || event.adminKey !== adminKey) {
    return { ok: false as const, error: "Invalid or unauthorized" };
  }

  await prisma.event.delete({ where: { id: event.id } });
  redirect("/");
}
