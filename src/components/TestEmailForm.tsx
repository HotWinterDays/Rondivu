"use client";

import { useState, useTransition } from "react";

import { sendTestEmailAction } from "@/app/settings/actions";

type Props = {
  disabled?: boolean;
};

export function TestEmailForm({ disabled }: Props) {
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-medium">Test email</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Save your config first, then send a test email to verify it works.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        action={(formData) => {
          setResult(null);
          startTransition(async () => {
            const res = await sendTestEmailAction(formData);
            setResult(res);
          });
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="test-email" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Send test to
          </label>
          <input
            id="test-email"
            name="to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            disabled={disabled}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:ring-white/10"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Sending…" : "Send test"}
        </button>
      </form>
      {result && (
        <div
          className={`mt-3 rounded-xl px-4 py-2 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
              : "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100"
          }`}
        >
          {result.ok ? "Test email sent. Check the inbox (and spam)." : result.error}
        </div>
      )}
    </div>
  );
}
