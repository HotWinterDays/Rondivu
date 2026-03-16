"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { newAdminKey, newGuestToken, newPublicId } from "@/lib/ids";
import { createEventSchema } from "@/lib/validation";

export async function createEventAction(formData: FormData) {
  await requirePermission("createEvent", "/create-event");

  const rawGuests = formData.get("guests");
  const guestsJson = typeof rawGuests === "string" ? rawGuests : "[]";

  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    hostName: formData.get("hostName"),
    hostEmail: formData.get("hostEmail"),
    guests: JSON.parse(guestsJson),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: "Please fix the highlighted fields.",
    };
  }

  const { title, description, location, startTime, endTime, hostName, hostEmail, guests } = parsed.data;
  const publicId = newPublicId();
  const adminKey = newAdminKey();

  const event = await prisma.event.create({
    data: {
      publicId,
      adminKey,
      title,
      description,
      location,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      hostName,
      hostEmail,
      guests: {
        create: guests.map((g) => ({
          name: g.name,
          email: g.email ?? null,
          plusOnesAllowed: g.plusOnesAllowed,
          note: g.note ?? null,
          token: newGuestToken(),
        })),
      },
    },
    select: { id: true, publicId: true, adminKey: true },
  });

  redirect(`/create-event/success?publicId=${encodeURIComponent(event.publicId)}&key=${encodeURIComponent(event.adminKey)}`);
}

