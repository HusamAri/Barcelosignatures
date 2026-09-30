-- Barceló Hotel Group Türkiye: central email signature management
-- Run in the Supabase SQL editor or with `supabase db push`.

create extension if not exists "pgcrypto";

-- ───────────────────────── hotels / templates ─────────────────────────
create table if not exists public.hotels (
  id            text primary key,                     -- bis, bch, oth, oah, och, cluster
  name          text not null,                        -- "Barceló Istanbul"
  brand         text not null check (brand in ('barcelo','occidental','cluster')),
  brand_word    text not null,                        -- "Barceló" / "Occidental" (bold part of the hotel line)
  city_word     text not null,                        -- "Istanbul" / "Taksim" (regular part)
  slogan        text not null default '',
  email_prefix  text not null default '',             -- "istanbul." ; empty for cluster
  email_domain  text not null,                        -- barcelo.com / occidentalhotels.com
  address       text not null,
  map_url       text not null,
  phone_display text not null default '',
  phone_href    text not null default '',
  website_url   text not null,
  website_label text not null default 'barcelo.com',
  secondary_banner_url text,                          -- optional static second banner (cluster award)
  secondary_banner_alt text,
  is_active     boolean not null default true,
  sort_order    int not null default 0
);

-- ───────────────────────── groups ─────────────────────────
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  hotel_id    text references public.hotels(id) on delete set null, -- auto group: every user of this hotel is a member
  created_at  timestamptz not null default now()
);

-- ───────────────────────── users (signature owners, not admins) ─────────────────────────
create table if not exists public.sig_users (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default encode(gen_random_bytes(9), 'hex'),
  full_name   text not null,
  title       text not null default '',
  email       text not null unique,
  mobile      text not null default '',
  hotel_id    text not null references public.hotels(id),
  is_active   boolean not null default true,
  last_sent_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sig_users_hotel_idx on public.sig_users(hotel_id);

create table if not exists public.user_groups (
  user_id  uuid not null references public.sig_users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  primary key (user_id, group_id)
);

-- ───────────────────────── banners ─────────────────────────
create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  storage_path text not null,
  public_url   text not null,
  mime_type    text not null,
  width        int not null,
  height       int not null,
  alt          text not null default 'Barceló Hotel Group Türkiye',
  link_url     text not null default 'https://www.barcelo.com/en-us/hotels/turkey/',
  created_at   timestamptz not null default now()
);

create table if not exists public.banner_schedules (
  id         uuid primary key default gen_random_uuid(),
  banner_id  uuid not null references public.banners(id) on delete cascade,
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  priority   int not null default 0,        -- higher wins when several schedules match
  all_users  boolean not null default false, -- true = every user, ignore group targeting
  link_url   text,                            -- overrides banners.link_url
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint banner_schedules_range check (ends_at > starts_at)
);
create index if not exists banner_schedules_range_idx on public.banner_schedules(starts_at, ends_at);

create table if not exists public.banner_schedule_groups (
  schedule_id uuid not null references public.banner_schedules(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  primary key (schedule_id, group_id)
);

create table if not exists public.banner_clicks (
  id          bigserial primary key,
  user_id     uuid references public.sig_users(id) on delete set null,
  schedule_id uuid references public.banner_schedules(id) on delete set null,
  banner_id   uuid references public.banners(id) on delete set null,
  clicked_at  timestamptz not null default now(),
  user_agent  text
);

create table if not exists public.banner_loads (
  id          bigserial primary key,
  user_id     uuid references public.sig_users(id) on delete set null,
  schedule_id uuid references public.banner_schedules(id) on delete set null,
  banner_id   uuid references public.banners(id) on delete set null,
  loaded_at   timestamptz not null default now()
);

-- ───────────────────────── settings & admins ─────────────────────────
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);
insert into public.settings(key, value) values
  ('default_banner_id', 'null'::jsonb),
  ('banner_size', '{"width":612,"height":140}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.admins (
  email    text primary key,
  added_at timestamptz not null default now()
);

-- ───────────────────────── updated_at trigger ─────────────────────────
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists sig_users_updated_at on public.sig_users;
create trigger sig_users_updated_at before update on public.sig_users
  for each row execute function public.set_updated_at();

-- ───────────────────────── RLS ─────────────────────────
-- Admin pages use the signed-in user's session; public endpoints use the service role.
create or replace function public.is_admin() returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['hotels','groups','sig_users','user_groups','banners','banner_schedules',
                          'banner_schedule_groups','banner_clicks','banner_loads','settings','admins']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ───────────────────────── storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 5242880, array['image/gif','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists banners_public_read on storage.objects;
create policy banners_public_read on storage.objects for select to public using (bucket_id = 'banners');
