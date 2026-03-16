"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export function RichTextEditor({ value, onChange, placeholder, minHeight = "120px" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950"
      style={{ minHeight }}
    >
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/5">
        <ToolbarButton cmd="bold" title="Bold" editorRef={ref}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton cmd="italic" title="Italic" editorRef={ref}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton cmd="insertUnorderedList" title="Bullet list" editorRef={ref}>
          •
        </ToolbarButton>
        <ToolbarButton cmd="insertOrderedList" title="Numbered list" editorRef={ref}>
          1.
        </ToolbarButton>
        <ToolbarButton cmd="formatBlock" arg="h2" title="Heading" editorRef={ref}>
          H2
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        data-placeholder={placeholder ?? "Write your description here..."}
        className="min-h-[120px] px-3 py-2 text-sm text-zinc-950 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:text-zinc-50 dark:empty:before:text-zinc-500 [&_h2]:mt-4 [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1"
        onInput={emit}
        onBlur={emit}
        suppressContentEditableWarning
      />
    </div>
  );
}

function ToolbarButton({
  cmd,
  arg,
  title,
  editorRef,
  children,
}: {
  cmd: string;
  arg?: string;
  title: string;
  editorRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        editorRef.current?.focus();
        document.execCommand(cmd, false, arg ?? "");
      }}
      className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
