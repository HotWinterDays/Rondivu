"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { addCommentAction, rsvpAction } from "./actions";
import { CommentCard } from "@/components/event-comments/CommentCard";

type PlusOneDetail = { name?: string; email?: string };

type Attendee = { id: string; name: string; plusOnesConfirmed: number };

type ReplyItem = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  reactions?: ReactionItem[];
};

type ReactionItem = { type: string; guestId: string };

type CommentItem = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  replies?: ReplyItem[];
  reactions?: ReactionItem[];
};

type Props = {
  publicId: string;
  token: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  dateTimeStr: string;
  location?: string | null;
  hostName: string;
  bannerImageUrl?: string | null;
  themeColor?: string | null;
  plusOnesAllowed: number;
  initialPlusOneDetails?: PlusOneDetail[];
  showAttendeesToGuests?: boolean;
  attendees?: Attendee[];
  allowGuestComments?: boolean;
  comments?: CommentItem[];
  guestHasRsvped?: boolean;
  currentGuestId?: string;
};

export function RsvpForm({
  publicId,
  token,
  title,
  subtitle,
  description,
  dateTimeStr,
  location,
  hostName,
  bannerImageUrl,
  themeColor,
  plusOnesAllowed,
  initialPlusOneDetails = [],
  showAttendeesToGuests = false,
  attendees = [],
  allowGuestComments = false,
  comments = [],
  guestHasRsvped = false,
  currentGuestId,
}: Props) {
  const router = useRouter();
  const accentColor = themeColor || "#3b82f6";
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"ACCEPTED" | "DECLINED" | "MAYBE">("ACCEPTED");
  const [plusOneDetails, setPlusOneDetails] = useState<PlusOneDetail[]>(() =>
    Array.from({ length: plusOnesAllowed }, (_, i) => initialPlusOneDetails[i] ?? { name: "", email: "" })
  );
  const [guestMessage, setGuestMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentPending, setCommentPending] = useState(false);

  const confirmedCount = useMemo(
    () => plusOneDetails.filter((p) => (p.name ?? "").trim() || (p.email ?? "").trim()).length,
    [plusOneDetails]
  );
  const attendeeCount = 1 + (status === "DECLINED" ? 0 : confirmedCount);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="overflow-hidden rounded-2xl border-2 bg-white p-8 shadow-sm dark:bg-zinc-950"
        style={{ borderColor: accentColor }}
      >
        {bannerImageUrl ? (
          <div className="-mx-8 -mt-8 mb-6 h-32 overflow-hidden sm:h-40">
            <img src={bannerImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          ) : null}
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Hosted by {hostName} · {dateTimeStr}
            {location ? ` · ${location}` : ""}
          </p>
          {description && description.startsWith("<") ? (
            <div
              className="mt-3 text-sm leading-6 text-zinc-800 dark:text-zinc-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:mt-4 [&_h2]:font-semibold"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-200">
              {description}
            </p>
          ) : null}
        </div>

        {showAttendeesToGuests && attendees.length > 0 ? (
          <div
            className="mb-6 rounded-2xl border-2 bg-zinc-50 p-5 dark:bg-white/5"
            style={{ borderColor: accentColor }}
          >
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Who&apos;s coming</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {attendees.length} {attendees.length === 1 ? "person has" : "people have"} RSVPed
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {attendees.map((g) => (
                <li
                  key={g.id}
                  className="rounded-full bg-white/80 px-3 py-1 text-sm text-zinc-800 dark:bg-white/10 dark:text-zinc-200"
                >
                  {g.name}
                  {g.plusOnesConfirmed > 0 ? ` +${g.plusOnesConfirmed}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {allowGuestComments ? (
          <div
            className="mb-6 rounded-2xl border-2 bg-zinc-50 p-5 dark:bg-white/5"
            style={{ borderColor: accentColor }}
          >
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Guest comments</h3>
            {comments.length > 0 ? (
              <div className="mt-3 space-y-4">
                {comments.map((c) => (
                  <CommentCard
                    key={c.id}
                    comment={c}
                    token={token}
                    guestHasRsvped={guestHasRsvped}
                    currentGuestId={currentGuestId}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No comments yet.</p>
            )}
            {guestHasRsvped ? (
              <form
                className="mt-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  formData.set("token", token);
                  setCommentError(null);
                  setCommentPending(true);
                  const res = await addCommentAction(formData);
                  setCommentPending(false);
                  if (res.ok) {
                    form.reset();
                    router.refresh();
                  } else {
                    setCommentError(res.error ?? "Could not post comment.");
                  }
                }}
              >
                <textarea
                  name="content"
                  rows={3}
                  maxLength={2000}
                  placeholder="Add a comment..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:ring-white/10"
                />
                {commentError ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{commentError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={commentPending}
                  className="mt-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {commentPending ? "Posting..." : "Post comment"}
                </button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Submit your RSVP above to leave a comment.
              </p>
            )}
          </div>
        ) : null}

        <h2 className="text-lg font-semibold tracking-tight">RSVP</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Submit your response below.</p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p>{result}</p>
            <Link
              href={`/e/${publicId}?token=${token}`}
              className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
            >
              View event details
            </Link>
          </div>
        ) : null}

        <form
          className="mt-8 space-y-8"
          action={(formData) => {
            setError(null);
            setResult(null);
            formData.set("plusOneDetails", JSON.stringify(plusOneDetails));
            startTransition(async () => {
              const res = await rsvpAction(formData);
              if (!res.ok) {
                setError(res.error ?? "Could not submit RSVP.");
                return;
              }
              setResult("RSVP saved. Thank you!");
              router.refresh();
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

          {plusOnesAllowed > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Plus-ones (you were granted {plusOnesAllowed})
              </label>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Optionally add name and email for each person you&apos;re bringing.
              </p>
              <div className="space-y-3">
                {plusOneDetails.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Plus-one {i + 1}</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Name (optional)"
                        value={p.name ?? ""}
                        onChange={(e) =>
                          setPlusOneDetails((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                          )
                        }
                        disabled={status === "DECLINED"}
                        maxLength={100}
                        className={inputClassName}
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={p.email ?? ""}
                        onChange={(e) =>
                          setPlusOneDetails((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, email: e.target.value } : x))
                          )
                        }
                        disabled={status === "DECLINED"}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Total attendees: {attendeeCount}</div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Note to host (optional)
            </label>
            <textarea
              name="guestMessage"
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value.slice(0, 2000))}
              className={inputClassName}
              rows={4}
              maxLength={2000}
              placeholder="Any note for the host (max 2000 characters)"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/e/${publicId}?token=${token}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: accentColor }}
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
