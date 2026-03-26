import { readFile } from "fs/promises";
import path from "path";

import { getEventBannerUploadDir } from "@/lib/uploadPaths";

const MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function isSafeBannerFilename(name: string): boolean {
  return /^[0-9]+-[a-z0-9]+\.(jpe?g|png|webp|gif)$/i.test(name);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments?.length || segments.length !== 1) {
    return new Response("Not Found", { status: 404 });
  }

  const name = segments[0]!;
  if (!isSafeBannerFilename(name)) {
    return new Response("Not Found", { status: 404 });
  }

  const root = path.resolve(getEventBannerUploadDir());
  const filePath = path.resolve(root, name);
  const relativeToRoot = path.relative(root, filePath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return new Response("Not Found", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  const ext = path.extname(name).slice(1).toLowerCase();
  const normExt = ext === "jpg" ? "jpeg" : ext;
  const contentType = MIME[normExt] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
