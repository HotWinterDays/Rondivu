"use client";

import { useState, useTransition } from "react";

import { saveEmailConfigAction } from "@/app/settings/actions";

type Config = {
  provider: string;
  emailFrom: string;
  appUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: string;
  smtpUser: string;
  smtpPass: string;
  resendApiKey: string;
};

type Props = {
  initialConfig: Config;
  className?: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/20 dark:focus:ring-white/10";

const defaultConfig: Config = {
  provider: "none",
  emailFrom: "",
  appUrl: "http://localhost:3000",
  smtpHost: "",
  smtpPort: "587",
  smtpSecure: "false",
  smtpUser: "",
  smtpPass: "",
  resendApiKey: "",
};

export function EmailConfigForm({ initialConfig, className = "" }: Props) {
  const config = { ...defaultConfig, ...initialConfig };
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className={className}
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await saveEmailConfigAction(formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        });
      }}
    >
      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email provider
          </label>
          <select
            name="provider"
            defaultValue={config.provider}
            className={inputClass}
          >
            <option value="none">None (copy links only)</option>
            <option value="smtp">SMTP</option>
            <option value="resend">Resend</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            App URL
          </label>
          <input
            name="appUrl"
            type="url"
            defaultValue={config.appUrl}
            placeholder="https://yourdomain.com"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Base URL for invite links (e.g. https://yourdomain.com)
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            From address
          </label>
          <input
            name="emailFrom"
            type="text"
            defaultValue={config.emailFrom}
            placeholder="Rondivu &lt;noreply@yourdomain.com&gt;"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Required for SMTP and Resend
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-medium">SMTP (when provider is SMTP)</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Host</label>
              <input name="smtpHost" defaultValue={config.smtpHost} className={inputClass} placeholder="smtp.example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Port</label>
              <input name="smtpPort" defaultValue={config.smtpPort} className={inputClass} placeholder="587" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Secure (SSL)</label>
              <select name="smtpSecure" defaultValue={config.smtpSecure} className={inputClass}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">User (optional)</label>
              <input name="smtpUser" defaultValue={config.smtpUser} className={inputClass} type="text" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Password (optional)</label>
              <input name="smtpPass" defaultValue={config.smtpPass} className={inputClass} type="password" placeholder="••••••••" autoComplete="new-password" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-medium">Resend (when provider is Resend)</h3>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">API key</label>
            <input name="resendApiKey" defaultValue={config.resendApiKey} className={inputClass} type="password" placeholder="re_..." autoComplete="new-password" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved!</span>}
        </div>
      </div>
    </form>
  );
}
