import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { listGroups, listUsers } from "@/lib/data";
import { createGroup, deleteGroup, setMembers } from "./actions";

export const dynamic = "force-dynamic";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [groups, users] = await Promise.all([listGroups(), listUsers()]);
  const selected = groups.find((g) => g.id === sp.g) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Groups</h1>
        <p className="text-sm text-muted">Banners target groups. Hotel groups fill themselves; manual groups you curate.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>All groups</CardTitle>
          <ul className="space-y-1">
            {groups.map((g) => {
              const count = g.hotel_id ? users.filter((u) => u.hotel_id === g.hotel_id).length : users.filter((u) => u.group_ids.includes(g.id)).length;
              return (
                <li key={g.id}>
                  <a href={`/admin/groups?g=${g.id}`} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-panel-2 ${selected?.id === g.id ? "bg-panel-2" : ""}`}>
                    <span className="font-semibold">{g.name}</span>
                    <span className="flex items-center gap-2">
                      {g.hotel_id && <Badge tone="accent">auto</Badge>}
                      <span className="text-xs text-muted">{count}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <form action={createGroup} className="mt-6 space-y-3 border-t border-border pt-4">
            <div>
              <label htmlFor="name">New group</label>
              <input id="name" name="name" required placeholder="Sales, GMs, Wedding team..." />
            </div>
            <div>
              <label htmlFor="description">Description</label>
              <input id="description" name="description" placeholder="Optional" />
            </div>
            <SubmitButton variant="secondary">Create group</SubmitButton>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-muted">Pick a group to see and edit its members.</p>
          ) : selected.hotel_id ? (
            <>
              <CardTitle>{selected.name}</CardTitle>
              <p className="mb-3 text-sm text-muted">Automatic group: every user whose signature template is this hotel is a member. Change a user&apos;s hotel to move them.</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {users.filter((u) => u.hotel_id === selected.hotel_id).map((u) => (
                  <li key={u.id} className="rounded-md bg-panel-2 px-3 py-2 text-sm">{u.full_name} <span className="text-xs text-muted">{u.title}</span></li>
                ))}
              </ul>
            </>
          ) : (
            <form action={setMembers.bind(null, selected.id)}>
              <CardTitle action={<SubmitButton pendingText="Saving...">Save members</SubmitButton>}>{selected.name}</CardTitle>
              {selected.description && <p className="mb-3 text-sm text-muted">{selected.description}</p>}
              <div className="grid gap-1 sm:grid-cols-2">
                {users.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-panel-2">
                    <input type="checkbox" name="user_ids" value={u.id} defaultChecked={u.group_ids.includes(selected.id)} className="h-4 w-4" />
                    <span className="font-semibold">{u.full_name}</span>
                    <span className="text-xs text-muted">{u.hotel.name}</span>
                  </label>
                ))}
                {users.length === 0 && <p className="text-sm text-muted">No users yet.</p>}
              </div>
              <div className="mt-6 border-t border-border pt-4">
                <ConfirmButton variant="danger" formAction={deleteGroup.bind(null, selected.id)} message={`Delete group "${selected.name}"? Schedules targeting only this group will stop matching anyone.`}>
                  Delete group
                </ConfirmButton>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
