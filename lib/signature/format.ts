// Formatting rules ported one to one from the browser builders so the
// server renders exactly what the old copy-paste pages produced.

const TR_MAP: Record<string, string> = {
  Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U",
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
};

export function asciiFold(str: string): string {
  return (str || "")
    .replace(/[ÇĞİÖŞÜçğıöşü]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function titleWord(word: string): string {
  return asciiFold(word)
    .toLowerCase()
    .replace(/(^|[-'’])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** "ahmet yılmaz" -> "Ahmet YILMAZ" (surname upper-cased, ASCII folded, as in the builders). */
export function formatDisplayName(raw: string): string {
  const parts = asciiFold(raw).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!parts.length) return "";
  return parts
    .map((part, i) => (i === parts.length - 1 ? asciiFold(part).toUpperCase() : titleWord(part)))
    .join(" ");
}

export function trMobileDigits(raw: string): string {
  let digits = asciiFold(raw).replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits;
}

export function formatTRMobile(raw: string): string {
  const d = trMobileDigits(raw);
  if (d.length === 10) return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  return raw;
}

export function trMobileHref(raw: string): string {
  const d = trMobileDigits(raw);
  return d.length === 10 ? `+90${d}` : raw.replace(/\s+/g, "");
}

/** Local part of an email, lower-cased, folded, with the hotel prefix removed if the user typed it. */
export function emailSuffix(raw: string, fixedPrefix: string): string {
  let local = asciiFold(raw).toLowerCase().replace(/\s+/g, "").replace(/@.*$/, "");
  if (fixedPrefix && local.startsWith(fixedPrefix)) local = local.slice(fixedPrefix.length);
  return local.replace(/^\.+/, "");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
