-- Land Clearing, Site Work, and Equipment Services
-- Extends divisions, service types, equipment capability catalog, intake, and hour tracking.
-- Does not alter existing Junk Removal or Hauling rows.

-- ---------------------------------------------------------------------------
-- Widen service_type constraints
-- ---------------------------------------------------------------------------
alter table public.divisions drop constraint if exists divisions_service_type_check;
alter table public.divisions add constraint divisions_service_type_check
  check (service_type in (
    'junk_removal',
    'hauling_transport',
    'land_clearing',
    'site_work',
    'equipment_services'
  ));

alter table public.jobs drop constraint if exists jobs_service_type_check;
alter table public.jobs add constraint jobs_service_type_check
  check (service_type in (
    'junk_removal',
    'hauling_transport',
    'land_clearing',
    'site_work',
    'equipment_services'
  ));

alter table public.jobs drop constraint if exists jobs_estimate_type_check;
alter table public.jobs add constraint jobs_estimate_type_check
  check (estimate_type is null or estimate_type in (
    'junk_removal',
    'hauling_transport',
    'land_clearing',
    'site_work',
    'equipment_services'
  ));

-- ---------------------------------------------------------------------------
-- New operating divisions (prelaunch: accepting upcoming estimates)
-- ---------------------------------------------------------------------------
insert into public.divisions (id, company_id, name, short_name, service_type, launch_status, logo_path)
values
  ('land_clearing', 'morris-hauling', 'Morris Land Clearing', 'Land Clearing', 'land_clearing', 'accepting_estimate_requests', '/MorrisServicesLogo.png?v=6'),
  ('site_work', 'morris-hauling', 'Morris Site Work', 'Site Work', 'site_work', 'accepting_estimate_requests', '/MorrisServicesLogo.png?v=6'),
  ('equipment_services', 'morris-hauling', 'Morris Equipment Services', 'Equipment Services', 'equipment_services', 'accepting_estimate_requests', '/MorrisServicesLogo.png?v=6')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  service_type = excluded.service_type,
  logo_path = excluded.logo_path,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Equipment types / attachments / capabilities / service catalog
-- ---------------------------------------------------------------------------
create table if not exists public.equipment_types (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  category text not null default 'loader',
  enabled boolean not null default false,
  ownership_status text not null default 'planned'
    check (ownership_status in ('planned', 'on_order', 'owned', 'leased', 'retired')),
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_attachments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  enabled boolean not null default false,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_capabilities (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  equipment_type_id text not null references public.equipment_types(id) on delete cascade,
  attachment_id text not null references public.equipment_attachments(id) on delete cascade,
  name text not null,
  enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_catalog (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  division_id text not null references public.divisions(id) on delete cascade,
  slug text not null,
  name text not null,
  status text not null default 'coming_soon'
    check (status in ('active', 'accepting_estimates', 'coming_soon', 'temporarily_unavailable')),
  publicly_listed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, division_id, slug)
);

create table if not exists public.service_capability_links (
  service_id text not null references public.service_catalog(id) on delete cascade,
  capability_id text not null references public.equipment_capabilities(id) on delete cascade,
  primary key (service_id, capability_id)
);

create table if not exists public.equipment_ops_settings (
  company_id text primary key references public.companies(id) on delete cascade,
  maintenance_reserve_per_hour numeric(10,2) not null default 25,
  updated_at timestamptz not null default now()
);

insert into public.equipment_ops_settings (company_id, maintenance_reserve_per_hour)
values ('morris-hauling', 25)
on conflict (company_id) do nothing;

-- Hour-meter fields on existing assets (no owned machine seeded)
alter table public.equipment_assets add column if not exists current_hours numeric(12,1);
alter table public.equipment_assets add column if not exists hours_at_purchase numeric(12,1);
alter table public.equipment_assets add column if not exists next_service_hours numeric(12,1);
alter table public.equipment_assets add column if not exists maintenance_interval_hours numeric(12,1);
alter table public.equipment_assets add column if not exists maintenance_reserve_per_hour numeric(10,2);
alter table public.equipment_assets add column if not exists equipment_type_id text references public.equipment_types(id);
alter table public.equipment_assets add column if not exists ownership_status text
  check (ownership_status is null or ownership_status in ('planned', 'on_order', 'owned', 'leased', 'retired'));

-- ---------------------------------------------------------------------------
-- Intake + operational profitability (conditional fields live in intake jsonb)
-- ---------------------------------------------------------------------------
create table if not exists public.equipment_intake_details (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  estimate_id text references public.estimates(id) on delete set null,
  job_id text references public.jobs(id) on delete set null,
  division_id text not null references public.divisions(id),
  service_slug text,
  kind text not null check (kind in ('land_clearing', 'site_work', 'equipment_services')),
  intake jsonb not null default '{}'::jsonb,
  equipment_type_id text references public.equipment_types(id),
  attachment_type_id text references public.equipment_attachments(id),
  estimated_acres numeric(10,2),
  actual_acres numeric(10,2),
  vegetation_density text,
  tree_diameter_range text,
  terrain_type text,
  access_difficulty text,
  estimated_machine_hours numeric(10,2),
  actual_machine_hours numeric(10,2),
  estimated_operator_hours numeric(10,2),
  actual_operator_hours numeric(10,2),
  estimated_fuel_gallons numeric(10,2),
  actual_fuel_gallons numeric(10,2),
  mobilization_miles numeric(10,2),
  mobilization_cost numeric(12,2),
  estimated_maintenance_reserve numeric(12,2),
  actual_repair_cost numeric(12,2),
  quoted_price numeric(12,2),
  deposit numeric(12,2),
  final_revenue numeric(12,2),
  estimated_profit numeric(12,2),
  actual_profit numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_intake_estimate_idx on public.equipment_intake_details(estimate_id);
create index if not exists equipment_intake_job_idx on public.equipment_intake_details(job_id);
create index if not exists equipment_intake_division_idx on public.equipment_intake_details(company_id, division_id);

create table if not exists public.equipment_intake_media (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  estimate_id text references public.estimates(id) on delete cascade,
  intake_id text references public.equipment_intake_details(id) on delete cascade,
  storage_path text not null,
  media_kind text not null default 'photo' check (media_kind in ('photo', 'video')),
  mime_type text,
  original_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.job_machine_hours (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  asset_id text references public.equipment_assets(id) on delete set null,
  equipment_type_id text references public.equipment_types(id),
  attachment_id text references public.equipment_attachments(id),
  machine_start_hours numeric(12,1),
  machine_end_hours numeric(12,1),
  machine_hours_used numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists job_machine_hours_job_idx on public.job_machine_hours(company_id, job_id);

-- ---------------------------------------------------------------------------
-- Published project pages (SEO). Empty until real jobs are published.
-- ---------------------------------------------------------------------------
create table if not exists public.published_projects (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  slug text not null,
  title text not null,
  division_id text not null references public.divisions(id),
  service_slug text,
  city text,
  county text,
  acreage numeric(10,2),
  vegetation_type text,
  equipment_used text,
  attachment_used text,
  approximate_machine_hours numeric(10,2),
  customer_goal text,
  work_completed text,
  before_image_urls jsonb not null default '[]'::jsonb,
  during_image_urls jsonb not null default '[]'::jsonb,
  after_image_urls jsonb not null default '[]'::jsonb,
  video_urls jsonb not null default '[]'::jsonb,
  testimonial text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

create index if not exists published_projects_public_idx
  on public.published_projects(company_id, published, division_id);

-- ---------------------------------------------------------------------------
-- Seed catalog (no owned machine assets)
-- ---------------------------------------------------------------------------
insert into public.equipment_types (id, company_id, name, slug, category, enabled, ownership_status, sort_order, notes)
values
  ('ctl', 'morris-hauling', 'Compact Track Loader', 'compact-track-loader', 'loader', true, 'planned', 10, 'Planned machine class. Do not claim ownership until an asset is marked owned.'),
  ('mini_excavator', 'morris-hauling', 'Mini Excavator', 'mini-excavator', 'excavator', false, 'planned', 20, 'Future expansion.'),
  ('excavator', 'morris-hauling', 'Excavator', 'excavator', 'excavator', false, 'planned', 30, 'Future expansion.')
on conflict (id) do nothing;

insert into public.equipment_attachments (id, company_id, name, slug, enabled, sort_order)
values
  ('forestry_mulcher', 'morris-hauling', 'Forestry Mulcher', 'forestry-mulcher', true, 10),
  ('grapple', 'morris-hauling', 'Grapple', 'grapple', true, 20),
  ('bucket', 'morris-hauling', 'Bucket', 'bucket', true, 30),
  ('pallet_forks', 'morris-hauling', 'Pallet Forks', 'pallet-forks', true, 40),
  ('brush_cutter', 'morris-hauling', 'Brush Cutter', 'brush-cutter', false, 50),
  ('power_rake', 'morris-hauling', 'Power Rake', 'power-rake', false, 60),
  ('stump_grinder', 'morris-hauling', 'Stump Grinder', 'stump-grinder', false, 70),
  ('auger', 'morris-hauling', 'Auger', 'auger', false, 80),
  ('trencher', 'morris-hauling', 'Trencher', 'trencher', false, 90),
  ('breaker', 'morris-hauling', 'Breaker', 'breaker', false, 100),
  ('snow_equipment', 'morris-hauling', 'Snow Equipment', 'snow-equipment', false, 110),
  ('excavator_mulcher', 'morris-hauling', 'Excavator Mulcher', 'excavator-mulcher', false, 120),
  ('excavator_thumb', 'morris-hauling', 'Excavator Thumb / Grapple', 'excavator-thumb', false, 130),
  ('excavation_bucket', 'morris-hauling', 'Excavation Bucket', 'excavation-bucket', false, 140),
  ('drainage_trenching', 'morris-hauling', 'Drainage / Trenching Equipment', 'drainage-trenching', false, 150)
on conflict (id) do nothing;

insert into public.equipment_capabilities (id, company_id, equipment_type_id, attachment_id, name, enabled)
values
  ('cap-ctl-mulcher', 'morris-hauling', 'ctl', 'forestry_mulcher', 'CTL forestry mulching', true),
  ('cap-ctl-grapple', 'morris-hauling', 'ctl', 'grapple', 'CTL grapple handling', true),
  ('cap-ctl-bucket', 'morris-hauling', 'ctl', 'bucket', 'CTL bucket / grading', true),
  ('cap-ctl-forks', 'morris-hauling', 'ctl', 'pallet_forks', 'CTL material handling', true),
  ('cap-mini-bucket', 'morris-hauling', 'mini_excavator', 'excavation_bucket', 'Mini excavator digging', false),
  ('cap-mini-thumb', 'morris-hauling', 'mini_excavator', 'excavator_thumb', 'Mini excavator thumb work', false),
  ('cap-mini-mulcher', 'morris-hauling', 'mini_excavator', 'excavator_mulcher', 'Mini excavator mulching', false),
  ('cap-mini-trench', 'morris-hauling', 'mini_excavator', 'drainage_trenching', 'Mini excavator trenching', false)
on conflict (id) do nothing;

insert into public.service_catalog (id, company_id, division_id, slug, name, status, publicly_listed, sort_order)
values
  ('svc-forestry-mulching', 'morris-hauling', 'land_clearing', 'forestry-mulching', 'Forestry Mulching', 'accepting_estimates', true, 10),
  ('svc-land-clearing', 'morris-hauling', 'land_clearing', 'land-clearing', 'Land Clearing', 'accepting_estimates', false, 15),
  ('svc-brush-clearing', 'morris-hauling', 'land_clearing', 'brush-clearing', 'Brush Clearing', 'accepting_estimates', true, 20),
  ('svc-lot-clearing', 'morris-hauling', 'land_clearing', 'lot-clearing', 'Lot Clearing', 'accepting_estimates', true, 30),
  ('svc-property-reclamation', 'morris-hauling', 'land_clearing', 'property-reclamation', 'Overgrown Property Reclamation', 'accepting_estimates', true, 40),
  ('svc-honeysuckle', 'morris-hauling', 'land_clearing', 'honeysuckle-clearing', 'Honeysuckle / Invasive Clearing', 'accepting_estimates', true, 50),
  ('svc-small-tree', 'morris-hauling', 'land_clearing', 'small-tree-clearing', 'Small Tree & Sapling Clearing', 'accepting_estimates', true, 60),
  ('svc-fence-line', 'morris-hauling', 'land_clearing', 'fence-line-clearing', 'Fence-Line Clearing', 'accepting_estimates', true, 70),
  ('svc-trail', 'morris-hauling', 'land_clearing', 'trail-clearing', 'Trail / Path Clearing', 'accepting_estimates', true, 80),
  ('svc-storm-veg', 'morris-hauling', 'land_clearing', 'storm-debris-clearing', 'Storm Debris / Vegetation Cleanup', 'accepting_estimates', true, 90),
  ('svc-brush-pile', 'morris-hauling', 'land_clearing', 'brush-pile-cleanup', 'Brush & Tree Pile Cleanup', 'accepting_estimates', false, 100),
  ('svc-rough-grading', 'morris-hauling', 'site_work', 'rough-grading', 'Rough Grading', 'accepting_estimates', true, 10),
  ('svc-site-prep', 'morris-hauling', 'site_work', 'site-preparation', 'Site Preparation', 'accepting_estimates', true, 20),
  ('svc-dirt-moving', 'morris-hauling', 'site_work', 'dirt-moving', 'Dirt Moving', 'accepting_estimates', true, 30),
  ('svc-gravel', 'morris-hauling', 'site_work', 'gravel-spreading', 'Gravel Spreading', 'accepting_estimates', true, 40),
  ('svc-backfill', 'morris-hauling', 'site_work', 'backfilling', 'Backfilling', 'accepting_estimates', true, 50),
  ('svc-driveway-grade', 'morris-hauling', 'site_work', 'driveway-grading', 'Driveway Grading', 'accepting_estimates', true, 60),
  ('svc-site-cleanup', 'morris-hauling', 'site_work', 'construction-cleanup', 'Construction / Demolition Site Cleanup', 'accepting_estimates', false, 70),
  ('svc-excavation', 'morris-hauling', 'site_work', 'excavation', 'Excavation', 'coming_soon', false, 200),
  ('svc-trenching', 'morris-hauling', 'site_work', 'trenching', 'Trenching', 'coming_soon', false, 210),
  ('svc-drainage', 'morris-hauling', 'site_work', 'drainage', 'Drainage', 'coming_soon', false, 220),
  ('svc-culverts', 'morris-hauling', 'site_work', 'culverts', 'Culverts', 'coming_soon', false, 230),
  ('svc-stump-root', 'morris-hauling', 'site_work', 'stump-root-removal', 'Stump / Root Removal', 'coming_soon', false, 240),
  ('svc-small-demo', 'morris-hauling', 'site_work', 'small-demolition', 'Small Demolition', 'coming_soon', false, 250),
  ('svc-building-pad', 'morris-hauling', 'site_work', 'building-pad', 'Foundation / Building Pad Preparation', 'coming_soon', false, 260),
  ('svc-ditch', 'morris-hauling', 'site_work', 'ditch-work', 'Ditch Work', 'coming_soon', false, 270),
  ('svc-excavator-services', 'morris-hauling', 'site_work', 'excavator-services', 'Excavator Services', 'coming_soon', false, 280),
  ('svc-skid-steer', 'morris-hauling', 'equipment_services', 'skid-steer-services', 'Skid Steer Services', 'accepting_estimates', true, 10),
  ('svc-bobcat', 'morris-hauling', 'equipment_services', 'bobcat-services', 'Skid Steer / Bobcat Services', 'accepting_estimates', true, 20),
  ('svc-grapple', 'morris-hauling', 'equipment_services', 'grapple-services', 'Grapple Services', 'accepting_estimates', true, 30),
  ('svc-material-handling', 'morris-hauling', 'equipment_services', 'material-handling', 'Material Handling', 'accepting_estimates', true, 40)
on conflict (id) do nothing;

insert into public.service_capability_links (service_id, capability_id)
values
  ('svc-forestry-mulching', 'cap-ctl-mulcher'),
  ('svc-land-clearing', 'cap-ctl-mulcher'),
  ('svc-land-clearing', 'cap-ctl-grapple'),
  ('svc-brush-clearing', 'cap-ctl-mulcher'),
  ('svc-lot-clearing', 'cap-ctl-mulcher'),
  ('svc-lot-clearing', 'cap-ctl-grapple'),
  ('svc-property-reclamation', 'cap-ctl-mulcher'),
  ('svc-property-reclamation', 'cap-ctl-grapple'),
  ('svc-honeysuckle', 'cap-ctl-mulcher'),
  ('svc-small-tree', 'cap-ctl-mulcher'),
  ('svc-fence-line', 'cap-ctl-mulcher'),
  ('svc-trail', 'cap-ctl-mulcher'),
  ('svc-storm-veg', 'cap-ctl-grapple'),
  ('svc-storm-veg', 'cap-ctl-mulcher'),
  ('svc-brush-pile', 'cap-ctl-grapple'),
  ('svc-rough-grading', 'cap-ctl-bucket'),
  ('svc-site-prep', 'cap-ctl-bucket'),
  ('svc-dirt-moving', 'cap-ctl-bucket'),
  ('svc-gravel', 'cap-ctl-bucket'),
  ('svc-backfill', 'cap-ctl-bucket'),
  ('svc-driveway-grade', 'cap-ctl-bucket'),
  ('svc-site-cleanup', 'cap-ctl-bucket'),
  ('svc-site-cleanup', 'cap-ctl-grapple'),
  ('svc-excavation', 'cap-mini-bucket'),
  ('svc-trenching', 'cap-mini-trench'),
  ('svc-drainage', 'cap-mini-trench'),
  ('svc-culverts', 'cap-mini-bucket'),
  ('svc-stump-root', 'cap-mini-thumb'),
  ('svc-small-demo', 'cap-mini-thumb'),
  ('svc-building-pad', 'cap-mini-bucket'),
  ('svc-building-pad', 'cap-ctl-bucket'),
  ('svc-ditch', 'cap-mini-bucket'),
  ('svc-excavator-services', 'cap-mini-bucket'),
  ('svc-skid-steer', 'cap-ctl-bucket'),
  ('svc-skid-steer', 'cap-ctl-grapple'),
  ('svc-skid-steer', 'cap-ctl-forks'),
  ('svc-bobcat', 'cap-ctl-bucket'),
  ('svc-bobcat', 'cap-ctl-grapple'),
  ('svc-bobcat', 'cap-ctl-forks'),
  ('svc-grapple', 'cap-ctl-grapple'),
  ('svc-material-handling', 'cap-ctl-forks'),
  ('svc-material-handling', 'cap-ctl-bucket')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.equipment_types enable row level security;
alter table public.equipment_attachments enable row level security;
alter table public.equipment_capabilities enable row level security;
alter table public.service_catalog enable row level security;
alter table public.service_capability_links enable row level security;
alter table public.equipment_ops_settings enable row level security;
alter table public.equipment_intake_details enable row level security;
alter table public.equipment_intake_media enable row level security;
alter table public.job_machine_hours enable row level security;
alter table public.published_projects enable row level security;

create policy "equipment_types_read" on public.equipment_types for select
  using (company_id = public.morris_company_id());
create policy "equipment_types_admin" on public.equipment_types for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_attachments_read" on public.equipment_attachments for select
  using (company_id = public.morris_company_id());
create policy "equipment_attachments_admin" on public.equipment_attachments for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_capabilities_read" on public.equipment_capabilities for select
  using (company_id = public.morris_company_id());
create policy "equipment_capabilities_admin" on public.equipment_capabilities for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "service_catalog_read" on public.service_catalog for select
  using (company_id = public.morris_company_id());
create policy "service_catalog_admin" on public.service_catalog for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "service_capability_links_read" on public.service_capability_links for select
  using (true);
create policy "service_capability_links_admin" on public.service_capability_links for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "equipment_ops_settings_read" on public.equipment_ops_settings for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "equipment_ops_settings_admin" on public.equipment_ops_settings for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_intake_staff" on public.equipment_intake_details for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "equipment_intake_media_staff" on public.equipment_intake_media for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "job_machine_hours_staff" on public.job_machine_hours for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "published_projects_public_read" on public.published_projects for select
  using (company_id = public.morris_company_id() and published = true);
create policy "published_projects_staff_read" on public.published_projects for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "published_projects_admin" on public.published_projects for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

-- Intake media bucket (photos + short videos). Service role writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intake-media',
  'intake-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
