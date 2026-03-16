"use client";

import { useMemo, useState, useTransition } from "react";

import { rsvpAction } from "./actions";

export default function GuestRsvpPage({ params }: { params: { publicId: string; token: string } }) {
  const { publicId, token } = params;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"ACCEPTED" | "DECLINED" | "MAYBE">("ACCEPTED");
  const [plusOnesConfirmed, setPlusOnesConfirmed] = useState(0);
  const [guestMessage, setGuestMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attendeeCount = useMemo(() => 1 + (status === "DECLINED" ? 0 : plusOnesConfirmed), [plusOnesConfirmed, status]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">RSVP</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Submit your response. (For now this page doesn’t show the full event details.)
        </p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-100">
            {result}
          </div>
        ) : null}

        <form
          className="mt-8 space-y-8"
          action={(formData) => {
            setError(null);
            setResult(null);
            startTransition(async () => {
              const res = await rsvpAction(formData);
              if (!res.ok) {
                setError(res.error ?? "Could not submit RSVP.");
                return;
              }
              setResult("RSVP saved. Thank you!");
            });
          }}
        >
          <input type="hidden" name="token" value={token} />

          <div className="grid gap-3 sm:grid-cols-3">
            <ChoiceButton selected={status === "ACCEPTED"} onClick={() => setStatus("ACCEPTED")}>
              Going
            </ChoiceButton>
            <ChoiceButton selected={status === "MAYBE"} onClick={() => setStatus("MAYBE")}>
              Maybe
            </ChoiceButton>
            <ChoiceButton selected={status === "DECLINED"} onClick={() => setStatus("DECLINED")}>
              Not going
            </ChoiceButton>
          </div>

          <input type="hidden" name="status" value={status} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">Plus-ones</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="plusOnesConfirmed"
                value={plusOnesConfirmed}
                onChange={(e) => setPlusOnesConfirmed(Number(e.target.value))}
                min={0}
                max={10}
                disabled={status === "DECLINED"}
                className={inputClassName}
              />
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Total attendees: {attendeeCount}</div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Note to host (optional)
            </label>
            <textarea
              name="guestMessage"
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              className={inputClassName}
              rows={4}
              placeholder="Any note for the host"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <a
              href={`/e/${encodeURIComponent(publicId)}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Back
            </a>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? "Saving..." : "Save RSVP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
        selected
          ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
          : "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:ring-white/10";

