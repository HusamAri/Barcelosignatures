import Link from "next/link";
import { parse, isValid } from "date-fns";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Button } from "@/components/ui/button";
import { listBanners, listGroups, listSchedules } from "@/lib/data";
import { fmtDateTime } from "@/lib/utils";
import { MonthCalendar } from "./calendar";
import { ScheduleForm } from "./schedule-form";
import { createSchedule, deleteSchedule, toggleSchedule, updateSchedule } from "./actions";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const parsedMonth = sp.month ? parse(sp.month, "yyyy-MM", new Date()) : new Date();
  const month = isValid(parsedMonth) ? parsedMonth : new Date();
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  const [schedules, banners, groups] = await Promise.all([listSchedules(), listBanners(), listGroups()]);
  const editing = schedules.find((s) => s.id === sp.edit);
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "?";
  const now = Date.now();
  const status = (s: (typeof schedules)[number]) => {
    if (!s.is_active) return <Badge tone="warn">Paused</Badge>;
    if (new Date(s.ends_at).getTime() <= now) return <Badge>Ended</Badge>;
    if (new Date(s.starts_at).getTime() > now) return <Badge tone="accent">Upcoming</Badge>;
    return <Badge tone="ok">Live</Badge>;
  };
  const overlaps = editing
    ? schedules.filter((s) => s.id !== editing.id && s.is_active && s.starts_at < editing.ends_at && s.ends_at > editing.starts_at &&
        (s.all_users || editing.all_users || s.group_ids.some((g) => editing.group_ids.includes(g))))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted">Each campaign gets a time window and an audience. Installed signatures switch automatically at the start and end.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <MonthCalendar month={month} schedules={schedules} groups={groups} selectedId={editing?.id} />
        </Card>

        <Card className="xl:col-span-2">
          {banners.length === 0 ? (
            <p className="text-sm text-muted">Upload a banner first under <Link href="/admin/banners" className="text-accent">Banners</Link>.</p>
          ) : editing ? (
            <>
              <CardTitle action={<Link href={`/admin/schedule?month=${monthKey}`} className="text-xs text-muted hover:text-text">+ New instead</Link>}>Edit: {editing.title}</CardTitle>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editing.banner.public_url} alt="" className="mb-4 w-full rounded-lg bg-white" />
              {overlaps.length > 0 && (
                <div className="mb-4 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                  Overlaps with {overlaps.map((o) => `"${o.title}" (priority ${o.priority})`).join(", ")}. Highest priority wins, then the most recent start.
                </div>
              )}
              <ScheduleForm banners={banners} groups={groups} schedule={editing} action={updateSchedule.bind(null, editing.id)} month={monthKey} submitLabel="Save changes" />
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <form action={toggleSchedule.bind(null, editing.id, !editing.is_active)}>
                  <input type="hidden" name="month" value={monthKey} />
                  <Button variant="secondary" type="submit">{editing.is_active ? "Pause" : "Resume"}</Button>
                </form>
                <form action={deleteSchedule.bind(null, editing.id)} className="ml-auto">
                  <input type="hidden" name="month" value={monthKey} />
                  <ConfirmButton variant="danger" message={`Delete "${editing.title}"?`}>Delete</ConfirmButton>
                </form>
              </div>
            </>
          ) : (
            <>
              <CardTitle>New campaign</CardTitle>
              <ScheduleForm banners={banners} groups={groups} action={createSchedule} month={monthKey} submitLabel="Schedule banner" defaultStart={new Date()} />
            </>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>All campaigns</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Banner</th>
                <th className="py-2 pr-3">Campaign</th>
                <th className="py-2 pr-3">Window</th>
                <th className="py-2 pr-3">Audience</th>
                <th className="py-2 pr-3">Prio</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-border/60 hover:bg-panel-2/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <td className="py-2 pr-3"><img src={s.banner.public_url} alt="" className="h-8 w-[122px] rounded object-cover" /></td>
                  <td className="py-2 pr-3"><Link href={`/admin/schedule?month=${monthKey}&edit=${s.id}`} className="font-semibold hover:text-accent">{s.title}</Link></td>
                  <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted">{fmtDateTime(s.starts_at)}<br />{fmtDateTime(s.ends_at)}</td>
                  <td className="py-2 pr-3"><div className="flex flex-wrap gap-1">{s.all_users ? <Badge tone="accent">All users</Badge> : s.group_ids.map((g) => <Badge key={g}>{groupName(g)}</Badge>)}</div></td>
                  <td className="py-2 pr-3">{s.priority}</td>
                  <td className="py-2 pr-3">{status(s)}</td>
                </tr>
              ))}
              {schedules.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">No campaigns yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
