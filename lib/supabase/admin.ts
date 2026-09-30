import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Service-role client. Bypasses RLS. Only for public endpoints (banner redirect,
 * click redirect, personal signature page) and storage uploads. Never import in client code.
 */
export function createAdminClient() {
  return createClient(supabaseEnv("NEXT_PUBLIC_SUPABASE_URL"), supabaseEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
