"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function back(msg: { ok?: string; error?: string }): never {
  const qs = new URLSearchParams();
  if (msg.ok) qs.set("ok", msg.ok);
  if (msg.error) qs.set("error", msg.error);
  redirect(`/admin/groups?${qs.toString()}`);
}

export async function createGroup(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) back({ error: "Group name is required" });
  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({ name, description });
  if (error) back({ error: error.code === "23505" ? `"${name}" already exists` : error.message });
  revalidatePath("/admin/groups");
  back({ ok: `Group "${name}" created` });
}

export async function deleteGroup(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) back({ error: error.message });
  revalidatePath("/admin/groups");
  back({ ok: "Group deleted" });
}

export async function setMembers(groupId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = formData.getAll("user_ids").map(String);
  const supabase = await createClient();
  await supabase.from("user_groups").delete().eq("group_id", groupId);
  if (ids.length) {
    const { error } = await supabase.from("user_groups").insert(ids.map((user_id) => ({ user_id, group_id: groupId })));
    if (error) back({ error: error.message });
  }
  revalidatePath("/admin/groups");
  revalidatePath("/admin/users");
  back({ ok: `Members saved (${ids.length})` });
}
