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
        select: { id: true, name: true, status: true, plusOnesConfirmed: true },
        orderBy: { name: "asc" },
      },
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
          {(event.subtitle || (event.description && !event.description.startsWith("<"))) ? (
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              {event.subtitle ?? event.description}
            </p>
          ) : null}
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Hosted by {event.hostName} · {formatDateTime(start)}
            {end ? ` – ${formatDateTime(end)}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </div>
          {event.description && event.description.startsWith("<") ? (
            <div
              className="mt-3 text-sm leading-6 text-zinc-800 dark:text-zinc-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:mt-4 [&_h2]:font-semibold"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
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

        {event.showAttendeesToGuests && event.guests.length > 0 ? (
          <div
            className="mt-6 rounded-2xl border-2 bg-zinc-50 p-6 dark:bg-white/5"
            style={{ borderColor: accentColor }}
          >
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Who&apos;s coming</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {event.guests.length} {event.guests.length === 1 ? "person has" : "people have"} RSVPed
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {event.guests.map((g) => (
                <li
                  key={g.id}
                  className="rounded-full bg-white/80 px-3 py-1 text-sm text-zinc-800 dark:bg-white/10 dark:text-zinc-200"
                >
                  {g.name}
                  {g.plusOnesConfirmed > 0 ? ` +${g.plusOnesConfirmed}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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

