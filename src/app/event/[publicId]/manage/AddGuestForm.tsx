"use client";

import { useState, useTransition } from "react";

import { addGuestAction } from "./actions";

type Props = {
  publicId: string;
  adminKey: string;
};

export function AddGuestForm({ publicId, adminKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-950 dark:text-zinc-50"
      >
        Add guest
        <span className="text-zinc-500">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <form
          className="mt-4 space-y-3"
          action={(formData) => {
            setError(null);
            formData.set("publicId", publicId);
            formData.set("adminKey", adminKey);
            startTransition(async () => {
              const res = await addGuestAction(formData);
              if (res.ok) {
                window.location.reload();
              } else {
                setError(res.error ?? "Could not add guest.");
              }
            });
          }}
        >
          <input type="hidden" name="publicId" value={publicId} />
          <input type="hidden" name="adminKey" value={adminKey} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="add-guest-name" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Name *
              </label>
              <input
                id="add-guest-name"
                name="name"
                required
                maxLength={100}
                placeholder="Guest name"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="add-guest-email" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Email (optional)
              </label>
              <input
                id="add-guest-email"
                name="email"
                type="email"
                placeholder="guest@example.com"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="add-guest-plusones" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Plus-ones granted
              </label>
              <p className="mb-1 text-[10px] text-zinc-500">How many additional people can this guest bring? (0–10)</p>
              <input
                id="add-guest-plusones"
                name="plusOnesAllowed"
                type="number"
                min={0}
                max={10}
                defaultValue={0}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="add-guest-note" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Note (internal)
              </label>
              <input
                id="add-guest-note"
                name="note"
                maxLength={500}
                placeholder="Optional"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {pending ? "Adding…" : "Add guest"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium dark:border-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
