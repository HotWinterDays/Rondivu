"use client";

import { useState, useTransition } from "react";

import { sendInviteAction } from "@/app/event/[publicId]/manage/actions";

type Props = {
  publicId: string;
  adminKey: string;
  guestToken: string;
  guestEmail: string | null;
  disabled?: boolean;
};

export function SendInviteButton({ publicId, adminKey, guestToken, guestEmail, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await sendInviteAction(formData);
      setResult(res);
    });
  }

  // Need to fix - useState is not imported. Let me add it.
  return (
    <form action={handleSubmit} className="inline">
      <input type="hidden" name="publicId" value={publicId} />
      <input type="hidden" name="adminKey" value={adminKey} />
      <input type="hidden" name="guestToken" value={guestToken} />
      <button
        type="submit"
        disabled={disabled || !guestEmail?.trim() || pending}
        className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
      {result && (
        <span
          className={`ml-2 text-xs ${result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        >
          {result.ok ? "Sent!" : result.error}
        </span>
      )}
    </form>
  );
}
