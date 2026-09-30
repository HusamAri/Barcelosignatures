import { createClient } from "@/lib/supabase/server";
import type { Banner, BannerScheduleWithRelations, Group, Hotel, SigUserWithRelations } from "@/lib/types";

export async function listHotels(includeInactive = false): Promise<Hotel[]> {
  const supabase = await createClient();
  let q = supabase.from("hotels").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Hotel[];
}

export async function listGroups(): Promise<Group[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Group[];
}

interface UserRow extends Omit<SigUserWithRelations, "group_ids" | "hotel"> {
  hotel: Hotel | null;
  user_groups: { group_id: string }[] | null;
}

function mapUser(r: UserRow): SigUserWithRelations | null {
  if (!r.hotel) return null;
  const { user_groups, hotel, ...rest } = r;
  return { ...rest, hotel, group_ids: (user_groups ?? []).map((g) => g.group_id) };
}

export async function listUsers(): Promise<SigUserWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sig_users").select("*, hotel:hotels(*), user_groups(group_id)").order("full_name");
  if (error) throw error;
  return ((data ?? []) as unknown as UserRow[]).map(mapUser).filter((u): u is SigUserWithRelations => u !== null);
}

export async function getUser(id: string): Promise<SigUserWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sig_users").select("*, hotel:hotels(*), user_groups(group_id)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data as unknown as UserRow) : null;
}

export async function listBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

interface ScheduleRow extends Omit<BannerScheduleWithRelations, "banner" | "group_ids"> {
  banner: Banner | null;
  banner_schedule_groups: { group_id: string }[] | null;
}

export async function listSchedules(): Promise<BannerScheduleWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banner_schedules")
    .select("*, banner:banners(*), banner_schedule_groups(group_id)")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ScheduleRow[])
    .filter((r): r is ScheduleRow & { banner: Banner } => r.banner !== null)
    .map(({ banner_schedule_groups, ...r }) => ({ ...r, group_ids: (banner_schedule_groups ?? []).map((g) => g.group_id) }));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return data && data.value !== null ? (data.value as T) : fallback;
}
