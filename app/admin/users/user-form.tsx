import type { Group, Hotel, SigUserWithRelations } from "@/lib/types";
import { SubmitButton } from "@/components/ui/submit-button";

/** Shared create/edit form. The email field is split like the builders: fixed hotel prefix + free part + domain. */
export function UserForm({
  hotels, groups, user, action, submitLabel,
}: {
  hotels: Hotel[]; groups: Group[]; user?: SigUserWithRelations; action: (formData: FormData) => Promise<void>; submitLabel: string;
}) {
  const manualGroups = groups.filter((g) => !g.hotel_id);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="full_name">Ad Soyad / Full name</label>
        <input id="full_name" name="full_name" required defaultValue={user?.full_name} placeholder="Ahmet Yılmaz" />
      </div>
      <div>
        <label htmlFor="title">Ünvan / Title</label>
        <input id="title" name="title" defaultValue={user?.title} placeholder="Sales Manager" />
      </div>
      <div>
        <label htmlFor="hotel_id">Otel / Template</label>
        <select id="hotel_id" name="hotel_id" required defaultValue={user?.hotel_id ?? hotels[0]?.id}>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-muted">Sets address, phone and logo line of the signature.</p>
      </div>
      <div>
        <label htmlFor="email_local">E-posta / Email</label>
        <input id="email_local" name="email_local" required defaultValue={user?.email ?? ""} placeholder="it.istanbul@barcelo.com" autoComplete="off" />
        <p className="mt-1 text-[11px] text-muted">Tam adresi yaz, olduğu gibi kaydedilir. Sadece @ öncesini yazarsan otelin kalıbı eklenir (istanbul.om → istanbul.om@barcelo.com).</p>
      </div>
      <div>
        <label htmlFor="mobile">Mobil (M)</label>
        <input id="mobile" name="mobile" defaultValue={user?.mobile} placeholder="+90 5xx xxx xx xx" />
      </div>
      <div className="flex items-end">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input type="checkbox" name="is_active" defaultChecked={user ? user.is_active : true} className="h-4 w-4" /> Active
        </label>
      </div>
      <div className="sm:col-span-2">
        <label>Groups (hotel groups are automatic)</label>
        <div className="flex flex-wrap gap-2">
          {manualGroups.length === 0 && <span className="text-xs text-muted">No manual groups yet. Create them under Groups.</span>}
          {manualGroups.map((g) => (
            <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-panel-2 px-3 py-1.5 text-sm text-text">
              <input type="checkbox" name="group_ids" value={g.id} defaultChecked={user?.group_ids.includes(g.id)} className="h-4 w-4" /> {g.name}
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
