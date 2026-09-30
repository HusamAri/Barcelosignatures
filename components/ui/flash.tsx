import { cn } from "@/lib/utils";

/** Renders ?ok= / ?error= query messages from server actions. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className={cn("mb-4 rounded-md border px-3 py-2 text-sm", error ? "border-danger/40 bg-danger/10 text-danger" : "border-ok/40 bg-ok/10 text-ok")}>
      {error ?? ok}
    </div>
  );
}
