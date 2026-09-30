"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fromLocalInputValue } from "@/lib/utils";

function back(msg: { ok?: string; error?: string }, month?: string): never {
  const qs = new URLSearchParams();
  if (msg.ok) qs.set("ok", msg.ok);
  if (msg.error) qs.set("error", msg.error);
  if (month) qs.set("month", month);
  redirect(`/admin/schedule?${qs.toString()}`);
}

const schema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  banner_id: z.string().uuid("Pick a banner"),
  starts_at: z.string().min(1, "Start is required"),
  ends_at: z.string().min(1, "End is required"),
  priority: z.coerce.number().int().min(0).max(100),
  all_users: z.boolean(),
  link_url: z.string().trim().default(""),
  is_active: z.boolean(),
  group_ids: z.array(z.string().uuid()),
});

function parse(formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    banner_id: formData.get("banner_id"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    priority: formData.get("priority") ?? 0,
    all_users: formData.get("all_users") === "on",
    link_url: formData.get("link_url") ?? "",
    is_active: formData.get("is_active") === "on",
    group_ids: formData.getAll("group_ids").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") } as const;
  const d = parsed.data;
  const starts_at = fromLocalInputValue(d.starts_at);
  const ends_at = fromLocalInputValue(d.ends_at);
  if (ends_at <= starts_at) return { error: "End must be after start" } as const;
  if (!d.all_users && d.group_ids.length === 0) return { error: "Pick at least one group, or tick All users" } as const;
  if (d.link_url && !/^https?:\/\//.test(d.link_url)) return { error: "Link must start with http:// or https://" } as const;
  return {
    row: { title: d.title, banner_id: d.banner_id, starts_at, ends_at, priority: d.priority, all_users: d.all_users, link_url: d.link_url || null, is_active: d.is_active },
    group_ids: d.all_users ? [] : d.group_ids,
  } as const;
}

async function syncGroups(scheduleId: string, groupIds: string[]) {
  const supabase = await createClient();
  await supabase.from("banner_schedule_groups").delete().eq("schedule_id", scheduleId);
  if (groupIds.length) {
    const { error } = await supabase.from("banner_schedule_groups").insert(groupIds.map((group_id) => ({ schedule_id: scheduleId, group_id })));
    if (error) throw error;
  }
}

export async function createSchedule(formData: FormData): Promise<void> {
  await requireAdmin();
  const month = String(formData.get("month") ?? "");
  const p = parse(formData);
  if ("error" in p) back({ error: p.error }, month);
  const supabase = await createClient();
  const { data, error } = await supabase.from("banner_schedules").insert(p.row).select("id").single();
  if (error || !data) back({ error: error?.message ?? "Insert failed" }, month);
  await syncGroups(data.id as string, p.group_ids);
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  back({ ok: `"${p.row.title}" scheduled` }, month);
}

export async function updateSchedule(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const month = String(formData.get("month") ?? "");
  const p = parse(formData);
  if ("error" in p) back({ error: p.error }, month);
  const supabase = await createClient();
  const { error } = await supabase.from("banner_schedules").update(p.row).eq("id", id);
  if (error) back({ error: error.message }, month);
  await syncGroups(id, p.group_ids);
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  back({ ok: "Schedule updated" }, month);
}

export async function deleteSchedule(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const month = String(formData.get("month") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("banner_schedules").delete().eq("id", id);
  if (error) back({ error: error.message }, month);
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  back({ ok: "Schedule deleted" }, month);
}

export async function toggleSchedule(id: string, active: boolean, formData: FormData): Promise<void> {
  await requireAdmin();
  const month = String(formData.get("month") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("banner_schedules").update({ is_active: active }).eq("id", id);
  if (error) back({ error: error.message }, month);
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  back({ ok: active ? "Schedule resumed" : "Schedule paused" }, month);
}
