"use client";

import { useState } from "react";

type Props = {
  /** Full URL or path; if path (starts with /), we prepend origin when copying */
  url: string;
  label?: string;
};

export function CopyLinkButton({ url, label = "Copy link" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const fullUrl = url.startsWith("/") ? `${typeof window !== "undefined" ? window.location.origin : ""}${url}` : url;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-xs font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
      aria-label={label}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
