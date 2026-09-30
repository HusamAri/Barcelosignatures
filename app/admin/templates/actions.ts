"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateHotel(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const row = {
    name: s("name"), slogan: s("slogan"), email_prefix: s("email_prefix").toLowerCase(), email_domain: s("email_domain").toLowerCase(),
    address: s("address"), map_url: s("map_url"), phone_display: s("phone_display"), phone_href: s("phone_href").replace(/\s+/g, ""),
    website_url: s("website_url"), website_label: s("website_label"),
    secondary_banner_url: s("secondary_banner_url") || null, secondary_banner_alt: s("secondary_banner_alt") || null,
    is_active: formData.get("is_active") === "on",
  };
  if (!row.name || !row.email_domain || !row.address) redirect(`/admin/templates?error=${encodeURIComponent("Name, domain and address are required")}`);
  const supabase = await createClient();
  const { error } = await supabase.from("hotels").update(row).eq("id", id);
  if (error) redirect(`/admin/templates?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/templates");
  redirect(`/admin/templates?ok=${encodeURIComponent(`${row.name} saved`)}`);
}
