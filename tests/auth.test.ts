import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, passwordPolicyError, INITIAL_PIN } from "../lib/auth/password";
import { signSession, verifySession } from "../lib/auth/session";

test("password hashes verify and reject wrong input", () => {
  const h = hashPassword(INITIAL_PIN);
  assert.match(h, /^scrypt\$16384\$/);
  assert.equal(verifyPassword("0000", h), true);
  assert.equal(verifyPassword("0001", h), false);
  assert.equal(verifyPassword("0000", null), false);
  assert.equal(verifyPassword("0000", "garbage"), false);
});

test("password policy blocks the PIN and short or repeated values", () => {
  assert.ok(passwordPolicyError("short"));
  assert.ok(passwordPolicyError("0000"));
  assert.ok(passwordPolicyError("11111111"));
  assert.equal(passwordPolicyError("Barcelo2026!"), null);
});

test("session tokens round-trip, reject tampering and expiry", async () => {
  process.env.AUTH_SECRET = "test-secret";
  const t = await signSession({ email: "mm.tr@barcelo.com", mustChange: true });
  const s = await verifySession(t);
  assert.equal(s?.email, "mm.tr@barcelo.com");
  assert.equal(s?.mustChange, true);
  assert.equal(await verifySession(t.slice(0, -2) + "xx"), null);
  assert.equal(await verifySession(undefined), null);
  const expired = await signSession({ email: "x@y.z", mustChange: false, exp: Math.floor(Date.now() / 1000) - 10 });
  assert.equal(await verifySession(expired), null);
});
