import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDisplayName, formatTRMobile, trMobileHref, emailSuffix } from "../lib/signature/format";

test("formatDisplayName folds Turkish characters and upper-cases the surname", () => {
  assert.equal(formatDisplayName("hüsam arı"), "Husam ARI");
  assert.equal(formatDisplayName("  ahmet   yılmaz "), "Ahmet YILMAZ");
  assert.equal(formatDisplayName("Şükrü Çağlar Öztürk"), "Sukru Caglar OZTURK");
  assert.equal(formatDisplayName(""), "");
});

test("formatTRMobile normalises the common Turkish inputs", () => {
  assert.equal(formatTRMobile("05321234567"), "+90 532 123 45 67");
  assert.equal(formatTRMobile("+90 532 123 45 67"), "+90 532 123 45 67");
  assert.equal(formatTRMobile("00905321234567"), "+90 532 123 45 67");
  assert.equal(formatTRMobile("532 123 45 67"), "+90 532 123 45 67");
  assert.equal(trMobileHref("0532 123 45 67"), "+905321234567");
});

test("emailSuffix strips an already-typed hotel prefix and domain", () => {
  assert.equal(emailSuffix("istanbul.om@barcelo.com", "istanbul."), "om");
  assert.equal(emailSuffix("OM", "istanbul."), "om");
  assert.equal(emailSuffix(".sales", ""), "sales");
});
