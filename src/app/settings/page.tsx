import { redirect } from "next/navigation";

import { EmailConfigForm } from "@/components/EmailConfigForm";
import { isAdminPasswordConfigured, verifyAdminSession } from "@/lib/auth";
import { getEmailConfig } from "@/lib/settings";
import { logoutAction } from "@/app/admin/logout/actions";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const passwordConfigured = await isAdminPasswordConfigured();
  if (!passwordConfigured) {
    redirect("/admin/setup?returnTo=/settings");
  }
  const valid = await verifyAdminSession();
  if (!valid) {
    redirect("/admin/login?returnTo=/settings");
  }

  const config = await getEmailConfig();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Configure email for sending invites. Env vars override values saved here.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <EmailConfigForm initialConfig={config} className="mt-10" />
      </div>
    </div>
  );
}
