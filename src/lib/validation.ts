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
  description: z
    .string()
    .trim()
    .max(2000)
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
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

