import { createAdminClient } from "./admin";

/**
 * Data access for admin pages and server actions. Authorization happens in
 * requireAdmin() before any of this runs, so the service-role client is used;
 * RLS still blocks every direct API call made with the public key.
 */
export async function createClient() {
  return createAdminClient();
}
