/** Reads a Supabase env var and fails loudly when the value was pasted from a masked display. */
export function supabaseEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to the environment variables and redeploy.`);
  const bad = [...value].find((ch) => ch.charCodeAt(0) > 126 || ch.charCodeAt(0) < 33);
  if (bad) {
    throw new Error(`${name} contains an invalid character (code ${bad.charCodeAt(0)}). It was probably copied from a masked field. Paste the full key and redeploy.`);
  }
  return value;
}
