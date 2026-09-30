import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { listHotels } from "@/lib/data";
import { updateHotel } from "./actions";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const hotels = await listHotels(true);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted">One renderer, six configurations. Change an address or phone here and every future copy uses it.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-6">
        {hotels.map((h) => (
          <Card key={h.id}>
            <CardTitle action={<div className="flex gap-2"><Badge tone={h.brand === "occidental" ? "accent" : "neutral"}>{h.brand}</Badge>{!h.is_active && <Badge tone="warn">hidden</Badge>}</div>}>
              {h.name} <span className="ml-2 font-mono text-[11px] normal-case text-muted">{h.id}</span>
            </CardTitle>
            <div className="grid gap-6 lg:grid-cols-2">
              <form action={updateHotel.bind(null, h.id)} className="grid gap-3 sm:grid-cols-2">
                <div><label>Name</label><input name="name" defaultValue={h.name} required /></div>
                <div><label>Slogan</label><input name="slogan" defaultValue={h.slogan} /></div>
                <div><label>Email prefix</label><input name="email_prefix" defaultValue={h.email_prefix} placeholder="istanbul." /></div>
                <div><label>Email domain</label><input name="email_domain" defaultValue={h.email_domain} required /></div>
                <div className="sm:col-span-2"><label>Address (as printed)</label><input name="address" defaultValue={h.address} required /></div>
                <div className="sm:col-span-2"><label>Map link</label><input name="map_url" type="url" defaultValue={h.map_url} required /></div>
                <div><label>Phone (display)</label><input name="phone_display" defaultValue={h.phone_display} placeholder="+90 212 377 45 45" /></div>
                <div><label>Phone (tel: digits)</label><input name="phone_href" defaultValue={h.phone_href} placeholder="+902123774545" /></div>
                <div><label>Website URL</label><input name="website_url" type="url" defaultValue={h.website_url} required /></div>
                <div><label>Website label</label><input name="website_label" defaultValue={h.website_label} required /></div>
                <div className="sm:col-span-2"><label>Second static banner URL (optional, e.g. award)</label><input name="secondary_banner_url" type="url" defaultValue={h.secondary_banner_url ?? ""} /></div>
                <div className="sm:col-span-2"><label>Second banner alt</label><input name="secondary_banner_alt" defaultValue={h.secondary_banner_alt ?? ""} /></div>
                <div className="flex items-center justify-between sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-text"><input type="checkbox" name="is_active" defaultChecked={h.is_active} className="h-4 w-4" /> Available for users</label>
                  <SubmitButton variant="secondary">Save template</SubmitButton>
                </div>
              </form>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Preview with sample data</p>
                <iframe title={`${h.name} preview`} src={`/admin/templates/${h.id}/preview`} className="h-[420px] w-full rounded-lg border border-border bg-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
