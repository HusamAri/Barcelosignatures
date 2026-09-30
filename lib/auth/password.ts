import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384, R = 8, P = 1, KEYLEN = 64;

/** scrypt hash in a self-describing format: scrypt$N$salt$hash (base64url). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, n, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !n || !saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const actual = scryptSync(password.normalize("NFKC"), salt, expected.length, { N: Number(n), r: R, p: P });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const INITIAL_PIN = "0000";

export function passwordPolicyError(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (pw === INITIAL_PIN || /^(\d)\1+$/.test(pw)) return "Choose something other than a repeated digit";
  return null;
}
