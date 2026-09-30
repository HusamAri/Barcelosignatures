import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "ok" | "warn" | "accent";
const tones: Record<Tone, string> = {
  neutral: "bg-panel-2 text-muted border-border",
  ok: "bg-ok/15 text-ok border-ok/30",
  warn: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  accent: "bg-accent/15 text-accent border-accent/30",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}
