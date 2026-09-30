import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { listGroups, listHotels, listUsers } from "@/lib/data";
import { fmtDate } from "@/lib/utils";
import { UserForm } from "./user-form";
import { createUser, importUsers, sendInstallBulk } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [users, hotels, groups] = await Promise.all([listUsers(), listHotels(), listGroups()]);
  const q = (sp.q ?? "").toLowerCase();
  const filtered = users.filter((u) => {
    if (sp.filter === "unsent" && u.last_sent_at) return false;
    if (sp.hotel && u.hotel_id !== sp.hotel) return false;
    if (q && !`${u.full_name} ${u.email} ${u.title}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "?";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted">{users.length} signature owners. Each has a personal install link that never changes.</p>
        </div>
        <form className="flex flex-wrap gap-2" method="get">
          <input name="q" defaultValue={sp.q} placeholder="Search name, email, title" className="w-56" />
          <select name="hotel" defaultValue={sp.hotel ?? ""} className="w-48">
            <option value="">All hotels</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select name="filter" defaultValue={sp.filter ?? ""} className="w-40">
            <option value="">Everyone</option>
            <option value="unsent">Not yet sent</option>
          </select>
          <button className="rounded-md border border-border bg-panel-2 px-3 py-2 text-sm">Filter</button>
        </form>
      </div>

      <Flash ok={sp.ok} error={sp.error} />

      <Card>
        <form action={sendInstallBulk}>
          <CardTitle action={<SubmitButton variant="secondary" pendingText="Sending...">Send install mail to selected</SubmitButton>}>
            {filtered.length} shown
          </CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-2"><input type="checkbox" className="h-4 w-4" aria-label="select all" data-select-all /></th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Hotel</th>
                  <th className="py-2 pr-3">Groups</th>
                  <th className="py-2 pr-3">Sent</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 hover:bg-panel-2/60">
                    <td className="py-2 pr-2"><input type="checkbox" name="user_ids" value={u.id} className="h-4 w-4" /></td>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-accent">{u.full_name}</Link>
                      <div className="text-xs text-muted">{u.title ? `${u.title} · ` : ""}{u.email}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted">{u.hotel.name}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">{u.group_ids.map((g) => <Badge key={g}>{groupName(g)}</Badge>)}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {!u.is_active ? <Badge tone="warn">Inactive</Badge> : u.last_sent_at ? <Badge tone="ok">{fmtDate(u.last_sent_at)}</Badge> : <Badge>Not sent</Badge>}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <a className="text-xs text-accent" href={`/s/${u.token}`} target="_blank" rel="noreferrer">Open link</a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted">No users match. Add one below or import a CSV.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Add user</CardTitle>
          <UserForm hotels={hotels} groups={groups} action={createUser} submitLabel="Create user" />
        </Card>
        <Card>
          <CardTitle>Import CSV</CardTitle>
          <form action={importUsers} className="space-y-3">
            <textarea name="csv" rows={10} className="font-mono text-xs" placeholder={"full_name,title,email,mobile,hotel,groups\nAyşe Kaya,Sales Manager,sm,0532 123 45 67,bis,Sales;Management\nMehmet Demir,Front Office Manager,fom,,Occidental Taksim,"} />
            <p className="text-xs text-muted">
              Header required. <code>hotel</code> accepts an id (bis, bch, oth, oah, och, cluster) or the hotel name. <code>email</code> may be the local part only; the hotel prefix and domain are added. Existing emails are updated, not duplicated.
            </p>
            <SubmitButton variant="secondary" pendingText="Importing...">Import</SubmitButton>
          </form>
        </Card>
      </div>
      <SelectAllScript />
    </div>
  );
}

function SelectAllScript() {
  const js = `document.addEventListener('change',function(e){var t=e.target;if(t&&t.hasAttribute&&t.hasAttribute('data-select-all')){document.querySelectorAll('input[name="user_ids"]').forEach(function(c){c.checked=t.checked;});}});`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
