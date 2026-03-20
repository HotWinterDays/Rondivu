"use server";

import { prisma } from "@/lib/prisma";
import { addCommentSchema, addReplySchema, reactionTypeSchema } from "@/lib/validation";
import {
  buildEventDetailsUrlFromConfig,
  buildRsvpUrlFromConfig,
  getAppBaseUrl,
  sendEventDetailsToGuest,
  sendNewCommentNotification,
  sendReplyToCommentNotification,
  sendRsvpChangeNotification,
} from "@/lib/email";

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
      email: true,
      plusOnesAllowed: true,
      event: {
        select: {
          publicId: true,
          adminKey: true,
          title: true,
          hostName: true,
          hostEmail: true,
          location: true,
          themeColor: true,
          startTime: true,
          notifyOnRsvpChange: true,
          emailGuestsEventDetailsOnRsvp: true,
        },
      },
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

  if (
    (safeStatus === "ACCEPTED" || safeStatus === "MAYBE") &&
    guest.event.emailGuestsEventDetailsOnRsvp &&
    guest.email?.trim()
  ) {
    const eventDetailsUrl = await buildEventDetailsUrlFromConfig(guest.event.publicId, token);
    sendEventDetailsToGuest({
      guestName: guest.name,
      guestEmail: guest.email,
      eventTitle: guest.event.title,
      hostName: guest.event.hostName,
      startTime: guest.event.startTime,
      location: guest.event.location,
      eventDetailsUrl,
      themeColor: guest.event.themeColor,
    }).catch(() => {});
  }

  return { ok: true as const, publicId: guest.event.publicId };
}

export async function addCommentAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const contentRaw = String(formData.get("content") ?? "").trim();

  const parsed = addCommentSchema.safeParse({ content: contentRaw });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: (first?.message as string) ?? "Invalid comment" };
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      status: true,
      event: {
        select: {
          id: true,
          publicId: true,
          adminKey: true,
          title: true,
          hostEmail: true,
          allowGuestComments: true,
          notifyOnNewComment: true,
        },
      },
    },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  if (!guest.event.allowGuestComments) {
    return { ok: false as const, error: "Comments are not enabled for this event." };
  }

  if (guest.status === "PENDING") {
    return { ok: false as const, error: "Please submit your RSVP before commenting." };
  }

  await prisma.comment.create({
    data: {
      eventId: guest.event.id,
      guestId: guest.id,
      content: parsed.data.content,
    },
  });

  if (guest.event.notifyOnNewComment && guest.event.hostEmail) {
    const baseUrl = await getAppBaseUrl();
    const manageUrl = `${baseUrl}/event/${guest.event.publicId}/manage?key=${guest.event.adminKey}`;
    sendNewCommentNotification({
      hostEmail: guest.event.hostEmail,
      eventTitle: guest.event.title,
      authorName: guest.name,
      content: parsed.data.content.slice(0, 500),
      manageUrl,
    }).catch(() => {});
  }

  return { ok: true as const };
}

export async function addReplyAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const commentId = String(formData.get("commentId") ?? "");
  const contentRaw = String(formData.get("content") ?? "").trim();

  const parsed = addReplySchema.safeParse({ content: contentRaw });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: (first?.message as string) ?? "Invalid reply" };
  }

  if (!commentId) {
    return { ok: false as const, error: "Invalid comment." };
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      token: true,
      status: true,
      event: {
        select: {
          id: true,
          publicId: true,
          adminKey: true,
          title: true,
          hostEmail: true,
          allowGuestComments: true,
          notifyOnNewComment: true,
          notifyGuestsOnReply: true,
        },
      },
    },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  if (!guest.event.allowGuestComments) {
    return { ok: false as const, error: "Comments are not enabled for this event." };
  }

  if (guest.status === "PENDING") {
    return { ok: false as const, error: "Please submit your RSVP before replying." };
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, eventId: guest.event.id },
    select: {
      id: true,
      content: true,
      guestId: true,
      guest: { select: { name: true, email: true, token: true } },
    },
  });

  if (!comment) {
    return { ok: false as const, error: "Comment not found." };
  }

  await prisma.reply.create({
    data: {
      commentId: comment.id,
      guestId: guest.id,
      content: parsed.data.content,
    },
  });

  const baseUrl = await getAppBaseUrl();
  const manageUrl = `${baseUrl}/event/${guest.event.publicId}/manage?key=${guest.event.adminKey}`;

  if (guest.event.notifyOnNewComment && guest.event.hostEmail) {
    sendNewCommentNotification({
      hostEmail: guest.event.hostEmail,
      eventTitle: guest.event.title,
      authorName: guest.name,
      content: `Reply: ${parsed.data.content.slice(0, 400)}`,
      manageUrl,
    }).catch(() => {});
  }

  if (guest.event.notifyGuestsOnReply && comment.guestId !== guest.id) {
    const recipient = comment.guest;
    if (recipient.email?.trim()) {
      const rsvpUrl = await buildRsvpUrlFromConfig(guest.event.publicId, recipient.token);
      sendReplyToCommentNotification({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        eventTitle: guest.event.title,
        replierName: guest.name,
        originalComment: comment.content.slice(0, 300),
        replyContent: parsed.data.content.slice(0, 300),
        rsvpUrl,
      }).catch(() => {});
    }
  }

  return { ok: true as const };
}

export async function toggleReactionAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const commentId = String(formData.get("commentId") ?? "");
  const typeRaw = String(formData.get("type") ?? "");

  const parsed = reactionTypeSchema.safeParse(typeRaw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid reaction type." };
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      event: { select: { id: true, allowGuestComments: true } },
    },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  if (!guest.event.allowGuestComments) {
    return { ok: false as const, error: "Reactions are not enabled." };
  }

  if (guest.status === "PENDING") {
    return { ok: false as const, error: "Please submit your RSVP first." };
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, eventId: guest.event.id },
    select: { id: true },
  });

  if (!comment) {
    return { ok: false as const, error: "Comment not found." };
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      commentId_guestId: { commentId: comment.id, guestId: guest.id },
    },
  });

  if (existing) {
    if (existing.type === parsed.data) {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.reaction.update({
        where: { id: existing.id },
        data: { type: parsed.data },
      });
    }
  } else {
    await prisma.reaction.create({
      data: {
        commentId: comment.id,
        guestId: guest.id,
        type: parsed.data,
      },
    });
  }

  return { ok: true as const };
}

export async function toggleReplyReactionAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const replyId = String(formData.get("replyId") ?? "");
  const typeRaw = String(formData.get("type") ?? "");

  const parsed = reactionTypeSchema.safeParse(typeRaw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid reaction type." };
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      event: { select: { id: true, allowGuestComments: true } },
    },
  });

  if (!guest) {
    return { ok: false as const, error: "Guest link is invalid or expired." };
  }

  if (!guest.event.allowGuestComments) {
    return { ok: false as const, error: "Reactions are not enabled." };
  }

  if (guest.status === "PENDING") {
    return { ok: false as const, error: "Please submit your RSVP first." };
  }

  const reply = await prisma.reply.findFirst({
    where: {
      id: replyId,
      comment: { eventId: guest.event.id },
    },
    select: { id: true },
  });

  if (!reply) {
    return { ok: false as const, error: "Reply not found." };
  }

  const existing = await prisma.replyReaction.findUnique({
    where: {
      replyId_guestId: { replyId: reply.id, guestId: guest.id },
    },
  });

  if (existing) {
    if (existing.type === parsed.data) {
      await prisma.replyReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.replyReaction.update({
        where: { id: existing.id },
        data: { type: parsed.data },
      });
    }
  } else {
    await prisma.replyReaction.create({
      data: {
        replyId: reply.id,
        guestId: guest.id,
        type: parsed.data,
      },
    });
  }

  return { ok: true as const };
}
