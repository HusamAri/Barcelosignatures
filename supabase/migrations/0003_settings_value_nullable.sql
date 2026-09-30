-- "Clear default" writes null into settings.value; the original NOT NULL made that
-- update fail silently and left default_banner_id pointing at deleted banners.
alter table public.settings alter column value drop not null;
update public.settings set value = null
where key = 'default_banner_id'
  and value is not null
  and not exists (select 1 from public.banners b where to_jsonb(b.id::text) = settings.value);
notify pgrst, 'reload schema';
