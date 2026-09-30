-- Hotel/template seed. Values ported from the five signature builders.
insert into public.hotels
  (id, name, brand, brand_word, city_word, slogan, email_prefix, email_domain, address, map_url,
   phone_display, phone_href, website_url, website_label, secondary_banner_url, secondary_banner_alt, sort_order)
values
  ('bis', 'Barceló Istanbul', 'barcelo', 'Barceló', 'Istanbul', 'Be Inspired', 'istanbul.', 'barcelo.com',
   'Kocatepe, Abdulhak Hamit Cad. No25 Beyoğlu | Istanbul | Türkiye 34437', 'https://maps.app.goo.gl/GbQy9G8yVxqxtrWy7',
   '+90 212 377 45 45', '+902123774545', 'https://barcelo.com', 'barcelo.com', null, null, 10),
  ('bch', 'Barceló Cappadocia', 'barcelo', 'Barceló', 'Cappadocia', 'Be Inspired', 'cappadocia.', 'barcelo.com',
   'Bahçelievler, Nevşehir Cad No:17, 50350 Ortahisar/Ürgüp/Nevşehir', 'https://maps.app.goo.gl/zWbUzZ6VPk9kDmpi8',
   '+90 384 343 27 27', '+903843432727', 'https://barcelo.com', 'barcelo.com', null, null, 20),
  ('oth', 'Occidental Taksim', 'occidental', 'Occidental', 'Taksim', 'Living Your Way', 'taksim.', 'occidentalhotels.com',
   'Kocatepe, Topçu Cad No:19 34437 Beyoğlu | Istanbul | Türkiye', 'https://maps.app.goo.gl/kJ52tJfGFr8hoHjL6',
   '+90 212 313 51 00', '+902123135100', 'https://www.barcelo.com/en-us/occidental/taksim/', 'barcelo.com', null, null, 30),
  ('oah', 'Occidental Ankara', 'occidental', 'Occidental', 'Ankara', 'Living Your Way', 'ankara.', 'occidentalhotels.com',
   'Güniz Sokak, Kavaklıdere, Barbaros No:42, 06700 Çankaya | Ankara | Türkiye', 'https://maps.app.goo.gl/YXgjD1o25bFpqqCs9',
   '+90 312 457 40 00', '+903124574000', 'https://www.barcelo.com/en-us/occidental/ankara/', 'barcelo.com', null, null, 40),
  ('och', 'Occidental Istanbul City', 'occidental', 'Occidental', 'Istanbul City', 'Living Your Way', 'istanbulcity.', 'occidentalhotels.com',
   'Istanbul | Türkiye', 'https://www.barcelo.com/en-us/hotels/turkey/',
   '', '', 'https://www.barcelo.com/en-us/hotels/turkey/', 'barcelo.com', null, null, 50),
  ('cluster', 'Barceló Hotel Group Türkiye', 'cluster', 'Barceló Hotel Group', '', '', '', 'barcelo.com',
   'Kocatepe, Abdulhak Hamit Cad. No:25 | 34437 Beyoglu | Istanbul | Türkiye', 'https://maps.app.goo.gl/GbQy9G8yVxqxtrWy7',
   '+90 212 377 45 45', '+902123774545', 'https://www.barcelo.com/en-us/hotels/turkey/', 'barcelo.com',
   'https://cdn.barcelo.com.tr/email-signatures/assets/barcelo-cluster-award-2025.png', 'Barceló Hotel Group - World Travel Awards 2025 winner', 60)
on conflict (id) do update set
  name = excluded.name, brand = excluded.brand, brand_word = excluded.brand_word, city_word = excluded.city_word,
  slogan = excluded.slogan, email_prefix = excluded.email_prefix, email_domain = excluded.email_domain,
  address = excluded.address, map_url = excluded.map_url, phone_display = excluded.phone_display,
  phone_href = excluded.phone_href, website_url = excluded.website_url, website_label = excluded.website_label,
  secondary_banner_url = excluded.secondary_banner_url, secondary_banner_alt = excluded.secondary_banner_alt,
  sort_order = excluded.sort_order;

-- Occidental Istanbul City is pre-opening (Sept 2026): keep it hidden until data is confirmed.
update public.hotels set is_active = false where id = 'och';

-- One automatic group per hotel plus a cluster-wide group.
insert into public.groups (name, description, hotel_id) values
  ('Barceló Istanbul', 'Everyone whose signature hotel is Barceló Istanbul', 'bis'),
  ('Barceló Cappadocia', 'Everyone whose signature hotel is Barceló Cappadocia', 'bch'),
  ('Occidental Taksim', 'Everyone whose signature hotel is Occidental Taksim', 'oth'),
  ('Occidental Ankara', 'Everyone whose signature hotel is Occidental Ankara', 'oah'),
  ('Occidental Istanbul City', 'Everyone whose signature hotel is Occidental Istanbul City', 'och'),
  ('Cluster Office', 'Everyone whose signature is the Türkiye cluster template', 'cluster'),
  ('Sales', 'Sales teams across all properties', null),
  ('Management', 'GMs, HODs and area management', null)
on conflict (name) do nothing;

insert into public.admins (email) values ('mm.tr@barcelo.com') on conflict do nothing;
