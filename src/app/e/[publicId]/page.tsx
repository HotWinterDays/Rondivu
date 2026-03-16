import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GuestEventPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: {
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
      hostName: true,
      bannerImageUrl: true,
      themeColor: true,
    },
  });

  if (!event) notFound();

  const start = new Date(event.startTime);
  const end = event.endTime ? new Date(event.endTime) : null;
  const accentColor = event.themeColor || "#3b82f6";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className="overflow-hidden rounded-2xl border-2 bg-white shadow-sm dark:bg-zinc-950"
        style={{ borderColor: accentColor }}
      >
        {event.bannerImageUrl ? (
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            <img
              src={event.bannerImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Hosted by {event.hostName} · {formatDateTime(start)}
            {end ? ` – ${formatDateTime(end)}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </div>
          {event.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-200">
              {event.description}
            </p>
          ) : null}
        </div>

        <div
          className="mt-10 rounded-2xl border-2 bg-zinc-50 p-6 dark:bg-white/5"
          style={{ borderColor: accentColor }}
        >
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Use the personal RSVP link your host sent you to respond. Each guest has a unique link.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

