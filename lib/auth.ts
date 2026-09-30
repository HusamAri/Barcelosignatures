import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAdminEmails } from "@/lib/env";

export interface AdminSession {
  email: string;
}

/** Is this email allowed into /admin? Bootstrap list from env, otherwise the admins table. */
export async function isAllowedAdmin(email: string): Promise<boolean> {
  const lower = email.toLowerCase();
  if (bootstrapAdminEmails().includes(lower)) return true;
  const admin = createAdminClient();
  const { data } = await admin.from("admins").select("email").ilike("email", lower).maybeSingle();
  return Boolean(data);
}

/** Server components and actions call this first. Redirects when the visitor is not an admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  if (!(await isAllowedAdmin(user.email))) redirect("/login?error=not_admin");
  return { email: user.email };
}
