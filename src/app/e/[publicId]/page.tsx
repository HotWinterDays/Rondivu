import Link from "next/link";
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
      guests: {
        select: {
          id: true,
          name: true,
          token: true,
          status: true,
          plusOnesAllowed: true,
          plusOnesConfirmed: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  const start = new Date(event.startTime);
  const end = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
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

        <div className="mt-10">
          <h2 className="text-sm font-medium">RSVP links</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            For now, use the per-guest links below to RSVP (this avoids exposing the guest list on the public page later).
          </p>

          <div className="mt-4 space-y-3">
            {event.guests.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{g.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    Status: {g.status} · Plus-ones: {g.plusOnesConfirmed}/{g.plusOnesAllowed}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(g.token)}`}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    RSVP
                  </Link>
                </div>
              </div>
            ))}
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

