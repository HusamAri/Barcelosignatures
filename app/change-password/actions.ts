"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAdmin } from "@/lib/auth";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/auth/session";

function fail(msg: string): never {
  redirect(`/change-password?error=${encodeURIComponent(msg)}`);
}

export async function changePassword(formData: FormData): Promise<void> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const row = await findAdmin(session.email);
  if (!row) redirect("/login?error=not_admin");
  if (!verifyPassword(current, row.password_hash)) fail("Mevcut PIN / şifre hatalı");
  const policy = passwordPolicyError(next);
  if (policy) fail(policy);
  if (next !== confirm) fail("Şifreler eşleşmiyor");

  const admin = createAdminClient();
  const { error } = await admin
    .from("admins")
    .update({ password_hash: hashPassword(next), must_change_password: false })
    .eq("email", row.email);
  if (error) fail(error.message);

  const token = await signSession({ email: row.email, mustChange: false });
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
  redirect("/admin?ok=" + encodeURIComponent("Şifre güncellendi"));
}
