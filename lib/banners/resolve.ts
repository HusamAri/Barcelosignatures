import type { Banner, BannerSchedule, ResolvedBanner, SigUser } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/env";

export interface ScheduleCandidate extends BannerSchedule {
  banner: Banner;
  group_ids: string[];
}

export interface ResolveInput {
  user: Pick<SigUser, "id" | "hotel_id">;
  /** Explicit memberships plus the auto group of the user's hotel. */
  userGroupIds: string[];
  schedules: ScheduleCandidate[];
  defaultBanner: Banner | null;
  now: Date;
}

/** Pure selection logic, unit-tested in tests/resolve.test.ts. */
export function pickBanner(input: ResolveInput): ResolvedBanner {
  const nowMs = input.now.getTime();
  const groupSet = new Set(input.userGroupIds);

  const matching = input.schedules.filter((s) => {
    if (!s.is_active) return false;
    if (new Date(s.starts_at).getTime() > nowMs) return false;
    if (new Date(s.ends_at).getTime() <= nowMs) return false;
    if (s.all_users) return true;
    return s.group_ids.some((g) => groupSet.has(g));
  });

  matching.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    // Later start wins among equal priority: the most recently scheduled campaign is the intended one.
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });

  const winner = matching[0];
  if (winner) {
    return {
      imageUrl: winner.banner.public_url,
      linkUrl: winner.link_url ?? winner.banner.link_url,
      alt: winner.banner.alt,
      bannerId: winner.banner.id,
      scheduleId: winner.id,
      source: "schedule",
    };
  }
  if (input.defaultBanner) {
    return {
      imageUrl: input.defaultBanner.public_url,
      linkUrl: input.defaultBanner.link_url,
      alt: input.defaultBanner.alt,
      bannerId: input.defaultBanner.id,
      scheduleId: null,
      source: "default",
    };
  }
  return {
    imageUrl: `${appUrl()}/seed/barcelo-properties-carousel.gif`,
    linkUrl: "https://www.barcelo.com/en-us/hotels/turkey/",
    alt: "Barceló Hotel Group Türkiye",
    bannerId: null,
    scheduleId: null,
    source: "fallback",
  };
}

interface ScheduleRow extends BannerSchedule {
  banner: Banner | null;
  banner_schedule_groups: { group_id: string }[] | null;
}

/** Loads everything the resolver needs for one signature token. Returns null for unknown or inactive tokens. */
export async function resolveBannerForToken(token: string, now = new Date()) {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("sig_users")
    .select("id, hotel_id, is_active, user_groups(group_id)")
    .eq("token", token)
    .maybeSingle();
  if (!user) return null;

  const [{ data: hotelGroups }, { data: scheduleRows }, { data: setting }] = await Promise.all([
    admin.from("groups").select("id").eq("hotel_id", user.hotel_id),
    admin
      .from("banner_schedules")
      .select("*, banner:banners(*), banner_schedule_groups(group_id)")
      .eq("is_active", true)
      .lte("starts_at", now.toISOString())
      .gt("ends_at", now.toISOString()),
    admin.from("settings").select("value").eq("key", "default_banner_id").maybeSingle(),
  ]);

  const defaultBannerId = typeof setting?.value === "string" ? setting.value : null;
  let defaultBanner: Banner | null = null;
  if (defaultBannerId) {
    const { data } = await admin.from("banners").select("*").eq("id", defaultBannerId).maybeSingle();
    defaultBanner = (data as Banner | null) ?? null;
  }

  const explicit = (user.user_groups as { group_id: string }[] | null)?.map((g) => g.group_id) ?? [];
  const auto = (hotelGroups ?? []).map((g) => g.id as string);

  const schedules: ScheduleCandidate[] = ((scheduleRows ?? []) as unknown as ScheduleRow[])
    .filter((r): r is ScheduleRow & { banner: Banner } => r.banner !== null)
    .map((r) => ({
      ...r,
      banner: r.banner,
      group_ids: (r.banner_schedule_groups ?? []).map((g) => g.group_id),
    }));

  const resolved = pickBanner({
    user: { id: user.id as string, hotel_id: user.hotel_id as string },
    userGroupIds: [...explicit, ...auto],
    schedules,
    defaultBanner,
    now,
  });

  return { userId: user.id as string, isActive: Boolean(user.is_active), resolved };
}
