import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { RsvpForm } from "./RsvpForm";

export default async function GuestRsvpPage({
  params,
}: {
  params: Promise<{ publicId: string; token: string }>;
}) {
  const { publicId, token } = await params;
  const event = await prisma.event.findUnique({
    where: { publicId },
    select: { bannerImageUrl: true, themeColor: true },
  });
  if (!event) notFound();
  return (
    <RsvpForm
      publicId={publicId}
      token={token}
      bannerImageUrl={event.bannerImageUrl}
      themeColor={event.themeColor}
    />
  );
}
