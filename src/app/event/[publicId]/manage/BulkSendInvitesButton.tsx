"use client";

import { useState, useTransition } from "react";

import { bulkSendInvitesAction } from "./actions";

type Props = {
  publicId: string;
  adminKey: string;
  guestCountWithEmail: number;
  emailConfigured?: boolean;
};

export function BulkSendInvitesButton({
  publicId,
  adminKey,
  guestCountWithEmail,
  emailConfigured = true,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    ok: boolean;
    error?: string;
    sent?: number;
    failed?: number;
  } | null>(null);

  const canSend = emailConfigured && guestCountWithEmail > 0;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <form
        action={(formData) => {
          setResult(null);
          startTransition(async () => {
            const res = await bulkSendInvitesAction(formData);
            setResult(res);
            if (res.ok) {
              setTimeout(() => setResult(null), 5000);
            }
          });
        }}
      >
        <input type="hidden" name="publicId" value={publicId} />
        <input type="hidden" name="adminKey" value={adminKey} />
        <button
          type="submit"
          disabled={!canSend || pending}
          title={!emailConfigured ? "Configure email in Settings to send invites" : undefined}
          className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-600 bg-emerald-50 px-4 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
        >
          {pending ? "Sending…" : `Send invites to all (${guestCountWithEmail})`}
        </button>
      </form>
      {result && (
        <span
          className={`text-xs ${
            result.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.ok
            ? `Sent to ${result.sent} guest(s).${result.failed ? ` ${result.failed} failed.` : ""}`
            : result.error}
        </span>
      )}
    </div>
  );
}
