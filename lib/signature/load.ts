import { createAdminClient } from "@/lib/supabase/admin";
import type { Hotel, SigUser } from "@/lib/types";

/** Loads a signature owner and their hotel by public token. Service role: the page is public by token. */
export async function loadUserByToken(token: string): Promise<{ user: SigUser; hotel: Hotel } | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("sig_users").select("*, hotel:hotels(*)").eq("token", token).maybeSingle();
  if (!data || !data.hotel) return null;
  const { hotel, ...user } = data as SigUser & { hotel: Hotel };
  return { user, hotel };
}
