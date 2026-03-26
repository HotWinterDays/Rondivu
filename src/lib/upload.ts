import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { getEventBannerUploadDir } from "@/lib/uploadPaths";

const MAX_SIZE = 1024 * 1024; // 1MB (Next.js default body limit)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function saveBannerImage(file: File): Promise<string | null> {
  if (file.size > MAX_SIZE) return null;
  if (!ALLOWED_TYPES.includes(file.type)) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const dir = getEventBannerUploadDir();
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/events/${filename}`;
}
