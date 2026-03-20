import { z } from "zod";

export const guestInputSchema = z.object({
  name: z.string().trim().min(1, "Guest name is required").max(100),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  plusOnesAllowed: z.coerce.number().int().min(0).max(10).default(0),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  subtitle: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .trim()
    .max(50000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().optional().or(z.literal("")),
  hostName: z.string().trim().min(1, "Host name is required").max(100),
  hostEmail: z.string().trim().email("Invalid host email"),
  guests: z.array(guestInputSchema).min(1, "Add at least one guest"),
  bannerImageUrl: z.string().trim().optional().or(z.literal("")),
  themeColor: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : undefined)),
  notifyOnRsvpChange: z
    .string()
    .optional()
    .default("on")
    .transform((v) => v === "on" || v === "true"),
  notifyOnNewGuest: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  showAttendeesToGuests: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  allowGuestComments: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  notifyOnNewComment: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  notifyGuestsOnReply: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  emailGuestsEventDetailsOnRsvp: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const addCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

export const addReplySchema = z.object({
  content: z.string().trim().min(1, "Reply cannot be empty").max(2000),
});

export const REACTION_TYPES = ["thumbs_up", "thumbs_down", "laugh", "heart", "sad"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const reactionTypeSchema = z.enum(REACTION_TYPES);

export const updateEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  subtitle: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .trim()
    .max(50000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notifyOnRsvpChange: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  notifyOnNewGuest: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  showAttendeesToGuests: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  allowGuestComments: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  notifyOnNewComment: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  notifyGuestsOnReply: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  emailGuestsEventDetailsOnRsvp: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

