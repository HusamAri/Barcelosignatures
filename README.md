# Barceló Signatures

Central email signature management for Barceló Hotel Group Türkiye: Barceló Istanbul, Barceló Cappadocia, Occidental Taksim, Occidental Ankara, Occidental Istanbul City and the cluster office.

Replaces the five copy-paste HTML builders with one place where Marketing:

- keeps every colleague's signature data (name, title, email, mobile, hotel template),
- sends each person a personal install link plus a `.htm` attachment by email,
- uploads banner images and schedules them on a calendar with a start and end,
- targets a banner at everyone or at specific groups (hotel groups are automatic, manual groups are curated),
- changes what installed signatures show without anyone pasting again.

## How the banner stays under Marketing's control

Every rendered signature embeds two URLs that never change:

| In the signature | What the server does |
|---|---|
| `<img src="https://APP/b/{token}">` | Looks up the person, finds the highest-priority schedule that is live now and targets one of their groups, and redirects to that image. Falls back to the default banner, then to the built-in carousel. Sent with `no-store` so mail clients re-fetch. |
| `<a href="https://APP/c/{token}">` | Logs the click and redirects to the live campaign link. |

So a schedule that starts Monday 09:00 shows up in every already-installed signature from Monday 09:00, and disappears when it ends.

Known limit: the banner is resolved when the email is *opened*, not when it was sent. An email sent during a campaign and opened after it ended shows the banner live at opening time. That is how every link-based signature service behaves, and it is the trade-off for never re-installing.

## Stack

Next.js 15 (App Router, server actions), TypeScript strict, Tailwind v4, Supabase (Postgres, Storage, Auth magic links), Nodemailer over Microsoft 365 SMTP. Hosted on Vercel.

## Setup

1. Create a Supabase project. In the SQL editor run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`, then `notify pgrst, 'reload schema';` so the API picks up the new tables and relationships immediately.
2. Copy `.env.example` to `.env.local` and fill it. `NEXT_PUBLIC_APP_URL` must be the final production domain, because it is baked into every installed signature.
3. In Supabase Auth settings, add `https://APP/auth/callback` to the redirect URLs and enable the Email provider.
4. `npm install`, then `npm run dev`. Sign in at `/login` with an address from `ADMIN_EMAILS` or the `admins` table.
5. On Vercel, turn Deployment Protection (Vercel Authentication) off for this project. Colleagues open their install links and mail clients load `/b/{token}` without any Vercel session.
6. Upload the current carousel banner under Banners and click Make default.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests for formatting, rendering and banner resolution |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
app/
  admin/            dashboard, users, groups, banners, schedule (calendar), templates
  s/[token]         personal install page with Copy button and .htm download
  b/[token]         dynamic banner redirect
  c/[token]         click redirect with logging
  login, auth/      magic-link sign-in for admins
lib/
  signature/        renderer ported from the builders (format.ts, render.ts)
  banners/resolve   pure schedule selection logic (tested)
  supabase/         server, admin (service role) and middleware clients
supabase/           migration and seed SQL
public/seed/        built-in fallback carousel (612×140 GIF)
```

## CSV import

Header row required. Columns in any order: `full_name, title, email, mobile, hotel, groups`. `hotel` is an id (`bis, bch, oth, oah, och, cluster`) or the hotel name. `email` may be just the local part; the hotel prefix and domain are added. `groups` is a semicolon-separated list of manual group names. Existing emails are updated, not duplicated.

## Banner rules

Signatures are locked to 612×140 (changeable in the `settings` table under `banner_size`). Uploads of another size are rejected unless you tick "allow any size", because Outlook stretches the image to the fixed attributes. Keep GIFs under 5 MB, ideally under 1 MB: Outlook desktop plays GIFs only in the newest builds and shows the first frame elsewhere.
