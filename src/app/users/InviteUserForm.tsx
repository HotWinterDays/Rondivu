"use client";

import { useState, useTransition } from "react";

import { inviteUserAction } from "./actions";

type Props = { className?: string };

export function InviteUserForm({ className }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={className}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await inviteUserAction(formData);
          if (res.ok) {
            window.location.reload();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Invite user</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Send an invite email. The user will set their password via the link.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="canCreateEvent" value="1" className="rounded border-zinc-300" />
            Create event
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="canModifySettings" value="1" className="rounded border-zinc-300" />
            Modify settings
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Sending..." : "Send invite"}
        </button>
      </div>
    </form>
  );
}
