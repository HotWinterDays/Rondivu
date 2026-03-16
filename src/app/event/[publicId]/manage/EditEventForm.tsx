"use client";

import { useState, useTransition } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { updateEventAction } from "./actions";

type Props = {
  publicId: string;
  adminKey: string;
  initialTitle: string;
  initialSubtitle: string | null;
  initialDescription: string | null;
  initialNotifyOnRsvpChange: boolean;
  initialNotifyOnNewGuest: boolean;
  initialShowAttendeesToGuests: boolean;
};

export function EditEventForm({
  publicId,
  adminKey,
  initialTitle,
  initialSubtitle,
  initialDescription,
  initialNotifyOnRsvpChange,
  initialNotifyOnNewGuest,
  initialShowAttendeesToGuests,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(initialDescription ?? "");
  const [notifyOnRsvpChange, setNotifyOnRsvpChange] = useState(initialNotifyOnRsvpChange);
  const [notifyOnNewGuest, setNotifyOnNewGuest] = useState(initialNotifyOnNewGuest);
  const [showAttendeesToGuests, setShowAttendeesToGuests] = useState(initialShowAttendeesToGuests);

  return (
    <form
      className="mt-6 space-y-4"
      action={(formData) => {
        setError(null);
        formData.set("publicId", publicId);
        formData.set("adminKey", adminKey);
        formData.set("title", title);
        formData.set("subtitle", subtitle);
        formData.set("description", descriptionHtml);
        formData.set("notifyOnRsvpChange", notifyOnRsvpChange ? "on" : "");
        formData.set("notifyOnNewGuest", notifyOnNewGuest ? "on" : "");
        formData.set("showAttendeesToGuests", showAttendeesToGuests ? "on" : "");
        startTransition(async () => {
          const res = await updateEventAction(formData);
          if (!res.ok) setError(res.error ?? "Could not update event.");
        });
      }}
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      ) : null}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Short tagline (optional)"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Notifications</label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyOnRsvpChange}
              onChange={(e) => setNotifyOnRsvpChange(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Email me when a guest changes their RSVP
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyOnNewGuest}
              onChange={(e) => setNotifyOnNewGuest(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Email me when I add a new guest
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAttendeesToGuests}
              onChange={(e) => setShowAttendeesToGuests(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Let guests see who else has RSVPed
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
