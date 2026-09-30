import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const error = sp.error === "not_admin" ? "Bu hesap yönetici değil." : sp.error;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="rounded-xl border border-border bg-panel p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Barceló Hotel Group Türkiye</p>
        <h1 className="mb-6 mt-1 text-xl font-bold">Signature Manager</h1>
        <Flash error={error} ok={sp.changed ? "Şifre güncellendi. Tekrar giriş yap." : undefined} />
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={sp.next ?? "/admin"} />
          <div>
            <label htmlFor="email">Kurumsal e-posta</label>
            <input id="email" name="email" type="email" required placeholder="ad.soyad@barcelo.com" autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password">PIN / Şifre</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" inputMode="numeric" />
          </div>
          <SubmitButton className="w-full justify-center" pendingText="Giriş yapılıyor...">Giriş yap</SubmitButton>
        </form>
        <p className="mt-4 text-xs text-muted">İlk girişte PIN 0000. Girişten sonra kendi şifreni belirlersin.</p>
      </div>
    </main>
  );
}
