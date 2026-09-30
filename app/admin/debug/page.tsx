import { headers, cookies } from "next/headers";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/env";
import { mailConfigured } from "@/lib/mail";
import { resolveBannerForToken } from "@/lib/banners/resolve";
import { looksDoublePrefixed } from "@/lib/signature/render";

export const dynamic = "force-dynamic";

interface Check { name: string; ok: boolean; detail: string }

function asciiOnly(v: string | undefined): boolean {
  return Boolean(v) && [...(v ?? "")].every((c) => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126);
}

export default async function DebugPage() {
  const me = await requireAdmin();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const checks: Check[] = [];
  const t0 = Date.now();

  // Build / runtime
  checks.push({ name: "Commit", ok: true, detail: `${(process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7)} · region ${process.env.VERCEL_REGION ?? "local"} · node ${process.version}` });

  // Env
  const app = appUrl();
  checks.push({ name: "NEXT_PUBLIC_APP_URL", ok: app.includes(host) || host === "", detail: `${app} (request host: ${host || "unknown"})${app.includes(host) ? "" : " → mismatch: install links and banner URLs point elsewhere"}` });
  checks.push({ name: "NEXT_PUBLIC_SUPABASE_URL", ok: /^https:\/\/[a-z]+\.supabase\.co$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""), detail: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "missing" });
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  checks.push({ name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: asciiOnly(anon), detail: anon ? `${anon.slice(0, 12)}… (${anon.length} chars${asciiOnly(anon) ? "" : ", contains an invalid character"})` : "missing" });
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  checks.push({ name: "SUPABASE_SERVICE_ROLE_KEY", ok: asciiOnly(svc), detail: svc ? `set (${svc.length} chars${asciiOnly(svc) ? "" : ", contains an invalid character"})` : "missing" });
  checks.push({ name: "ADMIN_EMAILS", ok: Boolean(process.env.ADMIN_EMAILS), detail: process.env.ADMIN_EMAILS ?? "missing (only the admins table applies)" });
  checks.push({ name: "AUTH_SECRET", ok: true, detail: process.env.AUTH_SECRET ? "set" : "not set, sessions are signed with the service role key (fine)" });
  checks.push({ name: "SMTP", ok: mailConfigured(), detail: mailConfigured() ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587} as ${process.env.SMTP_USER}` : "not configured, install mails cannot be sent yet" });

  // Session
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  checks.push({ name: "Session", ok: Boolean(session), detail: session ? `${session.email} · mustChange=${session.mustChange} · expires ${new Date(session.exp * 1000).toISOString()}` : "no valid session cookie" });

  // Database
  const admin = createAdminClient();
  const tables = ["hotels", "groups", "sig_users", "user_groups", "banners", "banner_schedules", "banner_schedule_groups", "banner_clicks", "banner_loads", "settings", "admins"] as const;
  for (const t of tables) {
    const started = Date.now();
    const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
    checks.push({ name: `table ${t}`, ok: !error, detail: error ? `${error.code ?? ""} ${error.message}` : `${count ?? 0} rows · ${Date.now() - started} ms` });
  }

  // Relationship embeds used by the app (break when the API schema cache is stale)
  {
    const { error } = await admin.from("sig_users").select("id, hotel:hotels(id), user_groups(group_id)").limit(1);
    checks.push({ name: "API relationships", ok: !error, detail: error ? `${error.code ?? ""} ${error.message} → run: notify pgrst, 'reload schema';` : "sig_users → hotels, user_groups resolve" });
    const { error: e2 } = await admin.from("banner_schedules").select("id, banner:banners(id), banner_schedule_groups(group_id)").limit(1);
    checks.push({ name: "API relationships (schedules)", ok: !e2, detail: e2 ? `${e2.code ?? ""} ${e2.message}` : "banner_schedules → banners, groups resolve" });
  }

  // Storage
  {
    const { data, error } = await admin.storage.getBucket("banners");
    checks.push({ name: "Storage bucket banners", ok: !error && Boolean(data?.public), detail: error ? error.message : `public=${data?.public} · limit ${data?.file_size_limit ?? "none"} bytes` });
  }

  // Settings and resolver
  {
    const { data } = await admin.from("settings").select("key,value");
    const map = Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value]));
    checks.push({ name: "Default banner", ok: true, detail: map.default_banner_id ? String(map.default_banner_id) : "none set, built-in carousel is used" });
    checks.push({ name: "Banner size lock", ok: true, detail: JSON.stringify(map.banner_size ?? null) });
    const { data: u } = await admin.from("sig_users").select("token, full_name").eq("is_active", true).limit(1).maybeSingle();
    if (u) {
      const r = await resolveBannerForToken(u.token as string);
      checks.push({ name: `Resolver for ${u.full_name}`, ok: Boolean(r), detail: r ? `${r.resolved.source} → ${r.resolved.imageUrl}` : "user not found by token" });
    }
  }

  // Data sanity
  {
    const { data: users } = await admin.from("sig_users").select("full_name, email, hotel:hotels(email_prefix, email_domain)");
    const rows = (users ?? []) as unknown as { full_name: string; email: string; hotel: { email_prefix: string; email_domain: string } | null }[];
    const doubled = rows.filter((u) => u.hotel && looksDoublePrefixed(u.hotel, u.email));
    checks.push({ name: "User emails", ok: doubled.length === 0, detail: doubled.length ? `hotel prefix doubled: ${doubled.map((u) => `${u.full_name} <${u.email}>`).join(", ")}` : `${rows.length} addresses look well-formed` });
    const bad = rows.filter((u) => !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(u.email));
    if (bad.length) checks.push({ name: "Invalid emails", ok: false, detail: bad.map((u) => `${u.full_name} <${u.email}>`).join(", ") });
  }

  checks.push({ name: "Total check time", ok: true, detail: `${Date.now() - t0} ms` });
  const failing = checks.filter((c) => !c.ok);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug</h1>
        <p className="text-sm text-muted">Live health of every dependency, as seen from this deployment. Signed in as {me.email}.</p>
      </div>
      <Card>
        <CardTitle action={failing.length ? <Badge tone="warn">{failing.length} failing</Badge> : <Badge tone="ok">all good</Badge>}>Checks</CardTitle>
        <ul className="divide-y divide-border">
          {checks.map((c) => (
            <li key={c.name} className="flex flex-wrap items-start gap-3 py-2 text-sm">
              <span className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${c.ok ? "bg-ok" : "bg-danger"}`} />
              <span className="w-64 shrink-0 font-semibold">{c.name}</span>
              <span className="min-w-0 flex-1 break-all text-muted">{c.detail}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>When something breaks</CardTitle>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Open this page first. A red dot names the broken dependency.</li>
          <li>If a page shows an error screen, copy the digest it prints and send it with the page URL.</li>
          <li>Env changes on Vercel need a redeploy before they apply.</li>
        </ol>
      </Card>
    </div>
  );
}
