import Link from "next/link";

export default async function CreateEventSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ publicId?: string; key?: string }>;
}) {
  const { publicId, key } = await searchParams;

  const publicUrl = publicId ? `/e/${encodeURIComponent(publicId)}` : null;
  const adminUrl = publicId && key ? `/event/${encodeURIComponent(publicId)}/manage?key=${encodeURIComponent(key)}` : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Event created</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Save your admin link. Anyone with it can manage the guest list.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-medium">Guest link</div>
            <div className="mt-2 break-all text-sm text-zinc-700 dark:text-zinc-300">
              {publicUrl ?? "Missing publicId (unexpected)."}
            </div>
            {publicUrl ? (
              <div className="mt-3">
                <Link className="text-sm font-medium underline underline-offset-4" href={publicUrl}>
                  Open guest page
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-medium">Admin link</div>
            <div className="mt-2 break-all text-sm text-zinc-700 dark:text-zinc-300">
              {adminUrl ?? "Missing admin key (unexpected)."}
            </div>
            {adminUrl ? (
              <div className="mt-3">
                <Link className="text-sm font-medium underline underline-offset-4" href={adminUrl}>
                  Open admin dashboard
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10">
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

