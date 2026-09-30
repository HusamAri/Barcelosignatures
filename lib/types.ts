export type Brand = "barcelo" | "occidental" | "cluster";

export interface Hotel {
  id: string;
  name: string;
  brand: Brand;
  brand_word: string;
  city_word: string;
  slogan: string;
  email_prefix: string;
  email_domain: string;
  address: string;
  map_url: string;
  phone_display: string;
  phone_href: string;
  website_url: string;
  website_label: string;
  secondary_banner_url: string | null;
  secondary_banner_alt: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  hotel_id: string | null;
  created_at: string;
}

export interface SigUser {
  id: string;
  token: string;
  full_name: string;
  title: string;
  email: string;
  mobile: string;
  hotel_id: string;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SigUserWithRelations extends SigUser {
  hotel: Hotel;
  group_ids: string[];
}

export interface Banner {
  id: string;
  name: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  width: number;
  height: number;
  alt: string;
  link_url: string;
  created_at: string;
}

export interface BannerSchedule {
  id: string;
  banner_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  all_users: boolean;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BannerScheduleWithRelations extends BannerSchedule {
  banner: Banner;
  group_ids: string[];
}

export interface BannerSize {
  width: number;
  height: number;
}

export interface ResolvedBanner {
  imageUrl: string;
  linkUrl: string;
  alt: string;
  bannerId: string | null;
  scheduleId: string | null;
  source: "schedule" | "default" | "fallback";
}
