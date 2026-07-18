-- Local authority content cards — one story can populate many website surfaces.
-- Division-tagged for future Morris Service Group crafts without redesign.

create table if not exists public.authority_stories (
  id uuid primary key default gen_random_uuid(),
  division_id text not null default 'junk_removal',
  title text not null,
  description text,
  summary text,
  location text,
  city text,
  service_category text,
  property_type text check (
    property_type is null or property_type in (
      'residential', 'commercial', 'estate', 'garage', 'storage_unit', 'construction'
    )
  ),
  item_removed text,
  event_kind text check (
    event_kind is null or event_kind in (
      'cookout', 'networking', 'partnership', 'cleanup', 'charity',
      'food_drive', 'school_supply', 'sponsor', 'other'
    )
  ),
  surfaces text[] not null default '{}',
  before_image_url text,
  after_image_url text,
  photo_urls text[] not null default '{}',
  video_url text,
  youtube_id text,
  thumbnail_url text,
  internal_path text,
  social_links jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  display_order integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists authority_stories_published_idx
  on public.authority_stories (published, display_order asc, published_at desc nulls last);

create index if not exists authority_stories_surfaces_idx
  on public.authority_stories using gin (surfaces);

create index if not exists authority_stories_city_idx
  on public.authority_stories (city);

create index if not exists authority_stories_division_idx
  on public.authority_stories (division_id);

alter table public.authority_stories enable row level security;

create policy "authority_stories_public_read" on public.authority_stories
  for select using (published = true);

create policy "authority_stories_admin_all" on public.authority_stories
  for all
  using (public.is_admin())
  with check (public.is_admin());
