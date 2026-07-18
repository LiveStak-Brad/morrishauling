-- Managed @WarrentonJunk featured content + privacy-safe click analytics

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  thumbnail_url text,
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok', 'youtube', 'x')),
  description text,
  location text,
  service_type text,
  content_kind text not null default 'video'
    check (content_kind in (
      'video', 'photo', 'before_after', 'trailer_load', 'appliance_removal',
      'furniture_removal', 'garage_cleanout', 'estate_cleanout', 'property_cleanout',
      'construction_debris', 'local_tips'
    )),
  destination_url text not null,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_published_order_idx
  on public.social_posts (published, display_order asc, created_at desc);

create table if not exists public.social_click_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok', 'youtube', 'x')),
  surface text not null,
  path text,
  device text,
  referrer_host text,
  created_at timestamptz not null default now()
);

create index if not exists social_click_events_created_idx
  on public.social_click_events (created_at desc);
create index if not exists social_click_events_platform_idx
  on public.social_click_events (platform, created_at desc);

alter table public.social_posts enable row level security;
alter table public.social_click_events enable row level security;

create policy "social_posts_public_read" on public.social_posts
  for select using (published = true);

create policy "social_posts_admin_all" on public.social_posts
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "social_clicks_insert_anon" on public.social_click_events
  for insert
  with check (true);

create policy "social_clicks_admin_read" on public.social_click_events
  for select
  using (public.is_admin());
