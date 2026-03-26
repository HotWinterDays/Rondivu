import path from "path";

const DEFAULT_RELATIVE = "public/uploads/events";

/** Absolute directory for event banner files. Override with UPLOAD_DIR (absolute or cwd-relative). */
export function getEventBannerUploadDir(): string {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  }
  return path.join(process.cwd(), DEFAULT_RELATIVE);
}
