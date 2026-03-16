import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { RsvpForm } from "./RsvpForm";

function formatDateTime(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function GuestRsvpPage({
  params,
}: {
  params: Promise<{ publicId: string; token: string }>;
}) {
  const { publicId, token } = await params;
  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      plusOnesAllowed: true,
      plusOneDetails: true,
      event: {
        select: {
          publicId: true,
          title: true,
          subtitle: true,
          description: true,
          location: true,
          startTime: true,
          endTime: true,
          hostName: true,
          bannerImageUrl: true,
          themeColor: true,
          showAttendeesToGuests: true,
          guests: {
            where: { status: { in: ["ACCEPTED", "MAYBE"] } },
            select: { id: true, name: true, plusOnesConfirmed: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });
  if (!guest || guest.event.publicId !== publicId) notFound();
  const plusOneDetails = (guest.plusOneDetails as { name?: string; email?: string }[] | null) ?? [];
  const start = new Date(guest.event.startTime);
  const end = guest.event.endTime ? new Date(guest.event.endTime) : null;
  const dateTimeStr = formatDateTime(start) + (end ? ` – ${formatDateTime(end)}` : "");
  return (
    <RsvpForm
      publicId={guest.event.publicId}
      token={token}
      title={guest.event.title}
      subtitle={guest.event.subtitle}
      description={guest.event.description}
      dateTimeStr={dateTimeStr}
      location={guest.event.location}
      hostName={guest.event.hostName}
      bannerImageUrl={guest.event.bannerImageUrl}
      themeColor={guest.event.themeColor}
      plusOnesAllowed={guest.plusOnesAllowed}
      initialPlusOneDetails={plusOneDetails}
      showAttendeesToGuests={guest.event.showAttendeesToGuests}
      attendees={guest.event.guests}
    />
  );
}
