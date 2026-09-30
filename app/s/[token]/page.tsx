import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadUserByToken } from "@/lib/signature/load";
import { renderSignature } from "@/lib/signature/render";
import { appUrl } from "@/lib/env";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const found = await loadUserByToken(token);
  return { title: found ? `${found.user.full_name} | ${found.hotel.name} imza` : "İmza bulunamadı", robots: { index: false } };
}

/** Personal install page. Light theme on purpose: people preview the signature the way Outlook shows it. */
export default async function SignaturePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await loadUserByToken(token);
  if (!found || !found.user.is_active) notFound();
  const { user, hotel } = found;

  const html = renderSignature(hotel, user, { appUrl: appUrl() });
  const downloadUrl = `${appUrl()}/s/${token}/signature.htm`;

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-4 py-10 text-[#333]" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-[680px]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#468D98]">Barceló Hotel Group Türkiye</p>
        <h1 className="mt-1 text-2xl font-bold">E-posta imzan hazır</h1>
        <p className="mt-1 text-sm text-[#666]">Your email signature is ready. Kopyala, Outlook&apos;a yapıştır, bitti.</p>

        <section className="mt-6 rounded-xl border border-[#e3e6ea] bg-white p-6 shadow-sm">
          <div id="sig-wrapper" dangerouslySetInnerHTML={{ __html: html }} />
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CopyButton targetId="sig-wrapper" label="İmzayı Kopyala / Copy Signature" doneLabel="✓ Kopyalandı / Copied" />
          <a href={downloadUrl} className="text-sm font-semibold text-[#1E4140] underline underline-offset-4" download>
            .htm dosyasını indir / Download .htm
          </a>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Steps
            title="Outlook (Windows / Mac / Web)"
            steps={[
              "Yukarıdaki İmzayı Kopyala düğmesine bas.",
              "Outlook > Ayarlar (Settings) > Hesaplar > İmzalar (Signatures).",
              "Yeni imza oluştur, kutuya Ctrl+V (Mac: Cmd+V) ile yapıştır.",
              "Yeni iletiler ve yanıtlar için bu imzayı varsayılan yap, kaydet.",
            ]}
          />
          <Steps
            title="Outlook (Windows / Mac / Web)"
            steps={[
              "Click Copy Signature above.",
              "Outlook > Settings > Accounts > Signatures.",
              "Create a new signature and paste with Ctrl+V (Mac: Cmd+V).",
              "Set it as default for new messages and replies, then save.",
            ]}
          />
        </section>

        <p className="mt-8 text-xs text-[#888]">
          Bilgilerinde hata varsa Pazarlama ekibine yaz; imza merkezi olarak güncellenir. Banner alanı kampanyalara göre otomatik değişir, tekrar yapıştırman gerekmez.
        </p>
      </div>
    </main>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-[#e3e6ea] bg-white p-5">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#444]">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
