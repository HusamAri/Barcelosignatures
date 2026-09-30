-- Email + password sign-in for admins, replacing Supabase Auth magic links.
alter table public.admins
  add column if not exists name text,
  add column if not exists password_hash text,
  add column if not exists must_change_password boolean not null default true,
  add column if not exists last_login_at timestamptz;

-- Admin pages now run server-side with the service role after a signed session
-- cookie is verified, so the JWT-based policy is replaced by deny-all for the public key.
do $$
declare t text;
begin
  foreach t in array array['hotels','groups','sig_users','user_groups','banners','banner_schedules',
                          'banner_schedule_groups','banner_clicks','banner_loads','settings','admins']
  loop
    execute format('drop policy if exists admin_all on public.%I', t);
  end loop;
end $$;
drop function if exists public.is_admin();
