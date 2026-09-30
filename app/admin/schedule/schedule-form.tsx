import type { Banner, BannerScheduleWithRelations, Group } from "@/lib/types";
import { SubmitButton } from "@/components/ui/submit-button";
import { toLocalInputValue } from "@/lib/utils";

export function ScheduleForm({
  banners, groups, schedule, action, month, submitLabel, defaultStart,
}: {
  banners: Banner[]; groups: Group[]; schedule?: BannerScheduleWithRelations; action: (formData: FormData) => Promise<void>;
  month: string; submitLabel: string; defaultStart?: Date;
}) {
  const start = schedule ? toLocalInputValue(schedule.starts_at) : defaultStart ? toLocalInputValue(defaultStart) : "";
  const end = schedule ? toLocalInputValue(schedule.ends_at) : defaultStart ? toLocalInputValue(new Date(defaultStart.getTime() + 14 * 86400000)) : "";
  const auto = groups.filter((g) => g.hotel_id);
  const manual = groups.filter((g) => !g.hotel_id);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="month" value={month} />
      <div className="sm:col-span-2">
        <label htmlFor="title">Campaign title</label>
        <input id="title" name="title" required defaultValue={schedule?.title} placeholder="Ramazan Iftar 2026, Summer Sale, WTA Award..." />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="banner_id">Banner</label>
        <select id="banner_id" name="banner_id" required defaultValue={schedule?.banner_id ?? ""}>
          <option value="" disabled>Choose a banner…</option>
          {banners.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.width}×{b.height})</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="starts_at">Starts (Istanbul time)</label>
        <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={start} />
      </div>
      <div>
        <label htmlFor="ends_at">Ends (Istanbul time)</label>
        <input id="ends_at" name="ends_at" type="datetime-local" required defaultValue={end} />
      </div>
      <div>
        <label htmlFor="priority">Priority (higher wins on overlap)</label>
        <input id="priority" name="priority" type="number" min={0} max={100} defaultValue={schedule?.priority ?? 0} />
      </div>
      <div>
        <label htmlFor="link_url">Link override (optional)</label>
        <input id="link_url" name="link_url" type="url" defaultValue={schedule?.link_url ?? ""} placeholder="Uses the banner's link when empty" />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input type="checkbox" name="all_users" defaultChecked={schedule?.all_users ?? false} className="h-4 w-4" /> All users (ignore groups)
        </label>
        <p className="text-xs text-muted">Or target groups:</p>
        <div className="flex flex-wrap gap-2">
          {auto.map((g) => (
            <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-text">
              <input type="checkbox" name="group_ids" value={g.id} defaultChecked={schedule?.group_ids.includes(g.id)} className="h-4 w-4" /> {g.name}
            </label>
          ))}
          {manual.map((g) => (
            <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-panel-2 px-3 py-1.5 text-sm text-text">
              <input type="checkbox" name="group_ids" value={g.id} defaultChecked={schedule?.group_ids.includes(g.id)} className="h-4 w-4" /> {g.name}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input type="checkbox" name="is_active" defaultChecked={schedule?.is_active ?? true} className="h-4 w-4" /> Active
        </label>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
