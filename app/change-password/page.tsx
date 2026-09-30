import { Flash } from "@/components/ui/flash";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword } from "./actions";

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="rounded-xl border border-border bg-panel p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Barceló Hotel Group Türkiye</p>
        <h1 className="mt-1 text-xl font-bold">Yeni şifre belirle</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Set your own password before continuing. At least 8 characters.</p>
        <Flash error={sp.error} />
        <form action={changePassword} className="space-y-4">
          <div>
            <label htmlFor="current">Mevcut PIN / şifre</label>
            <input id="current" name="current" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="password">Yeni şifre</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm">Yeni şifre (tekrar)</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <SubmitButton className="w-full justify-center">Şifreyi kaydet</SubmitButton>
        </form>
      </div>
    </main>
  );
}
