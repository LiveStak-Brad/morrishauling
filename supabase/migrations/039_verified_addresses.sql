-- Verified address fields + manager override audit
-- Run after 038_divisions.sql

-- ---------------------------------------------------------------------------
-- Jobs: structured verified service address
-- ---------------------------------------------------------------------------
alter table public.jobs add column if not exists address_line2 text;
alter table public.jobs add column if not exists address_place_id text;
alter table public.jobs add column if not exists address_formatted text;
alter table public.jobs add column if not exists address_verified boolean not null default false;
alter table public.jobs add column if not exists address_country text default 'US';
alter table public.jobs add column if not exists address_verification_status text
  check (address_verification_status is null or address_verification_status in ('verified', 'manual_override', 'unverified'));

create index if not exists jobs_address_place_id_idx on public.jobs(address_place_id)
  where address_place_id is not null;

-- ---------------------------------------------------------------------------
-- Hauling: verified pickup / delivery
-- ---------------------------------------------------------------------------
alter table public.hauling_details add column if not exists pickup_line2 text;
alter table public.hauling_details add column if not exists pickup_place_id text;
alter table public.hauling_details add column if not exists pickup_formatted text;
alter table public.hauling_details add column if not exists pickup_verified boolean not null default false;
alter table public.hauling_details add column if not exists pickup_country text default 'US';

alter table public.hauling_details add column if not exists delivery_line2 text;
alter table public.hauling_details add column if not exists delivery_place_id text;
alter table public.hauling_details add column if not exists delivery_formatted text;
alter table public.hauling_details add column if not exists delivery_verified boolean not null default false;
alter table public.hauling_details add column if not exists delivery_country text default 'US';

alter table public.hauling_details add column if not exists assistance_available_pickup boolean not null default false;
alter table public.hauling_details add column if not exists assistance_available_delivery boolean not null default false;

create index if not exists hauling_pickup_place_id_idx on public.hauling_details(pickup_place_id)
  where pickup_place_id is not null;
create index if not exists hauling_delivery_place_id_idx on public.hauling_details(delivery_place_id)
  where delivery_place_id is not null;

-- ---------------------------------------------------------------------------
-- Address override audit (managers / owners only)
-- ---------------------------------------------------------------------------
create table if not exists public.address_overrides (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  actor_profile_id text references public.profiles(id) on delete set null,
  reason text not null,
  address_role text not null default 'service'
    check (address_role in ('service', 'pickup', 'delivery', 'stop')),
  address_snapshot jsonb not null default '{}'::jsonb,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

create index if not exists address_overrides_job_idx on public.address_overrides(job_id);
create index if not exists address_overrides_company_idx on public.address_overrides(company_id);

alter table public.address_overrides enable row level security;

drop policy if exists "address_overrides_select" on public.address_overrides;
drop policy if exists "address_overrides_insert" on public.address_overrides;

create policy "address_overrides_select" on public.address_overrides for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()::text
        and p.company_id = address_overrides.company_id
        and p.role in ('admin', 'planner', 'office_admin')
    )
  );

create policy "address_overrides_insert" on public.address_overrides for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()::text
        and p.company_id = address_overrides.company_id
        and p.role in ('admin', 'planner')
    )
  );
