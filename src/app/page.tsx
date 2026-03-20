import Link from "next/link";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  let myEvents: { publicId: string; adminKey: string; title: string; startTime: Date }[] = [];
  if (session?.userId) {
    myEvents = await prisma.event.findMany({
      where: { createdById: session.userId },
      orderBy: { startTime: "desc" },
      select: { publicId: true, adminKey: true, title: true, startTime: true },
    });
  }

  const showMyEvents = !!session?.userId && myEvents.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {showMyEvents && (
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold tracking-tight">Your events</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Events you created. Use the manage link to view guests and send invites.
          </p>
          <ul className="mt-4 space-y-3">
            {myEvents.map((e) => {
              const dateStr = new Date(e.startTime).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <li
                  key={e.publicId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">{e.title}</div>
                    <div className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{dateStr}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/event/${encodeURIComponent(e.publicId)}/manage?key=${encodeURIComponent(e.adminKey)}`}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/e/${encodeURIComponent(e.publicId)}`}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      View event
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Minimal invites. Self-hosted RSVPs.
            </h1>
            <p className="mt-3 text-pretty text-zinc-600 dark:text-zinc-400">
              Rondivu lets you create events, manage guest lists (plus-ones included), and collect RSVPs
              with a clean, responsive UI—designed for simple Docker deployment.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/create-event"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Create an event
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-medium">Create</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Event details, host info, and guest list in one flow.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-medium">RSVP</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Guest-friendly RSVP with attendee counts and notes.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-medium">Manage</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Admin dashboard link shows totals and guest status.
          </div>
        </div>
      </section>
    </div>
  );
}
