"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { installMail } from "@/lib/mail-templates";
import { renderSignatureDocument, buildEmail } from "@/lib/signature/render";
import { asciiFold } from "@/lib/signature/format";
import type { Hotel, SigUser } from "@/lib/types";

const userSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required"),
  title: z.string().trim().default(""),
  email_local: z.string().trim().min(1, "Email is required"),
  mobile: z.string().trim().default(""),
  hotel_id: z.string().min(1, "Hotel is required"),
  is_active: z.boolean(),
  group_ids: z.array(z.string().uuid()),
});

function parseUserForm(formData: FormData) {
  return userSchema.safeParse({
    full_name: formData.get("full_name"),
    title: formData.get("title") ?? "",
    email_local: formData.get("email_local"),
    mobile: formData.get("mobile") ?? "",
    hotel_id: formData.get("hotel_id"),
    is_active: formData.get("is_active") === "on",
    group_ids: formData.getAll("group_ids").map(String),
  });
}

function back(path: string, msg: { ok?: string; error?: string }): never {
  const qs = new URLSearchParams();
  if (msg.ok) qs.set("ok", msg.ok);
  if (msg.error) qs.set("error", msg.error);
  redirect(`${path}?${qs.toString()}`);
}

async function loadHotel(hotelId: string): Promise<Hotel> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("hotels").select("*").eq("id", hotelId).single();
  if (error || !data) throw new Error("Hotel not found");
  return data as Hotel;
}

async function syncGroups(userId: string, groupIds: string[]) {
  const supabase = await createClient();
  await supabase.from("user_groups").delete().eq("user_id", userId);
  if (groupIds.length) {
    const { error } = await supabase.from("user_groups").insert(groupIds.map((group_id) => ({ user_id: userId, group_id })));
    if (error) throw error;
  }
}

export async function createUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseUserForm(formData);
  if (!parsed.success) back("/admin/users", { error: parsed.error.issues.map((i) => i.message).join(", ") });

  const hotel = await loadHotel(parsed.data.hotel_id);
  const email = buildEmail(hotel, parsed.data.email_local);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sig_users")
    .insert({ full_name: parsed.data.full_name, title: parsed.data.title, email, mobile: parsed.data.mobile, hotel_id: hotel.id, is_active: parsed.data.is_active })
    .select("id")
    .single();
  if (error) back("/admin/users", { error: error.code === "23505" ? `${email} already exists` : error.message });
  await syncGroups(data.id as string, parsed.data.group_ids);
  revalidatePath("/admin/users");
  redirect(`/admin/users/${data.id}?ok=${encodeURIComponent("User created")}`);
}

export async function updateUser(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseUserForm(formData);
  const path = `/admin/users/${id}`;
  if (!parsed.success) back(path, { error: parsed.error.issues.map((i) => i.message).join(", ") });

  const hotel = await loadHotel(parsed.data.hotel_id);
  const email = buildEmail(hotel, parsed.data.email_local);
  const supabase = await createClient();
  const { error } = await supabase
    .from("sig_users")
    .update({ full_name: parsed.data.full_name, title: parsed.data.title, email, mobile: parsed.data.mobile, hotel_id: hotel.id, is_active: parsed.data.is_active })
    .eq("id", id);
  if (error) back(path, { error: error.message });
  await syncGroups(id, parsed.data.group_ids);
  revalidatePath("/admin/users");
  back(path, { ok: "Saved" });
}

export async function deleteUser(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("sig_users").delete().eq("id", id);
  if (error) back(`/admin/users/${id}`, { error: error.message });
  revalidatePath("/admin/users");
  back("/admin/users", { ok: "User deleted" });
}

/** Rotates the personal token. Old links, banners and click URLs stop working; the person must re-install. */
export async function rotateToken(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(16).padStart(2, "0")).join("");
  const { error } = await supabase.from("sig_users").update({ token }).eq("id", id);
  if (error) back(`/admin/users/${id}`, { error: error.message });
  back(`/admin/users/${id}`, { ok: "New link generated. Send the install mail again." });
}

/**
 * CSV import. Header row required. Columns (any order, case-insensitive):
 * full_name, title, email, mobile, hotel (id or name), groups (semicolon separated names).
 */
export async function importUsers(formData: FormData): Promise<void> {
  await requireAdmin();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) back("/admin/users", { error: "Paste CSV rows first" });

  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const delimiter = (lines[0] ?? "").includes(";") && !(lines[0] ?? "").includes(",") ? ";" : ",";
  const split = (line: string) => line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(lines[0] ?? "").map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const required = ["full_name", "email", "hotel"];
  const missing = required.filter((r) => col(r) === -1);
  if (missing.length) back("/admin/users", { error: `CSV header is missing: ${missing.join(", ")}` });

  const supabase = await createClient();
  const [{ data: hotels }, { data: groups }] = await Promise.all([supabase.from("hotels").select("*"), supabase.from("groups").select("id,name")]);
  const hotelList = (hotels ?? []) as Hotel[];
  const groupList = (groups ?? []) as { id: string; name: string }[];
  const findHotel = (v: string) => {
    const f = asciiFold(v).toLowerCase();
    return hotelList.find((h) => h.id === f || asciiFold(h.name).toLowerCase() === f);
  };
  const findGroup = (v: string) => groupList.find((g) => asciiFold(g.name).toLowerCase() === asciiFold(v).toLowerCase());

  let created = 0, updated = 0;
  const errors: string[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const get = (name: string) => (col(name) === -1 ? "" : (cells[col(name)] ?? ""));
    const hotel = findHotel(get("hotel"));
    if (!hotel) { errors.push(`${get("email") || line}: unknown hotel "${get("hotel")}"`); continue; }
    const email = buildEmail(hotel, get("email"));
    const row = { full_name: get("full_name"), title: get("title"), email, mobile: get("mobile"), hotel_id: hotel.id, is_active: true };
    if (!row.full_name) { errors.push(`${email}: missing name`); continue; }

    const { data: existing } = await supabase.from("sig_users").select("id").eq("email", email).maybeSingle();
    let userId: string;
    if (existing) {
      const { error } = await supabase.from("sig_users").update(row).eq("id", existing.id);
      if (error) { errors.push(`${email}: ${error.message}`); continue; }
      userId = existing.id as string; updated++;
    } else {
      const { data, error } = await supabase.from("sig_users").insert(row).select("id").single();
      if (error || !data) { errors.push(`${email}: ${error?.message ?? "insert failed"}`); continue; }
      userId = data.id as string; created++;
    }
    const groupNames = get("groups").split(";").map((s) => s.trim()).filter(Boolean);
    if (groupNames.length) {
      const ids = groupNames.map(findGroup).filter((g): g is { id: string; name: string } => Boolean(g)).map((g) => g.id);
      const unknown = groupNames.filter((n) => !findGroup(n));
      if (unknown.length) errors.push(`${email}: unknown groups ${unknown.join(", ")}`);
      await supabase.from("user_groups").upsert(ids.map((group_id) => ({ user_id: userId, group_id })), { onConflict: "user_id,group_id" });
    }
  }
  revalidatePath("/admin/users");
  const summary = `Imported: ${created} created, ${updated} updated.`;
  if (errors.length) back("/admin/users", { error: `${summary} Problems: ${errors.slice(0, 8).join(" | ")}${errors.length > 8 ? " …" : ""}` });
  back("/admin/users", { ok: summary });
}

async function sendInstallTo(user: SigUser, hotel: Hotel): Promise<void> {
  const base = appUrl();
  const pageUrl = `${base}/s/${user.token}`;
  const firstName = user.full_name.trim().split(/\s+/)[0] ?? user.full_name;
  const mail = installMail({ firstName, hotelName: hotel.name, pageUrl });
  const doc = renderSignatureDocument(hotel, user, { appUrl: base });
  const filename = `${asciiFold(user.full_name).replace(/\s+/g, "_")}_${hotel.id}.htm`;
  await sendMail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: [{ filename, content: doc, contentType: "text/html; charset=utf-8" }],
  });
  const supabase = await createClient();
  await supabase.from("sig_users").update({ last_sent_at: new Date().toISOString() }).eq("id", user.id);
}

export async function sendInstall(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("sig_users").select("*, hotel:hotels(*)").eq("id", id).maybeSingle();
  if (!data || !data.hotel) back(`/admin/users/${id}`, { error: "User not found" });
  const { hotel, ...user } = data as SigUser & { hotel: Hotel };
  try {
    await sendInstallTo(user, hotel);
  } catch (e) {
    back(`/admin/users/${id}`, { error: e instanceof Error ? e.message : "Send failed" });
  }
  revalidatePath("/admin/users");
  back(`/admin/users/${id}`, { ok: `Install mail sent to ${user.email}` });
}

export async function sendInstallBulk(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = formData.getAll("user_ids").map(String);
  if (!ids.length) back("/admin/users", { error: "Select at least one user" });
  const supabase = await createClient();
  const { data } = await supabase.from("sig_users").select("*, hotel:hotels(*)").in("id", ids).eq("is_active", true);
  let sent = 0;
  const failed: string[] = [];
  for (const row of (data ?? []) as (SigUser & { hotel: Hotel | null })[]) {
    if (!row.hotel) continue;
    const { hotel, ...user } = row;
    try {
      await sendInstallTo(user, hotel);
      sent++;
    } catch (e) {
      failed.push(`${user.email}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  revalidatePath("/admin/users");
  if (failed.length) back("/admin/users", { error: `Sent ${sent}. Failed: ${failed.slice(0, 5).join(" | ")}` });
  back("/admin/users", { ok: `Install mail sent to ${sent} user${sent === 1 ? "" : "s"}` });
}
