import { createAdminClient } from "@/lib/supabase/admin";
import type { Hotel, SigUser } from "@/lib/types";

/** Loads a signature owner and their hotel by public token. Service role: the page is public by token. */
export async function loadUserByToken(token: string): Promise<{ user: SigUser; hotel: Hotel } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("sig_users").select("*, hotel:hotels(*)").eq("token", token).maybeSingle();
  if (error) {
    // A stale PostgREST schema cache right after a migration surfaces here as a relationship error.
    console.error("loadUserByToken failed", { token, code: error.code, message: error.message });
    return null;
  }
  if (!data || !data.hotel) return null;
  const { hotel, ...user } = data as SigUser & { hotel: Hotel };
  return { user, hotel };
}
