import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderSignatureDocument, buildEmail } from "@/lib/signature/render";
import { appUrl } from "@/lib/env";
import type { Hotel } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Renders the template with sample data and a static banner, for the iframe on the Templates page. */
export async function GET(_req: Request, ctx: { params: Promise<{ hotelId: string }> }) {
  await requireAdmin();
  const { hotelId } = await ctx.params;
  const supabase = await createClient();
  const { data } = await supabase.from("hotels").select("*").eq("id", hotelId).maybeSingle();
  if (!data) return new NextResponse("Not found", { status: 404 });
  const hotel = data as Hotel;
  const doc = renderSignatureDocument(
    hotel,
    { full_name: "Ayşe Kaya", title: "Sales Manager", email: buildEmail(hotel, "sm"), mobile: "05321234567", token: "preview" },
    { appUrl: appUrl(), staticBannerUrl: `${appUrl()}/seed/barcelo-properties-carousel.gif`, staticBannerLink: hotel.website_url },
  ).replace("<body style=\"margin:0; padding:0;", "<body style=\"margin:0; padding:16px;");
  return new NextResponse(doc, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
