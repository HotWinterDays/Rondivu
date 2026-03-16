/**
 * Validates and sanitizes redirect URLs to prevent open redirect vulnerabilities.
 * Only allows relative paths (starting with /) and rejects protocol-relative URLs.
 */
export function sanitizeReturnTo(value: unknown, fallback = "/"): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return fallback;
  if (!s.startsWith("/")) return fallback;
  if (s.startsWith("//")) return fallback;
  return s;
}
