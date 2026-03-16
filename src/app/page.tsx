export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl">
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
            <a
              href="https://github.com/HotWinterDays/rondivu"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-950 hover:bg-zinc-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              View repo
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
