import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSignature, buildEmail, looksDoublePrefixed } from "../lib/signature/render";
import type { Hotel } from "../lib/types";

const bis: Hotel = {
  id: "bis", name: "Barceló Istanbul", brand: "barcelo", brand_word: "Barceló", city_word: "Istanbul",
  slogan: "Be Inspired", email_prefix: "istanbul.", email_domain: "barcelo.com",
  address: "Kocatepe, Abdulhak Hamit Cad. No25 Beyoğlu | Istanbul | Türkiye 34437",
  map_url: "https://maps.app.goo.gl/GbQy9G8yVxqxtrWy7", phone_display: "+90 212 377 45 45", phone_href: "+902123774545",
  website_url: "https://barcelo.com", website_label: "barcelo.com", secondary_banner_url: null, secondary_banner_alt: null,
  is_active: true, sort_order: 10,
};

const person = { full_name: "ayşe kaya", title: "Sales Manager", email: "istanbul.sm@barcelo.com", mobile: "05321234567", token: "abc123" };

test("renders an Outlook-safe table with the dynamic banner endpoints", () => {
  const html = renderSignature(bis, person, { appUrl: "https://sig.example.com/" });
  assert.match(html, /^<table role="presentation"/);
  assert.match(html, /Ayse KAYA/);
  assert.match(html, /Be Inspired/);
  assert.match(html, /src="https:\/\/sig\.example\.com\/b\/abc123"/);
  assert.match(html, /href="https:\/\/sig\.example\.com\/c\/abc123"/);
  assert.match(html, /width="612" height="140"/);
  assert.match(html, /\+90 532 123 45 67/);
  assert.doesNotMatch(html, /position:relative|filter:/, "no CSS Outlook cannot render");
  assert.doesNotMatch(html, /<script/);
});

test("omits the mobile block when the person has no mobile", () => {
  const html = renderSignature(bis, { ...person, mobile: "" }, { appUrl: "https://sig.example.com" });
  assert.doesNotMatch(html, />M<\/span>/);
});

test("escapes user input", () => {
  const html = renderSignature(bis, { ...person, title: '<img src=x onerror="1">' }, { appUrl: "https://x" });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test("buildEmail keeps full addresses as typed and patterns only bare local parts", () => {
  assert.equal(buildEmail(bis, "om"), "istanbul.om@barcelo.com");
  assert.equal(buildEmail(bis, "istanbul.om"), "istanbul.om@barcelo.com");
  assert.equal(buildEmail(bis, "istanbul.om@barcelo.com"), "istanbul.om@barcelo.com");
  // regression: a real address outside the hotel pattern must not get the prefix glued on
  assert.equal(buildEmail(bis, "it.istanbul@barcelo.com"), "it.istanbul@barcelo.com");
  assert.equal(buildEmail(bis, " IT.Istanbul@Barcelo.com "), "it.istanbul@barcelo.com");
  assert.equal(buildEmail(bis, "marketing.tr@barcelo.com"), "marketing.tr@barcelo.com");
});

test("looksDoublePrefixed flags the prefix glued onto a hotel-named local part", () => {
  assert.equal(looksDoublePrefixed(bis, "istanbul.it.istanbul@barcelo.com"), true);
  assert.equal(looksDoublePrefixed(bis, "istanbul.om@barcelo.com"), false);
  assert.equal(looksDoublePrefixed(bis, "it.istanbul@barcelo.com"), false);
});
