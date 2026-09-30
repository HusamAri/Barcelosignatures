"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAdmin, isBootstrapAdmin } from "@/lib/auth";
import { hashPassword, INITIAL_PIN, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

function fail(msg: string, next: string): never {
  redirect(`/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";
  if (!email || !password) fail("E-posta ve PIN gerekli", next);

  const admin = createAdminClient();
  let row = await findAdmin(email);

  // First-ever login of a bootstrap admin: accept the initial PIN and create the row.
  if (!row && isBootstrapAdmin(email)) {
    if (password !== INITIAL_PIN) fail("İlk giriş PIN'i hatalı", next);
    const { data, error } = await admin
      .from("admins")
      .insert({ email, password_hash: hashPassword(INITIAL_PIN), must_change_password: true })
      .select("*")
      .single();
    if (error) fail(error.message, next);
    row = data as typeof row;
  }
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    // Uniform delay so a wrong email and a wrong password take the same time.
    await new Promise((r) => setTimeout(r, 400));
    fail("E-posta veya PIN hatalı", next);
  }

  await admin.from("admins").update({ last_login_at: new Date().toISOString() }).eq("email", row.email);
  const token = await signSession({ email: row.email, mustChange: row.must_change_password });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  redirect(row.must_change_password ? "/change-password" : next);
}
