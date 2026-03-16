import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { RsvpForm } from "./RsvpForm";

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
        select: { publicId: true, bannerImageUrl: true, themeColor: true },
      },
    },
  });
  if (!guest || guest.event.publicId !== publicId) notFound();
  const plusOneDetails = (guest.plusOneDetails as { name?: string; email?: string }[] | null) ?? [];
  return (
    <RsvpForm
      publicId={guest.event.publicId}
      token={token}
      bannerImageUrl={guest.event.bannerImageUrl}
      themeColor={guest.event.themeColor}
      plusOnesAllowed={guest.plusOnesAllowed}
      initialPlusOneDetails={plusOneDetails}
    />
  );
}
