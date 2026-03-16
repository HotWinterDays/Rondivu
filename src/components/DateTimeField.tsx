"use client";

import { useRef, useState, useEffect } from "react";

type Props = {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string; // "YYYY-MM-DDTHH:mm" from datetime-local
  defaultTime?: string;  // "HH:mm" when no value yet
};

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:ring-white/10";

export function DateTimeField({
  name,
  label,
  required,
  defaultValue = "",
  defaultTime = "18:00",
}: Props) {
  const timeRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(() => {
    if (defaultValue) {
      const d = defaultValue.split("T")[0];
      return d || "";
    }
    return "";
  });
  const [time, setTime] = useState(() => {
    if (defaultValue) {
      const t = defaultValue.split("T")[1]?.slice(0, 5);
      return t || defaultTime;
    }
    return defaultTime;
  });

  const combined = date && time ? `${date}T${time}` : "";

  const prevDateRef = useRef(date);
  useEffect(() => {
    if (date && !prevDateRef.current && timeRef.current) {
      timeRef.current.focus();
    }
    prevDateRef.current = date;
  }, [date]);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required={required}
          className={inputClassName}
          aria-label={`${label} date`}
        />
        <input
          ref={timeRef}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required={required}
          className={inputClassName}
          aria-label={`${label} time`}
        />
      </div>
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
