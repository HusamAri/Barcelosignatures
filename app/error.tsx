"use client";

import Link from "next/link";

/** Replaces Next's blank "Application error" screen with something a person can report. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <div className="rounded-xl border border-danger/40 bg-panel p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-danger">Bir şeyler ters gitti / Something broke</p>
        <h1 className="mt-1 text-xl font-bold">Sayfa yüklenemedi</h1>
        <p className="mt-2 text-sm text-muted">Send this to Marketing IT with the page address:</p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-panel-2 p-3 text-xs text-text">{`digest: ${error.digest ?? "none"}\nmessage: ${error.message || "hidden in production"}\npage: ${typeof window !== "undefined" ? window.location.href : ""}`}</pre>
        <div className="mt-4 flex gap-3">
          <button onClick={reset} className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white">Tekrar dene / Retry</button>
          <Link href="/admin/debug" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Open debug</Link>
        </div>
      </div>
    </main>
  );
}
