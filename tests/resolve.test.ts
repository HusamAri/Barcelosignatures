import { test } from "node:test";
import assert from "node:assert/strict";
import { pickBanner, type ScheduleCandidate } from "../lib/banners/resolve";
import type { Banner } from "../lib/types";

const banner = (id: string): Banner => ({
  id, name: id, storage_path: `${id}.gif`, public_url: `https://cdn/${id}.gif`, mime_type: "image/gif",
  width: 612, height: 140, alt: id, link_url: `https://link/${id}`, created_at: "2026-01-01T00:00:00Z",
});

const sched = (over: Partial<ScheduleCandidate> & { id: string }): ScheduleCandidate => ({
  banner_id: over.id, title: over.id, starts_at: "2026-09-01T00:00:00Z", ends_at: "2026-10-01T00:00:00Z",
  priority: 0, all_users: false, link_url: null, is_active: true, created_at: "2026-08-01T00:00:00Z",
  banner: banner(over.id), group_ids: [], ...over,
});

const now = new Date("2026-09-15T12:00:00Z");
const user = { id: "u1", hotel_id: "bis" };

test("falls back to the default banner when nothing is scheduled", () => {
  const r = pickBanner({ user, userGroupIds: ["g-bis"], schedules: [], defaultBanner: banner("default"), now });
  assert.equal(r.source, "default");
  assert.equal(r.imageUrl, "https://cdn/default.gif");
});

test("group targeting: only members see a group banner", () => {
  const s = [sched({ id: "sales-promo", group_ids: ["g-sales"] })];
  assert.equal(pickBanner({ user, userGroupIds: ["g-bis"], schedules: s, defaultBanner: null, now }).source, "fallback");
  assert.equal(pickBanner({ user, userGroupIds: ["g-bis", "g-sales"], schedules: s, defaultBanner: null, now }).bannerId, "sales-promo");
});

test("all_users schedules apply to everyone, higher priority wins, then later start", () => {
  const s = [
    sched({ id: "global", all_users: true, priority: 0 }),
    sched({ id: "bis-only", group_ids: ["g-bis"], priority: 5 }),
    sched({ id: "bis-newer", group_ids: ["g-bis"], priority: 5, starts_at: "2026-09-10T00:00:00Z" }),
  ];
  const r = pickBanner({ user, userGroupIds: ["g-bis"], schedules: s, defaultBanner: null, now });
  assert.equal(r.bannerId, "bis-newer");
});

test("time window is respected and the schedule link override wins", () => {
  const s = [
    sched({ id: "past", all_users: true, ends_at: "2026-09-10T00:00:00Z" }),
    sched({ id: "future", all_users: true, starts_at: "2026-09-20T00:00:00Z", ends_at: "2026-09-25T00:00:00Z" }),
    sched({ id: "live", all_users: true, link_url: "https://override" }),
  ];
  const r = pickBanner({ user, userGroupIds: [], schedules: s, defaultBanner: null, now });
  assert.equal(r.bannerId, "live");
  assert.equal(r.linkUrl, "https://override");
});
