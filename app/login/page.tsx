import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { sendMagicLink } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const error = sp.error === "not_admin" ? "Bu hesap yönetici değil." : sp.error;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="rounded-xl border border-border bg-panel p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Barceló Hotel Group Türkiye</p>
        <h1 className="mb-6 mt-1 text-xl font-bold">Signature Manager</h1>
        <Flash error={error} ok={sp.sent ? "Giriş bağlantısı e-postana gönderildi." : undefined} />
        <form action={sendMagicLink} className="space-y-4">
          <input type="hidden" name="next" value={sp.next ?? "/admin"} />
          <div>
            <label htmlFor="email">Kurumsal e-posta</label>
            <input id="email" name="email" type="email" required placeholder="ad.soyad@barcelo.com" autoComplete="email" />
          </div>
          <SubmitButton className="w-full justify-center" pendingText="Gönderiliyor...">Giriş bağlantısı gönder</SubmitButton>
        </form>
        <p className="mt-4 text-xs text-muted">Şifre yok. Bağlantı e-postana gelir, tıkla, içerdesin.</p>
      </div>
    </main>
  );
}
