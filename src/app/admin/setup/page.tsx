import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminPasswordConfigured } from "@/lib/auth";
import { setupAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const raw = await searchParams;
  const returnTo = typeof raw.returnTo === "string" ? raw.returnTo : raw.returnTo?.[0];
  const error = typeof raw.error === "string" ? raw.error : raw.error?.[0];
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/settings";

  if (await isAdminPasswordConfigured()) {
    redirect("/admin/login");
  }

  const errorMessage =
    error === "too_short"
      ? "Password must be at least 8 characters."
      : error === "mismatch"
        ? "Passwords do not match."
        : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Set up admin</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Create a password to protect Settings and event dashboards. You’ll use this to sign in.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
            {errorMessage}
          </div>
        )}

        <form action={setupAction} className="mt-8 space-y-6">
          <input type="hidden" name="returnTo" value={safeReturnTo} />
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoFocus
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10"
              placeholder="Repeat password"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Create password
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
