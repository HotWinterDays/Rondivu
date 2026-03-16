"use server";

import { redirect } from "next/navigation";

import { createAdminSession, isAdminPasswordConfigured, setAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/").trim() || "/";

  if (!(await isAdminPasswordConfigured())) {
    redirect("/admin/setup");
  }

  if (!(await verifyAdminPassword(password))) {
    redirect(`/admin/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const token = await createAdminSession();
  await setAdminSessionCookie(token);
  redirect(returnTo);
}
