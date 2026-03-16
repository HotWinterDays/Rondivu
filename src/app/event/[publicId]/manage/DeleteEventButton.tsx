"use client";

import { useState, useTransition } from "react";
import { deleteEventAction } from "./actions";

type Props = { publicId: string; adminKey: string };

export function DeleteEventButton({ publicId, adminKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Delete this event?</span>
        <form
          action={(formData) => {
            formData.set("publicId", publicId);
            formData.set("adminKey", adminKey);
            startTransition(() => deleteEventAction(formData).then(() => {}));
          }}
          className="contents"
        >
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            {pending ? "Deleting..." : "Yes, delete"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30"
    >
      Delete event
    </button>
  );
}
