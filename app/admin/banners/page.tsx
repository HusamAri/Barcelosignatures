import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Button } from "@/components/ui/button";
import { getSetting, listBanners, listSchedules } from "@/lib/data";
import type { BannerSize } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { deleteBanner, setDefaultBanner, updateBanner, uploadBanner } from "./actions";

export const dynamic = "force-dynamic";

export default async function BannersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [banners, schedules, defaultId, size] = await Promise.all([
    listBanners(), listSchedules(), getSetting<string | null>("default_banner_id", null), getSetting<BannerSize>("banner_size", { width: 612, height: 140 }),
  ]);
  const usage = (id: string) => schedules.filter((s) => s.banner_id === id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banners</h1>
        <p className="text-sm text-muted">Library of banner images. Locked size: {size.width}×{size.height}. Default banner shows whenever no schedule matches.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <Card>
        <CardTitle>Upload</CardTitle>
        <form action={uploadBanner} className="grid gap-4 sm:grid-cols-2" encType="multipart/form-data">
          <div>
            <label htmlFor="file">Image (GIF, PNG, JPEG, WebP, max 5 MB)</label>
            <input id="file" name="file" type="file" accept="image/gif,image/png,image/jpeg,image/webp" required className="file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-bold file:text-white" />
          </div>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required placeholder="Ramazan 2026 Iftar, Summer Cappadocia, WTA award..." />
          </div>
          <div>
            <label htmlFor="link_url">Click-through link</label>
            <input id="link_url" name="link_url" type="url" placeholder="https://www.barcelo.com/..." />
          </div>
          <div>
            <label htmlFor="alt">Alt text</label>
            <input id="alt" name="alt" placeholder="Barceló Hotel Group Türkiye" />
          </div>
          <div className="flex items-center gap-4 sm:col-span-2">
            <SubmitButton pendingText="Uploading...">Upload banner</SubmitButton>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="allow_any_size" className="h-4 w-4" /> allow any size (will be stretched to {size.width}×{size.height})
            </label>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <Card key={b.id} className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.public_url} alt={b.alt} className="w-full rounded-lg bg-white" style={{ aspectRatio: `${b.width}/${b.height}` }} />
            <form action={updateBanner.bind(null, b.id)} className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                {defaultId === b.id && <Badge tone="ok">Default</Badge>}
                <Badge>{b.width}×{b.height}</Badge>
                <Badge>{b.mime_type.replace("image/", "").toUpperCase()}</Badge>
                <Badge>{usage(b.id)} schedule{usage(b.id) === 1 ? "" : "s"}</Badge>
                <span className="ml-auto text-xs text-muted">{fmtDate(b.created_at)}</span>
              </div>
              <div className="sm:col-span-2"><label>Name</label><input name="name" defaultValue={b.name} required /></div>
              <div className="sm:col-span-2"><label>Link</label><input name="link_url" type="url" defaultValue={b.link_url} required /></div>
              <div className="sm:col-span-2"><label>Alt</label><input name="alt" defaultValue={b.alt} /></div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <SubmitButton variant="secondary">Save</SubmitButton>
                {defaultId === b.id ? (
                  <Button variant="ghost" formAction={setDefaultBanner.bind(null, null)}>Clear default</Button>
                ) : (
                  <Button variant="ghost" formAction={setDefaultBanner.bind(null, b.id)}>Make default</Button>
                )}
                <ConfirmButton variant="danger" className="ml-auto" formAction={deleteBanner.bind(null, b.id)} message={`Delete "${b.name}" and its ${usage(b.id)} schedule(s)?`}>Delete</ConfirmButton>
              </div>
            </form>
          </Card>
        ))}
        {banners.length === 0 && (
          <Card className="md:col-span-2 text-sm text-muted">
            No banners yet. Until you upload one and make it default, signatures show the built-in properties carousel from <code>/public/seed</code>.
          </Card>
        )}
      </div>
    </div>
  );
}
