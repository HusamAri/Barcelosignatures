export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function fmtDateTime(iso: string | Date, locale = "tr-TR"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
}

export function fmtDate(iso: string | Date, locale = "tr-TR"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(locale, { dateStyle: "medium", timeZone: "Europe/Istanbul" });
}

/** Value for <input type="datetime-local"> in Istanbul time. */
export function toLocalInputValue(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parses a datetime-local string as Istanbul wall-clock time and returns an ISO UTC string. */
export function fromLocalInputValue(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) throw new Error(`Invalid date: ${value}`);
  const [, y, mo, d, h, mi] = m;
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  // Istanbul has been fixed at UTC+3 since 2016, with no DST.
  return new Date(guess - 3 * 60 * 60 * 1000).toISOString();
}
