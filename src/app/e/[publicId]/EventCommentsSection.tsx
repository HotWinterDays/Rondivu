"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addCommentAction } from "@/app/e/[publicId]/g/[token]/actions";
import { CommentCard } from "@/components/event-comments/CommentCard";

const REACTION_EMOJI: Record<string, string> = {
  thumbs_up: "👍",
  thumbs_down: "👎",
  laugh: "😂",
  heart: "❤️",
  sad: "😢",
};

type ReplyShape = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  reactions?: { type: string; guestId?: string }[];
};

type CommentShape = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  replies?: ReplyShape[];
  reactions?: { type: string; guestId?: string }[];
};

type Props = {
  comments: CommentShape[];
  accentColor: string;
  token: string | null;
  guestHasRsvped: boolean;
  currentGuestId: string | null;
};

export function EventCommentsSection({
  comments,
  accentColor,
  token,
  guestHasRsvped,
  currentGuestId,
}: Props) {
  const router = useRouter();
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentPending, setCommentPending] = useState(false);

  const isInteractive = Boolean(token && guestHasRsvped);

  return (
    <div
      className="mt-6 rounded-2xl border-2 bg-zinc-50 p-6 dark:bg-white/5"
      style={{ borderColor: accentColor }}
    >
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Guest comments</h3>

      {comments.length > 0 ? (
        <div className="mt-3 space-y-4">
          {isInteractive ? (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                token={token!}
                guestHasRsvped={guestHasRsvped}
                currentGuestId={currentGuestId}
                accentColor={accentColor}
              />
            ))
          ) : (
            comments.map((c) => {
              const reactions = c.reactions ?? [];
              const replies = c.replies ?? [];
              const reactionCounts = reactions.reduce(
                (acc, r) => {
                  acc[r.type] = (acc[r.type] ?? 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              );
              return (
                <div key={c.id} className="rounded-xl bg-white/80 p-3 dark:bg-white/10">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.guest.name}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{c.content}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {reactions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(reactionCounts).map(([type, count]) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-sm dark:bg-white/10"
                        >
                          {REACTION_EMOJI[type] ?? type} {count}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {replies.length > 0 ? (
                    <div className="mt-3 ml-3 space-y-2 border-l-2 border-zinc-200 pl-3 dark:border-white/10">
                      {replies.map((r) => {
                        const replyReactions = r.reactions ?? [];
                        const replyCounts = replyReactions.reduce(
                          (acc, x) => {
                            acc[x.type] = (acc[x.type] ?? 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        );
                        return (
                          <div key={r.id}>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.guest.name}</p>
                            <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{r.content}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                            {replyReactions.length > 0 ? (
                              <div className="mt-1.5 flex gap-2">
                                {Object.entries(replyCounts).map(([type, n]) => (
                                  <span key={type} className="text-xs">
                                    {REACTION_EMOJI[type] ?? type} {n}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {isInteractive ? "No comments yet." : "No comments yet. Use your personal RSVP link to leave a comment."}
        </p>
      )}

      {isInteractive ? (
        <form
          className="mt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            formData.set("token", token!);
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
            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
          />
          {commentError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{commentError}</p>
          ) : null}
          <button
            type="submit"
            disabled={commentPending}
            className="mt-2 rounded-full bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-60 dark:bg-zinc-300 dark:text-zinc-900"
          >
            {commentPending ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
