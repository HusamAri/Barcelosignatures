import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Flash } from "@/components/ui/flash";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { getUser, listGroups, listHotels } from "@/lib/data";
import { renderSignature } from "@/lib/signature/render";
import { appUrl } from "@/lib/env";
import { fmtDateTime } from "@/lib/utils";
import { UserForm } from "../user-form";
import { deleteUser, rotateToken, sendInstall, updateUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function UserDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [user, hotels, groups] = await Promise.all([getUser(id), listHotels(true), listGroups()]);
  if (!user) notFound();

  const html = renderSignature(user.hotel, user, { appUrl: appUrl() });
  const link = `${appUrl()}/s/${user.token}`;
  const autoGroups = groups.filter((g) => g.hotel_id === user.hotel_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/users" className="text-xs text-muted hover:text-text">← Users</Link>
          <h1 className="text-2xl font-bold">{user.full_name}</h1>
          <p className="text-sm text-muted">{user.hotel.name} · {user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={sendInstall.bind(null, user.id)}>
            <SubmitButton pendingText="Sending...">Send install mail</SubmitButton>
          </form>
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-border bg-panel-2 px-3 py-2 text-sm font-semibold">Open install page</a>
        </div>
      </div>

      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle>Details</CardTitle>
          <UserForm hotels={hotels} groups={groups} user={user} action={updateUser.bind(null, user.id)} submitLabel="Save" />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Automatic groups:</span>
            {autoGroups.map((g) => <Badge key={g.id} tone="accent">{g.name}</Badge>)}
            {autoGroups.length === 0 && <span>none</span>}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle>Install link</CardTitle>
            <code className="block break-all rounded-md bg-panel-2 p-3 text-xs">{link}</code>
            <p className="mt-2 text-xs text-muted">Last sent: {user.last_sent_at ? fmtDateTime(user.last_sent_at) : "never"}</p>
            <form action={rotateToken.bind(null, user.id)} className="mt-3">
              <ConfirmButton variant="secondary" message="This breaks the banner in the signature this person already installed. They must copy the signature again. Continue?">
                Generate new link
              </ConfirmButton>
            </form>
          </Card>
          <Card>
            <CardTitle>Danger zone</CardTitle>
            <form action={deleteUser.bind(null, user.id)}>
              <ConfirmButton variant="danger" message={`Delete ${user.full_name}? Their installed signature will show the fallback banner.`}>Delete user</ConfirmButton>
            </form>
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle>Preview (as Outlook renders it)</CardTitle>
        <div className="rounded-lg bg-white p-6" style={{ colorScheme: "light" }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </Card>
    </div>
  );
}
