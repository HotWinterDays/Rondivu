import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SendInviteButton } from "@/components/SendInviteButton";
import { AddGuestForm } from "./AddGuestForm";
import { BulkSendInvitesButton } from "./BulkSendInvitesButton";
import { DeleteEventButton } from "./DeleteEventButton";
import { EditEventForm } from "./EditEventForm";
import { hasAnyUser, isAdminPasswordConfigured, needsMigration, verifyAdminSession } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export default async function ManageEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ key?: string; status?: string }>;
}) {
  const { publicId } = await params;
  const { key, status } = await searchParams;

  const returnTo = `/event/${publicId}/manage?key=${key ?? ""}&status=${status ?? "ALL"}`;
  if (!(await hasAnyUser()) && !(await isAdminPasswordConfigured())) {
    redirect(`/admin/setup?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (await needsMigration()) {
    redirect(`/admin/migrate?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const valid = await verifyAdminSession();
  if (!valid) {
    redirect(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const event = await prisma.event.findUnique({
    where: { publicId },
    select: {
      title: true,
      subtitle: true,
      description: true,
      adminKey: true,
      notifyOnRsvpChange: true,
      notifyOnNewGuest: true,
      guests: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          plusOnesAllowed: true,
          plusOnesConfirmed: true,
          plusOneDetails: true,
          respondedAt: true,
          guestMessage: true,
          token: true,
          note: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();
  if (!key || key !== event.adminKey) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">Admin access required</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This page requires the event admin key. Use the admin link you received after creating the event.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const emailConfigured = await isEmailConfigured();
  const guestCountWithEmail = event.guests.filter((g) => g.email?.trim()).length;
  const filteredGuests =
    status && status !== "ALL" ? event.guests.filter((g) => g.status === status) : event.guests;

  const counts = event.guests.reduce(
    (acc, g) => {
      acc.invited += 1;
      acc.totalAttendees += 1 + (g.status === "DECLINED" ? 0 : g.plusOnesConfirmed);
      acc[g.status] += 1;
      return acc;
    },
    {
      invited: 0,
      totalAttendees: 0,
      PENDING: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      MAYBE: 0,
    } as Record<string, number>,
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Admin dashboard · Save this URL. Anyone with it can view guests and RSVP links.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/settings"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Settings
            </Link>
            <Link
              href={`/e/${encodeURIComponent(publicId)}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Open guest page
            </Link>
            <DeleteEventButton publicId={publicId} adminKey={key} />
          </div>
        </div>

        <details className="mt-8 group">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50">
            Edit event details
          </summary>
          <EditEventForm
            publicId={publicId}
            adminKey={key}
            initialTitle={event.title}
            initialSubtitle={event.subtitle}
            initialDescription={event.description}
            initialNotifyOnRsvpChange={event.notifyOnRsvpChange}
            initialNotifyOnNewGuest={event.notifyOnNewGuest}
          />
        </details>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Stat label="Invited" value={counts.invited} />
          <Stat label="Accepted" value={counts.ACCEPTED} />
          <Stat label="Maybe" value={counts.MAYBE} />
          <Stat label="Declined" value={counts.DECLINED} />
          <Stat label="Attendees" value={counts.totalAttendees} />
        </div>

        <div className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">Guests</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Filter by RSVP status and copy each guest’s RSVP link.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <BulkSendInvitesButton
                publicId={publicId}
                adminKey={key}
                guestCountWithEmail={guestCountWithEmail}
                emailConfigured={emailConfigured}
              />
              <div className="flex flex-wrap gap-2">
              {(["ALL", "PENDING", "ACCEPTED", "MAYBE", "DECLINED"] as const).map((s) => (
                <Link
                  key={s}
                  href={`/event/${encodeURIComponent(publicId)}/manage?key=${encodeURIComponent(key)}&status=${encodeURIComponent(s)}`}
                  className={[
                    "inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium",
                    (status ?? "ALL") === s
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                      : "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/5",
                  ].join(" ")}
                >
                  {s}
                </Link>
              ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <AddGuestForm publicId={publicId} adminKey={key} />
            {filteredGuests.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{g.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {g.email ? g.email : "No email"} · Status: {g.status} · Plus-ones: {g.plusOnesConfirmed}/
                      {g.plusOnesAllowed} (granted)
                      {g.respondedAt ? ` · Responded: ${new Date(g.respondedAt).toLocaleString()}` : ""}
                    </div>
                    {formatPlusOneDetails(g.plusOneDetails) ? (
                      <div className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="font-medium">Plus-ones:</span> {formatPlusOneDetails(g.plusOneDetails)}
                      </div>
                    ) : null}
                    {g.guestMessage ? (
                      <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
                        <span className="font-medium">Guest note:</span> {g.guestMessage}
                      </div>
                    ) : null}
                    {g.note ? (
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="font-medium">Internal:</span> {g.note}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">RSVP link</div>
                    <div className="break-all text-xs text-zinc-700 dark:text-zinc-300">
                      {`/e/${publicId}/g/${g.token}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CopyLinkButton url={`/e/${publicId}/g/${g.token}`} />
                      <SendInviteButton
                        publicId={publicId}
                        adminKey={key}
                        guestToken={g.token}
                        guestEmail={g.email}
                      />
                      <Link
                        href={`/e/${encodeURIComponent(publicId)}/g/${encodeURIComponent(g.token)}`}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                      >
                        Open RSVP
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredGuests.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                No guests match this filter.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPlusOneDetails(details: unknown): string {
  if (!details || !Array.isArray(details)) return "";
  const parts = (details as { name?: string; email?: string }[])
    .filter((p) => (p.name ?? "").trim() || (p.email ?? "").trim())
    .map((p) => {
      const n = (p.name ?? "").trim();
      const e = (p.email ?? "").trim();
      return n && e ? `${n} (${e})` : n || e || "";
    });
  return parts.join("; ") || "";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

