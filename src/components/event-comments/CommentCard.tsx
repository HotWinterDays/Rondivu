"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  addReplyAction,
  toggleReactionAction,
  toggleReplyReactionAction,
} from "@/app/e/[publicId]/g/[token]/actions";
import { REACTION_TYPES } from "@/lib/validation";

const REACTION_EMOJI: Record<string, string> = {
  thumbs_up: "👍",
  thumbs_down: "👎",
  laugh: "😂",
  heart: "❤️",
  sad: "😢",
};

type ReplyItem = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  reactions?: { type: string; guestId?: string }[];
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: Date;
  guest: { name: string };
  replies?: ReplyItem[];
  reactions?: { type: string; guestId?: string }[];
};

function ReplyBlock({
  reply,
  token,
  guestHasRsvped,
  currentGuestId,
  router,
}: {
  reply: ReplyItem;
  token: string;
  guestHasRsvped: boolean;
  currentGuestId?: string | null;
  router: { refresh: () => void };
}) {
  const [reactionPending, setReactionPending] = useState<string | null>(null);
  const reactions = reply.reactions ?? [];
  const counts = REACTION_TYPES.reduce(
    (acc, t) => {
      acc[t] = reactions.filter((r) => r.type === t).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const myReaction = currentGuestId ? reactions.find((r) => r.guestId === currentGuestId)?.type : null;

  return (
    <div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{reply.guest.name}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{reply.content}</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        {new Date(reply.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </p>
      {guestHasRsvped ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {REACTION_TYPES.map((type) => {
            const count = counts[type] ?? 0;
            const isSelected = myReaction === type;
            return (
              <button
                key={type}
                type="button"
                disabled={!!reactionPending}
                onClick={async () => {
                  setReactionPending(type);
                  const formData = new FormData();
                  formData.set("token", token);
                  formData.set("replyId", reply.id);
                  formData.set("type", type);
                  const res = await toggleReplyReactionAction(formData);
                  setReactionPending(null);
                  if (res.ok) router.refresh();
                }}
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-colors ${
                  isSelected
                    ? "bg-zinc-200 dark:bg-zinc-700"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20"
                }`}
                title={type.replace("_", " ")}
              >
                <span>{REACTION_EMOJI[type] ?? type}</span>
                {count > 0 ? <span>{count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CommentCard({
  comment,
  token,
  guestHasRsvped,
  currentGuestId,
  accentColor,
}: {
  comment: CommentItem;
  token: string;
  guestHasRsvped: boolean;
  currentGuestId?: string | null;
  accentColor: string;
}) {
  const router = useRouter();
  const [replyPending, setReplyPending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [reactionPending, setReactionPending] = useState<string | null>(null);

  const reactions = comment.reactions ?? [];
  const replies = comment.replies ?? [];
  const counts = REACTION_TYPES.reduce(
    (acc, t) => {
      acc[t] = reactions.filter((r) => r.type === t).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const myReaction = currentGuestId ? reactions.find((r) => r.guestId === currentGuestId)?.type : null;

  return (
    <div className="rounded-xl bg-white/80 p-3 dark:bg-white/10">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{comment.guest.name}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{comment.content}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {new Date(comment.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {guestHasRsvped ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {REACTION_TYPES.map((type) => {
            const count = counts[type] ?? 0;
            const isSelected = myReaction === type;
            return (
              <button
                key={type}
                type="button"
                disabled={!!reactionPending}
                onClick={async () => {
                  setReactionPending(type);
                  const formData = new FormData();
                  formData.set("token", token);
                  formData.set("commentId", comment.id);
                  formData.set("type", type);
                  const res = await toggleReactionAction(formData);
                  setReactionPending(null);
                  if (res.ok) router.refresh();
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm transition-colors ${
                  isSelected
                    ? "bg-zinc-200 dark:bg-zinc-700"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20"
                }`}
                title={type.replace("_", " ")}
              >
                <span>{REACTION_EMOJI[type] ?? type}</span>
                {count > 0 ? <span className="text-xs">{count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {replies.length > 0 ? (
        <div className="mt-3 ml-3 space-y-3 border-l-2 border-zinc-200 pl-3 dark:border-white/10">
          {replies.map((r) => (
            <ReplyBlock
              key={r.id}
              reply={r}
              token={token}
              guestHasRsvped={guestHasRsvped}
              currentGuestId={currentGuestId}
              router={router}
            />
          ))}
        </div>
      ) : null}

      {guestHasRsvped ? (
        <form
          className="mt-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            formData.set("token", token);
            formData.set("commentId", comment.id);
            setReplyError(null);
            setReplyPending(true);
            const res = await addReplyAction(formData);
            setReplyPending(false);
            if (res.ok) {
              form.reset();
              router.refresh();
            } else {
              setReplyError(res.error ?? "Could not post reply.");
            }
          }}
        >
          <textarea
            name="content"
            rows={2}
            maxLength={2000}
            placeholder="Reply..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
          />
          {replyError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{replyError}</p>
          ) : null}
          <button
            type="submit"
            disabled={replyPending}
            className="mt-1 rounded-full bg-zinc-700 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-60 dark:bg-zinc-300 dark:text-zinc-900"
          >
            {replyPending ? "Posting..." : "Reply"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
