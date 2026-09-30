import { NextResponse } from "next/server";
import { loadUserByToken } from "@/lib/signature/load";
import { renderSignatureDocument } from "@/lib/signature/render";
import { appUrl } from "@/lib/env";
import { asciiFold } from "@/lib/signature/format";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const found = await loadUserByToken(token);
  if (!found || !found.user.is_active) return new NextResponse("Not found", { status: 404 });
  const doc = renderSignatureDocument(found.hotel, found.user, { appUrl: appUrl() });
  const filename = `${asciiFold(found.user.full_name).replace(/\s+/g, "_") || "signature"}_${found.hotel.id}.htm`;
  return new NextResponse(doc, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
