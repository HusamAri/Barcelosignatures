import Link from "next/link";
import { addDays, addMonths, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import type { BannerScheduleWithRelations, Group } from "@/lib/types";

const COLORS = ["#468D98", "#C9A227", "#7B61FF", "#E07A5F", "#3FAE6B", "#D96BA0", "#5B8DEF", "#B0803A"];

function colorFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length] ?? COLORS[0]!;
}

/** Istanbul-local day boundaries as UTC instants (UTC+3, no DST). */
function istDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 3 * 3600 * 1000;
}

export function MonthCalendar({ month, schedules, groups, selectedId }: { month: Date; schedules: BannerScheduleWithRelations[]; groups: Group[]; selectedId?: string }) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= last || days.length % 7 !== 0; d = addDays(d, 1)) days.push(d);
  const monthKey = (d: Date) => format(d, "yyyy-MM");
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "?";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link href={`/admin/schedule?month=${monthKey(subMonths(month, 1))}`} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-panel-2">←</Link>
        <h2 className="text-lg font-bold capitalize">{format(month, "LLLL yyyy", { locale: tr })}</h2>
        <Link href={`/admin/schedule?month=${monthKey(addMonths(month, 1))}`} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-panel-2">→</Link>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <div key={d} className="bg-panel px-2 py-1.5 text-center font-semibold uppercase text-muted">{d}</div>
        ))}
        {days.map((day) => {
          const dayStart = istDayStart(day);
          const dayEnd = dayStart + 24 * 3600 * 1000;
          const items = schedules
            .filter((s) => new Date(s.starts_at).getTime() < dayEnd && new Date(s.ends_at).getTime() > dayStart)
            .sort((a, b) => b.priority - a.priority);
          const key = format(day, "yyyy-MM-dd");
          return (
            <div key={key} className={`min-h-24 bg-panel p-1.5 ${isSameMonth(day, month) ? "" : "opacity-40"}`}>
              <div className={`mb-1 text-right text-[11px] ${key === todayKey ? "font-bold text-accent" : "text-muted"}`}>{format(day, "d")}</div>
              <div className="space-y-0.5">
                {items.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/schedule?month=${monthKey(month)}&edit=${s.id}`}
                    title={`${s.title} · ${s.all_users ? "All users" : s.group_ids.map(groupName).join(", ")} · priority ${s.priority}`}
                    className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-white ${s.is_active ? "" : "opacity-50 line-through"} ${selectedId === s.id ? "ring-2 ring-white" : ""}`}
                    style={{ background: colorFor(s.id) }}
                  >
                    {s.title}
                  </Link>
                ))}
                {items.length > 4 && <div className="text-[10px] text-muted">+{items.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
