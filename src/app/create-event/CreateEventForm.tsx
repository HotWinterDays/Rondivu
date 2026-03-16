"use client";

import { useMemo, useState, useTransition } from "react";

import { DateTimeField } from "@/components/DateTimeField";
import { resizeImage } from "@/lib/resizeImage";
import { createEventAction } from "./actions";

const MAX_BANNER_BYTES = 1024 * 1024; // 1MB

type GuestDraft = {
  name: string;
  email: string;
  plusOnesAllowed: number;
  note: string;
};

const emptyGuest: GuestDraft = { name: "", email: "", plusOnesAllowed: 0, note: "" };

export default function CreateEventForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);

  const [guests, setGuests] = useState<GuestDraft[]>([{ ...emptyGuest }]);

  const guestsJson = useMemo(() => JSON.stringify(guests), [guests]);

  function updateGuest(idx: number, patch: Partial<GuestDraft>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addGuest() {
    setGuests((prev) => [...prev, { ...emptyGuest }]);
  }

  function removeGuest(idx: number) {
    setGuests((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Create event</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your event details and a named guest list. You'll get a guest link and a private admin link.
        </p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
            {error}
          </div>
        ) : null}

        <form
          className="mt-8 space-y-10"
          action={(formData) => {
            setError(null);
            setBannerError(null);
            const file = formData.get("bannerImage") as File | null;
            startTransition(async () => {
              try {
                let dataToSend = formData;
                if (file && file.size > 0 && file.size > MAX_BANNER_BYTES) {
                  setResizing(true);
                  try {
                    const resized = await resizeImage(file, MAX_BANNER_BYTES);
                    const resizedFile = new File([resized], file.name.replace(/\.[^.]+$/, ".jpg") || "banner.jpg", {
                      type: "image/jpeg",
                    });
                    dataToSend = new FormData();
                    for (const [key, value] of formData.entries()) {
                      if (key === "bannerImage") {
                        dataToSend.set(key, resizedFile);
                      } else {
                        dataToSend.set(key, value);
                      }
                    }
                  } catch (resizeErr) {
                    setBannerError("Could not resize image. Try a smaller file or a different format.");
                    setResizing(false);
                    return;
                  } finally {
                    setResizing(false);
                  }
                }
                const res = await createEventAction(dataToSend);
                if (res && "ok" in res && !res.ok) setError(res.formError ?? "Could not create event.");
              } catch (err) {
                setError("Upload failed. Try a smaller image (under 1MB) or create the event without a banner first.");
              }
            });
          }}
        >
          <section className="space-y-4">
            <div>
              <Label>Banner image (optional)</Label>
              <p className="mt-1 text-xs text-zinc-500">
                Shows at the top of the event page and invite emails. JPG/PNG/WebP/GIF. Images over 1MB are automatically resized.
              </p>
              {bannerError ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{bannerError}</p>
              ) : null}
              <input
                type="file"
                name="bannerImage"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={() => setBannerError(null)}
                className="mt-2 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-950 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-white/10 dark:file:text-zinc-50 dark:hover:file:bg-white/20"
              />
            </div>
            <div>
              <Label>Theme color (optional)</Label>
              <p className="mt-1 text-xs text-zinc-500">Used for borders and accents on the event page and in emails.</p>
              <input
                type="color"
                name="themeColor"
                defaultValue="#3b82f6"
                className="mt-2 h-10 w-24 cursor-pointer rounded border border-zinc-200 bg-transparent dark:border-white/10"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" name="title" placeholder="Birthday dinner" required />
              <Field label="Location" name="location" placeholder="123 Main St (optional)" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <DateTimeField label="Start time" name="startTime" required />
              <DateTimeField label="End time" name="endTime" defaultTime="20:00" />
            </div>
            <TextArea label="Description" name="description" placeholder="Details for your guests (optional)" rows={4} />
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Host name" name="hostName" placeholder="John Smith" required />
              <Field label="Host email" name="hostEmail" placeholder="you@example.com" required />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium">Guest list</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Add at least one guest. Emails are optional (useful for later email invites).
                </p>
              </div>
              <button
                type="button"
                onClick={addGuest}
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Add guest
              </button>
            </div>

            <input type="hidden" name="guests" value={guestsJson} />

            <div className="space-y-3">
              {guests.map((g, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label>Name</Label>
                      <input
                        value={g.name}
                        onChange={(e) => updateGuest(idx, { name: e.target.value })}
                        className={inputClassName}
                        placeholder="Guest name"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label>Email</Label>
                      <input
                        value={g.email}
                        onChange={(e) => updateGuest(idx, { email: e.target.value })}
                        className={inputClassName}
                        placeholder="guest@example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Plus-ones</Label>
                      <input
                        value={g.plusOnesAllowed}
                        onChange={(e) => updateGuest(idx, { plusOnesAllowed: Number(e.target.value) })}
                        className={inputClassName}
                        type="number"
                        min={0}
                        max={10}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        disabled={guests.length <= 1}
                        onClick={() => removeGuest(idx)}
                        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/10"
                        aria-label={`Remove guest ${idx + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="md:col-span-12">
                      <Label>Note (internal)</Label>
                      <input
                        value={g.note}
                        onChange={(e) => updateGuest(idx, { note: e.target.value })}
                        className={inputClassName}
                        placeholder="Optional note (e.g. dietary, VIP)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? (resizing ? "Resizing image..." : "Creating...") : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <Label>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      <input className={inputClassName} name={name} placeholder={placeholder} required={required} type={type} />
    </div>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea className={inputClassName} name={name} placeholder={placeholder} rows={rows ?? 4} />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">{children}</label>;
}

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:ring-white/10";
