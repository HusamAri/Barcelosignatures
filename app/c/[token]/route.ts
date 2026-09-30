import { NextResponse, type NextRequest } from "next/server";
import { resolveBannerForToken } from "@/lib/banners/resolve";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Banner click: log it, then send the recipient to the campaign link that is live right now. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const result = await resolveBannerForToken(token);
  const target = result?.resolved.linkUrl ?? "https://www.barcelo.com/en-us/hotels/turkey/";

  if (result) {
    const admin = createAdminClient();
    await admin.from("banner_clicks").insert({
      user_id: result.userId,
      schedule_id: result.resolved.scheduleId,
      banner_id: result.resolved.bannerId,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
  }
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store" } });
}
