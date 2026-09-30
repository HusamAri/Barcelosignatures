import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireAdmin, type AdminRow } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateTime } from "@/lib/utils";
import { createAdmin, removeAdmin, resetAdminPin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, me] = await Promise.all([searchParams, requireAdmin()]);
  const { data } = await createAdminClient().from("admins").select("*").order("added_at");
  const admins = (data ?? []) as AdminRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admins</h1>
        <p className="text-sm text-muted">People who can sign in here. New accounts start with PIN 0000 and must pick a password on first login.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Accounts</CardTitle>
          <ul className="divide-y divide-border">
            {admins.map((a) => (
              <li key={a.email} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.name ?? a.email} {a.email.toLowerCase() === me.email.toLowerCase() && <Badge tone="accent">you</Badge>}</p>
                  <p className="truncate text-xs text-muted">{a.email} · last login {a.last_login_at ? fmtDateTime(a.last_login_at) : "never"}</p>
                </div>
                {a.must_change_password ? <Badge tone="warn">PIN 0000, not changed yet</Badge> : <Badge tone="ok">Password set</Badge>}
                <form action={resetAdminPin.bind(null, a.email)}>
                  <ConfirmButton variant="secondary" message={`Reset ${a.email} to PIN 0000?`}>Reset PIN</ConfirmButton>
                </form>
                {a.email.toLowerCase() !== me.email.toLowerCase() && (
                  <form action={removeAdmin.bind(null, a.email)}>
                    <ConfirmButton variant="danger" message={`Remove ${a.email} from admins?`}>Remove</ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Add admin</CardTitle>
          <form action={createAdmin} className="space-y-3">
            <div><label htmlFor="name">Name</label><input id="name" name="name" placeholder="Deniz ..." /></div>
            <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="name@barcelo.com" /></div>
            <SubmitButton>Create with PIN 0000</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
