"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword, INITIAL_PIN } from "@/lib/auth/password";

function back(msg: { ok?: string; error?: string }): never {
  const qs = new URLSearchParams();
  if (msg.ok) qs.set("ok", msg.ok);
  if (msg.error) qs.set("error", msg.error);
  redirect(`/admin/admins?${qs.toString()}`);
}

/** Creates an admin account with the initial PIN. They must set a password at first login. */
export async function createAdmin(formData: FormData): Promise<void> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back({ error: "Valid email required" });
  const admin = createAdminClient();
  const { error } = await admin.from("admins").insert({ email, name, password_hash: hashPassword(INITIAL_PIN), must_change_password: true });
  if (error) back({ error: error.code === "23505" ? `${email} is already an admin` : error.message });
  revalidatePath("/admin/admins");
  back({ ok: `${email} added. Initial PIN is ${INITIAL_PIN}; they set their own password at first login.` });
}

export async function resetAdminPin(email: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("admins").update({ password_hash: hashPassword(INITIAL_PIN), must_change_password: true }).eq("email", email);
  if (error) back({ error: error.message });
  back({ ok: `PIN for ${email} reset to ${INITIAL_PIN}` });
}

export async function removeAdmin(email: string): Promise<void> {
  const me = await requireAdmin();
  if (me.email.toLowerCase() === email.toLowerCase()) back({ error: "You cannot remove yourself" });
  const admin = createAdminClient();
  const { error } = await admin.from("admins").delete().eq("email", email);
  if (error) back({ error: error.message });
  revalidatePath("/admin/admins");
  back({ ok: `${email} removed` });
}
