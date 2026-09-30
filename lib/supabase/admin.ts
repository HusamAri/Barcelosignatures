import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS. Only for public endpoints (banner redirect,
 * click redirect, personal signature page) and storage uploads. Never import in client code.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
