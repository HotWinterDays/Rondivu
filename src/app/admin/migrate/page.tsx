import Link from "next/link";
import { redirect } from "next/navigation";

import { needsMigration } from "@/lib/auth";
import { migrateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMigratePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const raw = await searchParams;
  const returnTo = typeof raw.returnTo === "string" ? raw.returnTo : raw.returnTo?.[0];
  const error = typeof raw.error === "string" ? raw.error : raw.error?.[0];
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/settings";

  if (!(await needsMigration())) {
    redirect("/admin/login");
  }

  const errorMessage =
    error === "invalid"
      ? "Incorrect password."
      : error === "invalid_email"
        ? "Enter a valid email address."
        : error === "too_short"
          ? "Password must be at least 8 characters."
          : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Complete migration</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your email to finish setting up user accounts. Use your existing admin password.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
            {errorMessage}
          </div>
        )}

        <form action={migrateAction} className="mt-8 space-y-6">
          <input type="hidden" name="returnTo" value={safeReturnTo} />
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Admin password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10"
              placeholder="Current admin password"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Migrate
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
