"use server";

import { redirect } from "next/navigation";

import { createAdminSession, isAdminPasswordConfigured, setAdminPassword, setAdminSessionCookie } from "@/lib/auth";

export async function setupAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/settings").trim() || "/settings";

  if (await isAdminPasswordConfigured()) {
    redirect("/admin/login");
  }

  if (password.length < 8) {
    redirect("/admin/setup?error=too_short");
  }

  if (password !== confirm) {
    redirect(`/admin/setup?error=mismatch&returnTo=${encodeURIComponent(returnTo)}`);
  }

  await setAdminPassword(password);
  const token = await createAdminSession();
  await setAdminSessionCookie(token);
  redirect(returnTo);
}
