import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Public, secret-free health check: build id and whether the database answers. */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  let dbError: string | null = null;
  try {
    const { error } = await createAdminClient().from("hotels").select("id", { head: true, count: "exact" });
    if (error) { db = "error"; dbError = error.message; }
  } catch (e) {
    db = "error"; dbError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(
    { ok: db === "ok", commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7), region: process.env.VERCEL_REGION ?? "local", db, dbError, ms: Date.now() - started },
    { status: db === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
