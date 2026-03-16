"use server";

import { redirect } from "next/navigation";

import { createAdminSession, isAdminPasswordConfigured, setAdminSessionCookie } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/").trim() || "/";

  if (!isAdminPasswordConfigured()) {
    redirect("/admin/login?error=not_configured");
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect(`/admin/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const token = await createAdminSession();
  await setAdminSessionCookie(token);
  redirect(returnTo);
}
