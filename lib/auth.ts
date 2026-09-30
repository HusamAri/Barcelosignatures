import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAdminEmails } from "@/lib/env";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export interface AdminSession {
  email: string;
}

export interface AdminRow {
  email: string;
  name: string | null;
  password_hash: string | null;
  must_change_password: boolean;
  last_login_at: string | null;
  added_at: string;
}

export async function findAdmin(email: string): Promise<AdminRow | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("admins").select("*").ilike("email", email.toLowerCase()).maybeSingle();
  return (data as AdminRow | null) ?? null;
}

/** Bootstrap list from env: these addresses may sign in with the initial PIN even before a row exists. */
export function isBootstrapAdmin(email: string): boolean {
  return bootstrapAdminEmails().includes(email.toLowerCase());
}

/** Server components and actions call this first. Redirects when the visitor is not a signed-in admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");
  if (session.mustChange) redirect("/change-password");
  const row = await findAdmin(session.email);
  if (!row) redirect("/login?error=not_admin");
  if (row.must_change_password) redirect("/change-password");
  return { email: row.email };
}
