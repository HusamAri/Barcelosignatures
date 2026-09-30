import { NextResponse, type NextRequest } from "next/server";
import { resolveBannerForToken } from "@/lib/banners/resolve";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Dynamic banner endpoint. Every installed signature loads /b/{token}; we answer with a
 * redirect to whichever banner is scheduled for this person right now.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const result = await resolveBannerForToken(token);

  const fallback = `${appUrl()}/seed/barcelo-properties-carousel.gif`;
  if (!result) {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_CACHE });
  }

  const { resolved, userId } = result;
  if (resolved.source === "schedule") {
    // Best-effort load log; never block the image on it.
    const admin = createAdminClient();
    void admin.from("banner_loads").insert({ user_id: userId, schedule_id: resolved.scheduleId, banner_id: resolved.bannerId }).then(() => undefined, () => undefined);
  }
  return NextResponse.redirect(resolved.imageUrl, { status: 302, headers: NO_CACHE });
}
