"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readImageInfo } from "@/lib/image-size";
import { getSetting } from "@/lib/data";
import type { BannerSize } from "@/lib/types";

function back(msg: { ok?: string; error?: string }): never {
  const qs = new URLSearchParams();
  if (msg.ok) qs.set("ok", msg.ok);
  if (msg.error) qs.set("error", msg.error);
  redirect(`/admin/banners?${qs.toString()}`);
}

const EXT: Record<string, string> = { "image/gif": "gif", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function uploadBanner(formData: FormData): Promise<void> {
  await requireAdmin();
  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim() || "Barceló Hotel Group Türkiye";
  const link_url = String(formData.get("link_url") ?? "").trim() || "https://www.barcelo.com/en-us/hotels/turkey/";
  const allowAnySize = formData.get("allow_any_size") === "on";

  if (!(file instanceof File) || file.size === 0) back({ error: "Choose an image file" });
  if (!name) back({ error: "Banner name is required" });
  if (file.size > 5 * 1024 * 1024) back({ error: "Max 5 MB. Compress the GIF first." });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = readImageInfo(bytes);
  if (!info) back({ error: "Unsupported image. Use GIF, PNG, JPEG or WebP." });

  const size = await getSetting<BannerSize>("banner_size", { width: 612, height: 140 });
  if (!allowAnySize && (info.width !== size.width || info.height !== size.height)) {
    back({ error: `Image is ${info.width}×${info.height}. Signatures are locked to ${size.width}×${size.height}; a different size would be stretched in Outlook. Resize it, or tick "allow any size" if you know what you are doing.` });
  }
  if (!/^https?:\/\//.test(link_url)) back({ error: "Link must start with http:// or https://" });

  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${EXT[info.mime]}`;
  const { error: upErr } = await admin.storage.from("banners").upload(path, bytes, { contentType: info.mime, cacheControl: "31536000", upsert: false });
  if (upErr) back({ error: `Upload failed: ${upErr.message}` });
  const { data: pub } = admin.storage.from("banners").getPublicUrl(path);

  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert({
    name, alt, link_url, storage_path: path, public_url: pub.publicUrl, mime_type: info.mime, width: info.width, height: info.height,
  });
  if (error) back({ error: error.message });
  revalidatePath("/admin/banners");
  revalidatePath("/admin/schedule");
  back({ ok: `"${name}" uploaded (${info.width}×${info.height})` });
}

export async function updateBanner(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const link_url = String(formData.get("link_url") ?? "").trim();
  if (!name || !link_url) back({ error: "Name and link are required" });
  const supabase = await createClient();
  const { error } = await supabase.from("banners").update({ name, alt, link_url }).eq("id", id);
  if (error) back({ error: error.message });
  revalidatePath("/admin/banners");
  back({ ok: "Banner updated" });
}

export async function deleteBanner(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) back({ error: error.message });
  if (data?.storage_path) await createAdminClient().storage.from("banners").remove([data.storage_path as string]);
  const def = await getSetting<string | null>("default_banner_id", null);
  if (def === id) {
    const { error: clearErr } = await supabase.from("settings").update({ value: null }).eq("key", "default_banner_id");
    if (clearErr) back({ error: `Banner deleted, but clearing the default failed: ${clearErr.message}` });
  }
  revalidatePath("/admin/banners");
  revalidatePath("/admin/schedule");
  back({ ok: "Banner deleted. Schedules using it were removed too." });
}

export async function setDefaultBanner(id: string | null): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert({ key: "default_banner_id", value: id }, { onConflict: "key" });
  if (error) back({ error: error.message });
  revalidatePath("/admin/banners");
  back({ ok: id ? "Default banner set" : "Default cleared; the built-in carousel is used" });
}
