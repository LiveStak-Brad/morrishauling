-- Morris Hauling — service lines: junk removal + hauling/transport
-- Run after 003_auth_profiles_rls.sql

-- ---------------------------------------------------------------------------
-- Jobs: service line + estimate metadata
-- ---------------------------------------------------------------------------
update public.jobs
set service_type = 'junk_removal'
where service_type is null
   or service_type in ('residential', 'commercial', 'estate', 'construction', 'appliance', 'yard', 'general');

alter table public.jobs add column if not exists estimate_type text;
alter table public.jobs add column if not exists pricing_breakdown jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists disclaimer_accepted boolean not null default false;

alter table public.jobs drop constraint if exists jobs_service_type_check;
alter table public.jobs add constraint jobs_service_type_check
  check (service_type in ('junk_removal', 'hauling_transport'));

alter table public.jobs drop constraint if exists jobs_estimate_type_check;
alter table public.jobs add constraint jobs_estimate_type_check
  check (estimate_type is null or estimate_type in ('junk_removal', 'hauling_transport'));

create index if not exists jobs_service_type_idx on public.jobs(company_id, service_type);

-- ---------------------------------------------------------------------------
-- Hauling details (1:1 with hauling jobs)
-- ---------------------------------------------------------------------------
create table if not exists public.hauling_details (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null unique references public.jobs(id) on delete cascade,
  pickup_address text not null default '',
  pickup_city text not null default '',
  pickup_state text not null default 'MO',
  pickup_zip text not null default '',
  delivery_address text not null default '',
  delivery_city text not null default '',
  delivery_state text not null default 'MO',
  delivery_zip text not null default '',
  pickup_latitude numeric(10,7),
  pickup_longitude numeric(10,7),
  delivery_latitude numeric(10,7),
  delivery_longitude numeric(10,7),
  cargo_category text not null default 'other',
  cargo_description text not null default '',
  estimated_weight_lbs numeric(12,2),
  length_ft numeric(8,2),
  width_ft numeric(8,2),
  height_ft numeric(8,2),
  is_running boolean,
  is_rolling boolean,
  needs_winch boolean not null default false,
  needs_loading_help boolean not null default false,
  needs_unloading_help boolean not null default false,
  forklift_available_pickup boolean not null default false,
  forklift_available_delivery boolean not null default false,
  loading_dock_pickup boolean not null default false,
  loading_dock_delivery boolean not null default false,
  recommended_trailer_type text,
  rental_required boolean not null default false,
  estimated_loaded_miles numeric(10,2),
  estimated_empty_miles numeric(10,2),
  estimated_fuel_cost numeric(12,2),
  estimated_driver_hours numeric(8,2),
  urgency text not null default 'standard',
  trailer_availability_disclaimer_accepted boolean not null default false,
  pickup_access_notes text,
  delivery_access_notes text,
  preferred_delivery_date date,
  preferred_delivery_window text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hauling_details_job_idx on public.hauling_details(job_id);
create index if not exists hauling_details_company_idx on public.hauling_details(company_id);

alter table public.hauling_details enable row level security;

drop policy if exists "hauling_details_select" on public.hauling_details;
drop policy if exists "hauling_details_insert" on public.hauling_details;
drop policy if exists "hauling_details_update" on public.hauling_details;

create policy "hauling_details_select" on public.hauling_details for select
  using (
    company_id = public.morris_company_id()
    and (
      public.is_admin()
      or public.is_planner_or_admin()
      or exists (
        select 1 from public.jobs j
        where j.id = hauling_details.job_id
          and j.customer_id = public.my_customer_id()
      )
      or exists (
        select 1 from public.jobs j
        join public.job_assignments ja on ja.job_id = j.id
        where j.id = hauling_details.job_id
          and ja.employee_id = public.my_employee_id()
      )
    )
  );

create policy "hauling_details_insert" on public.hauling_details for insert
  with check (
    company_id = public.morris_company_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.jobs j
        where j.id = hauling_details.job_id
          and j.customer_id = public.my_customer_id()
      )
    )
  );

create policy "hauling_details_update" on public.hauling_details for update
  using (
    company_id = public.morris_company_id()
    and (public.is_planner_or_admin() or public.is_admin())
  )
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());
