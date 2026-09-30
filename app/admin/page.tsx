import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listGroups, listSchedules, listUsers } from "@/lib/data";
import { fmtDateTime } from "@/lib/utils";
import { mailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [users, groups, schedules] = await Promise.all([listUsers(), listGroups(), listSchedules()]);
  const now = Date.now();
  const live = schedules.filter((s) => s.is_active && new Date(s.starts_at).getTime() <= now && new Date(s.ends_at).getTime() > now);
  const upcoming = schedules.filter((s) => s.is_active && new Date(s.starts_at).getTime() > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 5);
  const notSent = users.filter((u) => u.is_active && !u.last_sent_at).length;
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "?";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">Signatures, groups and live banners at a glance.</p>
      </div>

      {!mailConfigured() && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
          SMTP is not configured yet. Install mails cannot be sent until SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM are set.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active users" value={users.filter((u) => u.is_active).length} href="/admin/users" />
        <Stat label="Not yet sent" value={notSent} href="/admin/users?filter=unsent" />
        <Stat label="Groups" value={groups.length} href="/admin/groups" />
        <Stat label="Live banners" value={live.length} href="/admin/schedule" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link className="text-xs text-accent" href="/admin/schedule">Open calendar</Link>}>Live right now</CardTitle>
          {live.length === 0 ? (
            <p className="text-sm text-muted">No scheduled banner is live. Everyone sees the default banner.</p>
          ) : (
            <ul className="space-y-3">
              {live.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.banner.public_url} alt="" className="h-10 w-[153px] rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted">until {fmtDateTime(s.ends_at)} · priority {s.priority}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.all_users ? <Badge tone="accent">All users</Badge> : s.group_ids.map((g) => <Badge key={g}>{groupName(g)}</Badge>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Upcoming</CardTitle>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled ahead.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">{s.title}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(s.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-panel p-5 transition hover:border-accent">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Link>
  );
}
