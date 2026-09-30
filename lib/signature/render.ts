import type { Hotel } from "@/lib/types";
import { escapeHtml, formatDisplayName, formatTRMobile, trMobileHref } from "./format";

export interface SignaturePerson {
  full_name: string;
  title: string;
  email: string;
  mobile: string;
  token: string;
}

export interface RenderOptions {
  appUrl: string;
  /** Static banner image instead of the dynamic per-user endpoint (used for admin previews). */
  staticBannerUrl?: string;
  staticBannerLink?: string;
  bannerWidth?: number;
  bannerHeight?: number;
}

interface Palette {
  text: string;      // name, labels, hotel line
  body: string;      // title, address, contacts
  muted: string;     // separators
  slogan: string;
  sloganStyle: string;
  fontFamily: string;
}

const PALETTES: Record<Hotel["brand"], Palette> = {
  barcelo: {
    text: "#333333", body: "#4A4A4A", muted: "#8C8E8F", slogan: "#8C8E8F",
    sloganStyle: "font-weight:700; letter-spacing:0.3px; text-transform:uppercase;",
    fontFamily: "'Aptos','Segoe UI',Arial,Helvetica,sans-serif",
  },
  occidental: {
    text: "#1E4140", body: "#575756", muted: "#B7CBCD", slogan: "#468D98",
    sloganStyle: "font-weight:600;",
    fontFamily: "'Aptos','Segoe UI',Arial,Helvetica,sans-serif",
  },
  cluster: {
    text: "#333333", body: "#4A4A4A", muted: "#8C8E8F", slogan: "#8C8E8F",
    sloganStyle: "font-weight:700; letter-spacing:0.3px; text-transform:uppercase;",
    fontFamily: "Aptos,'Segoe UI',Arial,Helvetica,sans-serif",
  },
};

const CLUSTER_PROPERTIES: { label: string; url: string }[] = [
  { label: "Barceló Istanbul", url: "https://maps.app.goo.gl/GbQy9G8yVxqxtrWy7" },
  { label: "Occidental Taksim", url: "https://maps.app.goo.gl/kJ52tJfGFr8hoHjL6" },
  { label: "Occidental Ankara", url: "https://maps.app.goo.gl/YXgjD1o25bFpqqCs9" },
  { label: "Barceló Cappadocia", url: "https://maps.app.goo.gl/zWbUzZ6VPk9kDmpi8" },
];

const DEFAULT_BANNER_ALT = "Barceló Hotel Group Türkiye";

/** Banner URLs that the installed signature keeps forever; the server decides what they show. */
export function bannerImageUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/b/${token}`;
}
export function bannerClickUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/c/${token}`;
}

function row(inner: string): string {
  return `    <tr>\n      <td ${inner}</td>\n    </tr>\n`;
}

/**
 * Renders the signature `<table>` for one person. Output is Outlook-safe:
 * tables only, inline styles, width attributes on images, no CSS filters or positioning.
 */
export function renderSignature(hotel: Hotel, person: SignaturePerson, opts: RenderOptions): string {
  const p = PALETTES[hotel.brand];
  const w = opts.bannerWidth ?? 612;
  const h = opts.bannerHeight ?? 140;
  const name = escapeHtml(formatDisplayName(person.full_name) || "Ad Soyad");
  const title = escapeHtml(person.title || "");
  const email = escapeHtml(person.email.trim().toLowerCase());
  const mobileDisplay = escapeHtml(formatTRMobile(person.mobile));
  const mobileHref = escapeHtml(trMobileHref(person.mobile));
  const address = escapeHtml(hotel.address);
  const imgSrc = escapeHtml(opts.staticBannerUrl ?? bannerImageUrl(opts.appUrl, person.token));
  const imgLink = escapeHtml(opts.staticBannerLink ?? bannerClickUrl(opts.appUrl, person.token));

  const sep = `<span style="color:${p.muted};">&nbsp;|&nbsp;</span>`;
  const label = (t: string) => `<span style="font-weight:700; color:${p.text};">${t}</span>`;
  const link = (href: string, text: string) =>
    `<a href="${escapeHtml(href)}" style="color:${p.body}; text-decoration:none;">${text}</a>`;

  let out = "";
  out += row(`style="font-size:15px; line-height:22px; font-weight:700; color:${p.text}; padding:0 0 2px 0; letter-spacing:0.1px;">\n        ${name}\n      `);
  if (title) {
    out += row(`style="font-size:12px; line-height:18px; color:${p.body}; padding:0 0 2px 0;">\n        ${title}\n      `);
  }

  if (hotel.brand === "cluster") {
    out += row(`style="font-size:12px; line-height:17px; font-weight:700; color:${p.text}; padding:0 0 10px 0;">\n        ${escapeHtml(hotel.brand_word)}\n      `);
    const props = CLUSTER_PROPERTIES.map(
      (c) => `<a href="${c.url}" style="font-weight:700; color:${p.text}; text-decoration:none;">${c.label}</a>`,
    ).join(`<span style="color:${p.muted};"> | </span>`);
    out += row(`style="font-size:11px; line-height:16px; color:${p.body}; padding:0 0 6px 0;">\n        ${props}\n      `);
  } else if (hotel.brand === "barcelo") {
    out += row(`style="font-size:12px; line-height:18px; font-weight:700; color:${p.text}; padding:0 0 2px 0;">\n        <span style="font-weight:700">${escapeHtml(hotel.brand_word)}</span>&nbsp;<span style="font-weight:400">${escapeHtml(hotel.city_word)}</span>\n      `);
  } else {
    out += row(`style="font-size:12px; line-height:18px; font-weight:700; color:${p.text}; padding:0 0 2px 0;">\n        ${escapeHtml(hotel.name)}\n      `);
  }

  if (hotel.slogan) {
    out += row(`style="font-size:11px; line-height:16px; color:${p.slogan}; padding:0 0 12px 0; ${p.sloganStyle}">\n        ${escapeHtml(hotel.slogan)}\n      `);
  }

  out += row(`style="font-size:11px; line-height:17px; color:${p.body}; padding:0 0 6px 0;">\n        <a href="${escapeHtml(hotel.map_url)}" style="color:${p.body};text-decoration:none;">${address}</a>\n      `);

  const contacts: string[] = [];
  if (hotel.phone_display) contacts.push(`${label("T")}\n        ${link(`tel:${hotel.phone_href}`, escapeHtml(hotel.phone_display))}`);
  if (person.mobile.trim()) contacts.push(`${label("M")}\n        ${link(`tel:${mobileHref}`, mobileDisplay)}`);
  contacts.push(`${label("E")}\n        ${link(`mailto:${email}`, email)}`);
  contacts.push(`${label("W")}\n        ${link(hotel.website_url, escapeHtml(hotel.website_label))}`);
  out += row(`style="font-size:11px; line-height:17px; color:${p.body}; padding:0 0 14px 0;">\n        ${contacts.join(`\n        ${sep}\n        `)}\n      `);

  out += row(`style="padding:0;">\n        <a href="${imgLink}" style="text-decoration:none;" target="_blank" rel="noopener noreferrer"><img src="${imgSrc}" alt="${DEFAULT_BANNER_ALT}" width="${w}" height="${h}" style="display:block; width:100%; max-width:${w}px; height:auto; border:0; outline:none; text-decoration:none; border-radius:14px;" /></a>\n      `);

  if (hotel.secondary_banner_url) {
    out += row(`style="padding:8px 0 0 0;">\n        <img src="${escapeHtml(hotel.secondary_banner_url)}" alt="${escapeHtml(hotel.secondary_banner_alt ?? "")}" width="${w}" height="${h}" style="display:block; width:100%; max-width:${w}px; height:auto; border:0; outline:none; text-decoration:none;" />\n      `);
  }

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; width:100%; max-width:620px; font-family:${p.fontFamily}; color:${p.text};">\n` +
    out +
    `</table>`
  );
}

/** Full standalone .htm document, for the attachment and for classic Outlook's Signatures folder. */
export function renderSignatureDocument(hotel: Hotel, person: SignaturePerson, opts: RenderOptions): string {
  const table = renderSignature(hotel, person, opts);
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(formatDisplayName(person.full_name))} | ${escapeHtml(hotel.name)}</title>
</head>
<body style="margin:0; padding:0; color:#333333;">
${table}
</body>
</html>
`;
}

/**
 * Resolves what an admin typed into a full address.
 * - Anything containing "@" is taken as the full address, exactly as typed (lower-cased).
 *   Real addresses do not always follow the hotel pattern (it.istanbul@barcelo.com).
 * - Only a bare local part gets the hotel pattern: prefix (once) + local + @domain.
 */
export function buildEmail(hotel: Hotel, typed: string): string {
  const raw = typed.trim().toLowerCase().replace(/\s+/g, "");
  if (raw.includes("@")) return raw;
  const local = hotel.email_prefix && !raw.startsWith(hotel.email_prefix) ? hotel.email_prefix + raw : raw;
  return `${local}@${hotel.email_domain}`;
}

/** Flags addresses where the hotel prefix was applied on top of a local part that already names the hotel. */
export function looksDoublePrefixed(hotel: Pick<Hotel, "email_prefix">, email: string): boolean {
  const prefix = hotel.email_prefix;
  if (!prefix) return false;
  const local = email.split("@")[0] ?? "";
  if (!local.startsWith(prefix)) return false;
  const name = prefix.replace(/\.$/, "");
  return local.slice(prefix.length).split(".").includes(name);
}
